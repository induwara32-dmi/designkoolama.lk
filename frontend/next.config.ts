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
