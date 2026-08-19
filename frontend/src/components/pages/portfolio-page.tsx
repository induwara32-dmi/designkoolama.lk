import { InnerHero } from "@/components/pages/inner-hero";
import { PortfolioBrowser } from "@/components/portfolio/portfolio-browser";
import type { PortfolioProject } from "@/content/portfolio";
export function PortfolioPage({projects}:{projects:PortfolioProject[]}){return <><InnerHero eyebrow="Our Work" title="Our" accent="Portfolio" description="Explore selected brand systems, campaigns, packaging, merchandise, and dimensional design crafted to make businesses stand out."/><section className="section bg-black"><div className="site-container"><PortfolioBrowser projects={projects}/></div></section></>}
