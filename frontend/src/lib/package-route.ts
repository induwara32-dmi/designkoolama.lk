// Retired package-category slugs and where their old URLs should permanently go. A
// retired slug only redirects once no live category uses it, so renaming a category in
// the admin never hides a page that still exists.
export const RETIRED_PACKAGE_SLUGS: Readonly<Record<string, string>> = { tutor: "/packages" };

export type PackageRoute =
  | { kind: "page"; slug: string }
  | { kind: "redirect"; to: string }
  | { kind: "notFound" };

export function resolvePackageRoute(requested: string, liveSlugs: readonly string[]): PackageRoute {
  if (liveSlugs.includes(requested)) return { kind: "page", slug: requested };
  const normalized = requested.trim().replace(/\/+$/, "").toLowerCase();
  if (normalized !== requested && liveSlugs.includes(normalized)) return { kind: "redirect", to: `/packages/${normalized}` };
  const target = RETIRED_PACKAGE_SLUGS[normalized];
  // Retired targets must leave /packages/[slug] entirely (no slug-to-slug chains or loops).
  if (target && !target.startsWith("/packages/")) return { kind: "redirect", to: target };
  return { kind: "notFound" };
}
