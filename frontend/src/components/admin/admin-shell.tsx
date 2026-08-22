"use client";
import { ExternalLink, LayoutDashboard, LogOut, Menu, Shield, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi, type AdminProfile } from "@/lib/admin-api";

const links=[{href:"/admin/dashboard",label:"Dashboard",icon:LayoutDashboard},{href:"/admin/profile",label:"Profile",icon:UserRound},{href:"/admin/security",label:"Security",icon:Shield}];
export function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter();const [admin,setAdmin]=useState<AdminProfile|null>(null);const [open,setOpen]=useState(false);const [checking,setChecking]=useState(true);
 useEffect(()=>{let active=true;adminApi.me().then(value=>{if(active)setAdmin(value)}).catch(()=>router.replace(`/admin/login?returnTo=${encodeURIComponent(path)}`)).finally(()=>{if(active)setChecking(false)});return()=>{active=false}},[path,router]);
 async function logout(){try{await adminApi.logout()}finally{router.replace("/admin/login");router.refresh()}}
 if(checking)return <div className="admin-screen-state" role="status">Verifying secure session…</div>;
 if(!admin)return <div className="admin-screen-state" role="status">Redirecting to sign in…</div>;
 return <div className="admin-layout"><aside className={open?"admin-sidebar is-open":"admin-sidebar"}><div className="admin-sidebar-head"><Link className="admin-brand" href="/admin/dashboard">DesignKoolama<span>•</span></Link><button className="admin-close" onClick={()=>setOpen(false)} aria-label="Close navigation"><X/></button></div><nav aria-label="Admin navigation">{links.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={path===href?"page":undefined}><Icon/>{label}</Link>)}<details><summary>Phase 7 modules</summary>{["Website Content","Services","Packages","Portfolio","Media Library","Testimonials","Quote Requests","Contact Messages","Website Settings","SEO Settings","Admin Users","Activity Log"].map(label=><span key={label} aria-disabled="true">{label}<small>Phase 7</small></span>)}</details><Link href="/" target="_blank"><ExternalLink/>View website</Link></nav><div className="admin-account"><span>{admin.displayName}</span><small>{admin.roles.join(", ")}</small><button onClick={logout}><LogOut/> Sign out</button></div></aside>{open&&<button className="admin-scrim" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}<section className="admin-workspace"><header className="admin-topbar"><button onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu/></button><div><strong>{admin.displayName}</strong><span>{admin.email}</span></div></header><div className="admin-content">{children}</div></section></div>
}
