import { siteConfig } from "@/lib/site";
import type { SiteContent } from "@/content/site-content";

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

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
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    // No standalone logo file exists in the codebase yet (the visible "wordmark" is
    // just styled text) -- reusing the generated OG image is a reasonable placeholder
    // until a real square/rectangular logo asset is supplied.
    logo: `${siteConfig.url}/opengraph-image`,
    image: `${siteConfig.url}/opengraph-image`,
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
  "@id": `${siteConfig.url}/#website`,
  url: siteConfig.url,
  name: siteConfig.name,
  description: siteConfig.description,
  publisher: { "@id": `${siteConfig.url}/#organization` },
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
    provider: { "@id": `${siteConfig.url}/#organization` },
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
    creator: { "@id": `${siteConfig.url}/#organization` },
    copyrightHolder: { "@id": `${siteConfig.url}/#organization` },
    dateCreated: project.date,
    about: project.client,
  };
}
