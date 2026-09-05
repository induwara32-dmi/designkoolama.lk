import { InnerHero } from "@/components/pages/inner-hero";
import { PortfolioBrowser } from "@/components/portfolio/portfolio-browser";
import type { PortfolioCategoryCard } from "@/content/portfolio";
import type {RouteUiContent} from "@/content/route-ui-cms";
export function PortfolioPage({categories,copy}:{categories:PortfolioCategoryCard[];copy:RouteUiContent["portfolio"]}){return <><InnerHero eyebrow={copy.heroEyebrow} title={copy.heroTitle} accent={copy.heroAccent} description={copy.heroDescription}/><section className="section bg-black"><div className="site-container"><PortfolioBrowser categories={categories}/></div></section></>}
