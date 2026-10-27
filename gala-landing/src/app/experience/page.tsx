"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import {
  GALA_EASE,
  RevealHeading,
  RoomOrnament,
  RoomSpotlight,
} from "../components/gala/Room";

/* Web-sized photographs for each movement of the evening */
const CHAPTER_IMAGES: Record<string, string> = {
  people: "/images/programme/people.jpg",
  companies: "/images/programme/companies.jpg",
  conversations: "/images/programme/conversations.jpg",
  experience: "/images/programme/experience.jpg",
};
const NUMERALS = ["I", "II", "III", "IV"];

interface Chapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
}

/**
 * IV · THE PROGRAMME
 * The four movements of GALA 2026 along a single silver line that draws itself
 * as the visitor scrolls, echoing the hero's one continuous camera move.
 */
export default function ExperiencePillars() {
  const { texts } = useLanguage();
  const y = texts.thisYear || {};
  const chapters: Chapter[] = y.chapters || [];
  const reduceMotion = useReducedMotion();

  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start 70%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const headTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-dark)] px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <RoomSpotlight y="18%" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-20 flex max-w-2xl flex-col items-center text-center sm:mb-28">
          <RoomOrnament numeral="IV" label={y.roomLabel || "THE PROGRAMME"} />
          <RevealHeading
            text={y.headline || "This is\nGALA 2026."}
            className="mt-6 font-cinzel text-[34px] font-light leading-[1.08] sm:text-6xl"
          />
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, delay: 0.3, ease: GALA_EASE }}
            className="mt-6 max-w-xl text-base font-light leading-relaxed text-[var(--color-cream)]/80 sm:text-lg"
          >
            {y.intro}
          </motion.p>
        </div>

        {/* The line and its four movements */}
        <div ref={lineRef} className="relative">
          {/* Track + drawn line (left on phones, centred from md) */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[11px] top-0 w-px bg-[var(--color-silver)]/12 md:left-1/2 md:-translate-x-1/2"
          >
            <motion.div
              style={reduceMotion ? undefined : { scaleY: lineScale }}
              className="absolute inset-0 origin-top bg-gradient-to-b from-[var(--color-silver-light)] via-[var(--color-silver)] to-[var(--color-silver)]/40"
            />
            {!reduceMotion && (
              <motion.span
                style={{ top: headTop }}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px] leading-none text-[var(--color-silver-light)] [text-shadow:0_0_12px_rgba(214,220,228,0.6)]"
              >
                ✦
              </motion.span>
            )}
          </div>

          <ol className="space-y-24 sm:space-y-32">
            {chapters.map((c, i) => (
              <Movement key={c.id || i} chapter={c} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** One movement: framed photograph on one side of the line, its story on the other */
function Movement({ chapter, index }: { chapter: Chapter; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const flip = index % 2 === 1;
  const src = CHAPTER_IMAGES[chapter.id] || CHAPTER_IMAGES.people;

  return (
    <li
      ref={ref}
      className="relative grid grid-cols-1 gap-8 pl-10 md:grid-cols-2 md:items-center md:gap-20 md:pl-0"
    >
      {/* Node on the line */}
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-[var(--color-silver)]/70 bg-[var(--color-dark)] md:left-1/2 md:top-1/2 md:-translate-y-1/2"
      />

      {/* Photograph, in a fine double frame */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, ease: GALA_EASE }}
        className={`${flip ? "md:order-2" : ""} rounded-[4px] p-1.5 ring-1 ring-[var(--color-silver)]/25 bg-white/[0.02]`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
          <motion.div style={reduceMotion ? undefined : { y: imageY }} className="absolute -inset-[7%]">
            <Image
              src={src}
              alt={chapter.title}
              fill
              sizes="(max-width: 768px) 90vw, 520px"
              className="object-cover [filter:brightness(0.82)_contrast(1.06)_saturate(0.82)]"
            />
          </motion.div>
          {/* Same burgundy grade as every photograph on the page */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,7,13,0.15)_0%,rgba(45,7,13,0.55)_100%)] mix-blend-multiply" />
        </div>
      </motion.div>

      {/* Story */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, delay: 0.12, ease: GALA_EASE }}
        className={flip ? "md:order-1 md:text-right" : ""}
      >
        <span className="font-cinzel text-sm tracking-[0.3em] text-[var(--color-silver)]">
          {NUMERALS[index] || chapter.number}
        </span>
        <span className="mt-3 block text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]/75">
          {chapter.subtitle}
        </span>
        <h3 className="mt-3 font-cinzel text-[28px] font-light leading-tight text-[var(--color-cream)] sm:text-4xl">
          {chapter.title}
        </h3>
        <p className={`mt-5 max-w-md text-[15px] font-light leading-relaxed text-[var(--color-cream)]/78 sm:text-base ${flip ? "md:ml-auto" : ""}`}>
          {chapter.description}
        </p>
      </motion.div>
    </li>
  );
}
