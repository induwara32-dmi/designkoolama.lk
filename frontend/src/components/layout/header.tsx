import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { LinkButton } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-black/85 backdrop-blur-xl">
      <div className="site-container flex min-h-16 items-center justify-between gap-6">
        <Link href="/" className="text-lg font-black tracking-tight text-white" aria-label="DesignKoolama home">Design<span className="text-orange">Koolama</span></Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {siteConfig.nav.map((item) => <Link key={item.href} href={item.href} className="text-sm text-secondary transition hover:text-white">{item.label}</Link>)}
        </nav>
        <LinkButton href="/get-a-quote" className="px-4">Get a Quote</LinkButton>
      </div>
    </header>
  );
}
