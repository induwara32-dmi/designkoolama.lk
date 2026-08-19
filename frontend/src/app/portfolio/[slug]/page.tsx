import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/components/pages/case-study-page";
import { portfolioProjects } from "@/content/portfolio";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { loadProject } from "@/services/public-content";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const project=portfolioProjects.find(item=>item.slug===slug);if(!project)return {title:"Project Not Found",robots:{index:false,follow:false}};return {title:project.title,description:project.description,alternates:{canonical:`/portfolio/${slug}`},openGraph:{title:`${project.title} | DesignKoolama`,description:project.description,url:`/portfolio/${slug}`}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const fallback=portfolioProjects.find(item=>item.slug===slug);try{return <CaseStudyPage project={await loadProject(slug,fallback)}/>}catch(error){if(error instanceof Error&&error.message==="NOT_FOUND")notFound();return <ContentUnavailable/>}}
