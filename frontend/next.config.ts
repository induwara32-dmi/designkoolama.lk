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
  "CONTENT_FALLBACK_ENABLED",
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

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};

export default nextConfig;
