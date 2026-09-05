"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApprovedIcon } from "@/components/ui/approved-icon";
import { AUTO_SLIDE_INTERVAL_MS } from "@/lib/carousel";
import type { PortfolioCategoryCard } from "@/content/portfolio";

const tones = ["rings", "squares", "hex", "orbit", "window", "triangle"];

export function FeaturedWorkCarousel({ categories }: { categories: PortfolioCategoryCard[] }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(3);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const ordered = useMemo(() => categories.filter((item) => item.slug).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 6), [categories]);
  const groups = useMemo(() => { const result: PortfolioCategoryCard[][] = []; for (let index = 0; index < ordered.length; index += visible) result.push(ordered.slice(index, index + visible)); return result; }, [ordered, visible]);
  useEffect(() => {
    const update = () => setVisible(window.matchMedia("(max-width: 767px)").matches ? 1 : window.matchMedia("(max-width: 1023px)").matches ? 2 : 3);
    update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => { setPage((current) => Math.min(current, Math.max(groups.length - 1, 0))); }, [groups.length]);
  useEffect(() => { if (reduced || paused || groups.length < 2) return; const timer = window.setInterval(() => setPage((current) => (current + 1) % groups.length), AUTO_SLIDE_INTERVAL_MS); return () => window.clearInterval(timer); }, [groups.length, paused, reduced]);
  function go(next: number) { setPage((next + groups.length) % groups.length); }
  function swipeEnd(event: React.PointerEvent) { if (startX.current === null) return; const delta = event.clientX - startX.current; startX.current = null; if (Math.abs(delta) > 40) go(page + (delta < 0 ? 1 : -1)); }
  if (!ordered.length) return null;
  return <div className="featured-work-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} onPointerDown={(event) => { startX.current = event.clientX; }} onPointerUp={swipeEnd} onPointerCancel={() => { startX.current = null; }}>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={`${visible}-${page}`} className="featured-work-group" initial={reduced ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -24 }} transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}>
        {groups[page]!.map((category, index) => <article className="project-card featured-work-card" key={category.slug}>
          {category.cardMedia ? <div className="project-art featured-work-art"><Image src={category.cardMedia.secureUrl || category.cardMedia.url} alt={category.cardMedia.altText || category.name} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" style={{ objectFit: "cover" }} /></div> : <div className={`project-art project-art-${tones[(page * visible + index) % tones.length]}`} role="img" aria-label={`${category.name} category artwork`}>{category.iconKey && <ApprovedIcon iconKey={category.iconKey} />}</div>}
          <div className="project-info"><span>{category.name}</span><div><h3>{category.cardTitle || category.name}</h3><Link href={`/portfolio/category/${category.slug}`} aria-label={`View ${category.name} portfolio`}><ArrowRight /></Link></div><p>{category.shortDescription || category.description}</p></div>
        </article>)}
      </motion.div>
    </AnimatePresence>
    {groups.length > 1 && <div className="portfolio-dots featured-work-dots" role="tablist" aria-label="Featured Work pages">{groups.map((_, index) => <button type="button" role="tab" aria-selected={page === index} aria-label={`Show Featured Work page ${index + 1}`} key={index} onClick={() => go(index)} className={page === index ? "is-active" : ""} />)}</div>}
  </div>;
}
