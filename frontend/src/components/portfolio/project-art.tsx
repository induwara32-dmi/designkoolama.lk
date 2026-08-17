import { cn } from "@/lib/utils";
export function ProjectArt({ tone, className }: { tone:string; className?:string }){return <div role="img" aria-label="Abstract orange geometric project artwork" className={cn("case-art",`case-art-${tone}`,className)}><i/><i/><i/></div>}
