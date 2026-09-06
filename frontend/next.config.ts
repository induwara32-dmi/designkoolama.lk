import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// The monorepo keeps its ignored environment file at the repository root.
// Next.js otherwise searches only the frontend workspace directory. Import only
// the frontend content settings: loading the complete file would leak backend
// configuration into the frontend process and could override production mode.
const frontendEnvironmentKeys = new Set([
  "API_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_WHATSAPP_NUMBER",
  "CONTENT_FALLBACK_ENABLED",
  "CLOUDINARY_CLOUD_NAME",
]);
const rootEnvironmentPath = resolve(process.cwd(), "../.env");
const rootEnvironmentLines = existsSync(rootEnvironmentPath)
  ? readFileSync(rootEnvironmentPath, "utf8").split(/\r?\n/)
  : [];
for (const line of rootEnvironmentLines) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (!match || !frontendEnvironmentKeys.has(match[1]) || process.env[match[1]] !== undefined) continue;
  const value = match[2];
  process.env[match[1]] =
    value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")
      ? value.slice(1, -1)
      : value;
}

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  poweredByHeader: false,
  compress: true,
  // The /api/[...path] Route Handler imports the compiled backend, whose real
  // Prisma Client output (the query engine binary Prisma actually loads at
  // runtime) lives in the separate, dot-prefixed node_modules/.prisma/client/
  // directory that node_modules/@prisma/client only re-exports from -- static
  // dependency tracing can miss that split location, which silently ships a
  // function that boots but fails the moment it touches the database. This forces
  // it into the trace regardless.
  outputFileTracingIncludes: {
    "/api/**": ["../backend/node_modules/.prisma/client/**"],
  },
  // NestJS's core lazily requires optional peer packages this app never installs
  // on purpose (@nestjs/microservices, @nestjs/websockets -- only needed if you
  // actually use those transports) inside a try/catch specifically so Node's
  // runtime require() can fail gracefully; class-transformer does the same for its
  // own optional ./storage submodule. Turbopack's static bundler doesn't know
  // those requires are meant to fail softly and hard-errors the whole build trying
  // to resolve them. Marking these as external skips bundling their internals
  // entirely and lets Node require() them normally at runtime, exactly like the
  // standalone backend server already does -- not a workaround, just not
  // pretending a plain Node package needs bundling in the first place.
  serverExternalPackages: [
    "@nestjs/core",
    "@nestjs/common",
    "@nestjs/config",
    "@nestjs/platform-express",
    "@nestjs/swagger",
    "@prisma/client",
    "class-transformer",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com",pathname:process.env.CLOUDINARY_CLOUD_NAME?`/${process.env.CLOUDINARY_CLOUD_NAME}/**`:"/__cloudinary_not_configured__/**" }],
  },
  async headers() {
    // Content-Security-Policy is set in middleware.ts instead of here: it needs a
    // fresh per-request nonce (see middleware.ts for why a static policy without one
    // blocks Next's own framework-injected scripts), and a per-request value can't be
    // computed in this static config function.
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        // HSTS only makes sense once the site is actually served over HTTPS in
        // production; sending it in local dev (plain http) has no effect in browsers
        // but there is no reason to send a header that doesn't apply.
        ...(isProduction ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
      ],
    }];
  },
};

export default nextConfig;
