import { Box, Flame, Layers3, MonitorCog, PenTool, Share2 } from "lucide-react";

export const homeContent = {
  hero: {
    eyebrow: "Sri Lanka's premier creative agency",
    title: "We turn creative concepts into",
    accent: "digital realities.",
    description: "Design Koolama (Pvt) Ltd. is a Sri Lankan creative agency specializing in branding, graphic design, and digital experiences that help businesses grow, connect, and stand out.",
  },
  services: [
    { title: "Branding & Identity", description: "Crafting memorable brand identities that resonate with your target audience and establish a strong market presence.", href: "/services/brand-identity", icon: Flame },
    { title: "Print Advertising", description: "Visually stunning graphics for print and digital media that communicate your message effectively and beautifully.", href: "/services/print-advertising", icon: PenTool },
    { title: "Social Media Design", description: "Engaging social media assets and templates designed to boost your online engagement and follower growth.", href: "/services/social-media-design", icon: Share2 },
    { title: "Packaging Design", description: "Responsive, user-centric designs built to drive conversions and showcase your brand.", href: "/services/packaging-design", icon: MonitorCog },
    { title: "Merchandise Design", description: "Innovative merchandise solutions that stand out and create memorable brand experiences.", href: "/services/merchandise-design", icon: Box },
    { title: "3D Design", description: "Immersive visuals and seamless experiences designed to delight audiences and achieve business goals.", href: "/services/3d-design", icon: Layers3 },
  ],
  stats: [
    { value: 3, suffix: "+", label: "Years Active" },
    { value: 150, suffix: "+", label: "Completed Projects" },
    { value: 80, suffix: "+", label: "Brand Collabs" },
    { value: 120, suffix: "+", label: "Brand Identities" },
  ],
  projects: [
    { category: "Branding", title: "Brand Identity — Nova Corp", href: "/portfolio/nova-corp", tone: "graphite" },
    { category: "Social Media", title: "Campaign — LuxuryBay", href: "/portfolio/luxury-bay", tone: "copper" },
    { category: "Print Advertising", title: "Redesign — Alto", href: "/portfolio/alto", tone: "teal" },
  ],
  testimonial: {
    quote: "Design Koolama exceeded our expectations with a modern brand identity and outstanding service throughout the project.",
    name: "Nimal Perera",
    role: "CEO, Nova Tech",
  },
} as const;
