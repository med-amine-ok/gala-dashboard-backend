"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CountUp, GALA_EASE } from "../components/gala/Room";

/**
 * VI · THE HOSTS — an editorial statement (after Still/Form's quiet spreads)
 * The club's belief set as one large line whose words light up one by one as
 * you read down the page; then the club's mark beside its story, the club's
 * figures as large engraved numbers between hairlines, and its three
 * principles as numbered lines. Few elements, a lot of air.
 */
export default function AboutUsSection() {
  const { texts } = useLanguage();
  const s = texts.story || {};
  const stats: { value: string; label: string }[] = s.stats || [];
  const pillars: { title: string; desc: string }[] = s.pillars || [];

  return (
    <section className="relative w-full overflow-x-clip bg-transparent px-6 pb-28 pt-28 text-[var(--color-cream)] sm:px-12 sm:pb-36 sm:pt-40 font-sans">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* The room */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, ease: GALA_EASE }}
          className="flex items-center gap-4"
        >
          <span className="font-cinzel text-[12px] font-semibold tracking-[0.3em] gala-engraved">VI</span>
          <span className="h-px w-12 bg-[var(--color-silver)]/50" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">{s.roomLabel || "THE HOSTS"}</span>
        </motion.div>

        {/* The belief, lit word by word */}
        {s.lead && <LitStatement text={s.lead} />}

        <div className="mt-20 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(214,219,226,0.28),transparent)] sm:mt-28" />

        {/* The club and its story */}
        <div className="mt-16 grid grid-cols-1 items-center gap-14 sm:mt-20 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.3, ease: GALA_EASE }}
            className="flex justify-center lg:col-span-5 lg:justify-start"
          >
            <ClubCrest />
          </motion.div>
          <div className="lg:col-span-7">
            <h2 className="font-cormorant text-[clamp(28px,3.2vw,44px)] italic leading-tight text-[var(--color-cream)]">
              {(s.headline || "The story behind the night.").replace(/\n/g, " ")}
            </h2>
            <div className="mt-6 space-y-5">
              {[s.paragraph1, s.paragraph2].filter(Boolean).map((p: string, i: number) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.12, ease: GALA_EASE }}
                  className="max-w-xl text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72"
                >
                  {p}
                </motion.p>
              ))}
            </div>
          </div>
        </div>

        {/* The figures */}
        {stats.length > 0 && (
          <dl className="mt-24 grid grid-cols-1 border-y border-[var(--color-silver)]/14 sm:mt-28 sm:grid-cols-3">
            {stats.map((st, i) => (
              <motion.div
                key={st.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.1, delay: i * 0.1, ease: GALA_EASE }}
                className={`flex items-baseline justify-between gap-6 py-7 sm:flex-col sm:items-start sm:justify-start sm:px-8 sm:py-12 ${
                  i > 0 ? "border-t border-[var(--color-silver)]/10 sm:border-l sm:border-t-0" : "sm:pl-0"
                }`}
              >
                <dd className="order-2 font-cinzel text-[clamp(44px,6.5vw,104px)] font-semibold leading-none gala-engraved sm:order-1">
                  <CountUp value={st.value} />
                </dd>
                <dt className="order-1 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--color-cream)]/60 sm:order-2 sm:mt-4">{st.label}</dt>
              </motion.div>
            ))}
          </dl>
        )}

        
       
      </div>
    </section>
  );
}

/** One large line whose words come into the light as you read down the page */
function LitStatement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 50%"] });
  const lines = text.split("\n");
  const total = Math.max(1, text.split(/\s+/).filter(Boolean).length);
  let n = 0;
  return (
    <p ref={ref} className="mt-10 max-w-5xl font-cormorant text-[clamp(34px,5.4vw,82px)] font-medium leading-[1.06] text-[var(--color-cream)] sm:mt-14">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line
            .split(/\s+/)
            .filter(Boolean)
            .map((w, wi) => {
              const i = n++;
              return reduce ? (
                <span key={wi}>{w} </span>
              ) : (
                <Word key={wi} word={w} progress={scrollYProgress} from={i / total} to={(i + 1) / total} />
              );
            })}
        </span>
      ))}
    </p>
  );
}

function Word({ word, progress, from, to }: { word: string; progress: MotionValue<number>; from: number; to: number }) {
  const opacity = useTransform(progress, [from, to], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block pr-[0.26em]">
      {word}
    </motion.span>
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
      <div className="relative aspect-[900/365] w-full [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.18))_drop-shadow(0_18px_30px_rgba(5,1,4,0.7))]">
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
