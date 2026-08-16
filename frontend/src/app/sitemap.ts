import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/contact", "/portfolio", "/packages", "/get-a-quote", "/privacy-policy", "/terms"].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly" }));
}
