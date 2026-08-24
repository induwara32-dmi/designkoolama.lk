import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about-page";
import {aboutCmsContent,type AboutCmsContent} from "@/content/about-cms";
import {siteContent,type SiteContent} from "@/content/site-content";
import {loadPageSection} from "@/services/public-content";
export const metadata:Metadata={title:"About Us",description:"Meet DesignKoolama, a Sri Lankan creative studio building brands that inspire, connect, and grow.",alternates:{canonical:"/about"},openGraph:{title:"About DesignKoolama",description:"A creative studio built on passion and purpose.",url:"/about"}};
export default async function Page(){const[content,site]=await Promise.all([loadPageSection<AboutCmsContent>("about","content",aboutCmsContent),loadPageSection<SiteContent>("site-settings","site",siteContent)]);return <AboutPage content={content} site={site}/>}
