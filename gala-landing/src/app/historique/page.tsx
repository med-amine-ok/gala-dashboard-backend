"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CountUp, DrawnRule, GALA_EASE, GalaButton, GalaFrame, RoomMasthead } from "../components/gala/Room";

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
 * Large screens: the room holds while the visitor reads the editions one by
 * one — a giant engraved year that rolls like an odometer from 2017 to 2025,
 * the photograph wiping in beside it, the story and figures beneath.
 * Phones: the same editions as an editorial column.
 */
export default function ArchivesSection() {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const reduceMotion = useReducedMotion();
  const isDesktop = useIsDesktop();
  const sticky = isDesktop && !reduceMotion;

  const editions: Edition[] = YEARS.map((year) => {
    const e = a.editions?.[year] || {};
    return {
      year,
      // The year is shown on its own; keep only the edition's name
      title: (e.title || `GALA ${year}`).replace(/^(GALA\s+)?\d{4}\s*·\s*/, ""),
      story: e.story || "",
      stats: e.stats || [],
      image: EDITION_IMAGES[year],
    };
  });

  return (
    <section className="relative w-full bg-transparent pt-28 text-[var(--color-cream)] sm:pt-36">
      <div className="px-6 sm:px-12">
        <RoomMasthead
          numeral="III"
          label={a.roomLabel || "THE GALLERY"}
          headline={a.headline || "Every edition leaves a story."}
          intro={a.subheadline}
        />
      </div>

      {sticky ? <StickyEditions editions={editions} /> : <EditionColumn editions={editions} />}

      <div className="relative flex justify-center px-6 pb-28 pt-10 sm:pb-36">
        <GalaButton href="#tarification">{a.joinCTA || "JOIN THE 2026 EDITION"}</GalaButton>
      </div>
    </section>
  );
}

/** Desktop: one held stage, the editions turning like pages */
function StickyEditions({ editions }: { editions: Edition[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(editions.length - 1, Math.max(0, Math.floor(v * editions.length * 0.999))));
  });
  const e = editions[active];

  return (
    <div ref={ref} className="relative mt-16" style={{ height: `${editions.length * 95}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-12 items-center gap-10 px-12">
          {/* The year, engraved and rolling */}
          <div className="col-span-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">
              {String(active + 1).padStart(2, "0")} / {String(editions.length).padStart(2, "0")}
            </span>
            <Odometer value={e.year} className="mt-3 text-[clamp(88px,10.5vw,176px)]" />
            <DrawnRule className="mt-3" />
            <AnimatePresence mode="wait">
              <motion.div
                key={e.year}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.7, ease: GALA_EASE }}
              >
                <h3 className="mt-6 font-cormorant text-[clamp(26px,2.6vw,38px)] italic leading-tight text-[var(--color-cream)]">
                  {e.title}
                </h3>
                <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72">{e.story}</p>
                <Stats stats={e.stats} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The photograph, wiping in over the last */}
          <div className="col-span-7 col-start-6">
            <div className="relative ml-auto w-full max-w-[680px]">
              <GalaFrame>
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={e.year}
                      initial={{ clipPath: "inset(100% 0 0 0)", scale: 1.12 }}
                      animate={{ clipPath: "inset(0% 0 0 0)", scale: 1 }}
                      exit={{ opacity: 0.999, transition: { duration: 1.1 } }}
                      transition={{ duration: 1.1, ease: GALA_EASE }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={e.image}
                        alt={e.title}
                        fill
                        sizes="680px"
                        className="object-cover [filter:brightness(0.88)_contrast(1.06)_saturate(0.85)]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,7,13,0.05)_0%,rgba(45,7,13,0.45)_100%)] mix-blend-multiply" />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </GalaFrame>
              {/* Where you are among the editions */}
              <ol aria-hidden="true" className="absolute -right-9 top-1/2 flex -translate-y-1/2 flex-col gap-5">
                {editions.map((ed, i) => (
                  <li key={ed.year}>
                    <span
                      className={`block h-px transition-all duration-700 ${i === active ? "w-6 bg-[var(--color-silver-light)]" : "w-2.5 bg-[var(--color-silver)]/35"}`}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phones and tablets: an editorial column, each edition its own spread */
function EditionColumn({ editions }: { editions: Edition[] }) {
  return (
    <ol className="mx-auto mt-16 flex max-w-xl flex-col gap-24 px-6 sm:px-12">
      {editions.map((e, i) => (
        <motion.li
          key={e.year}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: GALA_EASE }}
        >
          <div className="flex items-end justify-between">
            <span className="font-cinzel text-[clamp(72px,22vw,120px)] font-semibold leading-[0.85] gala-engraved">{e.year}</span>
            <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]">
              {String(i + 1).padStart(2, "0")} / {String(editions.length).padStart(2, "0")}
            </span>
          </div>
          <DrawnRule className="mt-3" />
          <GalaFrame className="mt-6">
            <div className="relative aspect-[3/2] overflow-hidden">
              <Image
                src={e.image}
                alt={e.title}
                fill
                sizes="(max-width: 640px) 90vw, 560px"
                className="object-cover [filter:brightness(0.88)_contrast(1.06)_saturate(0.85)]"
              />
            </div>
          </GalaFrame>
          <h3 className="mt-6 font-cormorant text-[28px] italic leading-tight text-[var(--color-cream)]">{e.title}</h3>
          <p className="mt-3 text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72">{e.story}</p>
          <Stats stats={e.stats} />
        </motion.li>
      ))}
    </ol>
  );
}

function Stats({ stats }: { stats: Edition["stats"] }) {
  if (!stats.length) return null;
  return (
    <dl className="mt-7 grid grid-cols-3 border-t border-[var(--color-silver)]/15">
      {stats.map((s, i) => (
        <div key={s.label} className={`pt-4 ${i > 0 ? "border-l border-[var(--color-silver)]/12 pl-4" : ""}`}>
          <dd className="font-cinzel text-[26px] font-semibold leading-none gala-engraved sm:text-[32px]">
            <CountUp value={s.value} />
          </dd>
          <dt className="mt-2 text-[9px] font-semibold uppercase leading-snug tracking-[0.2em] text-[var(--color-cream)]/55 sm:text-[9.5px]">
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/** Each digit on its own engraved drum, rolling to the new year */
function Odometer({ value, className = "" }: { value: string; className?: string }) {
  return (
    <div className={`flex font-cinzel font-semibold leading-none ${className}`} role="img" aria-label={value}>
      {value.split("").map((ch, i) => (
        <Drum key={i} digit={Number(ch)} delay={i * 0.07} />
      ))}
    </div>
  );
}

function Drum({ digit, delay }: { digit: number; delay: number }) {
  return (
    <span className="relative inline-block h-[1.05em] overflow-hidden" aria-hidden="true">
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 1.05}em` }}
        transition={{ duration: 1.2, delay, ease: GALA_EASE }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1.05em] gala-engraved">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
