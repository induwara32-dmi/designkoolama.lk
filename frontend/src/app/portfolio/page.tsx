import type { Metadata } from "next";
import { PortfolioPage } from "@/components/pages/portfolio-page";
export const metadata:Metadata={title:"Portfolio",description:"Explore selected identity, campaign, packaging, merchandise, and 3D projects by DesignKoolama.",alternates:{canonical:"/portfolio"},openGraph:{title:"DesignKoolama Portfolio",description:"Selected work and brand transformations.",url:"/portfolio"}};
export default function Page(){return <PortfolioPage/>}
