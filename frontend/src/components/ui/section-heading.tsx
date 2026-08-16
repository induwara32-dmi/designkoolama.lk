import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, centered = false, className }: { eyebrow?: string; title: string; description?: string; centered?: boolean; className?: string }) {
  return <div className={cn(centered && "text-center", className)}>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="section-title mt-3">{title}</h2>{description && <p className={cn("mt-4 max-w-xl text-[15px] leading-6 text-secondary", centered && "mx-auto")}>{description}</p>}</div>;
}
