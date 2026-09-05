"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { QuoteForm } from "@/components/forms/quote-form";
import {
  Reveal,
  staggerContainer,
  staggerItem,
} from "@/components/motion/reveal";
import { ApprovedIcon } from "@/components/ui/approved-icon";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { HomeCmsContent } from "@/content/home-cms";
import { FeaturedWorkCarousel } from "@/components/home/featured-work-carousel";
import { TestimonialCarousel } from "@/components/home/testimonial-carousel";
import { StatsBar } from "@/components/home/stats-bar";
import type { PortfolioCategoryCard } from "@/content/portfolio";
import type { PublicTestimonial } from "@/services/public-content";
export function HomePage({
  content,
  categories,
  testimonials,
}: {
  content: HomeCmsContent;
  categories: PortfolioCategoryCard[];
  testimonials: PublicTestimonial[];
}) {
  const reduce = useReducedMotion();
  return (
    <>
      <section className="hero-section">
        <div className="hero-glow" />
        <motion.div
          className="site-container relative z-10 max-w-5xl text-center"
          initial={reduce ? false : "hidden"}
          animate="visible"
          variants={staggerContainer}
        >
          <motion.p variants={staggerItem} className="hero-pill">
            <span />
            {content.hero.eyebrow}
          </motion.p>
          <motion.h1 variants={staggerItem} className="hero-title mt-9">
            {content.hero.title}
            <br />
            <span>{content.hero.accent}</span>
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-8 max-w-2xl text-base leading-7 text-secondary md:text-lg"
          >
            {content.hero.description}
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <LinkButton
              href="#services"
              className="rounded-full px-8 uppercase tracking-[.06em]"
            >
              {content.hero.primaryButton}
            </LinkButton>
            <LinkButton
              href="#portfolio"
              variant="secondary"
              className="rounded-full px-8 uppercase tracking-[.06em]"
            >
              {content.hero.secondaryButton}
            </LinkButton>
          </motion.div>
        </motion.div>
        <a href="#services" className="scroll-cue">
          <span>{content.hero.scrollLabel}</span>
          <ArrowDown />
        </a>
      </section>
      <section id="services" className="section bg-charcoal">
        <div className="site-container">
          <Reveal>
            <SectionHeading
              eyebrow={content.servicesHeading.eyebrow}
              title={content.servicesHeading.title}
              centered
            />
          </Reveal>
          <motion.div
            className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            initial={reduce ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {content.services
              .filter((item) => item.visible)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <motion.div variants={staggerItem} key={item.href}>
                  <Link className="service-card" href={item.href}>
                    <span className="icon-box">
                      <ApprovedIcon iconKey={item.iconKey} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </Link>
                </motion.div>
              ))}
          </motion.div>
          <Reveal>
            <StatsBar items={content.stats} />
          </Reveal>
        </div>
      </section>
      <section id="portfolio" className="section bg-black">
        <div className="site-container">
          <Reveal>
            <SectionHeading {...content.portfolioHeading} />
          </Reveal>
          <FeaturedWorkCarousel categories={categories} />
        </div>
      </section>
      <section id="home-testimonials" className="section bg-charcoal">
        <div className="site-container">
          <Reveal>
            <h2 className="section-title text-center">
              {content.testimonialHeading}
            </h2>
            <TestimonialCarousel items={testimonials} />
            {testimonials.length > 1 && (
              <p className="mt-8 text-center text-xs text-muted">
                {content.testimonial.pauseLabel}
              </p>
            )}
          </Reveal>
        </div>
      </section>
      {content.quote.visible && (
        <section id="quote" className="quote-section">
          <div className="site-container max-w-4xl">
            <Reveal>
              <SectionHeading
                eyebrow={content.quote.eyebrow}
                title={content.quote.title}
                centered
              />
              <div className="mt-14">
                <QuoteForm />
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
