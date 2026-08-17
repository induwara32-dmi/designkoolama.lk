import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { portfolioProjects } from "@/content/portfolio";
import { services } from "@/content/services";
import { packageExperiences } from "@/content/packages";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/contact", "/portfolio", "/packages", "/get-a-quote", "/privacy-policy", "/terms", ...portfolioProjects.map(({slug})=>`/portfolio/${slug}`), ...services.map(({slug})=>`/services/${slug}`), ...packageExperiences.map(({slug})=>`/packages/${slug}`)].map((path) => ({ url: `${siteConfig.url}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" : "monthly" }));
}
