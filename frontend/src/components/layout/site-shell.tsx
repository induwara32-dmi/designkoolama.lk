"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import { Header } from "./header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return <>{!admin && <a className="skip-link" href="#main-content">Skip to main content</a>}{!admin && <Header />}<main id="main-content" tabIndex={-1} className={admin ? "admin-main" : undefined}>{children}</main>{!admin && <Footer />}</>;
}
