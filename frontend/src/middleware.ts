import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The backend API lives on its own origin and is called via fetch() from client
// components (forms, the admin panel) -- connect-src must allow it explicitly or those
// requests are silently blocked by the CSP.
const apiOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return "";
  try { return new URL(url).origin; } catch { return ""; }
})();
const isProduction = process.env.NODE_ENV === "production";

export function middleware(request: NextRequest) {
  // A fresh nonce per request, threaded to Next.js via the x-nonce request header (its
  // documented pattern): Next automatically applies this nonce to its own
  // framework-injected inline scripts (hydration bootstrap, dev-mode fast refresh,
  // streaming/suspense chunks), which is why a plain `script-src 'self'` -- with no
  // nonce and no 'unsafe-inline' -- was blocking normal page loads outright in
  // testing, not just some edge case.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets a nonced script load further scripts (Next's own chunk
    // loading) without allowlisting every chunk URL by hash; browsers that don't
    // support it fall back to 'self' + the nonce.
    // Dev mode only: Next's Hot Module Replacement and React's dev-mode debugging
    // (reconstructing callstacks) call eval() directly, which no nonce can permit --
    // eval() is exempted from CSP only via 'unsafe-eval'. Dev builds never ship to real
    // users, so this relaxation never reaches production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProduction ? "" : " 'unsafe-eval'"}`,
    // React/framer-motion set inline `style=""` attributes throughout this codebase
    // (e.g. Image objectFit, motion transforms) -- CSP treats those as inline styles
    // regardless of source, and a nonce only covers <style> tags/elements, not style
    // attributes, so there is no nonce-based way to avoid 'unsafe-inline' here short of
    // rewriting every animated and image component to avoid inline styles entirely.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://res.cloudinary.com",
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Every request except Next's own static assets and the favicon -- those are
    // immutable/hashed files with nothing to enforce a per-request nonce against.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
