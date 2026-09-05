import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // The backend API runs on its own origin and was never crawlable from this frontend's
  // robots.txt in the first place, but disallowing /api/ here too is a harmless
  // backstop in case a reverse proxy ever exposes it under this same domain.
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/preview/", "/api/"] }], sitemap: `${siteConfig.url}/sitemap.xml`, host: siteConfig.url };
}
