import { cn } from "@/lib/utils";
import Image from "next/image";
import type {PortfolioMedia} from "@/content/portfolio";
export function ProjectArt({ tone, className,media }: { tone:string; className?:string;media?:PortfolioMedia }){return <div role="img" aria-label={media?.altText??"Abstract orange geometric project artwork"} className={cn("case-art",`case-art-${tone}`,className)}>{media?<Image src={media.secureUrl||media.url} alt={media.altText} fill sizes="(max-width: 768px) 100vw, 50vw" style={{objectFit:"cover"}}/>:<><i/><i/><i/></>}</div>}
