import type { Metadata } from "next";
import { PortfolioPage } from "@/components/pages/portfolio-page";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { portfolioProjects } from "@/content/portfolio";
import { loadPortfolio } from "@/services/public-content";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Portfolio",description:"Explore selected identity, campaign, packaging, merchandise, and 3D projects by DesignKoolama.",alternates:{canonical:"/portfolio"},openGraph:{title:"DesignKoolama Portfolio",description:"Selected work and brand transformations.",url:"/portfolio"}};
export default async function Page(){try{return <PortfolioPage projects={await loadPortfolio(portfolioProjects)}/>}catch{return <ContentUnavailable/>}}
