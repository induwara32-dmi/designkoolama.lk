"use client";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import {Menu,X} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {LinkButton} from "@/components/ui/button";
import {siteConfig} from "@/lib/site";
import {cn} from "@/lib/utils";
function Logo(){return <Link href="/" prefetch={false} className="relative z-50 text-[21px] font-extrabold tracking-[-.04em]" aria-label="DesignKoolama home">DesignKoolama<span className="ml-1 inline-block size-1.5 rounded-full bg-orange align-top"/></Link>}
export function Header(){
  const pathname=usePathname();const [open,setOpen]=useState(false);const reduce=useReducedMotion();
  const active=(href:string)=>href==="/"?pathname===href:pathname===href||pathname.startsWith(`${href}/`);
  useEffect(()=>{if(!open)return;document.body.style.overflow="hidden";const close=(event:KeyboardEvent)=>event.key==="Escape"&&setOpen(false);window.addEventListener("keydown",close);return()=>{document.body.style.overflow="";window.removeEventListener("keydown",close)}},[open]);
  return <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#090909]/95 backdrop-blur-xl"><div className="site-container flex h-[78px] items-center justify-between"><Logo/><nav className="hidden items-center gap-9 lg:flex" aria-label="Primary navigation">{siteConfig.nav.map(item=><Link key={item.href} href={item.href} prefetch={false} aria-current={active(item.href)?"page":undefined} className={cn("text-[13px] text-secondary transition hover:text-white",active(item.href)&&"text-orange")}>{item.label}</Link>)}</nav><div className="hidden lg:block"><LinkButton href="/get-a-quote" className="rounded-full px-7">Get a Quote</LinkButton></div><button type="button" className="relative z-50 grid size-11 place-items-center rounded-lg border border-white/10 lg:hidden" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open?"Close navigation":"Open navigation"}>{open?<X/>:<Menu/>}</button></div><AnimatePresence>{open&&<motion.nav id="mobile-menu" className="fixed inset-0 flex min-h-dvh flex-col bg-black px-6 pb-10 pt-28 lg:hidden" aria-label="Mobile navigation" initial={reduce?false:{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:24}}>{siteConfig.nav.map(item=><Link onClick={()=>setOpen(false)} href={item.href} prefetch={false} key={item.href} aria-current={active(item.href)?"page":undefined} className={cn("flex min-h-14 items-center border-b border-white/10 text-xl font-semibold",active(item.href)&&"text-orange")}>{item.label}</Link>)}<LinkButton onClick={()=>setOpen(false)} href="/get-a-quote" className="mt-8 rounded-full">Get a Quote</LinkButton></motion.nav>}</AnimatePresence></header>
}
