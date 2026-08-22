import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPreview } from "@/services/public-content";
export const metadata:Metadata={title:"Content preview | DesignKoolama",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function PreviewPage({params,searchParams}:{params:Promise<{resource:string;id:string}>;searchParams:Promise<{token?:string}>}){const [{resource,id},{token}]=await Promise.all([params,searchParams]);if(!token)notFound();let data:Record<string,unknown>;try{data=await loadPreview(resource,id,token)}catch{notFound()}const title=String(data.title??data.name??data.clientName??"Content preview");return <main className="preview-page"><header><p>Secure draft preview</p><h1>{title}</h1><span>This short-lived preview is not indexed and may differ from the published website.</span></header><section aria-label="Draft content"><pre>{JSON.stringify(data,null,2)}</pre></section></main>}
