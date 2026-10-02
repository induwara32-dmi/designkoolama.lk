export function shouldExposeSwagger(nodeEnvironment: string | undefined, explicitlyEnabled: boolean | undefined) {
  return nodeEnvironment !== "production" || explicitlyEnabled === true;
}

// The real custom domain, apex and www. Hardcoded rather than sourced from
// FRONTEND_URL/ADMIN_FRONTEND_URL: those env vars have previously drifted stale
// after the custom domain went live (left pointing at the old
// designkoolama-lk-frontend.vercel.app deployment URL), which silently broke
// admin sign-in -- both app.enableCors (create-app.ts) and AdminOriginGuard
// (admin-auth/origin.guard.ts) reject any Origin that isn't an exact match.
// Always including these means that env var drifting again can't take admin
// sign-in down with it.
export const TRUSTED_PRODUCTION_ORIGINS = [
  "https://designkoolama.lk",
  "https://www.designkoolama.lk",
];
