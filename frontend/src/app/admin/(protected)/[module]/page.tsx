import { notFound } from "next/navigation";
import { CmsManager } from "@/components/admin/cms-manager";
export const metadata={title:"Content management | DesignKoolama Admin",robots:{index:false,follow:false}};
const modules=["content","services","portfolio-categories","portfolio","package-categories","packages","testimonials","media","settings","quotes","messages","activity"];
export default async function CmsPage({params}:{params:Promise<{module:string}>}){const {module}=await params;if(!modules.includes(module))notFound();return <CmsManager module={module}/>}
