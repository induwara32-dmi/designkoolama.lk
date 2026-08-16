"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Quote } from "lucide-react";
import Link from "next/link";
import { QuoteForm } from "@/components/forms/quote-form";
import { Reveal, staggerContainer, staggerItem } from "@/components/motion/reveal";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { homeContent } from "@/content/home";

export function HomePage() {
  const reduce = useReducedMotion();
  return <>
    <section className="hero-section"><div className="hero-glow"/><motion.div className="site-container relative z-10 max-w-5xl text-center" initial={reduce ? false : "hidden"} animate="visible" variants={staggerContainer}><motion.p variants={staggerItem} className="hero-pill"><span/> {homeContent.hero.eyebrow}</motion.p><motion.h1 variants={staggerItem} className="hero-title mt-9">{homeContent.hero.title}<br/><span>{homeContent.hero.accent}</span></motion.h1><motion.p variants={staggerItem} className="mx-auto mt-8 max-w-2xl text-base leading-7 text-secondary md:text-lg">{homeContent.hero.description}</motion.p><motion.div variants={staggerItem} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"><LinkButton href="#services" className="rounded-full px-8 uppercase tracking-[.06em]">Explore our services</LinkButton><LinkButton href="#portfolio" variant="secondary" className="rounded-full px-8 uppercase tracking-[.06em]">View portfolio</LinkButton></motion.div></motion.div><a href="#services" className="scroll-cue"><span>Scroll</span><ArrowDown/></a></section>
    <section id="services" className="section bg-charcoal"><div className="site-container"><Reveal><SectionHeading eyebrow="Our Services" title="What We Do" centered/></Reveal><motion.div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3" initial={reduce ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: .1 }} variants={staggerContainer}>{homeContent.services.map(({ title, description, href, icon: Icon }) => <motion.div variants={staggerItem} key={href}><Link className="service-card" href={href}><span className="icon-box"><Icon/></span><h3>{title}</h3><p>{description}</p></Link></motion.div>)}</motion.div><Reveal><div className="stats-panel">{homeContent.stats.map((stat) => <Stat key={stat.label} {...stat}/>)}</div></Reveal></div></section>
    <section id="portfolio" className="section bg-black"><div className="site-container"><Reveal><SectionHeading eyebrow="Our Portfolio" title="Featured Work" description="A glimpse into our recent digital creations and brand transformations."/></Reveal><motion.div className="portfolio-track" initial={reduce ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: .15 }} variants={staggerContainer}>{homeContent.projects.map((project) => <motion.article variants={staggerItem} className="project-card" key={project.href}><div className={`project-art project-art-${project.tone}`}/><div className="project-info"><span>{project.category}</span><div><h3>{project.title}</h3><Link href={project.href} aria-label={`View ${project.title}`}><ArrowRight/></Link></div></div></motion.article>)}</motion.div><div className="portfolio-dots"><span/><i/><i/><i/></div></div></section>
    <section className="section bg-charcoal"><div className="site-container max-w-4xl"><Reveal><h2 className="section-title text-center">What Our Clients Say About Us</h2><article className="testimonial-card"><Quote className="quote-mark"/><blockquote>“{homeContent.testimonial.quote}”</blockquote><div className="avatar" aria-hidden="true">NP</div><h3>{homeContent.testimonial.name}</h3><p>{homeContent.testimonial.role}</p><div className="stars" aria-label="5 out of 5 stars">★★★★★</div></article><p className="mt-8 text-center text-xs text-muted">Pause on hover</p></Reveal></div></section>
    <section id="quote" className="quote-section"><div className="site-container max-w-4xl"><Reveal><SectionHeading eyebrow="Let's start your project" title="Request a Quote" centered/><div className="mt-14"><QuoteForm/></div></Reveal></div></section>
  </>;
}

function Stat({ value, suffix, label }: { value: number; suffix: string; label: string }) { return <div className="stat"><p>{value}{suffix}</p><span>{label}</span></div>; }
