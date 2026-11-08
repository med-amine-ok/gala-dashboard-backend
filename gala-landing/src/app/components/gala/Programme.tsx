"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { GALA_EASE, GalaFrame, RoomMasthead } from "./Room";

/* Web-sized photographs for each movement of the evening */
export const CHAPTER_IMAGES: Record<string, string> = {
  people: "/images/programme/people.jpg",
  companies: "/images/programme/companies.jpg",
  conversations: "/images/programme/conversations.jpg",
  experience: "/images/programme/experience.jpg",
};
export const NUMERALS = ["I", "II", "III", "IV"];

export interface Chapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
}

/**
 * IV · THE PROGRAMME — "The Four Doors"
 * The evening's four movements stand side by side like tall doors, each a
 * photograph. The open one fills the room with its numeral, title and story;
 * the others narrow to slim darkened strips, a silver numeral and a vertical
 * title. The room holds while you scroll, opening the acts one by one; once
 * you have seen them all, hovering or clicking opens any of them.
 * Phones: the same doors laid on their side, as stacked bands.
 * Reduced motion: an editorial index of the four movements.
 */
export default function ExperiencePillars() {
  const { texts } = useLanguage();
  const y = texts.thisYear || {};
  const chapters: Chapter[] = y.chapters || [];
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <MovementIndex />;
  return (
    <section className="relative w-full bg-transparent pt-28 text-[var(--color-cream)] sm:pt-36 font-sans">
      <div className="px-6 sm:px-12">
        <RoomMasthead
          numeral="IV"
          label={y.roomLabel || "THE PROGRAMME"}
          headline={y.headline || "This is GALA 2026."}
          intro={y.intro}
        />
      </div>
      <ActsPanels chapters={chapters} />
    </section>
  );
}

/** Reduced motion: the editorial index of the four movements */
export function MovementIndex() {
  const { texts } = useLanguage();
  const y = texts.thisYear || {};
  const chapters: Chapter[] = y.chapters || [];
  const reduceMotion = useReducedMotion();

  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  useEffect(() => {
    setFinePointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // Scroll focus: the row nearest the centre of the screen is the active one
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 60%", "end 40%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (hovering) return;
    setActive(Math.min(chapters.length - 1, Math.max(0, Math.floor(v * chapters.length))));
  });

  // Floating photograph that follows the cursor with a little lag (the WebGL
  // layer tilts it toward the cursor)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const fx = useSpring(mx, { stiffness: 140, damping: 22, mass: 0.6 });
  const fy = useSpring(my, { stiffness: 140, damping: 22, mass: 0.6 });

  const showFloat = finePointer && !reduceMotion;

  return (
    <section className="relative w-full overflow-hidden bg-transparent px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <RoomMasthead
        numeral="IV"
        label={y.roomLabel || "THE PROGRAMME"}
        headline={y.headline || "This is GALA 2026."}
        intro={y.intro}
      />

      <div className="relative mx-auto mt-20 max-w-6xl sm:mt-28">
        <ol
          ref={listRef}
          className="relative border-t border-[var(--color-silver)]/15"
          onPointerMove={(e) => {
            if (!showFloat) return;
            const r = e.currentTarget.getBoundingClientRect();
            mx.set(e.clientX - r.left);
            my.set(e.clientY - r.top);
          }}
          onPointerLeave={() => setHovering(false)}
        >
          {chapters.map((c, i) => (
            <Movement
              key={c.id || i}
              chapter={c}
              index={i}
              active={active === i}
              inline={!showFloat}
              onEnter={() => {
                if (!showFloat) return;
                setHovering(true);
                setActive(i);
              }}
            />
          ))}

          {/* The photograph of the active movement, floating beside the cursor */}
          {showFloat && (
            <motion.div
              aria-hidden="true"
              style={{ x: fx, y: fy }}
              className="pointer-events-none absolute left-0 top-0 z-20 hidden w-[300px] lg:block xl:w-[340px]"
            >
              <div className="-translate-y-1/2 translate-x-12">
              <AnimatePresence mode="popLayout">
                {hovering && (
                  <motion.div
                    key={chapters[active]?.id}
                    initial={{ opacity: 0, scale: 0.85, clipPath: "inset(30% 30% 30% 30%)" }}
                    animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.6, ease: GALA_EASE }}
                  >
                    <GalaFrame>
                      <div data-gala-media className="relative aspect-[4/5]">
                        <Image
                          src={CHAPTER_IMAGES[chapters[active]?.id] || CHAPTER_IMAGES.people}
                          alt=""
                          fill
                          sizes="340px"
                          className="object-cover [filter:brightness(0.86)_contrast(1.06)_saturate(0.82)]"
                        />
                      </div>
                    </GalaFrame>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          )}
        </ol>
      </div>
    </section>
  );
}

