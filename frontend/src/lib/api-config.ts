// The one place in the codebase allowed to read the backend API base URL from
// process.env. Every other module imports PUBLIC_API_URL / SERVER_API_URL from
// here instead of reading process.env directly, so there is exactly one definition
// to keep correct -- a prior audit found five independent copies of this read,
// one of which silently fell back to http://localhost:4000/api/v1 in production
// whenever the real env var didn't reach the build.
//
// NEXT_PUBLIC_API_URL must stay written exactly as `process.env.NEXT_PUBLIC_API_URL`
// -- a static, direct member expression. Next.js inlines NEXT_PUBLIC_ variables into
// the client bundle with a compile-time text replacement of that exact expression;
// a destructured binding (`const { NEXT_PUBLIC_API_URL } = process.env`) or a
// dynamic key (`process.env[name]`) is not recognized by that replacement and
// silently becomes `undefined` in the browser.
//
// No hardcoded fallback on purpose: a wrong-but-present value (like a stale
// localhost URL) fails *silently* -- requests go somewhere, just the wrong place,
// which is exactly how this bug shipped unnoticed. Every caller below either throws
// or renders nothing when the URL is missing, which fails loudly instead.

/** Client-safe. Undefined if NEXT_PUBLIC_API_URL wasn't set at build time. */
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Server-only. Prefers the unprefixed API_URL (e.g. an internal/private network
 * address only the server can reach) and falls back to the public URL -- safe to
 * import from client code too, since API_URL simply evaluates to undefined there
 * and PUBLIC_API_URL takes over, matching this module's existing behavior.
 */
export const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
