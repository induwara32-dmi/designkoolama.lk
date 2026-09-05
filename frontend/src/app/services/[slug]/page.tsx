import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ServicePage} from "@/components/services/service-page";
import {serviceBySlug,type ServiceContent} from "@/content/services";
import {loadService,loadServiceShowcase} from "@/services/public-content";
import {ContentUnavailable} from "@/components/feedback/content-unavailable";
import {JsonLd} from "@/components/seo/json-ld";
import {breadcrumbJsonLd,serviceJsonLd} from "@/lib/structured-data";
type Props={params:Promise<{slug:string}>};
type Resolved={service:ServiceContent}|{notFound:true}|{unavailable:true};
export const dynamic="force-dynamic";
// Always ask the live API first -- the static list in content/services.ts only covers the
// originally-seeded services, so gating on it before checking live data would 404 any
// service created later in the admin panel. The static entry (if any) is used only when
// the API is unreachable, never to decide whether the service exists.
async function resolveService(slug:string):Promise<Resolved>{
  const fallback=serviceBySlug(slug);
  try{
    return {service:await loadService(slug,fallback)};
  }catch(error){
    if(error instanceof Error&&error.message==="NOT_FOUND")return {notFound:true};
    if(fallback)return {service:fallback};
    return {unavailable:true};
  }
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const resolved=await resolveService(slug);
  if(!("service" in resolved))return {};
  const service=resolved.service;
  const url=`/services/${service.slug}`;
  // `title.absolute` opts out of the root layout's "%s | DesignKoolama" template --
  // service.seoTitle already ends with "| DesignKoolama" itself, so applying the
  // template on top (as a plain string title would) produced a doubled suffix.
  return {title:{absolute:service.seoTitle},description:service.metaDescription,alternates:{canonical:url},openGraph:{title:service.seoTitle,description:service.metaDescription,url,type:"website"},twitter:{card:"summary_large_image",title:service.seoTitle,description:service.metaDescription}};
}
export default async function Page({params}:Props){
  const {slug}=await params;
  // Fetched in parallel: the showcase query is independent of service resolution, and a
  // Service with no matching Portfolio Category (or a fetch failure) just resolves to an
  // empty array, so it never blocks or fails the page.
  const [resolved,showcase]=await Promise.all([resolveService(slug),loadServiceShowcase(slug)]);
  if("notFound" in resolved)notFound();
  if("unavailable" in resolved)return <ContentUnavailable/>;
  const service=resolved.service;
  return <><JsonLd data={[serviceJsonLd(service),breadcrumbJsonLd([{name:"Home",path:"/"},{name:"Services",path:"/#services"},{name:service.name,path:`/services/${service.slug}`}])]}/><ServicePage service={service} showcase={showcase}/></>;
}
