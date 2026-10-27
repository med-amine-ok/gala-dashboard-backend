"use client";

/**
 * Shared language for every "room" of the evening that follows the 3D entrance:
 * one ornament, one heading reveal, one light source, one button. Keeping them
 * here is what makes the page read as a single art-directed sequence.
 */

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

/** The same unhurried curve as the hero's camera move */
export const GALA_EASE = [0.16, 1, 0.3, 1] as const;

/** ✦ between two silver hairlines, with the room's programme number and name */
export function RoomOrnament({
  numeral,
  label,
  align = "center",
  className = "",
}: {
  numeral: string;
  label: string;
  /** "start" for left-aligned editorial layouts: ✦ then a single trailing hairline */
  align?: "center" | "start";
  className?: string;
}) {
  const start = align === "start";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, ease: GALA_EASE }}
      className={`flex flex-col gap-4 ${start ? "items-start" : "items-center"} ${className}`}
    >
      <div className="flex items-center gap-4" aria-hidden="true">
        {!start && (
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.2, ease: GALA_EASE }}
            className="block h-px w-14 sm:w-20 origin-right bg-gradient-to-l from-[var(--color-silver)]/70 to-transparent"
          />
        )}
        <span className="text-[13px] leading-none text-[var(--color-silver-light)]">✦</span>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.2, ease: GALA_EASE }}
          className="block h-px w-14 sm:w-20 origin-left bg-gradient-to-r from-[var(--color-silver)]/70 to-transparent"
        />
      </div>
      <span className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-silver)]">
        {numeral} <span className="mx-1.5 text-[var(--color-silver)]/50">·</span> {label}
      </span>
    </motion.div>
  );
}

/** Heading revealed line by line from behind a mask, like engraved type rising */
export function RevealHeading({
  text,
  as: Tag = "h2",
  className = "",
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
}) {
  const lines = text.split("\n");
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className="block"
            initial={{ y: "105%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.1, delay: delay + i * 0.12, ease: GALA_EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** A single soft pool of light: each room has one focus, like the hero's lighting */
export function RoomSpotlight({
  x = "50%",
  y = "40%",
  className = "",
}: {
  x?: string;
  y?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(ellipse 55% 45% at ${x} ${y}, rgba(122, 26, 42, 0.42) 0%, rgba(61, 8, 18, 0.18) 45%, transparent 75%)`,
      }}
    />
  );
}

/** Letterpress plaque button, identical in spirit to the hero invitation CTA */
export function GalaButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-3 sm:gap-4 pl-5 sm:pl-7 pr-2 py-2 min-h-[52px] rounded-[2px] bg-[#30070E]/85 border border-[var(--color-cream)]/40 hover:border-[var(--color-cream)]/85 text-[var(--color-cream)] text-[10.5px] sm:text-[12px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.22em] transition-[border-color,background-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#400A14]/95 active:scale-[0.985] luxury-focus-ring ${className}`}
    >
      <span className="relative pb-0.5">
        {children}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-0 bg-[var(--color-cream)]/75 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
        />
      </span>
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center border border-[var(--color-cream)]/30 text-[var(--color-silver-light)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:border-[var(--color-cream)]/60"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      </span>
    </Link>
  );
}

/** Counts up the numeric part of a figure ("1,200", "500+", "100%") once in view */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match || !inView || reduceMotion) return;
    const [, pre, num, post] = match;
    const target = parseInt(num.replace(/,/g, ""), 10);
    const pad = num.length > 1 && num.startsWith("0") ? num.length : 0;
    const format = (n: number) => {
      const r = Math.round(n);
      const s = pad
        ? String(r).padStart(pad, "0")
        : num.includes(",")
          ? r.toLocaleString("en-US")
          : String(r);
      return pre + s + post;
    };
    const controls = animate(0, target, {
      duration: 1.6,
      ease: GALA_EASE,
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduceMotion, value]);

  return <span ref={ref}>{value}</span>;
}
