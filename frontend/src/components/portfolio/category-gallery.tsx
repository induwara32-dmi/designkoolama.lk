import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/states";
import { ProjectArt } from "@/components/portfolio/project-art";
import type { PortfolioCategoryCard, PortfolioMedia } from "@/content/portfolio";

type GalleryImage = { displayOrder: number; media: PortfolioMedia };

export function CategoryGallery({category,images,page,pages}:{category:PortfolioCategoryCard;images:GalleryImage[];page:number;pages:number}) {
  const banner = category.bannerMedia ?? category.cardMedia ?? images[0]?.media;
  const hasDedicatedBanner = Boolean(category.bannerMedia);
  return <>
    <section className="case-hero"><div className="site-container">
      <p className="eyebrow">Portfolio category</p><h1>{category.name}</h1>
      <p>{category.shortDescription ?? category.description}</p>
      <div className="category-banner">{banner?<><Image src={banner.secureUrl || banner.url} alt={(hasDedicatedBanner&&category.bannerAltText)||banner.altText} width={1400} height={760} priority unoptimized />{hasDedicatedBanner&&category.bannerCaption&&<p>{category.bannerCaption}</p>}</>:<ProjectArt tone="rings"/>}</div>
    </div></section>
    <section className="section bg-charcoal"><div className="site-container case-content">
      <div><p className="eyebrow">Category Overview</p><h2>{category.name} Overview</h2></div>
      <div className="case-text"><p>{category.overview ?? category.shortDescription ?? category.description}</p></div>
    </div></section>
    <section className="section bg-black"><div className="site-container">
      <p className="eyebrow text-center">{category.name} Gallery</p>
      {images.length===0?<EmptyState title="No published images in this category yet"/>:<div className="category-image-gallery">{images.map(({media},index)=><figure key={`${media.id}-${index}`}><Image src={media.secureUrl||media.url} alt={media.altText} width={900} height={650} unoptimized/>{media.caption&&<figcaption>{media.caption}</figcaption>}</figure>)}</div>}
      {pages>1&&<nav className="pagination" aria-label="Category gallery pagination">{Array.from({length:pages},(_,index)=>index+1).map(value=><Link aria-current={page===value?"page":undefined} href={`/portfolio/category/${category.slug}?page=${value}`} key={value}>{value}</Link>)}</nav>}
    </div></section>
  </>;
}
