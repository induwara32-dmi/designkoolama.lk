import { Brush, CalendarDays, Check, Eye, Flag, Globe2, Lightbulb, MapPin, Shield, Trophy } from "lucide-react";

export const aboutContent = {
  hero: { eyebrow: "About Us", title: "Designing Brands That", accent: "Inspire,", tail: "Connect, and Grow.", description: "We are a dedicated team of creative professionals based in Sri Lanka, passionate about delivering exceptional design solutions that elevate brands and create lasting impressions." },
  facts: [
    { title: "Founded in 2022", description: "A young and dynamic studio that emerged with a clear mission — to redefine creative design in Sri Lanka and set new standards of excellence.", icon: Flag },
    { title: "Based in Colombo, Sri Lanka", description: "Headquartered in the heart of Sri Lanka's commercial capital, we bring local insight combined with a globally inspired design perspective.", icon: MapPin },
    { title: "Serving Clients Worldwide", description: "Though rooted locally, our work has reached clients across Asia, the Middle East, and beyond — delivering premium creative solutions without borders.", icon: Globe2 },
  ],
  values: [
    { title: "Creativity", description: "Pushing boundaries with bold, original thinking in every project we touch.", icon: Brush },
    { title: "Integrity", description: "Honest, transparent, and ethical in everything we do and deliver.", icon: Shield },
    { title: "Innovation", description: "Embracing new ideas, tools, and approaches to stay ahead of the curve.", icon: Lightbulb },
    { title: "Excellence", description: "Never settling for less than the best in every single deliverable.", icon: Trophy },
  ],
  advantages: ["Fast Response Time", "Tailor-Made Creative Solutions", "On-Time Project Delivery", "Dedicated Client Support"].map((title) => ({ title, icon: Check })),
  badges: [{ label: "Est. 2022", icon: CalendarDays }, { label: "Sri Lanka Based", icon: MapPin }, { label: "Global Reach", icon: Globe2 }],
  foundation: [
    { title: "Our Mission", description: "To deliver innovative and impactful design solutions that empower businesses to stand out, grow, and inspire their audiences through creative excellence and strategic brand thinking.", icon: Lightbulb },
    { title: "Our Vision", description: "To become the most trusted creative design studio in South Asia, recognized for transforming brands through world-class creative strategy, design thinking, and measurable results.", icon: Eye },
  ],
} as const;
