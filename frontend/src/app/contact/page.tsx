import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/contact-page";
export const metadata:Metadata={title:"Contact Us",description:"Contact DesignKoolama in Colombo to discuss branding, advertising, packaging, merchandise, or 3D design.",alternates:{canonical:"/contact"},openGraph:{title:"Contact DesignKoolama",description:"Let's create something extraordinary together.",url:"/contact"}};
export default function Page(){return <ContactPage/>}
