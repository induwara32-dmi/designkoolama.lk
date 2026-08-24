"use client";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { InnerHero } from "@/components/pages/inner-hero";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { PackageExperience } from "@/content/packages";
import type {RouteUiContent} from "@/content/route-ui-cms";
export function PackagesPage({ experiences,copy }: { experiences: PackageExperience[];copy:RouteUiContent["packages"] }) {
  return (
    <>
      <InnerHero
        eyebrow={copy.heroEyebrow}
        title={copy.heroTitle}
        description={copy.heroDescription}
      >
        <LinkButton
          href="#package-categories"
          className="mt-9 rounded-full px-8"
        >
          {copy.heroButton}
        </LinkButton>
      </InnerHero>
      <section className="section" id="package-categories">
        <div className="site-container">
          <SectionHeading
            eyebrow={copy.categoriesEyebrow}
            title={copy.categoriesTitle}
            centered
          />
          <div className="category-grid">
            {experiences.map((item, index) => (
              <Reveal key={item.slug} delay={index * 0.08}>
                <Link href={`/packages/${item.slug}`}>
                  <span>0{index + 1}</span>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <strong>
                    {copy.exploreLabel} <ArrowRight />
                  </strong>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="package-stats">
            {copy.stats.filter(item=>item.visible).sort((a,b)=>a.order-b.order).map(item => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section service-dark">
        <div className="site-container">
          <SectionHeading
            eyebrow={copy.benefitsEyebrow}
            title={copy.benefitsTitle}
            centered
          />
          <div className="benefit-grid">
            {copy.benefits.filter(item=>item.visible).sort((a,b)=>a.order-b.order).map(({title,description}) => (
              <Reveal key={title}>
                <article>
                  <CheckCircle2 />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="site-container">
          <SectionHeading
            eyebrow={copy.processEyebrow}
            title={copy.processTitle}
            centered
          />
          <div className="package-process">
            {copy.steps.filter(item=>item.visible).sort((a,b)=>a.order-b.order).map((step, index) => (
              <Reveal key={step.title} delay={index * 0.06}>
                <article>
                  <b>0{index + 1}</b>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="service-cta">
        <div className="site-container">
          <Reveal>
            <p className="eyebrow">{copy.customEyebrow}</p>
            <h2>{copy.customTitle}</h2>
            <p>{copy.customDescription}</p>
            <LinkButton
              href="/get-a-quote?package=Custom"
              className="mt-8 rounded-full px-9"
            >
              {copy.customButton}
            </LinkButton>
          </Reveal>
        </div>
      </section>
    </>
  );
}
