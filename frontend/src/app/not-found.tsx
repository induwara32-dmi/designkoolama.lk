import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return <section className="site-container flex min-h-[65vh] flex-col items-center justify-center text-center"><p className="eyebrow">404 — Page not found</p><h1 className="mt-4 text-5xl font-black">This idea wandered off.</h1><p className="mt-4 max-w-md text-secondary">The page may have moved or no longer exists.</p><LinkButton href="/" className="mt-8">Back to home</LinkButton></section>;
}
