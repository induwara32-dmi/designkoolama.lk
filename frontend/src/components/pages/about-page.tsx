import Image from "next/image";
import {Reveal} from "@/components/motion/reveal";
import {InfoCard} from "@/components/pages/info-card";
import {InnerHero} from "@/components/pages/inner-hero";
import {LinkButton} from "@/components/ui/button";
import {SectionHeading} from "@/components/ui/section-heading";
import {ApprovedIcon} from "@/components/ui/approved-icon";
import type {AboutCmsContent} from "@/content/about-cms";

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

export function AboutPage({content}: {content: AboutCmsContent}) {
  const h = content.hero;
  return (
    <>
      <InnerHero eyebrow={h.eyebrow} title={h.title} accent={h.accent} description={h.description}>
        <h2 className="inner-hero-tail">{h.tail}</h2>
        <LinkButton href={h.buttonHref} className="mt-10 rounded-full px-9 uppercase tracking-wider">{h.buttonLabel}</LinkButton>
        <div className="hero-badges">{content.badges.map(item => <span key={item.label}><ApprovedIcon iconKey={item.iconKey}/>{item.label}</span>)}</div>
      </InnerHero>
      <section className="section bg-charcoal">
        <div className="site-container about-split">
          <Reveal>
            <p className="eyebrow">{content.story.eyebrow}</p>
            <h2 className="section-title mt-7 max-w-xl">{content.story.title}</h2>
            <div className="prose-copy">{content.story.paragraphs.map(item => <p key={item}>{item}</p>)}</div>
          </Reveal>
          <div className="grid gap-5">{content.story.facts.map(item => <Reveal key={item.title}><InfoCard iconKey={item.iconKey} title={item.title} accent>{item.description}</InfoCard></Reveal>)}</div>
        </div>
      </section>
      <section className="section bg-black">
        <div className="site-container">
          <p className="eyebrow text-center">{content.founder.eyebrow}</p>
          <div className="founder-grid">
            <Reveal>
              <div className="founder-card">
                {content.founder.photoUrl ? (
                  <Image className="founder-photo" src={content.founder.photoUrl} alt={content.founder.photoAlt || content.founder.name} width={160} height={160} unoptimized/>
                ) : (
                  <div className="founder-avatar">{initials(content.founder.name)}</div>
                )}
                <h2>{content.founder.name}</h2>
                <p>{content.founder.role}</p>
                <span>{content.founder.caption}</span>
              </div>
            </Reveal>
            <Reveal>
              <div className="founder-message">
                <span className="founder-quote">&ldquo;</span>
                <h2 className="section-title">{content.founder.messageHeading}</h2>
                {content.founder.messageParagraphs.map(item => <p key={item}>{item}</p>)}
                <strong>{content.founder.signatureName}</strong>
                <small>{content.founder.signatureTitle}</small>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="section bg-charcoal">
        <div className="site-container">
          <SectionHeading eyebrow={content.foundation.eyebrow} title={content.foundation.title} centered/>
          <div className="foundation-grid">
            <InfoCard iconKey={content.foundation.mission.iconKey} title={content.foundation.mission.title}>{content.foundation.mission.description}</InfoCard>
            <InfoCard iconKey={content.foundation.vision.iconKey} title={content.foundation.vision.title}>{content.foundation.vision.description}</InfoCard>
          </div>
          <p className="values-label">{content.foundation.valuesLabel}</p>
          <div className="values-grid">{content.foundation.values.map(item => <InfoCard key={item.title} iconKey={item.iconKey} title={item.title}>{item.description}</InfoCard>)}</div>
        </div>
      </section>
      <section className="section bg-black">
        <div className="site-container contact-advantage">
          <div>
            <SectionHeading eyebrow={content.location.eyebrow} title={content.location.title}/>
            <div className="mt-10 grid gap-4">
              <InfoCard iconKey="map-pin" title="Office Address">{content.location.address.split("\n").map((line, index) => <span key={index}>{line}{index < content.location.address.split("\n").length - 1 && <br/>}</span>)}</InfoCard>
              <InfoCard iconKey="mail" title="Email Us"><a href={`mailto:${content.location.email}`} className="hover:text-white">{content.location.email}</a></InfoCard>
              <InfoCard iconKey="phone" title="Call Us"><a href={`tel:${content.location.phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">{content.location.phone}</a></InfoCard>
              <InfoCard iconKey="clock" title="Operating Hours">{content.location.hours}</InfoCard>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow={content.advantage.eyebrow} title={content.advantage.title}/>
            <div className="advantage-list">{content.advantage.items.map(item => <div key={item.title}><span><ApprovedIcon iconKey="check"/></span><h3>{item.title}</h3><p>{item.description}</p></div>)}</div>
            <LinkButton href={content.advantage.buttonHref} className="mt-9 w-full uppercase tracking-widest">{content.advantage.buttonLabel}</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
