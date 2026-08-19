import type { Metadata } from "next";
import { PackagesPage } from "@/components/packages/packages-page";
import { ContentUnavailable } from "@/components/feedback/content-unavailable";
import { packageExperiences } from "@/content/packages";
import { loadPackages } from "@/services/public-content";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Creative Packages | DesignKoolama",
  description:
    "Explore branding, tutor and photography packages built to grow your business.",
  alternates: { canonical: "/packages" },
  openGraph: {
    title: "Packages Built to Grow Your Business",
    description: "Focused creative packages from DesignKoolama.",
    url: "/packages",
  },
  twitter: {
    card: "summary_large_image",
    title: "DesignKoolama Creative Packages",
    description: "Focused creative packages for growing businesses.",
  },
};
export default async function Page() {
  try { return <PackagesPage experiences={await loadPackages(packageExperiences)} />; }
  catch { return <ContentUnavailable />; }
}
