import { siteConfig } from "@/lib/site";
import type { SiteContent } from "@/content/site-content";

// Hardcoded rather than siteConfig.url: structured data URLs must always resolve
// to the custom domain, not whatever NEXT_PUBLIC_SITE_URL happens to be set to
// (which has previously pointed at the Vercel deployment URL).
const SITE_URL = "https://designkoolama.lk";

const absolute = (path: string) => new URL(path, SITE_URL).toString();

// A function, not a static object, so this always reflects whatever is actually
// published in the "Shared website content" CMS record -- the same source the footer
// reads from. A hardcoded copy here previously drifted out of sync with the footer's
// real (admin-editable) contact details.
export function organizationJsonLd(site: SiteContent) {
  return {
    "@context": "https://schema.org",
    // LocalBusiness in addition to ProfessionalService: a Colombo-based studio with a
    // real street address and phone number qualifies for local-business rich results.
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: SITE_URL,
    // No standalone logo file exists in the codebase yet (the visible "wordmark" is
    // just styled text) -- reusing the generated OG image is a reasonable placeholder
    // until a real square/rectangular logo asset is supplied.
    logo: `${SITE_URL}/opengraph-image`,
    image: `${SITE_URL}/opengraph-image`,
    email: site.contact.emails[0],
    telephone: site.contact.phoneLabel,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.contact.address[0] ?? "",
      addressLocality: "Sri Jayawardenepura Kotte",
      addressRegion: "Colombo",
      addressCountry: "LK",
    },
    sameAs: site.social
      .filter((item) => item.visible && item.href.startsWith("http"))
      .map((item) => item.href),
  };
}

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: siteConfig.name,
  description: siteConfig.description,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

export function serviceJsonLd(service: { name: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: absolute(`/services/${service.slug}`),
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: [{ "@type": "Country", name: "Sri Lanka" }, "Worldwide"],
  };
}

export function creativeWorkJsonLd(project: { title: string; description: string; slug: string; client: string; date: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: absolute(`/portfolio/${project.slug}`),
    creator: { "@id": `${SITE_URL}/#organization` },
    copyrightHolder: { "@id": `${SITE_URL}/#organization` },
    dateCreated: project.date,
    about: project.client,
  };
}
