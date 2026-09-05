import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {title:"Portfolio",robots:{index:false,follow:true}};
export default function LegacyProjectPage(){notFound()}
