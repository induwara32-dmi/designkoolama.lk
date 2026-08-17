"use client";
import {ArrowRight,Check,Layers3} from "lucide-react";
import Link from "next/link";
import {Reveal} from "@/components/motion/reveal";
import {InnerHero} from "@/components/pages/inner-hero";
import {LinkButton} from "@/components/ui/button";
import {SectionHeading} from "@/components/ui/section-heading";
import {serviceBySlug,type ServiceContent} from "@/content/services";

export function ServicePage({service}: {service:ServiceContent}){const quoteService=service.slug==="brand-identity"?"Branding & Identity":service.name;return <>
  <InnerHero eyebrow={service.eyebrow} title={service.name} description={service.description}><LinkButton href={`/get-a-quote?service=${encodeURIComponent(quoteService)}`} className="mt-9 rounded-full px-8">Start a Project</LinkButton></InnerHero>
  <section className="section"><div className="site-container service-overview"><Reveal><p className="eyebrow">Service Overview</p><h2>{service.overviewTitle}</h2><p>{service.overviewDescription}</p><LinkButton href={`/get-a-quote?service=${encodeURIComponent(service.name)}`} className="mt-8">Request a Quote</LinkButton></Reveal><div className="deliverable-grid">{service.deliverables.map((item,index)=><Reveal key={item.title} delay={index*.06}><article className="deliverable-card"><span>0{index+1}</span><h3>{item.title}</h3><p>{item.description}</p></article></Reveal>)}</div></div></section>
  <section className="section service-dark"><div className="site-container"><SectionHeading eyebrow="Our Process" title="From first thought to final form" centered/><div className="process-grid">{service.process.map((step,index)=><Reveal key={step.title} delay={index*.07}><article className="process-step"><b>{index+1}</b><div><h3>{step.title}</h3><p>{step.description}</p></div></article></Reveal>)}</div></div></section>
  <section className="section"><div className="site-container"><SectionHeading eyebrow="Visual Showcase" title={`${service.name} in action`} centered/><div className="showcase-grid">{service.showcase.map((item,index)=><Reveal key={item} delay={index*.05}><div className={`showcase-art showcase-art-${index+1}`} role="img" aria-label={`${service.name}: ${item}`}><Layers3/><span>{item}</span></div></Reveal>)}</div></div></section>
  <section className="section service-dark"><div className="site-container"><SectionHeading eyebrow="Explore More" title="Related Services" centered/><div className="related-services">{service.related.map(slug=>{const related=serviceBySlug(slug);return related&&<Link href={`/services/${related.slug}`} key={slug}><span><Check/></span><div><h3>{related.name}</h3><p>{related.description}</p></div><ArrowRight/></Link>})}</div></div></section>
  <section className="service-cta"><div className="site-container"><Reveal><p className="eyebrow">Have a project in mind?</p><h2>Let&apos;s create something remarkable.</h2><LinkButton href={`/get-a-quote?service=${encodeURIComponent(quoteService)}`} className="mt-8 rounded-full px-9">Get a Free Quote</LinkButton></Reveal></div></section>
  </>}
