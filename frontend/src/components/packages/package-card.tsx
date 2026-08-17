"use client";
import {Check,Sparkles} from "lucide-react";
import {Reveal} from "@/components/motion/reveal";
import {LinkButton} from "@/components/ui/button";
import type {PackageTier} from "@/content/packages";
export function PackageCard({tier,index=0}:{tier:PackageTier;index?:number}){
  const selectedService=tier.category==="tutor"?"Social Media Design":"Branding & Identity";
  const query=new URLSearchParams({service:selectedService,package:tier.name}).toString();
  return <Reveal delay={index*.07}><article className={`package-card ${tier.recommended?"package-recommended":""}`}>{tier.recommended&&<p className="recommended-badge"><Sparkles/> Most Popular</p>}<p className="eyebrow">{tier.subtitle}</p><h3>{tier.name}</h3><div className="package-price"><strong>{tier.price}</strong><span>{tier.priceLabel}</span></div><p className="package-description">{tier.description}</p><ul>{tier.features.map(feature=><li key={feature}><Check/>{feature}</li>)}</ul><LinkButton href={`/get-a-quote?${query}`} variant={tier.recommended?"primary":"secondary"} className="mt-auto w-full rounded-lg">{tier.ctaText}</LinkButton></article></Reveal>
}
