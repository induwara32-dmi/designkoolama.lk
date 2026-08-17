import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about-page";
export const metadata:Metadata={title:"About Us",description:"Meet DesignKoolama, a Sri Lankan creative studio building brands that inspire, connect, and grow.",alternates:{canonical:"/about"},openGraph:{title:"About DesignKoolama",description:"A creative studio built on passion and purpose.",url:"/about"}};
export default function Page(){return <AboutPage/>}
