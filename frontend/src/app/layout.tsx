import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import "./globals.css";
import {loadPageSection} from "@/services/public-content";
import {siteContent,type SiteContent} from "@/content/site-content";

// Previously "Inter" was only a CSS font-family name with no actual font file behind
// it, so every visitor silently fell back to their OS's default sans-serif. next/font
// self-hosts the real font (no third-party request, so no separate connect-src/
// font-src CSP entries are needed), preloads it, and applies font-display: swap
// automatically -- the exact things a launch-grade site needs from its type.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading headers() here is required, not incidental: a CSP nonce is only correct
  // when it matches the value middleware just issued for THIS request, and Next.js
  // only threads that live nonce into its own framework-injected scripts when the
  // route renders per-request. Without a Dynamic API call here, this layout (and every
  // page under it) gets statically prerendered once, permanently baking in whatever
  // nonce happened to be live at that build/revalidation -- which then can never match
  // the fresh nonce middleware sends on every subsequent request, and browsers block
  // every script on the page. Calling headers() opts the whole app into per-request
  // rendering so the baked-in and header nonces always agree.
  await headers();
  const content=await loadPageSection<SiteContent>("site-settings","site",siteContent);
  return <html lang="en" className={inter.variable}><body><JsonLd data={[organizationJsonLd(content), websiteJsonLd]}/><SiteShell content={content}>{children}</SiteShell></body></html>;
}
