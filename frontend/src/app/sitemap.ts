import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { portfolioProjects } from "@/content/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/contact", "/portfolio", "/packages", "/get-a-quote", "/privacy-policy", "/terms", ...portfolioProjects.map(({slug})=>`/portfolio/${slug}`)].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly" }));
}
