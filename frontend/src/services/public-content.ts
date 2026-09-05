import type { PackageExperience } from "@/content/packages";
import type {
  PortfolioCategoryCard,
  PortfolioMedia,
  PortfolioProject,
} from "@/content/portfolio";
import type { ServiceContent } from "@/content/services";
const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const fallbackEnabled = process.env.CONTENT_FALLBACK_ENABLED === "true";
type Envelope<T> = { data: T };
type PortfolioApiItem =
  | (PortfolioProject & { media?: PortfolioProject["media"] })
  | {
      content: PortfolioProject;
      media?: PortfolioProject["media"];
    };
const portfolioProject = (item: PortfolioApiItem): PortfolioProject => {
  if ("slug" in item && typeof item.slug === "string") {
    const raw = item as unknown as Record<string, unknown>;
    const direct = item as PortfolioProject;
    const clientName =
      typeof raw.clientName === "string" ? raw.clientName : undefined;
    const summary = typeof raw.summary === "string" ? raw.summary : undefined;
    const categoryValue = raw.category;
    const serviceValue = raw.service;
    const details =
      raw.content && typeof raw.content === "object"
        ? (raw.content as Partial<PortfolioProject>)
        : {};
    return {
      ...details,
      ...direct,
      client: direct.client ?? clientName ?? details.client ?? "",
      category: (typeof categoryValue === "string"
        ? categoryValue
        : ((categoryValue as { name?: string } | null)?.name ??
          details.category ??
          "")) as PortfolioProject["category"],
      categorySlug:
        typeof categoryValue === "object" && categoryValue
          ? (categoryValue as { slug?: string }).slug
          : details.categorySlug,
      service:
        typeof serviceValue === "string"
          ? serviceValue
          : ((serviceValue as { name?: string } | null)?.name ??
            details.service ??
            ""),
      description: direct.description ?? summary ?? details.description ?? "",
      date: direct.date ?? details.date ?? "",
      overview: direct.overview ?? details.overview ?? "",
      challenge: direct.challenge ?? details.challenge ?? "",
      solution: direct.solution ?? details.solution ?? "",
      results: direct.results ?? details.results ?? [],
      tone: direct.tone ?? details.tone ?? "rings",
      media: direct.media ?? details.media,
    };
  }
  const wrapped = item as {
    content: PortfolioProject;
    media?: PortfolioProject["media"];
  };
  return {
    ...wrapped.content,
    media: wrapped.media ?? wrapped.content.media,
  };
};
async function get<T>(path: string, fresh = false): Promise<T> {
  if (!apiUrl) throw new Error("Public content API is not configured");
  const response = await fetch(
    `${apiUrl}${path}`,
    fresh
      ? { cache: "no-store", signal: AbortSignal.timeout(8_000) }
      : { next: { revalidate: 60 }, signal: AbortSignal.timeout(8_000) },
  );
  if (response.status === 404) throw new Error("NOT_FOUND");
  if (!response.ok) throw new Error("Public content API unavailable");
  const body = (await response.json()) as Partial<Envelope<T>>;
  if (!body.data) throw new Error("Invalid public content response");
  return body.data;
}
export async function loadPreview(resource: string, id: string, token: string) {
  if (!apiUrl) throw new Error("Public content API is not configured");
  const response = await fetch(
    `${apiUrl}/preview/${encodeURIComponent(resource)}/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
    { cache: "no-store", signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) throw new Error("Preview is unavailable or expired");
  const body = (await response.json()) as Partial<
    Envelope<Record<string, unknown>>
  >;
  if (!body.data) throw new Error("Invalid preview response");
  return body.data;
}
export async function loadService(slug: string, fallback?: ServiceContent) {
  try {
    return (await get<{ content: ServiceContent }>(`/public/services/${slug}`))
      .content;
  } catch (error) {
    if (fallbackEnabled && fallback) {
      console.warn(`[content-fallback] service:${slug}`);
      return fallback;
    }
    throw error;
  }
}
export type ServiceShowcaseItem = {
  slug: string;
  title: string;
  image: { url: string; secureUrl?: string; altText: string } | null;
};
export async function loadServiceShowcase(categorySlug: string): Promise<ServiceShowcaseItem[]> {
  try {
    const result = await get<{ items: Array<Record<string, unknown>> }>(
      `/public/portfolio-categories/${encodeURIComponent(categorySlug)}/showcase`,
    );
    return result.items
      .map((row) => {
        const mediaEntry = Array.isArray(row.media)
          ? (row.media[0] as { media?: Record<string, unknown> } | undefined)
          : undefined;
        const media = mediaEntry?.media;
        const title = String(row.title ?? row.clientName ?? "");
        return {
          slug: String(row.slug ?? ""),
          title,
          image: media
            ? {
                url: String(media.url ?? ""),
                secureUrl: media.secureUrl ? String(media.secureUrl) : undefined,
                altText: String(media.altText ?? title),
              }
            : null,
        };
      })
      .filter((item) => item.slug);
  } catch {
    // A Service with no matching Portfolio Category (or a temporarily unreachable API)
    // should just hide the Visual Showcase section, not break the page.
    return [];
  }
}
export async function loadServices(fallback?: readonly ServiceContent[]) {
  try {
    const rows = await get<Array<{ content: ServiceContent }>>("/public/services");
    return rows.map((row) => row.content).filter((item) => item && item.slug);
  } catch (error) {
    if (fallbackEnabled && fallback) {
      console.warn("[content-fallback] services");
      return [...fallback];
    }
    throw error;
  }
}
export async function loadPortfolio(fallback?: PortfolioProject[]) {
  try {
    return (
      await get<{
        items: PortfolioApiItem[];
      }>("/public/portfolio?limit=50")
    ).items.map(portfolioProject);
  } catch (error) {
    if (fallbackEnabled && fallback) {
      console.warn("[content-fallback] portfolio");
      return fallback;
    }
    throw error;
  }
}
export async function loadPortfolioCategories() {
  return get<PortfolioCategoryCard[]>("/public/portfolio-categories", true);
}
export type PublicTestimonial = { clientName: string; clientRole?: string | null; company?: string | null; quote: string; rating?: number | null; displayOrder: number; avatar?: PortfolioMedia | null };
export async function loadTestimonials() {
  return get<PublicTestimonial[]>("/public/testimonials", true);
}
export async function loadPortfolioCategory(slug: string, page = 1) {
  const result = await get<{
    category: PortfolioCategoryCard;
    items: Array<{displayOrder:number;media:PortfolioMedia}>;
    pagination: { page: number; pages: number; total: number };
  }>(
    `/public/portfolio-categories/${encodeURIComponent(slug)}?page=${page}&limit=9`,
    true,
  );
  return {
    category: result.category,
    images: result.items,
    pagination: result.pagination,
  };
}
export async function loadProject(slug: string, fallback?: PortfolioProject) {
  try {
    const item = await get<PortfolioApiItem>(`/public/portfolio/${slug}`, true);
    return portfolioProject(item);
  } catch (error) {
    if (fallbackEnabled && fallback) {
      console.warn(`[content-fallback] portfolio:${slug}`);
      return fallback;
    }
    throw error;
  }
}
export async function loadPackages(fallback?: readonly PackageExperience[]) {
  try {
    const rows =
      await get<Array<{ content: PackageExperience }>>("/public/packages");
    return rows.map((row) => row.content).filter((item) => item && item.slug);
  } catch (error) {
    if (fallbackEnabled && fallback) {
      console.warn("[content-fallback] packages");
      return [...fallback];
    }
    throw error;
  }
}
export async function loadPageSection<T>(
  slug: string,
  key: string,
  fallback: T,
): Promise<T> {
  try {
    const page = await get<{
      sections?: Array<{ key: string; content: unknown; isEnabled?: boolean }>;
    }>(`/public/pages/${slug}`);
    const section = page.sections?.find(
      (item) => item.key === key && item.isEnabled !== false,
    );
    return section?.content && typeof section.content === "object"
      ? (section.content as T)
      : fallback;
  } catch {
    return fallback;
  }
}
