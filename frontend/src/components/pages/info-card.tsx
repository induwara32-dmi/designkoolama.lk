import type { LucideIcon } from "lucide-react";
import {ApprovedIcon} from "@/components/ui/approved-icon";
import type {IconKey} from "@/content/site-content";

export function InfoCard({icon:Icon,iconKey,title,children,accent=false}:{icon?:LucideIcon;iconKey?:IconKey;title:string;children:React.ReactNode;accent?:boolean}){return <article className={`info-card${accent?" info-card-accent":""}`}><span className="icon-box">{Icon?<Icon/>:iconKey?<ApprovedIcon iconKey={iconKey}/>:null}</span><div><h3>{title}</h3><div className="mt-2 text-sm leading-6 text-muted">{children}</div></div></article>}
