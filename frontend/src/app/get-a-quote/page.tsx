import type { Metadata } from "next";
import { QuotePage } from "@/components/pages/quote-page";
export const metadata:Metadata={title:"Get a Quote",description:"Request a tailored creative project quote from DesignKoolama.",alternates:{canonical:"/get-a-quote"},openGraph:{title:"Request a DesignKoolama Quote",description:"Tell us about your next creative project.",url:"/get-a-quote"}};
export default function Page(){return <QuotePage/>}
