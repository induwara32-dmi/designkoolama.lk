import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#080808] py-12">
      <div className="site-container grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div><p className="text-lg font-black">Design<span className="text-orange">Koolama</span></p><p className="mt-3 max-w-sm text-sm leading-6 text-muted">Creative ideas, shaped into memorable brand experiences.</p></div>
        <div><p className="text-sm font-semibold text-white">Explore</p><div className="mt-4 grid gap-3">{siteConfig.nav.slice(1).map((item) => <Link className="text-sm text-muted hover:text-orange" key={item.href} href={item.href}>{item.label}</Link>)}</div></div>
        <div><p className="text-sm font-semibold text-white">Legal</p><div className="mt-4 grid gap-3"><Link className="text-sm text-muted hover:text-orange" href="/privacy-policy">Privacy Policy</Link><Link className="text-sm text-muted hover:text-orange" href="/terms">Terms</Link></div></div>
      </div>
      <div className="site-container mt-10 border-t border-white/[0.07] pt-6 text-xs text-muted">© {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.</div>
    </footer>
  );
}
