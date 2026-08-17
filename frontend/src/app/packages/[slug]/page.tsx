import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {PackageExperiencePage} from "@/components/packages/package-experience-page";
import {packageBySlug,packageExperiences} from "@/content/packages";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return packageExperiences.map(({slug})=>({slug}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const item=packageBySlug(slug);if(!item)return {};const url=`/packages/${item.slug}`;return {title:item.seoTitle,description:item.metaDescription,alternates:{canonical:url},openGraph:{title:item.seoTitle,description:item.metaDescription,url,type:"website"},twitter:{card:"summary_large_image",title:item.seoTitle,description:item.metaDescription}}}
export default async function Page({params}:Props){const {slug}=await params;const item=packageBySlug(slug);if(!item)notFound();return <PackageExperiencePage experience={item}/>}
