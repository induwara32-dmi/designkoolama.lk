"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import { Header } from "./header";
import type {SiteContent} from "@/content/site-content";
import type {ServiceContent} from "@/content/services";

export function SiteShell({ children,content,services }: { children: React.ReactNode;content:SiteContent;services?:readonly ServiceContent[] }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return <>{!admin && <a className="skip-link" href="#main-content">Skip to main content</a>}{!admin && <Header content={content}/>}<main id="main-content" tabIndex={-1} className={admin ? "admin-main" : undefined}>{children}</main>{!admin && <Footer content={content} services={services}/>}</>;
}
