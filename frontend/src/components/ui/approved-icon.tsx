import {Box,Brush,CalendarDays,Check,Clock3,Eye,Facebook,Flag,Flame,Globe2,Instagram,Layers3,Lightbulb,Linkedin,Mail,MapPin,MonitorCog,PenTool,Phone,Share2,Shield,Trophy} from "lucide-react";
import type {IconKey} from "@/content/site-content";
const icons={facebook:Facebook,instagram:Instagram,linkedin:Linkedin,mail:Mail,phone:Phone,clock:Clock3,"map-pin":MapPin,flame:Flame,"pen-tool":PenTool,share:Share2,monitor:MonitorCog,box:Box,layers:Layers3,calendar:CalendarDays,globe:Globe2,flag:Flag,brush:Brush,shield:Shield,lightbulb:Lightbulb,trophy:Trophy,check:Check,eye:Eye} as const;
export function ApprovedIcon({iconKey}:{iconKey:IconKey}){if(iconKey==="behance")return <span aria-hidden="true" className="text-sm font-bold">Bē</span>;const Icon=icons[iconKey];return Icon?<Icon/>:null}
