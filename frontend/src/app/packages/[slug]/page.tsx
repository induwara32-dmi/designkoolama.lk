import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageExperiencePage } from "@/components/packages/package-experience-page";
import { packageExperiences, type PackageExperience } from "@/content/packages";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { loadPackages } from "@/services/public-content";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

// Live data first, same reasoning as /services/[slug]: the static list only covers the
// originally-seeded categories, so gating metadata (or the page itself) on it would
// leave every admin-created package category without real SEO tags or a working page.
async function resolveExperience(slug: string): Promise<PackageExperience | null> {
  try {
    const experiences = await loadPackages(packageExperiences);
    return experiences.find((entry) => entry.slug === slug) ?? null;
  } catch {
    return packageExperiences.find((entry) => entry.slug === slug) ?? null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await resolveExperience(slug);
  if (!item) return {};
  const url = `/packages/${item.slug}`;
  // `title.absolute` opts out of the root layout's "%s | DesignKoolama" template --
  // item.seoTitle already ends with "| DesignKoolama" itself, so applying the template
  // on top (as a plain string title would) produced a doubled suffix.
  return {
    title: { absolute: item.seoTitle },
    description: item.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: item.seoTitle, description: item.metaDescription, url, type: "website" },
    twitter: { card: "summary_large_image", title: item.seoTitle, description: item.metaDescription },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  let experiences;
  try { experiences = await loadPackages(packageExperiences); }
  catch { return <ContentUnavailable />; }
  const item = experiences.find((entry) => entry.slug === slug);
  if (!item) notFound();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Packages", path: "/packages" },
          { name: item.name, path: `/packages/${item.slug}` },
        ])}
      />
      <PackageExperiencePage experience={item} />
    </>
  );
}
