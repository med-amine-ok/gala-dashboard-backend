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
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { GALA_EASE, GalaFrame, RoomMasthead } from "../components/gala/Room";

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
 * An editorial index of the evening's four movements. Titles are set at
 * display size; the movement at the centre of the screen lights up while the
 * others recede, and on desktop its photograph floats beside the cursor.
 */
export default function ExperiencePillars() {
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

  // Floating photograph that follows the cursor with a little lag and lean
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const fx = useSpring(mx, { stiffness: 140, damping: 22, mass: 0.6 });
  const fy = useSpring(my, { stiffness: 140, damping: 22, mass: 0.6 });
  const lean = useTransform(fx, (v) => {
    const w = listRef.current?.clientWidth || 1;
    return ((v / w) - 0.5) * 10;
  });

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
              style={{ x: fx, y: fy, rotate: lean }}
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
                      <div className="relative aspect-[4/5]">
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
          <div className="relative aspect-[16/10]">
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
