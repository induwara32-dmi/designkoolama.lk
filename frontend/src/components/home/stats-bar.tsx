"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type StatEntry = { value: number; suffix: string; label: string; visible: boolean; order: number };

const COUNT_UP_DURATION_MS = 1800;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function useCountUp(target: number, active: boolean) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setDisplay(target); return; }
    if (!active) return;
    let frameId = 0;
    const startedAt = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startedAt) / COUNT_UP_DURATION_MS, 1);
      setDisplay(Math.round(target * easeOutExpo(progress)));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, target, reduce]);
  return display;
}

function StatNumber({ value, suffix, active }: { value: number; suffix: string; active: boolean }) {
  const display = useCountUp(value, active);
  return <p>{display}{suffix}</p>;
}

export function StatsBar({ items }: { items: StatEntry[] }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || active) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  const visible = items.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  if (!visible.length) return null;

  return (
    <div className="stats-panel" ref={ref}>
      {visible.map((stat) => (
        <div className="stat" key={`${stat.label}-${stat.order}`}>
          <StatNumber value={stat.value} suffix={stat.suffix} active={active} />
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
