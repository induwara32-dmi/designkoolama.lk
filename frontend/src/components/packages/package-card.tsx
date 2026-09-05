"use client";
import {Check,Sparkles} from "lucide-react";
import {Reveal} from "@/components/motion/reveal";
import {Button} from "@/components/ui/button";
import type {PackageTier} from "@/content/packages";
import {buildWhatsAppLink} from "@/lib/whatsapp";

function priceAmount(price: string): string | null {
  const trimmed = price.trim();
  if (!trimmed || /^custom$/i.test(trimmed)) return null;
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : trimmed;
}

function buildPackageWhatsAppMessage(tier: PackageTier, categoryName: string) {
  const amount = priceAmount(tier.price);
  return `Hi, I'm interested in the ${tier.name} package under ${categoryName}${amount ? ` (LKR ${amount})` : ""}. Can you tell me more?`;
}

export function PackageCard({tier,categoryName,index=0}:{tier:PackageTier;categoryName:string;index?:number}){
  return <Reveal delay={index*.07}><article className={`package-card ${tier.recommended?"package-recommended":""}`}>
    {tier.recommended&&<p className="recommended-badge"><Sparkles/> Most Popular</p>}
    <p className="eyebrow">{tier.subtitle}</p>
    <h3>{tier.name}</h3>
    <div className="package-price"><strong>{tier.price}</strong><span>{tier.priceLabel}</span></div>
    <p className="package-description">{tier.description}</p>
    <ul>{tier.features.map(feature=><li key={feature}><Check/>{feature}</li>)}</ul>
    <Button
      type="button"
      variant={tier.recommended?"primary":"secondary"}
      className="mt-auto w-full rounded-lg"
      onClick={()=>window.open(buildWhatsAppLink(buildPackageWhatsAppMessage(tier,categoryName)),"_blank","noopener,noreferrer")}
    >
      {tier.ctaText}
    </Button>
  </article></Reveal>;
}
