"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import {
  GALA_EASE,
  GalaButton,
  RevealHeading,
  RoomOrnament,
  RoomSpotlight,
  CountUp,
} from "../components/gala/Room";

const EDITION_IMAGES: Record<string, string> = {
  "2017": "/images/lowla.png",
  "2019": "/images/deuxième.png",
  "2024": "/images/troisième.png",
  "2025": "/DSCF7403.jpg",
};
/* Walked in chronological order, arriving at the most recent edition */
const YEARS = ["2017", "2019", "2024", "2025"];

interface Edition {
  year: string;
  title: string;
  story: string;
  stats: { value: string; label: string }[];
  image: string;
}

/** Large screens: the horizontal walk; smaller or short screens: a plain vertical gallery */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return desktop;
}

/**
 * III · THE GALLERY
 * The previous editions hung like portraits along a corridor. On desktop the
 * section holds while the visitor walks past them, from 2017 to 2025.
 */
export default function ArchivesSection() {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const walk = isDesktop && !reduceMotion;

  const editions: Edition[] = YEARS.map((year) => {
    const e = a.editions?.[year] || {};
    return {
      year,
      title: e.title || `GALA ${year}`,
      story: e.story || "",
      stats: e.stats || [],
      image: EDITION_IMAGES[year],
    };
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!walk) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () =>
      setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [walk]);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -distance]);

  const renderHeader = (compact: boolean) => (
    <div className="flex flex-col items-center px-6 text-center">
      <RoomOrnament numeral="III" label={a.roomLabel || "THE GALLERY"} />
      <RevealHeading
        text={
          compact
            ? (a.headline || "Every edition\nleaves a story.").replace(/\n/g, " ")
            : a.headline || "Every edition\nleaves a story."
        }
        className={`mt-6 font-cinzel font-light leading-[1.08] ${compact ? "text-4xl" : "text-[34px] sm:text-6xl"}`}
      />
      {!compact && a.subheadline && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, delay: 0.3, ease: GALA_EASE }}
          className="mt-5 max-w-xl text-base font-light leading-relaxed text-[var(--color-cream)]/75"
        >
          {a.subheadline}
        </motion.p>
      )}
    </div>
  );

  return (
    <section className="relative w-full bg-[var(--color-dark)] text-[var(--color-cream)]">
      {/* The scroll target exists in both layouts so useScroll always has a mounted ref */}
      <div
        ref={stageRef}
        className={walk ? "relative" : "relative px-6 py-28 sm:px-12"}
        style={walk ? { height: `${100 + editions.length * 75}vh` } : undefined}
      >
        {walk ? (
          <div className="sticky top-0 flex h-[100dvh] flex-col justify-start overflow-hidden">
            <RoomSpotlight y="55%" />
            <div className="relative z-10 pt-[clamp(4.5rem,11vh,7rem)]">
              {renderHeader(true)}
              {/* The corridor's map: years filling as the visitor walks */}
              <YearRail years={YEARS} progress={scrollYProgress} />
            </div>
            <motion.div
              ref={trackRef}
              style={{ x }}
              className="relative z-10 mt-[clamp(1.5rem,5vh,3rem)] flex w-max items-stretch gap-[6vw] px-[12vw] will-change-transform"
            >
              {editions.map((e) => (
                <EditionPanel key={e.year} edition={e} />
              ))}
            </motion.div>
          </div>
        ) : (
          <>
            <RoomSpotlight y="12%" />
            <div className="relative z-10">{renderHeader(false)}</div>
            <div className="relative z-10 mx-auto mt-16 flex max-w-xl flex-col gap-20">
              {editions.map((e) => (
                <EditionPanel key={e.year} edition={e} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative flex justify-center px-6 pb-28 pt-4 sm:pb-32">
        <GalaButton href="#tarification">
          {a.joinCTA || "JOIN THE 2026 EDITION"}
        </GalaButton>
      </div>
    </section>
  );
}

/** One edition: a framed photograph with an engraved plaque beside it */
function EditionPanel({ edition }: { edition: Edition }) {
  return (
    <article className="flex w-full flex-col gap-7 lg:w-[min(74vw,1060px)] lg:flex-row lg:items-center lg:gap-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: GALA_EASE }}
        className="rounded-[4px] p-1.5 ring-1 ring-[var(--color-silver)]/25 bg-white/[0.02] lg:w-[54%] lg:shrink-0"
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-[2px] lg:aspect-auto lg:h-[min(40vh,420px)]">
          <Image
            src={edition.image}
            alt={edition.title}
            fill
            sizes="(max-width: 768px) 90vw, 560px"
            className="object-cover [filter:brightness(0.85)_contrast(1.06)_saturate(0.82)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,7,13,0.1)_0%,rgba(45,7,13,0.5)_100%)] mix-blend-multiply" />
          <span className="absolute left-4 top-3 font-cinzel text-5xl font-light text-[var(--color-cream)]/90 [text-shadow:0_2px_18px_rgba(10,1,3,0.7)] sm:text-6xl">
            {edition.year}
          </span>
        </div>
      </motion.div>

      <div className="flex flex-col lg:pr-4">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]">
          {edition.year}
        </span>
        <h3 className="mt-3 font-cinzel text-2xl font-light leading-snug text-[var(--color-cream)] sm:text-[28px] lg:text-[24px]">
          {edition.title}
        </h3>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-[var(--color-cream)]/75 lg:line-clamp-4">
          {edition.story}
        </p>
        {edition.stats.length > 0 && (
          <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-[var(--color-silver)]/15 pt-5 lg:mt-5 lg:pt-4">
            {edition.stats.map((s) => (
              <div key={s.label}>
                <dd className="font-cinzel text-2xl text-[var(--color-silver-light)] sm:text-3xl">
                  <CountUp value={s.value} />
                </dd>
                <dt className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.2em] text-[var(--color-cream)]/60">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}


/** A fine line of years at the foot of the corridor, filling as the visitor walks */
function YearRail({
  years,
  progress,
}: {
  years: string[];
  progress: MotionValue<number>;
}) {
  const fill = useTransform(progress, [0.04, 0.96], [0, 1]);
  return (
    <div className="relative z-10 mx-auto mt-6 w-[min(560px,70vw)]">
      <div className="relative h-px bg-[var(--color-silver)]/15">
        <motion.div
          style={{ scaleX: fill }}
          className="absolute inset-0 origin-left bg-[var(--color-silver)]/70"
        />
      </div>
      <div className="mt-3 flex justify-between font-cinzel text-[12px] tracking-[0.2em] text-[var(--color-silver)]/70">
        {years.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  );
}
