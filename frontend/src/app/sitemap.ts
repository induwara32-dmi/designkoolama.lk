import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { SERVER_API_URL } from "@/lib/api-config";

const apiUrl = SERVER_API_URL;

type Envelope<T> = { data: T };
async function fetchPublic<T>(path: string): Promise<T> {
  if (!apiUrl) throw new Error("Public content API is not configured");
  const response = await fetch(`${apiUrl}${path}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`sitemap: ${path} returned ${response.status}`);
  const body = (await response.json()) as Partial<Envelope<T>>;
  if (!body.data) throw new Error(`sitemap: ${path} returned an invalid response`);
  return body.data;
}

// Regenerated at most once an hour -- frequent enough that admin-published changes show
// up promptly, infrequent enough that crawlers never trigger a live query per hit.
export const revalidate = 3600;

const STATIC_PAGES: ReadonlyArray<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", changeFrequency: "weekly" },
  { path: "/about", changeFrequency: "monthly" },
  { path: "/contact", changeFrequency: "monthly" },
  { path: "/portfolio", changeFrequency: "weekly" },
  { path: "/packages", changeFrequency: "monthly" },
  { path: "/get-a-quote", changeFrequency: "monthly" },
  { path: "/privacy-policy", changeFrequency: "yearly" },
  { path: "/terms", changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, changeFrequency }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency,
  }));

  // Each section is fetched and applied independently: a single unreachable or empty
  // endpoint should never prevent the rest of the sitemap (or the static pages above)
  // from shipping. Draft/archived content never reaches these URLs at all -- the public
  // API these calls hit already excludes anything that isn't published.
  try {
    const categories = await fetchPublic<Array<{ slug?: string; updatedAt?: string }>>(
      "/public/portfolio-categories",
    );
    for (const category of categories) {
      if (!category.slug) continue;
      entries.push({
        url: `${siteConfig.url}/portfolio/category/${category.slug}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
        changeFrequency: "weekly",
      });
    }
  } catch {
    // Individual portfolio project pages are intentionally not included: that route
    // does not currently render a real project (see /portfolio/[slug]) so it would
    // only submit 404s to search engines.
  }

  try {
    const services = await fetchPublic<Array<{ slug?: string; updatedAt?: string }>>("/public/services");
    for (const service of services) {
      if (!service.slug) continue;
      entries.push({
        url: `${siteConfig.url}/services/${service.slug}`,
        lastModified: service.updatedAt ? new Date(service.updatedAt) : now,
        changeFrequency: "monthly",
      });
    }
  } catch {}

  try {
    const packageCategories = await fetchPublic<Array<{ slug?: string; updatedAt?: string }>>("/public/packages");
    for (const category of packageCategories) {
      if (!category.slug) continue;
      entries.push({
        url: `${siteConfig.url}/packages/${category.slug}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
        changeFrequency: "monthly",
      });
    }
  } catch {}

  return entries;
}
