import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/contact-page";
import {contactCmsContent,type ContactCmsContent} from "@/content/contact-cms";import {siteContent,type SiteContent} from "@/content/site-content";import {loadPageSection} from "@/services/public-content";
export const metadata:Metadata={title:"Contact Us",description:"Contact DesignKoolama in Colombo to discuss branding, advertising, packaging, merchandise, or 3D design.",alternates:{canonical:"/contact"},openGraph:{title:"Contact DesignKoolama",description:"Let's create something extraordinary together.",url:"/contact"}};
export default async function Page(){const[c,s]=await Promise.all([loadPageSection<ContactCmsContent>("contact","content",contactCmsContent),loadPageSection<SiteContent>("site-settings","site",siteContent)]);return <ContactPage content={c} site={s}/>}
