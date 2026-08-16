import { ArrowRight, Box, Layers3, Megaphone, Palette, PenTool, Shapes } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

const services = [
  ["Brand Identity", "Build a distinct visual language people remember.", Palette],
  ["Print Advertising", "Make every printed touchpoint work harder.", Megaphone],
  ["Social Media Design", "Create a consistent feed that earns attention.", Layers3],
  ["Packaging Design", "Turn the shelf into your strongest campaign.", Box],
  ["Merchandise Design", "Put your brand into products people keep.", PenTool],
  ["3D Design", "Visualize products and ideas with real dimension.", Shapes],
] as const;

export default function Home() {
  return (
    <>
      <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden py-24 text-center">
        <div className="absolute left-1/2 top-1/3 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-orange/15 blur-[110px]" />
        <div className="site-container mx-auto max-w-5xl">
          <p className="eyebrow">Strategy · Design · Digital</p>
          <h1 className="hero-title mt-5 font-black">We turn creative concepts into <span className="bg-brand-gradient bg-clip-text text-transparent">digital realities.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-secondary md:text-lg">A creative studio building confident brands and compelling visual experiences for businesses ready to grow.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><LinkButton href="/get-a-quote">Start a project <ArrowRight className="ml-2 size-4" /></LinkButton><LinkButton href="/portfolio" variant="secondary">Explore our work</LinkButton></div>
        </div>
      </section>
      <section className="border-y border-white/[0.06] bg-charcoal py-24">
        <div className="site-container"><p className="eyebrow">What we do</p><div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end"><h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">Design that moves your business forward.</h2><p className="max-w-md text-sm leading-6 text-secondary">From first idea to final execution, our focused services build a consistent, memorable presence.</p></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(([title, description, Icon]) => <article className="glass-card group min-h-52 p-6 transition hover:-translate-y-1 hover:border-orange/35" key={title}><span className="flex size-11 items-center justify-center rounded-lg bg-orange/10 text-orange"><Icon className="size-5" /></span><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-secondary">{description}</p></article>)}</div>
        </div>
      </section>
      <section className="py-20"><div className="site-container grid grid-cols-2 gap-4 md:grid-cols-4">{[["3+", "Years creating"], ["150+", "Projects delivered"], ["80+", "Happy clients"], ["20+", "Industries reached"]].map(([value,label]) => <div className="border-l border-orange/40 px-5 py-3" key={label}><p className="text-3xl font-black text-orange md:text-4xl">{value}</p><p className="mt-2 text-xs uppercase tracking-wider text-muted">{label}</p></div>)}</div></section>
    </>
  );
}
