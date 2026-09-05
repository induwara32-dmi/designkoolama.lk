"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AUTO_SLIDE_INTERVAL_MS } from "@/lib/carousel";
import type { PublicTestimonial } from "@/services/public-content";

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

export function TestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(3);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const update = () =>
      setVisible(
        window.matchMedia("(max-width: 767px)").matches
          ? 1
          : window.matchMedia("(max-width: 1023px)").matches
            ? 2
            : 3,
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const count = Math.min(visible, items.length);
  // Groups are built circularly (wrapping back to index 0) so every page always
  // renders exactly `count` cards, even when items.length isn't a multiple of
  // count -- otherwise the final page would render short and look unbalanced.
  const groups = useMemo(() => {
    if (!count) return [];
    const pageCount = Math.ceil(items.length / count);
    return Array.from({ length: pageCount }, (_, p) =>
      Array.from({ length: count }, (_, i) => items[(p * count + i) % items.length]!),
    );
  }, [items, count]);

  useEffect(() => setPage((p) => Math.min(p, Math.max(groups.length - 1, 0))), [groups.length]);

  useEffect(() => {
    if (reduce || paused || groups.length < 2) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setPage((p) => (p + 1) % groups.length);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [groups.length, paused, reduce]);

  if (!items.length) return null;

  function go(next: number, dir: number) {
    setDirection(dir);
    setPage((next + groups.length) % groups.length);
  }

  return (
    <div
      className={`home-testimonial-carousel${groups.length > 1 ? " has-nav" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onPointerDown={(event) => {
        startX.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (startX.current === null) return;
        const delta = event.clientX - startX.current;
        startX.current = null;
        if (Math.abs(delta) > 40) go(page + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        startX.current = null;
      }}
    >
      {groups.length > 1 && (
        <button
          type="button"
          className="testimonial-nav testimonial-nav-prev"
          aria-label="Previous testimonials"
          onClick={() => go(page - 1, -1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      )}
      <div className="home-testimonial-viewport">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={page}
            className={`home-testimonial-group testimonial-count-${count}`}
            custom={direction}
            variants={reduce ? undefined : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeInOut" }}
          >
            {groups[page]!.map((item) => (
              <article className="testimonial-card home-testimonial-card" key={`${item.clientName}-${item.displayOrder}`}>
                <div className="testimonial-card-header">
                  {item.avatar ? (
                    <Image
                      className="testimonial-card-photo"
                      src={item.avatar.secureUrl || item.avatar.url}
                      alt={item.avatar.altText || item.clientName}
                      width={64}
                      height={64}
                    />
                  ) : (
                    <span className="testimonial-card-initials" aria-hidden="true">{initials(item.clientName)}</span>
                  )}
                  <h3>{item.clientName}</h3>
                  <p>{[item.clientRole, item.company].filter(Boolean).join(", ")}</p>
                  <div className="stars" aria-label={`${item.rating ?? 0} out of 5 stars`}>
                    {"★".repeat(item.rating ?? 0)}
                  </div>
                </div>
                <div className="testimonial-card-body">
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                </div>
              </article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      {groups.length > 1 && (
        <button
          type="button"
          className="testimonial-nav testimonial-nav-next"
          aria-label="Next testimonials"
          onClick={() => go(page + 1, 1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      )}
      {groups.length > 1 && (
        <div className="portfolio-dots testimonial-dots" role="tablist" aria-label="Testimonials pages">
          {groups.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={`Show testimonials page ${i + 1}`}
              className={i === page ? "is-active" : ""}
              onClick={() => go(i, i > page ? 1 : -1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
