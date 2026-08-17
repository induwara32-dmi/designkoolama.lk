import { MapPin } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { QuoteForm } from "@/components/forms/quote-form";
import { Reveal } from "@/components/motion/reveal";
import { FaqAccordion } from "@/components/pages/faq";
import { InfoCard } from "@/components/pages/info-card";
import { InnerHero } from "@/components/pages/inner-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import { contactContent } from "@/content/contact";

export function ContactPage(){return <><InnerHero eyebrow="Get In Touch" title="Contact" accent="Us" description="Have a project in mind? We'd love to hear about it. Reach out and let's create something extraordinary together."/><section className="section bg-charcoal"><div className="site-container contact-layout"><div><SectionHeading eyebrow="Contact Details" title="Our Contact Details"/><div className="mt-10 grid gap-4">{contactContent.details.map(({title,lines,icon})=><InfoCard key={title} icon={icon} title={title}>{lines.map(line=><p key={line}>{line}</p>)}</InfoCard>)}</div></div><Reveal><div className="map-card"><span className="map-country">Sri Lanka</span><div className="map-pin"><MapPin/></div><h2>Interactive Map</h2><p>Google Maps Embed</p><span className="map-location"><MapPin/>Sri Jayawardenepura Kotte, Colombo</span><small>6.8879° N, 79.9127° E</small></div></Reveal></div></section><section className="section bg-black"><div className="site-container max-w-3xl"><SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" centered/><div className="mt-14"><FaqAccordion items={contactContent.faqs}/></div></div></section><section className="quote-section"><div className="site-container max-w-4xl"><SectionHeading eyebrow="Let's start your project" title="Request a Quote" centered/><div className="mt-14"><QuoteForm/></div></div></section><section className="section bg-charcoal"><div className="site-container max-w-4xl"><SectionHeading eyebrow="Send a message" title="Contact Our Team" centered/><div className="mt-12"><ContactForm/></div></div></section></>}
