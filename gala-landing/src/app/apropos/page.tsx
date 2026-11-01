"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CountUp, DrawnRule, GALA_EASE, RoomMasthead } from "../components/gala/Room";

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
    <section className="relative w-full overflow-hidden bg-transparent px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <div className="relative z-10 mx-auto max-w-6xl">
        <RoomMasthead numeral="VI" label={s.roomLabel || "THE HOSTS"} headline={s.headline || "The story behind the night."} />

        {/* The belief, set large, beside the club's seal */}
        <div className="mt-20 grid grid-cols-1 items-center gap-16 sm:mt-28 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {s.lead && (
              <motion.blockquote
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, ease: GALA_EASE }}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-2 -top-14 font-cormorant text-[140px] leading-none gala-engraved opacity-60 sm:-left-8 sm:-top-20 sm:text-[200px]"
                >
                  “
                </span>
                <p className="relative whitespace-pre-line font-cormorant text-[clamp(28px,3.6vw,52px)] italic leading-[1.12] text-[var(--color-cream)]">
                  {s.lead}
                </p>
              </motion.blockquote>
            )}
            <DrawnRule className="mt-10 max-w-sm" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {[s.paragraph1, s.paragraph2].filter(Boolean).map((p: string, i: number) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: GALA_EASE }}
                  className="text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/72"
                >
                  {p}
                </motion.p>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.4, ease: GALA_EASE }}
            className="flex justify-center lg:col-span-5"
          >
            <ClubCrest />
          </motion.div>
        </div>

        {/* The figures, at display size across the room */}
        {stats.length > 0 && (
          <dl className="mt-24 grid grid-cols-3 border-y border-[var(--color-silver)]/15 sm:mt-32">
            {stats.map((st, i) => (
              <motion.div
                key={st.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.1, delay: i * 0.1, ease: GALA_EASE }}
                className={`flex flex-col items-center gap-3 px-1 py-8 text-center sm:py-12 ${i > 0 ? "border-l border-[var(--color-silver)]/12" : ""}`}
              >
                <dd className="font-cinzel text-[clamp(34px,8.5vw,128px)] font-semibold leading-none gala-engraved">
                  <CountUp value={st.value} />
                </dd>
                <dt className="text-[8.5px] font-semibold uppercase leading-snug tracking-[0.18em] text-[var(--color-cream)]/60 sm:text-[11px] sm:tracking-[0.3em]">
                  {st.label}
                </dt>
              </motion.div>
            ))}
          </dl>
        )}

        {/* The three principles */}
        {pillars.length > 0 && (
          <ol className="mt-20 grid grid-cols-1 gap-14 sm:mt-24 md:grid-cols-3 md:gap-10">
            {pillars.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.12, ease: GALA_EASE }}
                className="relative"
              >
                <span className="block font-cinzel text-[56px] font-semibold leading-none gala-engraved opacity-90">
                  {["I", "II", "III"][i]}
                </span>
                <DrawnRule className="mt-5" />
                <h3 className="mt-5 font-cormorant text-[28px] italic leading-tight text-[var(--color-cream)]">{p.title}</h3>
                <p className="mt-3 text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{p.desc}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/**
 * The club's mark, and nothing else: the Vision & Innovation Club lockup in
 * brushed silver foil, one hairline and one engraved line beneath. A band of
 * light passes across the foil as the visitor scrolls by.
 */
function ClubCrest() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sheen = useTransform(scrollYProgress, [0.15, 0.85], ["130%", "-30%"]);
  const MASK =
    "[mask-image:url(/images/vic-lockup.png)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-image:url(/images/vic-lockup.png)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]";

  return (
    <div ref={ref} className="flex w-[min(78vw,400px)] flex-col items-center">
      <div className="relative aspect-[900/365] w-full [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.18))_drop-shadow(0_18px_30px_rgba(5,1,2,0.7))]">
        <div role="img" aria-label="Vision & Innovation Club" className={`absolute inset-0 gala-brushed ${MASK}`} />
        {/* Light passing over the foil */}
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? undefined : { backgroundPositionX: sheen }}
          className={`absolute inset-0 bg-[linear-gradient(100deg,transparent_40%,rgba(255,255,255,0.75)_50%,transparent_60%)] bg-[length:250%_100%] mix-blend-soft-light ${MASK}`}
        />
      </div>
      <span aria-hidden="true" className="mt-10 block h-px w-16 bg-gradient-to-r from-transparent via-[var(--color-silver)]/70 to-transparent" />
      <span className="mt-5 whitespace-nowrap text-center font-cinzel text-[8.5px] font-semibold tracking-[0.3em] text-[var(--color-silver)] sm:text-[10px] sm:tracking-[0.34em]">
        ÉCOLE NATIONALE POLYTECHNIQUE · 2014
      </span>
    </div>
  );
}
