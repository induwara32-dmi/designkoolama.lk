import type { Metadata } from "next";
import { QuotePage } from "@/components/pages/quote-page";
import { quoteCmsContent, type QuoteCmsContent } from "@/content/quote-cms";
import { loadPageSection } from "@/services/public-content";
export const metadata:Metadata={title:"Get a Quote",description:"Request a tailored creative project quote from DesignKoolama.",alternates:{canonical:"/get-a-quote"},openGraph:{title:"Request a DesignKoolama Quote",description:"Tell us about your next creative project.",url:"/get-a-quote"}};
export default async function Page({searchParams}:{searchParams:Promise<{service?:string;package?:string}>}){const query=await searchParams;const content=await loadPageSection<QuoteCmsContent>("get-a-quote","content",quoteCmsContent);return <QuotePage service={query.service} packageName={query.package} content={content}/>}
