import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { json } from "express";
import { randomBytes } from "node:crypto";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { AppModule } from "../src/app.module";
import { SafeResetDeliveryProvider } from "../src/admin-auth/reset-delivery.provider";
import { hashPassword, signAccessToken } from "../src/admin-auth/security";
import { ResponseInterceptor } from "../src/common/interceptors/response.interceptor";

loadEnvFile(resolve(__dirname, "../../.env"));
process.env.AUTH_DEV_RESET_PROVIDER = "true";

type JsonRecord = Record<string, unknown>;
let verificationStep = "startup";
class CookieJar {
  private readonly values = new Map<string, string>();
  apply(response: Response) {
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(";"), separator = pair.indexOf("=");
      const name = pair.slice(0, separator), value = pair.slice(separator + 1);
      if (/max-age=0/i.test(line) || !value) this.values.delete(name); else this.values.set(name, value);
    }
  }
  header() { return [...this.values].map(([name, value]) => `${name}=${value}`).join("; "); }
  get(name: string) { return this.values.get(name); }
  set(name: string, value: string) { this.values.set(name, value); }
  clone() { const copy = new CookieJar(); for (const [name, value] of this.values) copy.set(name, value); return copy; }
}

function required(name: string) { const value = process.env[name]; if (!value) throw new Error("configuration"); return value; }
function assert(value: unknown) { if (!value) throw new Error("verification"); }
function temporaryPassword() { return `Tmp!${randomBytes(24).toString("base64url")}9aA`; }

