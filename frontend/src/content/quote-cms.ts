export type QuoteCmsContent = {
  hero: { eyebrow: string; title: string; accent: string; description: string };
  form: { eyebrow: string; title: string; instructions: string; consent: string; privacyLabel: string; privacyHref: string };
};

export const quoteCmsContent: QuoteCmsContent = {
  hero: { eyebrow: "Start a Project", title: "Get a", accent: "Quote", description: "Tell us what you are building and we will help shape the right creative approach." },
  form: { eyebrow: "Project Brief", title: "Request a Quote", instructions: "Share the essentials below. Attachment uploads are deferred; we will request project files securely after confirming your brief.", consent: "By submitting, you consent to being contacted about this request.", privacyLabel: "See our Privacy Policy.", privacyHref: "/privacy" },
};
