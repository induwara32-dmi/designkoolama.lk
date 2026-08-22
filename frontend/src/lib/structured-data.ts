import { siteConfig } from "@/lib/site";

const absolute = (path: string) => new URL(path, siteConfig.url).toString();

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteConfig.url}/#organization`,
  name: siteConfig.legalName,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  email: "hello@designkoolama.com",
  telephone: "+94 77 000 0000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No. 460, Thalawathugoda Road, Madiwela",
    addressLocality: "Sri Jayawardenepura Kotte",
    addressRegion: "Colombo",
    addressCountry: "LK",
  },
};

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
