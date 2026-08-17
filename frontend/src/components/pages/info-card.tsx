import type { LucideIcon } from "lucide-react";

export function InfoCard({ icon: Icon, title, children, accent = false }: { icon: LucideIcon; title: string; children: React.ReactNode; accent?: boolean }) { return <article className={`info-card${accent ? " info-card-accent" : ""}`}><span className="icon-box"><Icon/></span><div><h3>{title}</h3><div className="mt-2 text-sm leading-6 text-muted">{children}</div></div></article>; }
