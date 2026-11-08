"use client";

/**
 * Shared language for every "room" of the evening that follows the 3D entrance:
 * one ornament, one heading reveal, one light source, one button. Keeping them
 * here is what makes the page read as a single art-directed sequence.
 */

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";

/** The same unhurried curve as the hero's camera move */
export const GALA_EASE = [0.16, 1, 0.3, 1] as const;

/** The Gala's four-point star with its two satellites, as stitched on the banners */
export function GalaStar({ className = "", satellites = true }: { className?: string; satellites?: boolean }) {
  const star = (cx: number, r: number, inner: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : inner;
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)},${(12 + Math.sin(a) * rr).toFixed(2)}`);
    }
    return pts.join(" ");
  };
  return (
    <svg viewBox={satellites ? "0 0 48 24" : "12 0 24 24"} className={className} aria-hidden="true" fill="currentColor">
      <polygon points={star(24, 11, 2.4)} />
      {satellites && <polygon points={star(8.5, 4, 1)} />}
      {satellites && <polygon points={star(39.5, 4, 1)} />}
    </svg>
  );
}

/**
 * The room's banner: a silver satin pennant on a brushed rail, stitched and
 * starred exactly like the banners hanging in the hall, with the room's
 * programme numeral and name. It swings down into place as the room arrives.
 */
export function RoomOrnament({
  numeral,
  label,
  align = "center",
  className = "",
}: {
  numeral: string;
  label: string;
  /** "start" for left-aligned editorial layouts */
  align?: "center" | "start";
  className?: string;
}) {
  const start = align === "start";
  return (
    <div className={`flex flex-col gap-4 ${start ? "items-start" : "items-center"} ${className}`}>
      <motion.div
        initial={{ rotateX: -70, opacity: 0 }}
        whileInView={{ rotateX: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.6, ease: GALA_EASE }}
        style={{ transformOrigin: "50% 0%", transformPerspective: 500 }}
        className="flex flex-col items-center"
        aria-hidden="true"
      >
        {/* Rail with finials */}
        <span className="relative block h-[3px] w-[78px] rounded-full gala-brushed shadow-[0_2px_4px_rgba(5,1,4,0.6)]">
          <span className="absolute -left-1 -top-[2px] h-[7px] w-[7px] rounded-full gala-brushed" />
          <span className="absolute -right-1 -top-[2px] h-[7px] w-[7px] rounded-full gala-brushed" />
        </span>
        {/* Satin pennant */}
        <span className="block [filter:drop-shadow(0_10px_14px_rgba(6,1,4,0.6))]">
          <span className="relative mt-[2px] flex h-[84px] w-[60px] flex-col items-center gala-satin [clip-path:polygon(0_0,100%_0,100%_76%,50%_100%,0_76%)]">
            <svg viewBox="0 0 60 84" className="absolute inset-0 h-full w-full" fill="none">
              <polygon
                points="4,4 56,4 56,62.5 30,79 4,62.5"
                stroke="rgba(32,38,48,0.55)"
                strokeWidth="0.8"
                strokeDasharray="2.4 1.6"
              />
            </svg>
            <GalaStar className="mt-[11px] w-[30px] text-[#121722]" />
            <span className="mt-[5px] font-cinzel text-[19px] font-bold leading-none text-[#0A0E16]">{numeral}</span>
          </span>
        </span>
      </motion.div>
      <motion.span
        initial={{ opacity: 0, letterSpacing: "0.5em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.34em" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.4, delay: 0.3, ease: GALA_EASE }}
        className="font-cinzel text-[11px] font-semibold uppercase text-[var(--color-silver-light)] sm:text-[12px]"
      >
        {label}
      </motion.span>
    </div>
  );
}

/**
 * A photograph presented like a jewel: brushed silver moulding around a
 * burgundy passe-partout.
 */
export function GalaFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative gala-brushed p-[5px] shadow-[0_40px_70px_-34px_rgba(5,1,4,0.95),0_0_0_1px_rgba(8,1,6,0.7)] sm:p-[7px]">
        <div className="bg-[#2b061e] p-[10px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(0,0,0,0.5)] sm:p-[18px]">
          <div className="relative overflow-hidden shadow-[0_0_0_1px_rgba(192,192,192,0.25)]">{children}</div>
        </div>
      </div>
    </div>
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
        <span key={i} className="block overflow-hidden pb-[0.14em]">
          <motion.span
            className="block gala-engraved"
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

/** Rooms are lit by the hall itself now (GalaWorld); kept so callers stay simple */
export function RoomSpotlight(_props: { x?: string; y?: string; className?: string }) {
  return null;
}

/**
 * Letterpress plaque button, identical in spirit to the hero invitation CTA.
 * The one button style of the site: a plum plaque with a hairline cream
 * border, small caps, an underline that draws on hover and a square arrow.
 * As a link (href) or a button (onClick / type="submit"). `variant="ghost"`
 * is the quiet secondary (no fill), `icon` replaces the arrow.
 */
export function GalaButton({
  href,
  onClick,
  type = "button",
  disabled,
  variant = "plaque",
  icon,
  children,
  className = "",
  target,
  rel,
  ariaLabel,
  download,
}: {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "plaque" | "ghost";
  icon?: React.ReactNode | null;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  /** File name: renders a plain download link */
  download?: string;
}) {
  const cls = `group relative inline-flex items-center justify-between gap-3 sm:gap-4 pl-5 sm:pl-7 pr-2 py-2 min-h-[52px] rounded-[2px] border text-[var(--color-cream)] text-[10.5px] sm:text-[12px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.22em] transition-[border-color,background-color,transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60 luxury-focus-ring cursor-pointer ${
    variant === "ghost"
      ? "bg-transparent border-[var(--color-cream)]/25 hover:border-[var(--color-cream)]/60 hover:bg-[#310621]/50"
      : "bg-[#310621]/85 border-[var(--color-cream)]/40 hover:border-[var(--color-cream)]/85 hover:bg-[#41092C]/95"
  } ${className}`;
  const inner = (
    <>
      <span className="relative inline-flex items-center gap-2 pb-0.5">
        {children}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-0 bg-[var(--color-cream)]/75 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
        />
      </span>
      {icon !== null && (
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--color-cream)]/30 text-[var(--color-silver-light)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:border-[var(--color-cream)]/60"
        >
          {icon ?? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
        </span>
      )}
    </>
  );
  if (href && download) {
    return (
      <a href={href} download={download} className={cls} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} target={target} rel={rel} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>
      {inner}
    </button>
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

/**
 * A room's masthead, set like a magazine cover: the room's name in engraved
 * silver at viewport scale, its letters drawing together as the room arrives,
 * over the banner, with the room's line in italic beneath.
 */
export function RoomMasthead({
  numeral,
  label,
  headline,
  intro,
  align = "center",
  className = "",
}: {
  numeral: string;
  /** e.g. "THE GALLERY"; the leading article is dropped from the giant word */
  label: string;
  headline?: string;
  intro?: string;
  align?: "center" | "start";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 35%"] });
  const tracking = useTransform(scrollYProgress, [0, 1], ["0.38em", "0.04em"]);
  const wordOpacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
  const wordY = useTransform(scrollYProgress, [0, 1], ["30%", "0%"]);
  const word = label.replace(/^(THE|LA|LE|LES|L['’])\s*/i, "");
  const start = align === "start";

  return (
    <header ref={ref} className={`relative flex flex-col ${start ? "items-start text-left" : "items-center text-center"} ${className}`}>
      <RoomOrnament numeral={numeral} label={label} align={align} />
      <div className={`mt-6 w-full overflow-hidden ${start ? "" : "flex justify-center"}`}>
        <motion.h2
          aria-label={label}
          style={reduceMotion ? undefined : { letterSpacing: tracking, opacity: wordOpacity, y: wordY }}
          className="whitespace-nowrap font-cinzel text-[clamp(40px,10.5vw,176px)] font-semibold leading-[0.95] tracking-[0.04em] gala-engraved"
        >
          {word}
        </motion.h2>
      </div>
      {headline && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, delay: 0.15, ease: GALA_EASE }}
          className="mt-4 whitespace-pre-line font-cormorant text-[clamp(24px,3.2vw,44px)] italic leading-[1.15] text-[var(--color-cream)]/92"
        >
          {headline.replace(/\n/g, " ")}
        </motion.p>
      )}
      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, delay: 0.3, ease: GALA_EASE }}
          className={`mt-5 max-w-xl text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72 sm:text-base ${start ? "" : "mx-auto"}`}
        >
          {intro}
        </motion.p>
      )}
    </header>
  );
}

/** Thin silver rule that draws itself across its container when it arrives */
export function DrawnRule({ className = "", origin = "left" }: { className?: string; origin?: "left" | "center" }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.4, ease: GALA_EASE }}
      className={`block h-px w-full bg-gradient-to-r from-[var(--color-silver)]/50 via-[var(--color-silver)]/25 to-transparent ${origin === "center" ? "origin-center via-[var(--color-silver)]/45 from-transparent" : "origin-left"} ${className}`}
    />
  );
}
