"use client";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

type StatEntry = { value: number | string; suffix?: string; label: string; visible: boolean; order: number };
type ParsedStat = { prefix: string; target: number; decimals: number; grouped: boolean; suffix: string };

const COUNT_UP_DURATION_MS = 1800;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const NUMERIC = /^(\D*)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(\D*)$/;

function parseStat(text: string): ParsedStat | null {
  const match = NUMERIC.exec(text.trim());
  if (!match) return null;
  const [, prefix = "", whole = "", fraction = "", suffix = ""] = match;
  return { prefix, target: Number(`${whole.replace(/,/g, "")}.${fraction || "0"}`), decimals: fraction.length, grouped: whole.includes(","), suffix };
}

function formatStat(stat: ParsedStat, progress: number) {
  const value = Number((stat.target * progress).toFixed(stat.decimals));
  return stat.prefix + value.toLocaleString("en-US", { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals, useGrouping: stat.grouped }) + stat.suffix;
}

export function StatsBar({ items }: { items: StatEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setProgress(1); return; }
    let frameId = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / COUNT_UP_DURATION_MS, 1);
      setProgress(easeOutCubic(t));
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, reduce]);

  const visible = items.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  if (!visible.length) return null;

  return (
    <div className="stats-panel" ref={ref}>
      {visible.map((stat) => {
        const text = `${stat.value}${stat.suffix ?? ""}`;
        const parsed = parseStat(text);
        return (
          <div className="stat" key={`${stat.label}-${stat.order}`}>
            {parsed ? (
              <p>
                <span className="sr-only">{text}</span>
                <span className="stat-count" data-final={text} aria-hidden="true">
                  <span className="stat-count-live">{formatStat(parsed, progress)}</span>
                </span>
              </p>
            ) : (
              <p>{text}</p>
            )}
            <span>{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
