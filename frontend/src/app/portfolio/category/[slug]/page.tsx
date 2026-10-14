import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CategoryGallery } from "@/components/portfolio/category-gallery";
import { JsonLd } from "@/components/seo/json-ld";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { loadPortfolioCategories, loadPortfolioCategory } from "@/services/public-content";
import { CATEGORY_ROUTES, resolveSlugRoute } from "@/lib/slug-routes";
import { categoryCardTitle } from "@/content/portfolio";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { category } = await loadPortfolioCategory(slug);
    const title = `${categoryCardTitle(category)} Portfolio`;
    const description =
      category.description ||
      `Explore ${category.name} projects by DesignKoolama.`;
    const image = category.bannerMedia ?? category.cardMedia;
    return {
      title,
      description,
      alternates: { canonical: `/portfolio/category/${category.slug}` },
      openGraph: {
        title,
        description,
        url: `/portfolio/category/${category.slug}`,
        // Omitted entirely when the category has no image of its own -- Next.js then
        // falls back to the site-wide default (app/opengraph-image.tsx) automatically.
        ...(image ? { images: [{ url: image.secureUrl || image.url, alt: image.altText || title }] } : {}),
      },
    };
  } catch {
    return {
      title: "Portfolio category",
      robots: { index: false, follow: false },
    };
  }
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let result: Awaited<ReturnType<typeof loadPortfolioCategory>>;
  try {
    result = await loadPortfolioCategory(slug, page);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      // Page-level fallback for the middleware redirect (renamed or uppercase slugs).
      const live = await loadPortfolioCategories().then((items) => items.map((item) => item.slug)).catch(() => [] as string[]);
      const route = resolveSlugRoute(slug, live, CATEGORY_ROUTES);
      if (route.kind === "redirect") permanentRedirect(route.to);
      notFound();
    }
    return <ContentUnavailable />;
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
          {
            name: result.category.name,
            path: `/portfolio/category/${result.category.slug}`,
          },
        ])}
      />
      <CategoryGallery
        category={result.category}
        images={result.images}
        page={page}
        pages={result.pagination.pages}
      />
    </>
  );
}
