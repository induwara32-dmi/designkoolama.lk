// Slug-based public routes (/packages/<slug>, /services/<slug>) and their retired slugs.
// A retired slug only redirects once no live entry uses it; a retired slug that points at
// another slug only redirects while that target is live, so a redirect never chains, loops
// or lands on a missing page.
export type SlugRoutes = { basePath: string; retired: Readonly<Record<string, string>> };

export const PACKAGE_ROUTES: SlugRoutes = { basePath: "/packages", retired: { tutor: "/packages" } };
export const SERVICE_ROUTES: SlugRoutes = { basePath: "/services", retired: { "packaging-design": "/services/book-cover-design" } };

export type SlugRoute =
  | { kind: "page"; slug: string }
  | { kind: "redirect"; to: string }
  | { kind: "notFound" };

export function resolveSlugRoute(requested: string, liveSlugs: readonly string[], routes: SlugRoutes): SlugRoute {
  if (liveSlugs.includes(requested)) return { kind: "page", slug: requested };
  const normalized = requested.trim().replace(/\/+$/, "").toLowerCase();
  if (normalized !== requested && liveSlugs.includes(normalized)) return { kind: "redirect", to: `${routes.basePath}/${normalized}` };
  const target = routes.retired[normalized];
  if (!target) return { kind: "notFound" };
  const prefix = `${routes.basePath}/`;
  if (!target.startsWith(prefix)) return { kind: "redirect", to: target };
  const targetSlug = target.slice(prefix.length);
  return targetSlug !== normalized && liveSlugs.includes(targetSlug) ? { kind: "redirect", to: target } : { kind: "notFound" };
}

/** The live slug a stored reference now points to (itself, or its renamed target), or null. */
export function liveSlugFor(reference: string, liveSlugs: readonly string[], routes: SlugRoutes): string | null {
  const route = resolveSlugRoute(reference, liveSlugs, routes);
  if (route.kind === "page") return route.slug;
  if (route.kind === "redirect" && route.to.startsWith(`${routes.basePath}/`)) return route.to.slice(routes.basePath.length + 1);
  return null;
}