async function main() {
  const email = required("INITIAL_SUPER_ADMIN_EMAIL").trim().toLowerCase();
  const ownerPassword = required("INITIAL_SUPER_ADMIN_PASSWORD");
  const origin = required("ADMIN_FRONTEND_URL");
  const accessSecret = required("ADMIN_ACCESS_TOKEN_SECRET");
  const prisma = new PrismaClient();
  let passwordMayDiffer = false;
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api/v1");
  app.use(json({ limit: "256kb" }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(0, "127.0.0.1");
  const base = `${await app.getUrl()}/api/v1`;
  const resetDelivery = app.get(SafeResetDeliveryProvider);
  const config = app.get(ConfigService);
  config.set("AUTH_DEV_RESET_PROVIDER", true);

  async function request(path: string, options: { method?: string; body?: JsonRecord; jar?: CookieJar } = {}) {
    const method = options.method ?? "GET";
    const headers: Record<string, string> = { Origin: origin };
    if (options.body) headers["Content-Type"] = "application/json";
    const cookie = options.jar?.header(); if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${base}${path}`, { method, headers, body: options.body ? JSON.stringify(options.body) : undefined });
    options.jar?.apply(response);
    const payload = await response.json().catch(() => ({})) as { data?: unknown };
    return { response, data: payload.data };
  }

  try {
    verificationStep = "provider-boundary";
    assert(config.get<string>("NODE_ENV") !== "production");
    assert(!new SafeResetDeliveryProvider({ get: () => "production" } as unknown as ConfigService).deliver(email, "suppressed"));
    assert(await prisma.adminUser.count({ where: { email } }) === 1);

    verificationStep = "protected-route";
    const anonymous = await request("/admin/dashboard"); assert(anonymous.response.status === 401);
    verificationStep = "invalid-login";
    const wrong = await request("/admin/auth/login", { method: "POST", body: { email, password: `${ownerPassword}x`, rememberMe: false } }); assert(wrong.response.status === 401);

    verificationStep = "successful-login-and-cookies";
    let primary = new CookieJar();
    const login = await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: true }, jar: primary }); assert(login.response.ok);
    const cookies = login.response.headers.getSetCookie();
    assert(cookies.length >= 2 && cookies.every((line) => /httponly/i.test(line)));
    assert(cookies.every((line) => new RegExp(`samesite=${config.get<string>("ADMIN_COOKIE_SAME_SITE", "lax")}`, "i").test(line)));
    if (config.get<boolean>("ADMIN_COOKIE_SECURE", false)) assert(cookies.every((line) => /secure/i.test(line)));
    assert(primary.get("dk_admin_access") && primary.get("dk_admin_refresh"));
    const me = await request("/admin/auth/me", { jar: primary }); assert(me.response.ok);
    const persisted = await request("/admin/auth/me", { jar: primary.clone() }); assert(persisted.response.ok);

    verificationStep = "dashboard";
    const dashboard = await request("/admin/dashboard", { jar: primary }); assert(dashboard.response.ok);
    const counts = (dashboard.data as { counts: Record<string, number> }).counts;
    const expected = await prisma.$transaction([
      prisma.portfolioProject.count({ where: { deletedAt: null } }), prisma.service.count({ where: { deletedAt: null } }), prisma.package.count({ where: { isActive: true } }),
      prisma.quoteRequest.count({ where: { status: "NEW" } }), prisma.contactMessage.count({ where: { status: "NEW" } }), prisma.testimonial.count({ where: { status: "PUBLISHED" } }),
    ]);
    assert([counts.projects, counts.services, counts.packages, counts.quotes, counts.contacts, counts.testimonials].every((value, index) => value === expected[index]));

    verificationStep = "refresh-rotation-and-replay";
    const sessionsBeforeRefresh = await request("/admin/auth/sessions", { jar: primary });
    const current = (sessionsBeforeRefresh.data as Array<{ id: string; current: boolean }>).find((session) => session.current); assert(current);
    const oldRefresh = primary.get("dk_admin_refresh"); assert(oldRefresh);
    primary.set("dk_admin_access", signAccessToken({ sub: (me.data as { id: string }).id, sid: current!.id, roles: (me.data as { roles: string[] }).roles, exp: 1, type: "access" }, accessSecret));
    const expired = await request("/admin/auth/me", { jar: primary }); assert(expired.response.status === 401);
    const refreshed = await request("/admin/auth/refresh", { method: "POST", jar: primary }); assert(refreshed.response.ok && primary.get("dk_admin_refresh") !== oldRefresh);
    assert((await request("/admin/auth/me", { jar: primary })).response.ok);
    const replay = new CookieJar(); replay.set("dk_admin_refresh", oldRefresh!);
    assert((await request("/admin/auth/refresh", { method: "POST", jar: replay })).response.status === 401);
    assert((await request("/admin/auth/me", { jar: primary })).response.status === 401);

    verificationStep = "individual-session-revocation";
    primary = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: true }, jar: primary })).response.ok);
    const second = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: true }, jar: second })).response.ok);
    const sessionRows = (await request("/admin/auth/sessions", { jar: primary })).data as Array<{ id: string; current: boolean }>;
    const other = sessionRows.find((session) => !session.current); assert(other);
    assert((await request(`/admin/auth/sessions/${other!.id}`, { method: "DELETE", jar: primary })).response.ok);
    assert((await request("/admin/auth/me", { jar: second })).response.status === 401);

    verificationStep = "password-change";
    const changedPassword = temporaryPassword(); passwordMayDiffer = true;
    assert((await request("/admin/auth/change-password", { method: "POST", body: { currentPassword: ownerPassword, newPassword: changedPassword }, jar: primary })).response.ok);
    const changedJar = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: changedPassword, rememberMe: false }, jar: changedJar })).response.ok);
    assert((await request("/admin/auth/change-password", { method: "POST", body: { currentPassword: changedPassword, newPassword: ownerPassword }, jar: changedJar })).response.ok); passwordMayDiffer = false;

    verificationStep = "password-reset";
    const resetJar = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: false }, jar: resetJar })).response.ok);
    verificationStep = "password-reset-request";
    const forgot = await request("/admin/auth/forgot-password", { method: "POST", body: { email } }); assert(forgot.response.ok);
    verificationStep = "password-reset-delivery";
    const resetUrl = resetDelivery.consumeForTesting(email); assert(resetUrl);
    const resetToken = new URL(resetUrl!).searchParams.get("token"); assert(resetToken);
    const resetPassword = temporaryPassword(); passwordMayDiffer = true;
    verificationStep = "password-reset-completion";
    assert((await request("/admin/auth/reset-password", { method: "POST", body: { token: resetToken!, password: resetPassword } })).response.ok);
    verificationStep = "password-reset-single-use";
    assert((await request("/admin/auth/reset-password", { method: "POST", body: { token: resetToken!, password: temporaryPassword() } })).response.status === 400);
    verificationStep = "password-reset-login";
    const afterReset = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: resetPassword, rememberMe: false }, jar: afterReset })).response.ok);
    verificationStep = "password-reset-owner-password-restore";
    assert((await request("/admin/auth/change-password", { method: "POST", body: { currentPassword: resetPassword, newPassword: ownerPassword }, jar: afterReset })).response.ok); passwordMayDiffer = false;

    verificationStep = "logout-all-and-logout";
    const allA = new CookieJar(), allB = new CookieJar();
    assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: true }, jar: allA })).response.ok);
    assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: true }, jar: allB })).response.ok);
    verificationStep = "logout-all";
    assert((await request("/admin/auth/logout-all", { method: "POST", jar: allA })).response.ok);
    verificationStep = "logout-all-access-rejection";
    assert((await request("/admin/auth/me", { jar: allA })).response.status === 401 && (await request("/admin/auth/me", { jar: allB })).response.status === 401);
    verificationStep = "logout-login";
    const logoutJar = new CookieJar(); assert((await request("/admin/auth/login", { method: "POST", body: { email, password: ownerPassword, rememberMe: false }, jar: logoutJar })).response.ok);
    verificationStep = "logout";
    assert((await request("/admin/auth/logout", { method: "POST", jar: logoutJar })).response.ok && (await request("/admin/auth/me", { jar: logoutJar })).response.status === 401);

    verificationStep = "database-persistence";
    const user = await prisma.adminUser.findUnique({ where: { email }, select: { passwordChangedAt: true, failedLoginCount: true } });
    assert(user?.passwordChangedAt && user.failedLoginCount === 0);
    assert(await prisma.refreshSession.count({ where: { user: { email }, revokedAt: { not: null } } }) > 0);
    assert(await prisma.refreshSession.count({ where: { user: { email }, replacedById: { not: null } } }) > 0);
    assert(await prisma.passwordResetToken.count({ where: { user: { email }, usedAt: { not: null } } }) > 0);
    console.info("Live Admin verification passed: authentication, cookies, rotation, persistence, dashboard, password lifecycle, reset lifecycle, and session revocation.");
  } finally {
    if (passwordMayDiffer) {
      await prisma.adminUser.update({ where: { email }, data: { passwordHash: await hashPassword(ownerPassword), passwordChangedAt: new Date() } });
      await prisma.refreshSession.updateMany({ where: { user: { email }, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await app.close(); await prisma.$disconnect();
  }
}

main().catch(() => { console.error(`Live Admin verification failed safely during: ${verificationStep}.`); process.exitCode = 1; });
