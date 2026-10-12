import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const styles = {
  primary: "bg-brand-gradient text-white shadow-orange hover:-translate-y-0.5 hover:brightness-110",
  secondary: "border border-white/15 bg-white/[0.04] text-white hover:border-orange/60 hover:bg-orange/10",
} as const;

type Shared = { variant?: keyof typeof styles; className?: string };
type ButtonProps = Shared & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkButtonProps = Shared & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

const base = "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange";

export const linkButtonClassName = (variant: keyof typeof styles = "primary", className?: string) => cn(base, styles[variant], className);

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn(base, "disabled:opacity-50", styles[variant], className)} {...props} />;
}

export function LinkButton({ variant = "primary", className, ...props }: LinkButtonProps) {
  return <Link className={linkButtonClassName(variant, className)} {...props} />;
}
