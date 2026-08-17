import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {ServicePage} from "@/components/services/service-page";
import {serviceBySlug,services} from "@/content/services";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return services.map(({slug})=>({slug}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const service=serviceBySlug(slug);if(!service)return {};const url=`/services/${service.slug}`;return {title:service.seoTitle,description:service.metaDescription,alternates:{canonical:url},openGraph:{title:service.seoTitle,description:service.metaDescription,url,type:"website"},twitter:{card:"summary_large_image",title:service.seoTitle,description:service.metaDescription}}}
export default async function Page({params}:Props){const {slug}=await params;const service=serviceBySlug(slug);if(!service)notFound();return <ServicePage service={service}/>}
