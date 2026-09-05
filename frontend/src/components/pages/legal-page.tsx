import { Reveal } from "@/components/motion/reveal";
import { InnerHero } from "@/components/pages/inner-hero";

export type LegalSection = {
  heading: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  email?: string;
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: readonly LegalSection[];
}) {
  return (
    <>
      <InnerHero eyebrow={eyebrow} title={title} description={intro} />
      <section className="section bg-charcoal">
        <div className="site-container legal-content">
          {updated && <p className="legal-updated">Last updated: {updated}</p>}
          {sections.map((section) => (
            <Reveal className="legal-section" key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.list && (
                <ul>
                  {section.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {section.email && <p>Email us at <a href={`mailto:${section.email}`} className="hover:text-white">{section.email}</a>.</p>}
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
