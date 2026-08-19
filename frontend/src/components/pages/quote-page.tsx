import { QuoteForm } from "@/components/forms/quote-form";
import { InnerHero } from "@/components/pages/inner-hero";
import { SectionHeading } from "@/components/ui/section-heading";
export function QuotePage({
  service = "",
  packageName = "",
}: {
  service?: string;
  packageName?: string;
}) {
  return (
    <>
      <InnerHero
        eyebrow="Start a Project"
        title="Get a"
        accent="Quote"
        description="Tell us what you are building and we will help shape the right creative approach."
      />
      <section className="quote-section">
        <div className="site-container max-w-4xl">
          <SectionHeading
            eyebrow="Project Brief"
            title="Request a Quote"
            centered
          />
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted">
          Share the essentials below. Attachment uploads are deferred for this
          phase; we will request project files securely after confirming your brief.
          </p>
          <div className="mt-12">
          <QuoteForm
            initialService={service}
              initialPackage={packageName}
            />
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            By submitting, you consent to being contacted about this request.
            See our Privacy Policy.
          </p>
        </div>
      </section>
    </>
  );
}
