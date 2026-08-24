import { QuoteForm } from "@/components/forms/quote-form";
import { InnerHero } from "@/components/pages/inner-hero";
import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";
import type { QuoteCmsContent } from "@/content/quote-cms";
export function QuotePage({
  service = "",
  packageName = "",
  content,
}: {
  service?: string;
  packageName?: string;
  content: QuoteCmsContent;
}) {
  return (
    <>
      <InnerHero
        {...content.hero}
      />
      <section className="quote-section">
        <div className="site-container max-w-4xl">
          <SectionHeading
            eyebrow={content.form.eyebrow}
            title={content.form.title}
            centered
          />
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted">
          {content.form.instructions}
          </p>
          <div className="mt-12">
          <QuoteForm
            initialService={service}
              initialPackage={packageName}
            />
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            {content.form.consent} <Link href={content.form.privacyHref}>{content.form.privacyLabel}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
