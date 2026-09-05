import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import {homeCmsContent,type HomeCmsContent} from "@/content/home-cms";
import {loadPageSection} from "@/services/public-content";
import {loadPortfolioCategories,loadTestimonials,type PublicTestimonial} from "@/services/public-content";
import type {PortfolioCategoryCard} from "@/content/portfolio";

// Only `alternates` is set here -- the root layout's `openGraph` object already points
// at the site root (the same URL as this page), and Next.js replaces rather than
// deep-merges a nested metadata object like `openGraph` between a layout and its page,
// so redeclaring even one field of it here would silently drop the rest (title,
// description, siteName, type, locale) for the homepage specifically.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home(){const content=await loadPageSection<HomeCmsContent>("home","content",homeCmsContent);let categories:PortfolioCategoryCard[]=[];let testimonials:PublicTestimonial[]=[];try{categories=await loadPortfolioCategories()}catch{categories=[]}try{testimonials=await loadTestimonials()}catch{testimonials=[]}return <HomePage content={content} categories={categories} testimonials={testimonials}/>}
