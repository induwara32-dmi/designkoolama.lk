import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ServicePage} from "@/components/services/service-page";
import {serviceBySlug} from "@/content/services";
import {loadService} from "@/services/public-content";
import {ContentUnavailable} from "@/components/feedback/content-unavailable";
type Props={params:Promise<{slug:string}>};
export const dynamic="force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const service=serviceBySlug(slug);if(!service)return {};const url=`/services/${service.slug}`;return {title:service.seoTitle,description:service.metaDescription,alternates:{canonical:url},openGraph:{title:service.seoTitle,description:service.metaDescription,url,type:"website"},twitter:{card:"summary_large_image",title:service.seoTitle,description:service.metaDescription}}}
export default async function Page({params}:Props){const {slug}=await params;const fallback=serviceBySlug(slug);if(!fallback)notFound();try{return <ServicePage service={await loadService(slug,fallback)}/>}catch{return <ContentUnavailable/>}}
