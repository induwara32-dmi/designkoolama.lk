import type { Metadata } from "next";
import { PortfolioPage } from "@/components/pages/portfolio-page";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { loadPortfolioCategories } from "@/services/public-content";
import {loadPageSection} from "@/services/public-content";
import {routeUiContent,type RouteUiContent} from "@/content/route-ui-cms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Portfolio",description:"Explore selected identity, campaign, packaging, merchandise, and 3D projects by DesignKoolama.",alternates:{canonical:"/portfolio"},openGraph:{title:"DesignKoolama Portfolio",description:"Selected work and brand transformations.",url:"/portfolio"}};
export default async function Page(){try{const[categories,ui]=await Promise.all([loadPortfolioCategories(),loadPageSection<RouteUiContent>("route-content","ui",routeUiContent)]);return <PortfolioPage categories={categories} copy={ui.portfolio}/>}catch{return <ContentUnavailable/>}}