/** One movement of the evening: numeral, display title, its line and story */
function Movement({
  chapter,
  index,
  active,
  inline,
  onEnter,
}: {
  chapter: Chapter;
  index: number;
  active: boolean;
  inline: boolean;
  onEnter: () => void;
}) {
  const src = CHAPTER_IMAGES[chapter.id] || CHAPTER_IMAGES.people;
  return (
    <motion.li
      onPointerEnter={onEnter}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1, delay: index * 0.06, ease: GALA_EASE }}
      className="group relative border-b border-[var(--color-silver)]/15 py-9 sm:py-12"
    >
      {/* A silver line sweeps along the active row */}
      <motion.span
        aria-hidden="true"
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.9, ease: GALA_EASE }}
        className="absolute -bottom-px left-0 h-px w-full origin-left bg-gradient-to-r from-[var(--color-silver-light)] via-[var(--color-silver)]/60 to-transparent"
      />
      <div className="grid grid-cols-12 items-baseline gap-x-4 gap-y-4 md:gap-x-8">
        <span
          className={`col-span-2 font-cinzel text-[22px] font-semibold transition-opacity duration-700 sm:text-[28px] md:col-span-1 ${active ? "opacity-100" : "opacity-40"} gala-engraved`}
        >
          {NUMERALS[index] || chapter.number}
        </span>
        <h3
          className={`col-span-10 font-cinzel text-[clamp(28px,4.6vw,74px)] font-normal leading-[1] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:col-span-7 ${active ? "translate-x-0 opacity-100" : "opacity-35 md:-translate-x-1"}`}
        >
          <span className={active ? "gala-engraved" : "text-[var(--color-cream)]"}>{chapter.title}</span>
        </h3>
        <div
          className={`col-span-10 col-start-3 transition-opacity duration-700 md:col-span-4 md:col-start-9 ${active ? "opacity-100" : "opacity-45"}`}
        >
          <span className="font-cormorant text-[19px] italic text-[var(--color-silver-light)] sm:text-[22px]">
            {chapter.subtitle}
          </span>
          <p className="mt-2 text-[14px] font-light leading-relaxed text-[var(--color-cream)]/72">{chapter.description}</p>
        </div>
      </div>
      {/* Touch screens: the photograph sits within the row */}
      {inline && (
        <GalaFrame className="ml-[16.666%] mt-6 md:ml-[8.333%] md:max-w-md">
          <div data-gala-media className="relative aspect-[16/10]">
            <Image
              src={src}
              alt={chapter.title}
              fill
              sizes="(max-width: 768px) 80vw, 448px"
              className="object-cover [filter:brightness(0.86)_contrast(1.06)_saturate(0.82)]"
            />
          </div>
        </GalaFrame>
      )}
    </motion.li>
  );
}

/* ───────────────────────────── The four doors ───────────────────────────── */

