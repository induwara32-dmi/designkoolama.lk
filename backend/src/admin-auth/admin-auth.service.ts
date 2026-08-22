import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { AdminPrincipal, AccessClaims } from "./auth.types";
import type { ChangePasswordDto, LoginDto, ResetPasswordDto } from "./auth.dto";
import { assertStrongPassword, hashPassword, hashToken, randomToken, readCookie, signAccessToken, verifyPassword } from "./security";
import { SafeResetDeliveryProvider } from "./reset-delivery.provider";

const ACCESS_COOKIE = "dk_admin_access";
const REFRESH_COOKIE = "dk_admin_refresh";

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly resetDelivery: SafeResetDeliveryProvider) {}

  private tokenHash(token: string) { return hashToken(token, this.config.getOrThrow("ADMIN_REFRESH_TOKEN_SECRET")); }

  private cookieBase() {
    const domain = this.config.get<string>("ADMIN_COOKIE_DOMAIN") || undefined;
    return { httpOnly: true, secure: this.config.get<boolean>("ADMIN_COOKIE_SECURE", false), sameSite: this.config.get<"strict" | "lax" | "none">("ADMIN_COOKIE_SAME_SITE", "lax"), domain, path: "/" } as const;
  }
  private clearCookies(response: Response) { response.clearCookie(ACCESS_COOKIE, this.cookieBase()); response.clearCookie(REFRESH_COOKIE, this.cookieBase()); }
  private async issue(userId: string, roles: string[], request: Request, response: Response, rememberMe = false) {
    const accessSeconds = this.config.get<number>("ADMIN_ACCESS_TOKEN_TTL_SECONDS", 900);
    const refreshDays = rememberMe ? this.config.get<number>("ADMIN_REFRESH_TOKEN_TTL_DAYS", 7) : 1;
    const now = Math.floor(Date.now() / 1000);
    const refresh = randomToken();
    const session = await this.prisma.refreshSession.create({ data: { userId, tokenHash: this.tokenHash(refresh), userAgent: request.headers["user-agent"]?.slice(0, 500), ipAddress: request.ip, expiresAt: new Date(Date.now() + refreshDays * 86_400_000) }, select: { id: true } });
    const access = signAccessToken({ sub: userId, sid: session.id, roles, exp: now + accessSeconds, type: "access" } satisfies AccessClaims, this.config.getOrThrow("ADMIN_ACCESS_TOKEN_SECRET"));
    response.cookie(ACCESS_COOKIE, access, { ...this.cookieBase(), maxAge: accessSeconds * 1000 });
    response.cookie(REFRESH_COOKIE, refresh, { ...this.cookieBase(), maxAge: refreshDays * 86_400_000 });
    return session.id;
  }
  private safeUser(user: { id: string; email: string; displayName: string; status: string; lastLoginAt: Date | null; roles: { role: { name: string } }[] }) {
    return { id: user.id, email: user.email, displayName: user.displayName, status: user.status, lastLoginAt: user.lastLoginAt, roles: user.roles.map((item) => item.role.name) };
  }

  async login(dto: LoginDto, request: Request, response: Response) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({ where: { email }, include: { roles: { include: { role: true } } } });
    if (!user || user.deletedAt || user.status !== "ACTIVE") throw new UnauthorizedException("Invalid email or password");
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new HttpException("Account temporarily locked", HttpStatus.LOCKED);
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      const failures = user.failedLoginCount + 1; const lockedUntil = failures >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
      await this.prisma.adminUser.update({ where: { id: user.id }, data: { failedLoginCount: failures, lockedUntil } });
      throw new UnauthorizedException("Invalid email or password");
    }
    const roles = user.roles.map((item) => item.role.name); const now = new Date();
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now } }),
      this.prisma.activityLog.create({ data: { actorId: user.id, action: "ADMIN_LOGIN", entityType: "AdminUser", entityId: user.id, ipAddress: request.ip } }),
    ]);
    await this.issue(user.id, roles, request, response, dto.rememberMe);
    return { admin: this.safeUser({ ...user, lastLoginAt: now }) };
  }

  async refresh(request: Request, response: Response) {
    const token = readCookie(request.headers.cookie, REFRESH_COOKIE);
    if (!token) throw new UnauthorizedException("Refresh required");
    const tokenHash = this.tokenHash(token); const now = new Date();
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash }, include: { user: { include: { roles: { include: { role: true } } } } } });
    if (!session) { this.clearCookies(response); throw new UnauthorizedException("Invalid session"); }
    if (session.revokedAt) {
      await this.prisma.refreshSession.updateMany({ where: { userId: session.userId, revokedAt: null }, data: { revokedAt: now } });
      this.clearCookies(response); throw new UnauthorizedException("Invalid session");
    }
    if (session.expiresAt <= now || session.user.status !== "ACTIVE" || session.user.deletedAt) { await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: now } }); this.clearCookies(response); throw new UnauthorizedException("Session expired"); }
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: now, lastUsedAt: now } });
    const newSessionId = await this.issue(session.userId, session.user.roles.map((item) => item.role.name), request, response, true);
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { replacedById: newSessionId } });
    return { refreshed: true };
  }

  async logout(request: Request, response: Response) {
    const token = readCookie(request.headers.cookie, REFRESH_COOKIE);
    if (token) await this.prisma.refreshSession.updateMany({ where: { tokenHash: this.tokenHash(token), revokedAt: null }, data: { revokedAt: new Date() } });
    this.clearCookies(response); return { loggedOut: true };
  }
  async logoutAll(adminId: string, response: Response) { await this.prisma.refreshSession.updateMany({ where: { userId: adminId, revokedAt: null }, data: { revokedAt: new Date() } }); this.clearCookies(response); return { loggedOut: true }; }

  async profile(adminId: string) {
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: adminId }, include: { roles: { include: { role: true } } } });
    return this.safeUser(user);
  }
  async sessions(adminId: string, request: Request) {
    const currentHash = readCookie(request.headers.cookie, REFRESH_COOKIE); const hash = currentHash ? this.tokenHash(currentHash) : "";
    const rows = await this.prisma.refreshSession.findMany({ where: { userId: adminId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { id: true, tokenHash: true, userAgent: true, ipAddress: true, createdAt: true, lastUsedAt: true, expiresAt: true } });
    return rows.map(({ tokenHash, ...row }) => ({ ...row, current: tokenHash === hash }));
  }
  async revokeSession(adminId: string, sessionId: string) { await this.prisma.refreshSession.updateMany({ where: { id: sessionId, userId: adminId, revokedAt: null }, data: { revokedAt: new Date() } }); return { revoked: true }; }

  async forgotPassword(emailValue: string) {
    const email = emailValue.trim().toLowerCase(); const user = await this.prisma.adminUser.findFirst({ where: { email, status: "ACTIVE", deletedAt: null } });
    if (user) {
      const token = randomToken(); const row = await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: this.tokenHash(token), expiresAt: new Date(Date.now() + this.config.get<number>("PASSWORD_RESET_TTL_MINUTES", 30) * 60_000) } });
      const base = this.config.getOrThrow<string>("PASSWORD_RESET_FRONTEND_URL"); const delivered = this.resetDelivery.deliver(user.email, `${base}?token=${encodeURIComponent(token)}`);
      if (!delivered) await this.prisma.passwordResetToken.delete({ where: { id: row.id } });
    }
    return { message: "If an eligible account exists, password reset instructions will be sent." };
  }
  async resetPassword(dto: ResetPasswordDto, request: Request) {
    if (!assertStrongPassword(dto.password)) throw new BadRequestException("Password does not meet security requirements");
    const row = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: this.tokenHash(dto.token) } }); const now = new Date();
    if (!row || row.usedAt || row.expiresAt <= now) throw new BadRequestException("Reset link is invalid or expired");
    const passwordHash = await hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: now } }),
      this.prisma.adminUser.update({ where: { id: row.userId }, data: { passwordHash, passwordChangedAt: now, failedLoginCount: 0, lockedUntil: null } }),
      this.prisma.refreshSession.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: now } }),
      this.prisma.activityLog.create({ data: { actorId: row.userId, action: "PASSWORD_RESET", entityType: "AdminUser", entityId: row.userId, ipAddress: request.ip } }),
    ]);
    return { reset: true };
  }
  async changePassword(admin: AdminPrincipal, dto: ChangePasswordDto, request: Request, response: Response) {
    if (!assertStrongPassword(dto.newPassword)) throw new BadRequestException("Password does not meet security requirements");
    const user = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) throw new UnauthorizedException("Current password is incorrect");
    const now = new Date(); const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash, passwordChangedAt: now } }),
      this.prisma.refreshSession.updateMany({ where: { userId: admin.id, revokedAt: null }, data: { revokedAt: now } }),
      this.prisma.activityLog.create({ data: { actorId: admin.id, action: "PASSWORD_CHANGED", entityType: "AdminUser", entityId: admin.id, ipAddress: request.ip } }),
    ]);
    this.clearCookies(response); return { changed: true };
  }
}
