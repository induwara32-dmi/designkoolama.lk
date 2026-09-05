import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/pages/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DesignKoolama collects, uses, and protects the information you share with us.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: { title: "Privacy Policy | DesignKoolama", description: "How DesignKoolama collects, uses, and protects your information.", url: "/privacy-policy" },
};

const sections: readonly LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "DesignKoolama (Pvt) Ltd. (\"DesignKoolama\", \"we\", \"us\", or \"our\") is a creative design studio based in Colombo, Sri Lanka. This Privacy Policy explains what information we collect through this website, how we use it, and the choices you have.",
      "By using this website or submitting a form to us, you agree to the practices described in this policy.",
    ],
  },
  {
    heading: "Information we collect",
    paragraphs: [
      "We only collect information that you choose to give us. We do not require you to create an account or log in to browse this site.",
    ],
    list: [
      "Contact form submissions: your full name, email address, phone number, subject, and message.",
      "Quote request submissions: your full name, email address, WhatsApp number, company name (if provided), preferred contact method, service of interest, budget range (if selected), project deadline, project details, and an optional file attachment.",
      "Any information you volunteer when you continue a conversation with us on WhatsApp after submitting a form.",
    ],
  },
  {
    heading: "How we use your information",
    paragraphs: ["We use the information you submit only to:"],
    list: [
      "Respond to your enquiry, quote request, or project brief.",
      "Prepare proposals, estimates, and project timelines.",
      "Communicate with you about an ongoing or prospective project by email, phone, or WhatsApp.",
      "Keep internal records of enquiries so our team can follow up appropriately.",
    ],
  },
  {
    heading: "Cookies and similar technologies",
    paragraphs: [
      "This website may use strictly necessary cookies to keep the site functioning correctly (for example, remembering a submitted form's state or an administrator's signed-in session in our content management panel). We do not currently use cookies for advertising or cross-site tracking.",
      "If this changes in the future, we will update this policy and, where required by law, ask for your consent first.",
    ],
  },
  {
    heading: "Third-party services we use",
    paragraphs: [
      "We rely on a small number of trusted third-party services to run this website and respond to enquiries. Each processes data under its own privacy policy and terms:",
    ],
    list: [
      "WhatsApp: after a successful form submission, you may be redirected to a WhatsApp chat pre-filled with the details you entered, so you can continue the conversation directly with our team. This redirect only happens with your form data, and only after your submission has been saved.",
      "Email: enquiries and notifications may be sent and received through standard email service providers.",
      "Cloudinary: we use Cloudinary to host and deliver the images and media shown on this website. Cloudinary is not used to store or process the personal information you submit through our forms.",
      "Hosting and infrastructure providers that keep this website and its database online and secure.",
    ],
  },
  {
    heading: "How long we keep your information",
    paragraphs: [
      "We keep enquiry, quote request, and contact submissions for as long as reasonably necessary to respond to you, deliver a project, and maintain a basic record of past client communications, after which it may be archived or deleted.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You may ask us at any time to tell you what information we hold about you, to correct inaccurate information, or to delete information we no longer need to keep. To make a request, contact us using the details below.",
    ],
  },
  {
    heading: "Keeping your information secure",
    paragraphs: [
      "We take reasonable technical and organisational measures to protect the information you share with us from unauthorised access, alteration, or loss. No method of transmission or storage is completely secure, but we work to keep your information appropriately protected.",
    ],
  },
  {
    heading: "Children's privacy",
    paragraphs: [
      "This website is intended for businesses and individuals seeking creative design services and is not directed at children. We do not knowingly collect information from children.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes to our practices or for legal reasons. The \"Last updated\" date at the top of this page shows when it was last revised.",
    ],
  },
  {
    heading: "Contact us",
    paragraphs: [
      "If you have any questions about this Privacy Policy or how we handle your information, please get in touch.",
    ],
    email: "designkoolamapvtltd@gmail.com",
  },
];

export default function Page() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what information DesignKoolama collects when you use this website, why we collect it, and how it is handled."
      updated="September 4, 2026"
      sections={sections}
    />
  );
}
