import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/pages/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the DesignKoolama website and creative design services.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service | DesignKoolama", description: "The terms that govern your use of DesignKoolama's website and services.", url: "/terms" },
};

const sections: readonly LegalSection[] = [
  {
    heading: "Acceptance of these terms",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern your use of the DesignKoolama (Pvt) Ltd. (\"DesignKoolama\", \"we\", \"us\", or \"our\") website and any creative design services you request from us. By browsing this website, submitting a form, or engaging us for a project, you agree to these Terms.",
    ],
  },
  {
    heading: "Our services",
    paragraphs: [
      "DesignKoolama provides creative design services including, but not limited to, brand identity, print advertising, social media design, packaging design, merchandise design, and 3D design. The specific scope, deliverables, and timeline for any project are agreed separately with each client, typically following a quote request or consultation.",
      "We reserve the right to decline or discontinue a project enquiry at our discretion, for example where a request falls outside the services we offer.",
    ],
  },
  {
    heading: "Quotes, engagement, and payment",
    paragraphs: [
      "Quotes provided through this website or in follow-up conversation are estimates based on the information you provide and may be revised once the full scope of a project is confirmed. A quote is not a binding contract until both parties agree to proceed.",
      "Specific payment terms, project milestones, and delivery timelines (including any deposit, instalment, or full-payment requirements) will be agreed in writing with you before work begins, and will form part of the engagement for that project. This general placeholder is not a substitute for those project-specific terms.",
    ],
  },
  {
    heading: "Client responsibilities",
    paragraphs: [
      "To help us deliver your project on time and to the expected standard, we ask that you provide accurate project details, timely feedback, and any content, assets, or approvals required at each stage. Delays in providing this information may affect project timelines.",
      "You are responsible for ensuring that any material you supply to us (text, images, logos, or other assets) does not infringe the rights of any third party.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      "Unless otherwise agreed in writing, ownership of final approved deliverables transfers to the client upon full payment for the relevant project. Until full payment is received, DesignKoolama retains all rights to the work produced.",
      "DesignKoolama retains the right to display completed work in its portfolio, on this website, and in its own marketing materials, unless a client requests confidentiality in writing and we agree to it.",
      "Preliminary concepts, drafts, and unused design directions remain the property of DesignKoolama unless explicitly included in the agreed deliverables.",
    ],
  },
  {
    heading: "Confidentiality",
    paragraphs: [
      "We treat project details shared with us as confidential and will not disclose them to third parties except as needed to deliver the project or as required by law.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "DesignKoolama provides its services with reasonable skill and care, but to the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential loss arising from your use of this website or our services. Our total liability for any claim relating to a project is limited to the amount paid by you for that project.",
      "This website and its content are provided \"as is\" without warranties of any kind, express or implied.",
    ],
  },
  {
    heading: "Third-party links and services",
    paragraphs: [
      "This website may direct you to third-party services, including a WhatsApp chat used to continue a conversation after submitting a form. We are not responsible for the content, policies, or practices of any third-party service, and your use of them is subject to their own terms.",
    ],
  },
  {
    heading: "Termination",
    paragraphs: [
      "Either party may end an ongoing project engagement in line with the terms agreed for that specific project. Work completed and costs reasonably incurred up to the point of termination remain payable.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: [
      "These Terms are governed by the laws of Sri Lanka, and any disputes arising from them will be subject to the exclusive jurisdiction of the courts of Sri Lanka.",
    ],
  },
  {
    heading: "Changes to these terms",
    paragraphs: [
      "We may update these Terms from time to time. Continued use of this website or our services after an update constitutes acceptance of the revised Terms.",
    ],
  },
  {
    heading: "Contact us",
    paragraphs: [
      "If you have any questions about these Terms, please get in touch.",
    ],
    email: "designkoolamapvtltd@gmail.com",
  },
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of the DesignKoolama website and the creative design services we provide."
      sections={sections}
    />
  );
}
