export const siteConfig = {
  name: "DesignKoolama",
  legalName: "DesignKoolama (Pvt) Ltd",
  description: "A creative studio building brands, campaigns, and digital experiences.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services/brand-identity" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Packages", href: "/packages" },
    { label: "Contact", href: "/contact" },
  ],
} as const;
