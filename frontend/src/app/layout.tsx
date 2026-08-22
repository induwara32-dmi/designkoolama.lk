import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — Creative Design Studio`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { type: "website", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>;
}
