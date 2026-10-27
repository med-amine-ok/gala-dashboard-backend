"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import {
  CountUp,
  GALA_EASE,
  RevealHeading,
  RoomOrnament,
  RoomSpotlight,
} from "../components/gala/Room";

/**
 * VI · THE HOSTS
 * The Vision & Innovation Club, presented like a house crest: their story on one
 * side, the club's seal on the other, then the figures and the three principles.
 */
export default function AboutUsSection() {
  const { texts } = useLanguage();
  const s = texts.story || {};
  const stats: { value: string; label: string }[] = s.stats || [];
  const pillars: { title: string; desc: string }[] = s.pillars || [];

  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-dark)] px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <RoomSpotlight x="72%" y="38%" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <RoomOrnament numeral="VI" label={s.roomLabel || "THE HOSTS"} className="mb-16 sm:mb-24" />

        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-20">
          {/* Story */}
          <div className="lg:col-span-7">
            <RevealHeading
              text={s.headline || "The story\nbehind the night."}
              className="font-cinzel text-[34px] font-light leading-[1.08] sm:text-6xl"
            />
            {s.lead && (
              <motion.blockquote
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: 0.25, ease: GALA_EASE }}
                className="mt-8 border-l border-[var(--color-silver)]/40 pl-6 font-cinzel text-lg leading-relaxed text-[var(--color-cream)]/90 sm:text-xl whitespace-pre-line"
              >
                {s.lead}
              </motion.blockquote>
            )}
            {[s.paragraph1, s.paragraph2].filter(Boolean).map((p: string, i: number) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: 0.35 + i * 0.1, ease: GALA_EASE }}
                className="mt-6 max-w-xl text-[15px] font-light leading-relaxed text-[var(--color-cream)]/75 sm:text-base"
              >
                {p}
              </motion.p>
            ))}
          </div>

          {/* Crest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.4, ease: GALA_EASE }}
            className="flex justify-center lg:col-span-5"
          >
            <ClubCrest />
          </motion.div>
        </div>

        {/* Figures */}
        {stats.length > 0 && (
          <dl className="mt-20 grid grid-cols-1 divide-y divide-[var(--color-silver)]/12 border-y border-[var(--color-silver)]/12 sm:mt-28 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((st) => (
              <div key={st.label} className="flex flex-col items-center gap-2 py-8 text-center">
                <dd className="font-cinzel text-4xl font-light text-[var(--color-silver-light)] sm:text-5xl">
                  <CountUp value={st.value} />
                </dd>
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-cream)]/65">
                  {st.label}
                </dt>
              </div>
            ))}
          </dl>
        )}

        {/* Principles */}
        {pillars.length > 0 && (
          <ol className="mt-16 grid grid-cols-1 gap-12 sm:mt-20 md:grid-cols-3 md:gap-10">
            {pillars.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.1, ease: GALA_EASE }}
              >
                <span className="font-cinzel text-sm tracking-[0.3em] text-[var(--color-silver)]">
                  {["I", "II", "III"][i]}
                </span>
                <h3 className="mt-3 font-cinzel text-xl font-light text-[var(--color-cream)] sm:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72">
                  {p.desc}
                </p>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/** The club's seal: logo inside a fine double ring, engraved text turning slowly around it */
function ClubCrest() {
  const ring = "VISION & INNOVATION CLUB · ÉCOLE NATIONALE POLYTECHNIQUE · SINCE 2014 · ";
  return (
    <div className="relative aspect-square w-[min(78vw,340px)]">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full animate-[crest-turn_90s_linear_infinite] motion-reduce:animate-none"
        aria-hidden="true"
      >
        <defs>
          <path id="crest-path" d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" />
        </defs>
        <text className="fill-[var(--color-silver)]" style={{ fontSize: 8.4, letterSpacing: 2.6 }}>
          <textPath href="#crest-path">{ring}</textPath>
        </text>
      </svg>
      <div className="absolute inset-[13%] rounded-full p-1.5 ring-1 ring-[var(--color-silver)]/35">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#4a0c17_0%,#2a060c_75%)] ring-1 ring-[var(--color-silver)]/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_30px_60px_-30px_rgba(10,1,3,0.9)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vic.png"
            alt="Vision & Innovation Club"
            className="w-[76%] select-none object-contain [filter:grayscale(1)_invert(1)_brightness(0.92)]"
          />
        </div>
      </div>
    </div>
  );
}
