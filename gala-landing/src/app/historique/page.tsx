"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { CHAPTER_IMAGES, MovementIndex, NUMERALS, type Chapter } from "../experience/page";
import { useLanguage } from "../../context/LanguageContext";
import { CountUp, DrawnRule, GALA_EASE, GalaButton, GalaFrame, GalaStar, RoomMasthead } from "../components/gala/Room";

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
 * III · THE CHAPTERS — a horizontal film
 * The past editions and this year's programme as one strip of film that your
 * scrolling draws sideways across the room: a title frame, then each edition
 * (its year engraved large over its photograph, its name, story and figures),
 * then Chapter V, 2026, and this year's four acts, and a last frame inviting
 * you to join. Each photograph drifts a little inside its frame as it passes
 * (parallax); a rail beneath marks the chapters and takes you to any of them.
 * Reduced motion: the editions as an editorial column, then the four acts.
 */
export default function ArchivesSection() {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const chapters: Chapter[] = texts.thisYear?.chapters || [];
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
    <section className="relative w-full bg-transparent pt-16 text-[var(--color-cream)] sm:pt-24">
      {reduceMotion && (
        <div className="px-6 sm:px-12">
        <RoomMasthead
          numeral="III"
          label="THE CHAPTERS"
          headline={a.headline || "Every edition leaves a story."}
          intro={a.subheadline}
        />
        </div>

      )}
      {reduceMotion ? (
        <>
          <EditionColumn editions={editions} />
          <div className="mt-24">
            <MovementIndex />
          </div>
        </>
      ) : (
        <ChaptersFilm editions={editions} chapters={chapters} />
      )}

      {reduceMotion && (
        <div className="relative flex justify-center px-6 pb-28 pt-10 sm:pb-36">
          <GalaButton href="#tarification">{a.joinCTA || "JOIN THE 2026 EDITION"}</GalaButton>
        </div>
      )}
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

/* ───────────────────────────── The film ───────────────────────────── */

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function ChaptersFilm({ editions, chapters }: { editions: Edition[]; chapters: Chapter[] }) {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const y = texts.thisYear || {};
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dist = useRef(1);
  const [height, setHeight] = useState<number | null>(null);
  // Where each chapter sits along the film (0–1 of the scroll)
  const [marks, setMarks] = useState<number[]>([]);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const view = viewRef.current;
      if (!track || !view) return;
      const vw = view.clientWidth;
      const d = Math.max(1, track.scrollWidth - vw);
      dist.current = d;
      setHeight(d + window.innerHeight);
      const ms = [...track.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) =>
        Math.min(1, Math.max(0, (el.offsetLeft + el.offsetWidth / 2 - vw / 2) / d)),
      );
      setMarks(ms);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => -v * dist.current);
  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", setP);

  const P = editions.length;
  let current = 0;
  marks.forEach((m, i) => {
    if (p >= m - 0.04) current = i;
  });
  const railLabels = [...editions.map((e) => e.year), "2026"];

  const goTo = (i: number) => {
    const el = wrapRef.current;
    if (!el || marks[i] === undefined) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + marks[i] * dist.current + 2, behavior: "smooth" });
  };

  return (
    <div ref={wrapRef} className="relative" style={{ height: height ? `${height}px` : "600vh" }}>
      {/* Menu links to the programme land on Chapter V */}
      <div
        id="piliers"
        aria-hidden
        className="pointer-events-none absolute left-0"
        style={{ top: marks[P] !== undefined ? `${marks[P] * dist.current}px` : "70%" }}
      />

      <div ref={viewRef} className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden pb-5 pt-[78px] lg:pb-7 lg:pt-24">
        {/* Film edge: a fine perforation of silver along the top */}
        <div aria-hidden className="mx-5 h-[6px] bg-[radial-gradient(circle,rgba(214,219,226,0.22)_1.4px,transparent_1.6px)] bg-[length:14px_6px] sm:mx-10" />

        <div className="relative flex min-h-0 flex-1 items-center">
          <motion.div ref={trackRef} style={{ x }} className="flex h-full items-center gap-[9vw] pl-6 pr-[12vw] will-change-transform sm:pl-12 lg:gap-[7vw] lg:pl-20">
            {/* The title frame */}
            <div className="w-[min(78vw,440px)] shrink-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">
                III · {a.label || "THE ARCHIVES"}
              </span>
              <h2 className="mt-4 whitespace-pre-line font-cormorant text-[clamp(40px,5.2vw,76px)] font-medium leading-[0.98] text-[var(--color-cream)]">
                {a.headline || "Every edition\nleaves a story."}
              </h2>
              {a.subheadline && <p className="mt-5 max-w-sm text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{a.subheadline}</p>}
              <p className="mt-8 flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver-light)]/80">
                <span className="h-px w-10 bg-[var(--color-silver)]/60" /> Scroll
              </p>
            </div>

            {/* The editions */}
            {editions.map((e, i) => (
              <article key={e.year} data-chapter className="shrink-0">
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-[0.62em] left-[-0.04em] z-10 font-cinzel text-[clamp(64px,15vh,150px)] font-semibold leading-none gala-engraved"
                  >
                    {e.year}
                  </span>
                  <FilmPhoto src={e.image} alt={e.title} progress={scrollYProgress} center={marks[i] ?? 0} dist={dist} className="aspect-[3/2] w-[min(82vw,calc(44dvh*1.5))]" />
                </div>
                <div className="mt-4 w-[min(82vw,calc(44dvh*1.5))]">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-silver)]">
                    Chapter {ROMAN[i]} · {e.year}
                  </span>
                  <h3 className="mt-1 font-cormorant text-[clamp(22px,2.2vw,32px)] italic leading-tight text-[var(--color-cream)]">{e.title}</h3>
                  <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-8">
                    <p className="line-clamp-2 flex-1 text-[13.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{e.story}</p>
                    {e.stats.length > 0 && (
                      <dl className="hidden shrink-0 gap-5 sm:flex">
                        {e.stats.slice(0, 2).map((st) => (
                          <div key={st.label}>
                            <dd className="font-cinzel text-[22px] font-semibold leading-none gala-engraved">
                              <CountUp value={st.value} />
                            </dd>
                            <dt className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]/50">{st.label}</dt>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {/* Chapter V: this year */}
            <div data-chapter className="w-[min(80vw,460px)] shrink-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">
                Chapter {ROMAN[P]} · 2026 · {y.label || "This year"}
              </span>
              <h2 className="mt-4 whitespace-pre-line font-cormorant text-[clamp(40px,5vw,72px)] font-medium leading-[0.98] text-[var(--color-cream)]">
                {y.headline || "This is\nGALA 2026."}
              </h2>
              {y.intro && <p className="mt-5 max-w-sm text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{y.intro}</p>}
              <DrawnRule className="mt-8 max-w-[220px]" />
            </div>

            {/* This year's four acts */}
            {chapters.map((c, i) => (
              <article key={c.id || i} className="shrink-0">
                <div className="relative">
                  <FilmPhoto
                    src={CHAPTER_IMAGES[c.id] || CHAPTER_IMAGES.people}
                    alt={c.title}
                    progress={scrollYProgress}
                    center={marks[P] ?? 0.7}
                    dist={dist}
                    className="aspect-[4/3] w-[min(78vw,calc(42dvh*4/3))]"
                  />
                  <span className="pointer-events-none absolute bottom-3 left-4 z-10 font-cinzel text-[clamp(48px,9vh,92px)] font-semibold leading-none gala-engraved drop-shadow-[0_6px_18px_rgba(10,1,6,0.7)]">
                    {NUMERALS[i]}
                  </span>
                </div>
                <div className="mt-4 w-[min(78vw,calc(42dvh*4/3))]">
                  <span className="font-cormorant text-[16px] italic text-[var(--color-silver-light)]">{c.subtitle}</span>
                  <h3 className="mt-0.5 font-cinzel text-[clamp(20px,2vw,28px)] font-normal leading-tight text-[var(--color-cream)]">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-[13.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{c.description}</p>
                </div>
              </article>
            ))}

            {/* The last frame */}
            <div className="w-[min(78vw,400px)] shrink-0">
              <GalaStar className="w-10 text-[var(--color-silver-light)]" />
              <p className="mt-6 font-cormorant text-[clamp(30px,3.4vw,48px)] italic leading-tight text-[var(--color-cream)]">
                The next chapter is yours.
              </p>
              <div className="mt-8">
                <GalaButton href="#tarification">{a.joinCTA || "JOIN THE 2026 EDITION"}</GalaButton>
              </div>
            </div>
          </motion.div>
        </div>

        {/* The chapter rail */}
        <nav aria-label="Chapters" className="mx-5 mt-4 sm:mx-10 lg:mt-6">
          <div className="relative h-8">
            <div className="absolute left-0 right-0 top-[5px] h-px bg-[var(--color-silver)]/15" />
            <div
              className="absolute left-0 top-[5px] h-px bg-[linear-gradient(90deg,var(--color-silver),var(--color-silver-light))]"
              style={{ width: `${Math.min(100, p * 100)}%` }}
            />
            {railLabels.map((label, i) => {
              const at = marks[i];
              if (at === undefined) return null;
              const reached = i <= current && p >= at - 0.04;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Chapter ${ROMAN[i]}, ${label}`}
                  aria-current={i === current ? "step" : undefined}
                  className="group absolute top-0 flex -translate-x-1/2 flex-col items-center gap-2 luxury-focus-ring"
                  style={{ left: `${Math.min(97, Math.max(3, at * 100))}%` }}
                >
                  <span
                    className={`block h-[11px] w-[11px] rotate-45 border transition-colors duration-700 ${
                      reached ? "border-[var(--color-silver-light)] bg-[var(--color-silver-light)]" : "border-[var(--color-silver)]/40 bg-[#1d0210] group-hover:border-[var(--color-silver-light)]"
                    }`}
                  />
                  <span className={`whitespace-nowrap font-cinzel text-[10.5px] tracking-[0.2em] transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-45 group-hover:opacity-80"}`}>
                    <span className="text-[var(--color-silver-light)]">{ROMAN[i]}</span>
                    <span className="ml-1.5 hidden sm:inline">{label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

/** A photograph in the film: it drifts a little inside its frame as it passes */
function FilmPhoto({
  src,
  alt,
  progress,
  center,
  dist,
  className = "",
}: {
  src: string;
  alt: string;
  progress: MotionValue<number>;
  center: number;
  dist: { current: number };
  className?: string;
}) {
  const shift = useTransform(progress, (v) => (v - center) * dist.current * 0.08);
  return (
    <div className={`relative overflow-hidden rounded-[4px] shadow-[0_40px_80px_-40px_rgba(6,0,4,1)] ${className}`}>
      <motion.div style={{ x: shift }} className="absolute -inset-x-[12%] inset-y-0">
        <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 85vw, 720px" className="object-cover" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-inset ring-[var(--color-silver-light)]/30" />
    </div>
  );
}
