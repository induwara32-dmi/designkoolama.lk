"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <section className="site-container flex min-h-[65vh] flex-col items-center justify-center text-center"><p className="eyebrow">Something went wrong</p><h1 className="mt-4 text-4xl font-black">We hit a creative block.</h1><p className="mt-4 text-secondary">Please try that again.</p><Button className="mt-8" onClick={reset}>Try again</Button></section>; }