export const DOOR_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function ActsPanels({ chapters }: { chapters: Chapter[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = Math.max(1, chapters.length);
  const [scrollActive, setScrollActive] = useState(0);
  const [free, setFree] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setScrollActive(Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999))));
    // Once every act has been opened, the doors answer to the hand
    const done = v > 0.97;
    setFree(done);
    if (!done) setChosen(null);
  });
  const active = free && chosen !== null ? chosen : scrollActive;

  // Before the end, a click takes you to that act along the scroll
  const goTo = (i: number) => {
    if (free) return setChosen(i);
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (travel * (i + 0.5)) / n, behavior: "smooth" });
  };

  return (
    <div ref={ref} className="relative mt-10" style={{ height: `${n * 85 + 15}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] flex-col px-4 pb-6 pt-20 sm:px-8 lg:px-12 lg:pb-10 lg:pt-24">
        <div
          className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-2 lg:flex-row lg:gap-3"
          onMouseLeave={() => free && setChosen(null)}
        >
          {chapters.map((c, i) => (
            <Door
              key={c.id || i}
              chapter={c}
              index={i}
              open={i === active}
              onOpen={() => goTo(i)}
              onHover={() => free && setChosen(i)}
            />
          ))}
        </div>

        {/* Where you are */}
        <div className="mx-auto mt-4 flex w-full max-w-7xl items-center gap-4 lg:mt-6">
          <span className="font-cinzel text-[11px] tracking-[0.3em] text-[var(--color-silver)]">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
          <span className="relative h-px flex-1 bg-[var(--color-silver)]/15">
            <span
              className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--color-silver),var(--color-silver-light))]"
              style={{ width: `${((active + 1) / n) * 100}%`, transition: `width 900ms ${DOOR_EASE}` }}
            />
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-[var(--color-cream)]/45 sm:block">
            {free ? "Hover to open" : "Scroll"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Door({
  chapter,
  index,
  open,
  onOpen,
  onHover,
}: {
  chapter: Chapter;
  index: number;
  open: boolean;
  onOpen: () => void;
  onHover: () => void;
}) {
  const src = CHAPTER_IMAGES[chapter.id] || CHAPTER_IMAGES.people;
  const numeral = NUMERALS[index] || chapter.number;
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onHover}
      aria-expanded={open}
      aria-label={`${numeral}. ${chapter.title}`}
      className={`group relative min-h-0 min-w-0 overflow-hidden rounded-[4px] text-left luxury-focus-ring ${
        open ? "shadow-[0_40px_80px_-40px_rgba(6,0,4,1)]" : ""
      }`}
      style={{ flex: `${open ? 7 : 1} 1 0%`, transition: `flex-grow 1100ms ${DOOR_EASE}` }}
    >
      {/* The photograph, settling from a slight zoom as its door opens */}
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${open ? 1 : 1.12})`, transition: `transform 1600ms ${DOOR_EASE}` }}
      >
        <Image src={src} alt="" fill sizes="(max-width: 1024px) 100vw, 75vw" className="object-cover" />
      </div>

      {/* Closed: deep plum over the photograph. Open: only a shade at the foot for the words */}
      <div
        className="absolute inset-0 bg-[#1d0210]"
        style={{ opacity: open ? 0 : 0.72, transition: `opacity 900ms ${DOOR_EASE}` }}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(24,2,14,0.55)_65%,rgba(20,2,12,0.92)_100%)]"
        style={{ opacity: open ? 1 : 0, transition: `opacity 900ms ${DOOR_EASE}` }}
      />
      {/* Silver edge, brighter on the open door */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-inset transition-colors duration-700 ${
          open ? "ring-[var(--color-silver-light)]/45" : "ring-[var(--color-silver)]/20 group-hover:ring-[var(--color-silver)]/45"
        }`}
      />

      {/* Closed strip: numeral and a vertical title (horizontal on phones) */}
      <div
        className="absolute inset-0 flex items-center justify-between px-5 lg:flex-col lg:items-center lg:justify-between lg:px-0 lg:py-7"
        style={{ opacity: open ? 0 : 1, transition: `opacity ${open ? 300 : 700}ms ease ${open ? 0 : 400}ms` }}
        aria-hidden={open}
      >
        <span className="font-cinzel text-[22px] font-semibold leading-none gala-engraved lg:text-[26px]">{numeral}</span>
        <span className="truncate font-cinzel text-[12px] uppercase tracking-[0.32em] text-[var(--color-silver-light)]/85 lg:[writing-mode:vertical-rl] lg:rotate-180">
          {chapter.title}
        </span>
      </div>

      {/* Open door: the act */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="act"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.45, ease: GALA_EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10"
          >
            <div className="flex items-end gap-5 lg:gap-7">
              <span className="font-cinzel text-[clamp(48px,7vw,112px)] font-semibold leading-[0.8] gala-engraved">{numeral}</span>
              <div className="min-w-0 pb-1">
                <span className="block font-cormorant text-[clamp(16px,1.6vw,22px)] italic text-[var(--color-silver-light)]">
                  {chapter.subtitle}
                </span>
                <h3 className="mt-1 font-cinzel text-[clamp(22px,2.8vw,44px)] font-normal leading-[1.05] text-[var(--color-cream)]">
                  {chapter.title}
                </h3>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 max-w-xl text-[13.5px] font-light leading-relaxed text-[var(--color-cream)]/80 sm:mt-4 sm:text-[14.5px] lg:line-clamp-none">
              {chapter.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
