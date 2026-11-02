"use client";

import { useRef, useState } from "react";
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

/**
 * III · THE GALLERY — "The Archive"
 * One photograph at a time, presented like a print in a gallery: a deep plum
 * mat, a hairline silver bevel, a thin brushed-silver frame and a pane of
 * glass. The room holds while you scroll; each new edition is unveiled over
 * the last, its year rolls like an odometer and its story settles beside it.
 * A row of years beneath doubles as navigation.
 * Reduced motion: the same editions as an editorial column.
 */
export default function ArchivesSection() {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const reduceMotion = useReducedMotion();

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

      {reduceMotion ? <EditionColumn editions={editions} /> : <ArchiveEditions editions={editions} />}

      <div className="relative flex justify-center px-6 pb-28 pt-10 sm:pb-36">
        <GalaButton href="#tarification">{a.joinCTA || "JOIN THE 2026 EDITION"}</GalaButton>
      </div>
    </section>
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
            <div data-gala-media className="relative aspect-[3/2] overflow-hidden">
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

/* ───────────────────────────── The Archive ───────────────────────────── */

function ArchiveEditions({ editions }: { editions: Edition[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const n = editions.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setProgress(v);
    setActive(Math.min(n - 1, Math.max(0, Math.round(v * (n - 1)))));
  });
  const e = editions[active];

  // The years beneath take you straight to an edition
  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (travel * i) / Math.max(1, n - 1) + 2, behavior: "smooth" });
  };

  return (
    <div ref={ref} className="relative mt-10" style={{ height: `${n * 100}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden px-6 pb-6 pt-20 sm:px-12 lg:pb-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-14">
          {/* The print */}
          <div className="lg:order-2 lg:col-span-7">
            {/* Sized by the screen's height as well as its width, so the whole print always shows */}
            <div className="mx-auto w-full max-w-[calc((100dvh-330px)*1.5)] min-w-[260px] lg:mr-0 lg:max-w-[calc((100dvh-250px)*1.5)]">
              <Print editions={editions} active={active} />
            </div>
          </div>

          {/* The edition */}
          <div className="lg:order-1 lg:col-span-5">
            <div className="flex items-end justify-between lg:block">
              <Odometer value={e.year} className="text-[clamp(52px,min(7.5vw,15vh),128px)]" />
              <span className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)] lg:mb-0 lg:mt-3 lg:block">
                {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </span>
            </div>
            <DrawnRule className="mt-3 lg:mt-5" />
            <AnimatePresence mode="wait">
              <motion.div
                key={e.year}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: GALA_EASE }}
              >
                <h3 className="mt-4 font-cormorant text-[clamp(24px,2.4vw,36px)] italic leading-tight text-[var(--color-cream)] lg:mt-6">
                  {e.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-[14px] font-light leading-relaxed text-[var(--color-cream)]/72 sm:text-[14.5px] lg:mt-3 lg:line-clamp-none">
                  {e.story}
                </p>
                <div className="hidden sm:block">
                  <Stats stats={e.stats} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* The years, joined by a hairline that fills as you go */}
        <nav aria-label="Editions" className="mx-auto mt-6 w-full max-w-6xl lg:mt-8">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[5px] h-px bg-[var(--color-silver)]/15" />
            <div
              className="absolute left-0 top-[5px] h-px bg-[linear-gradient(90deg,var(--color-silver),var(--color-silver-light))]"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
            <ol className="relative flex justify-between">
              {editions.map((ed, i) => (
                <li key={ed.year}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className={`group flex flex-col items-center gap-3 luxury-focus-ring ${i === 0 ? "items-start" : i === n - 1 ? "items-end" : ""}`}
                    aria-current={i === active ? "step" : undefined}
                  >
                    <span
                      className={`block h-[11px] w-[11px] rotate-45 border transition-all duration-700 ${
                        i <= active
                          ? "border-[var(--color-silver-light)] bg-[var(--color-silver-light)]"
                          : "border-[var(--color-silver)]/40 bg-[#1d0210] group-hover:border-[var(--color-silver-light)]"
                      }`}
                    />
                    <span
                      className={`font-cinzel text-[11px] tracking-[0.24em] transition-opacity duration-700 ${
                        i === active ? "opacity-100" : "opacity-40 group-hover:opacity-80"
                      }`}
                    >
                      {ed.year}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>
    </div>
  );
}

/**
 * The print: a thin brushed-silver frame, a deep mat with a bevelled window,
 * a pane of glass. Each edition is unveiled over the one before (a slow wipe,
 * the photograph settling from a slight zoom), so the frame never empties.
 */
function Print({ editions, active }: { editions: Edition[]; active: number }) {
  return (
    <figure className="relative">
      {/* A soft rose bloom on the velvet behind the frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[12%] bg-[radial-gradient(closest-side,rgba(211,55,145,0.22),transparent)] blur-2xl"
      />
      {/* Frame */}
      <div className="relative rounded-[3px] bg-[linear-gradient(135deg,#f5f7fa_0%,#a9afb9_22%,#eef0f4_46%,#868d98_70%,#dfe2e8_100%)] p-[3px] shadow-[0_50px_90px_-40px_rgba(6,0,4,1),0_18px_30px_-18px_rgba(6,0,4,0.9)] sm:p-[5px]">
        {/* Mat */}
        <div className="bg-[radial-gradient(120%_120%_at_30%_0%,#2a0619_0%,#1a0410_60%,#140309_100%)] p-[clamp(12px,2.4vw,34px)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          {/* Bevelled window: a hairline of light on the cut edge */}
          <div className="relative aspect-[3/2] overflow-hidden shadow-[0_0_0_1px_rgba(226,230,238,0.55),0_0_0_2px_rgba(10,1,6,0.6)]">
            {editions.map((ed, i) => (
              <motion.div
                key={ed.year}
                className="absolute inset-0"
                initial={false}
                animate={{ clipPath: i <= active ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)" }}
                transition={{ duration: 1.1, ease: GALA_EASE }}
                style={{ zIndex: i }}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{ scale: i === active ? 1 : 1.06 }}
                  transition={{ duration: 2.2, ease: GALA_EASE }}
                >
                  <Image
                    src={ed.image}
                    alt={ed.title}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 92vw, 680px"
                    className="object-cover"
                  />
                </motion.div>
              </motion.div>
            ))}
            {/* Glass: a faint diagonal reflection and a vignette at the edges */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(118deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_28%,transparent_42%)] shadow-[inset_0_0_60px_rgba(10,1,6,0.45)]"
            />
          </div>
        </div>
      </div>
      {/* The museum label */}
      <figcaption className="mt-3 flex items-baseline justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]/80">
        <span>GALA · {editions[active].year}</span>
        <span className="truncate font-cormorant text-[15px] normal-case italic tracking-normal text-[var(--color-cream)]/70">
          {editions[active].title}
        </span>
      </figcaption>
    </figure>
  );
}
