import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — Creative Design Studio`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  category: "design",
  referrer: "origin-when-cross-origin",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description, url: siteConfig.url, locale: "en_LK" },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><JsonLd data={[organizationJsonLd, websiteJsonLd]}/><SiteShell>{children}</SiteShell></body></html>;
}
