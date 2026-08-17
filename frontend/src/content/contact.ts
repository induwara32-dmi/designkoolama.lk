import { Clock3, Mail, MapPin, Phone } from "lucide-react";

export const contactContent = {
  details: [
    { title: "Office Address", lines: ["No. 460, Thalawathugoda Road, Madiwela,", "Sri Jayawardenepura Kotte, Colombo, Sri Lanka"], icon: MapPin },
    { title: "Email Us", lines: ["hello@designkoolama.com", "support@designkoolama.com"], icon: Mail },
    { title: "Call Us", lines: ["+94 77 000 0000"], icon: Phone },
    { title: "Operating Hours", lines: ["Monday – Friday · 9:00 AM – 6:00 PM", "Saturday – By Appointment"], icon: Clock3 },
  ],
  faqs: [
    { question: "How long does a typical project take?", answer: "Project timelines vary depending on scope and complexity. A brand identity project typically takes 2–4 weeks, while larger digital projects can take 4–8 weeks. We provide a detailed timeline at the start." },
    { question: "Do you work with international clients?", answer: "Yes. We collaborate remotely with clients worldwide using clear milestones, regular reviews, and convenient communication channels." },
    { question: "How do I get started with a project?", answer: "Send us a quote request with your goals, preferred service, and timeline. We will reply with the next steps and discovery questions." },
    { question: "What information should I prepare?", answer: "Your goals, target audience, preferred timeline, budget range, and any existing brand material are the best place to start." },
    { question: "Can you work with an existing brand identity?", answer: "Absolutely. We can extend, refine, or refresh an established identity while protecting the recognition you have already built." },
  ],
} as const;
