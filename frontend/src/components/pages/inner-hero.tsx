"use client";
import { motion, useReducedMotion } from "framer-motion";

export function InnerHero({ eyebrow, title, accent, description, children }: { eyebrow: string; title: string; accent?: string; description: string; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  return <section className="inner-hero"><div className="inner-hero-glow"/><motion.div className="site-container relative z-10 max-w-4xl text-center" initial={reduce ? false : { opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:reduce ? 0 : .6 }}><p className="hero-pill"><span/>{eyebrow}</p><h1 className="inner-title">{title} {accent && <span>{accent}</span>}</h1><p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-secondary md:text-lg">{description}</p>{children}</motion.div></section>;
}
