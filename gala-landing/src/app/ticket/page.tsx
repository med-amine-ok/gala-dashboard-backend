"use client";

import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { DrawnRule, GALA_EASE, GalaButton, GalaStar, RoomMasthead } from "../components/gala/Room";
import Stage3D, { type StageContext } from "../components/gala/Stage3D";

/*
 * Stage geometry (percent of the stage box, which keeps a 10:7.2 aspect).
 * The envelope fills the lower 64%; its folded side flaps open in a V whose
 * point sits 44% down the envelope. The ticket rests with its lower corners
 * tucked behind the side flaps, its centre clear above the V. The open flap
 * (half the envelope's height) stands behind the ticket, its lining showing.
 */
const ENV_TOP = "36%";
const FLAP_H = "32%";
const SEAL_TOP = "68%";
const TICKET_REST = "16%";
const TICKET_INSIDE = "39%";

/**
 * V · THE INVITATION
 * Editorial split: the invitation text on one side, the letter on the other —
 * a real envelope in 3D, in the spirit of the Hogwarts letter: heavy, aged
 * ivory parchment, hand-addressed in plum ink, a deckled pointed flap and a
 * poured plum wax seal pressed with the club's mark (its relief dusted with
 * silver), a silver-starred liner inside. The section holds while you scroll:
 * the letter turns over on the table, the seal breaks, the flap opens and the
 * pass slides out and lifts toward you; then the page moves on. The pass
 * follows the cursor and turns over when tapped.
 * Reduced motion / no WebGL: the drawn envelope.
 */
export default function TicketPricing() {
  const { texts } = useLanguage();
  const t = texts.invitations || {};
  const reduceMotion = useReducedMotion();
  const hint = t.flipHint || "Tap the ticket to turn it over";

  return (
    <section className="relative w-full overflow-x-clip bg-transparent pt-24 text-[var(--color-cream)] sm:pt-36 font-sans">
      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-12 xl:px-0">
        <RoomMasthead
          numeral="V"
          label={t.roomLabel || "THE INVITATION"}
          headline={t.headline || "Your entrance to the evening."}
        />
      </div>

      {reduceMotion ? (
        <div className="relative z-10 mx-auto mt-16 grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-24 sm:mt-24 sm:px-12 sm:pb-36 lg:grid-cols-12 lg:gap-x-14 xl:px-0">
          <div className="lg:order-2 lg:col-span-7">
            <EnvelopeStage hint={hint} />
          </div>
          <div className="lg:order-1 lg:col-span-5">
            <InvitationTerms t={t} />
          </div>
        </div>
      ) : (
        <PinnedInvitation t={t} hint={hint} />
      )}
    </section>
  );
}

/**
 * The room holds while the letter is opened: arriving, you see its addressed
 * front; once the section fills the screen it turns over, the seal breaks,
 * the flap opens and the pass comes out — all on your scroll — and only then
 * does the page move on.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PinnedInvitation({ t, hint }: { t: any; hint: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [settled, setSettled] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
    setSettled(v > 0.9);
  });

  return (
    <>
      <div ref={ref} className="relative mt-6" style={{ height: "340vh" }}>
        <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden px-6 pt-16 sm:px-12">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-x-14">
            <div className="lg:order-2 lg:col-span-7">
              {/* Sized by the screen's height too, so the whole letter always shows */}
              <div className="mx-auto w-full max-w-[calc((100dvh-150px)*1.19)]">
                <EnvelopeScene hint={hint} venue={t.venue} progress={progress} settled={settled} />
              </div>
            </div>
            <div className="hidden lg:order-1 lg:col-span-5 lg:block">
              <InvitationTerms t={t} compact />
            </div>
          </div>
        </div>
      </div>
      {/* Phones: the terms follow the letter */}
      <div className="relative z-10 mx-auto max-w-xl px-6 pb-24 pt-6 sm:px-12 lg:hidden">
        <InvitationTerms t={t} />
      </div>
      <div className="hidden pb-28 lg:block" />
    </>
  );
}

/** The terms of the invitation: the pass, its price, when and where, the request */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InvitationTerms({ t, compact = false }: { t: any; compact?: boolean }) {
  return (
    <>
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1, ease: GALA_EASE }}
        className="block text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]"
      >
        {t.label || "OFFICIAL ADMISSION PASS"}
      </motion.span>
      <PriceTag price={t.price || "1,000 DA"} />
      <DrawnRule className={compact ? "mt-4" : "mt-6"} />
      {t.description && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1, delay: 0.2, ease: GALA_EASE }}
          className={`max-w-md font-light leading-relaxed text-[var(--color-cream)]/75 ${
            compact ? "mt-4 text-[14px] [@media(max-height:680px)]:line-clamp-3" : "mt-6 text-[15px] sm:text-base"
          }`}
        >
          {t.description}
        </motion.p>
      )}
      <dl className={`border-t border-[var(--color-silver)]/12 ${compact ? "mt-5" : "mt-8"}`}>
        {[
          { k: "Date", v: t.date },
          { k: "Venue", v: t.venue },
        ]
          .filter((r) => r.v)
          .map((r, i) => (
            <motion.div
              key={r.k}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.9, delay: 0.25 + i * 0.1, ease: GALA_EASE }}
              className={`flex items-center gap-4 border-b border-[var(--color-silver)]/12 ${compact ? "py-3" : "py-4"}`}
            >
              <GalaStar satellites={false} className="h-3.5 w-3.5 shrink-0 text-[var(--color-silver)]" />
              <dt className="sr-only">{r.k}</dt>
              <dd className="font-cormorant text-[20px] italic leading-snug text-[var(--color-cream)]/90">{r.v}</dd>
            </motion.div>
          ))}
      </dl>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1, delay: 0.45, ease: GALA_EASE }}
        className={compact ? "mt-6" : "mt-10"}
      >
        <GalaButton href="/register">{t.selectCTA || "REQUEST YOUR ADMISSION PASS"}</GalaButton>
      </motion.div>
    </>
  );
}

/** "1,000 DA": the figure engraved at display size, the currency set small beside it */
function PriceTag({ price }: { price: string }) {
  const m = price.match(/^([\d.,\s]+)\s*(.*)$/);
  const figure = m ? m[1].trim() : price;
  const unit = m ? m[2] : "";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 1.2, delay: 0.1, ease: GALA_EASE }}
      className="mt-3 flex items-start gap-3"
    >
      <span className="font-cinzel text-[clamp(64px,9vw,120px)] font-semibold leading-[0.9] gala-engraved">{figure}</span>
      {unit && (
        <span className="mt-[0.6em] font-cinzel text-[clamp(16px,1.8vw,24px)] font-semibold tracking-[0.2em] text-[var(--color-silver)]">
          {unit}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Envelope + ticket, opened by the visitor's own scrolling while it travels up
 * the screen in full view (and closed again if they scroll back).
 * Phases: the seal cracks, the flap lifts toward the viewer (its outside darkening
 * as it turns from the light, its lining brightening once it faces us, its shadow
 * on the envelope fading), then the ticket slides out and lifts off the paper.
 */
function EnvelopeStage({ hint }: { hint: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["center 95%", "center 45%"] });
  // A little weight, so the paper moves like paper rather than tracking the wheel 1:1
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.6 });
  const fixedEnd = useMotionValue(1);
  const p = reduceMotion ? fixedEnd : smooth;

  // 1. Seal: the top half rides away on the flap; the broken lower half stays put
  const sealCrack = useTransform(p, [0.2, 0.3], [0, 1]);
  const sealLowerY = useTransform(sealCrack, [0, 1], [0, 2]);
  const sealLowerRotate = useTransform(sealCrack, [0, 1], [0, 6]);

  // 2. Flap: 0° closed (pointing down) → 180° open (standing up behind the ticket)
  const flapRotate = useTransform(p, [0.28, 0.64], [0, 180]);
  const flapZ = useTransform(flapRotate, (r) => (r < 90 ? 4 : 1));
  const flapOutsideShade = useTransform(flapRotate, [0, 90], [0, 0.65]);
  const flapInsideShade = useTransform(flapRotate, [90, 180], [0.6, 0.18]);
  const flapCastShadow = useTransform(flapRotate, [0, 40, 120, 180], [0, 0.5, 0.25, 0]);

  // 3. Ticket: slides out with friction, then lifts off the paper toward the viewer
  const ticketTop = useTransform(p, [0.58, 0.92], [TICKET_INSIDE, TICKET_REST]);
  const ticketLift = useTransform(p, [0.84, 1], [0, 1]);
  const ticketScale = useTransform(ticketLift, [0, 1], [1, 1.035]);
  const ticketRotate = useTransform(p, [0.66, 1], [0, -1.4]);
  const ticketShadow = useTransform(
    ticketLift,
    (l) => `drop-shadow(0 ${6 + l * 18}px ${10 + l * 22}px rgba(8,1,6,${0.45 + l * 0.25}))`,
  );

  const hintOpacity = useTransform(p, [0.92, 1], [0, 1]);
  const [settled, setSettled] = useState(!!reduceMotion);
  useMotionValueEvent(p, "change", (v) => setSettled(v > 0.95));

  return (
    <div ref={ref} className="mx-auto w-full max-w-[600px]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {/* Silver damask lining: a lattice of small ✦ stars */}
          <pattern id="gala-liner" width="26" height="26" patternUnits="userSpaceOnUse">
            <rect width="26" height="26" fill="#26051a" />
            <path
              d="M13 6 L14.2 11.8 L20 13 L14.2 14.2 L13 20 L11.8 14.2 L6 13 L11.8 11.8 Z"
              fill="rgba(214,220,228,0.30)"
            />
            <path d="M0 0 L2 2 M26 0 L24 2 M0 26 L2 24 M26 26 L24 24" stroke="rgba(214,220,228,0.18)" strokeWidth="0.8" />
          </pattern>
          {/* Paper grain */}
          <filter id="gala-paper" x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.92  0 0 0 0.07 0" />
          </filter>
        </defs>
      </svg>

      {/* The envelope lies slightly back, as on a table, so the flap swings out toward us */}
      <div className="[perspective:1300px]">
        <div className="relative aspect-[10/7.2] w-full [transform:rotateX(9deg)] [transform-origin:50%_100%]">
          {/* Envelope back: its lined inside is what shows above the lip */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 overflow-hidden rounded-[4px] shadow-[0_50px_80px_-40px_rgba(8,1,6,0.95)]"
            style={{ top: ENV_TOP }}
          >
            <svg className="h-full w-full">
              <rect width="100%" height="100%" fill="url(#gala-liner)" />
            </svg>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,1,6,0.6)_0%,rgba(8,1,6,0.12)_45%)]" />
          </div>

          {/* Top flap, hinged on the envelope's top edge */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 [perspective:900px]"
            style={{ top: ENV_TOP, height: FLAP_H, zIndex: flapZ }}
          >
            <motion.div
              style={{ rotateX: flapRotate, transformOrigin: "50% 0%" }}
              className="absolute inset-0 [transform-style:preserve-3d]"
            >
              {/* Outside, with the upper half of the wax seal on its point */}
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <div className="absolute inset-0 [clip-path:polygon(0_0,100%_0,50%_100%)] bg-[linear-gradient(180deg,#601244_0%,#4c0c35_70%,#400a2d_100%)]" />
                <motion.div
                  style={{ opacity: flapOutsideShade }}
                  className="absolute inset-0 bg-[#080106] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L50 100 L100 0" fill="none" stroke="rgba(255,214,240,0.30)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
                <WaxSeal half="upper" className="left-1/2 top-full" />
              </div>
              {/* Inside: the lining, seen once the flap has swung past upright.
                  This face is pre-flipped about its own centre, so its triangle is
                  drawn point-up here; after the flap's 180° swing that puts the wide
                  edge on the hinge and the point upward, like a real open flap. */}
              <div className="absolute inset-0 [transform:rotateX(180deg)] [backface-visibility:hidden]">
                <div className="absolute inset-0 [clip-path:polygon(0_100%,100%_100%,50%_0)]">
                  <svg className="h-full w-full">
                    <rect width="100%" height="100%" fill="url(#gala-liner)" />
                  </svg>
                  <motion.div style={{ opacity: flapInsideShade }} className="absolute inset-0 bg-[#080106]" />
                </div>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 L50 0 L100 100" fill="none" stroke="rgba(214,220,228,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </motion.div>
          </motion.div>

          {/* The ticket */}
          <motion.div
            style={{ top: ticketTop, scale: ticketScale, rotate: ticketRotate, filter: ticketShadow }}
            className="absolute left-[7%] z-[2] w-[86%] aspect-[1200/420]"
          >
            <InteractiveTicket interactive={settled} />
          </motion.div>

          {/* Pocket: folded side and bottom panels in front of the ticket, opening in a V */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[3]"
            style={{ top: ENV_TOP }}
          >
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gala-left" x1="0" y1="0" x2="1" y2="0.3">
                  <stop offset="0" stopColor="#5c1041" />
                  <stop offset="1" stopColor="#480f34" />
                </linearGradient>
                <linearGradient id="gala-right" x1="1" y1="0" x2="0" y2="0.3">
                  <stop offset="0" stopColor="#4b0e36" />
                  <stop offset="1" stopColor="#390827" />
                </linearGradient>
                <linearGradient id="gala-bottom" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#360725" />
                  <stop offset="1" stopColor="#500e38" />
                </linearGradient>
              </defs>
              {/* Side flaps meet in the middle; their top edges form the lip */}
              <path d="M0 0 L52 46 L52 100 L0 100 Z" fill="url(#gala-left)" />
              <path d="M100 0 L48 46 L48 100 L100 100 Z" fill="url(#gala-right)" />
              {/* Bottom flap folded over them */}
              <path d="M0 100 L50 52 L100 100 Z" fill="url(#gala-bottom)" />
              {/* Seams: a soft shadow under each fold, a lit paper edge on the lip */}
              <path d="M0 100 L50 52 L100 100" fill="none" stroke="rgba(8,1,6,0.45)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d="M0.5 99 L50 53.2 L99.5 99" fill="none" stroke="rgba(255,214,240,0.14)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M0 0 L50 44.2 L100 0" fill="none" stroke="rgba(255,220,242,0.38)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              {/* Paper grain over the whole front */}
              <rect width="100" height="100" filter="url(#gala-paper)" opacity="0.9" style={{ mixBlendMode: "overlay" }} />
            </svg>
            {/* Shadow the lifting flap casts on the envelope */}
            <motion.div
              style={{ opacity: flapCastShadow }}
              className="absolute inset-x-0 top-0 h-[60%] bg-[#080106] [clip-path:polygon(0_0,100%_0,50%_100%)] blur-[10px]"
            />
          </div>

          {/* Lower half of the seal, left on the envelope once it cracks */}
          <motion.div
            aria-hidden="true"
            style={{ top: SEAL_TOP, y: sealLowerY, rotate: sealLowerRotate }}
            className="absolute left-1/2 z-[5]"
          >
            <WaxSeal half="lower" className="left-0 top-0" />
          </motion.div>
        </div>
      </div>

      <motion.p
        style={{ opacity: hintOpacity }}
        className="mt-6 text-center text-[10.5px] uppercase tracking-[0.3em] text-[var(--color-silver)]/75"
      >
        {hint}
      </motion.p>
    </div>
  );
}

/**
 * One half of the seal: silver wax pressed with the Vision & Innovation Club
 * mark, the club's name engraved around the rim. It is split along its middle
 * when the flap lifts.
 */
function WaxSeal({ half, className = "" }: { half: "upper" | "lower"; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 sm:h-[92px] sm:w-[92px] ${className}`}
      style={{
        // A slightly ragged break line rather than a ruler-straight cut
        clipPath:
          half === "upper"
            ? "polygon(0 0, 100% 0, 100% 50%, 78% 46%, 61% 53%, 44% 47%, 27% 54%, 0 49%)"
            : "polygon(0 49%, 27% 54%, 44% 47%, 61% 53%, 78% 46%, 100% 50%, 100% 100%, 0 100%)",
      }}
    >
      {/* Poured silver wax: soft, slightly uneven lip */}
      <div className="absolute inset-0 rounded-[47%_53%_50%_50%/52%_48%_52%_48%] bg-[radial-gradient(circle_at_34%_28%,#ffffff_0%,#e4e7ec_16%,#b3b9c3_42%,#7d848f_72%,#555b65_100%)] shadow-[0_8px_18px_rgba(8,1,6,0.6),inset_0_2px_3px_rgba(255,255,255,0.75),inset_0_-4px_8px_rgba(40,44,52,0.55)]" />
      {/* The pressed face of the stamp */}
      <div className="absolute inset-[11%] rounded-full bg-[radial-gradient(circle_at_40%_32%,#f4f5f7_0%,#c9ced6_45%,#9aa1ab_100%)] shadow-[inset_0_3px_6px_rgba(40,44,52,0.55),inset_0_-1px_1px_rgba(255,255,255,0.8),0_1px_0_rgba(255,255,255,0.6)]" />
      {/* Club name engraved around the rim */}
      <svg viewBox="0 0 100 100" className="absolute inset-[11%] h-[78%] w-[78%]" aria-hidden="true">
        <defs>
          <path id={`seal-ring-${half}`} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text
          fill="rgba(52,57,66,0.85)"
          style={{ fontSize: 8.2, fontFamily: "Cinzel, serif", fontWeight: 700 }}
        >
          <textPath href={`#seal-ring-${half}`} textLength="228" lengthAdjust="spacing">
            ✦ VISION &amp; INNOVATION CLUB ✦ ENP
          </textPath>
        </text>
      </svg>
      {/* The club mark, debossed into the silver */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vic-icon.png"
        alt=""
        className="absolute left-1/2 top-1/2 h-[38%] w-auto -translate-x-1/2 -translate-y-1/2 select-none [filter:grayscale(1)_brightness(0.42)_contrast(1.2)_drop-shadow(0_1px_0_rgba(255,255,255,0.85))_drop-shadow(0_-1px_0_rgba(30,33,40,0.4))]"
      />
    </div>
  );
}

/** The double-sided pass: gentle tilt under the cursor, turns over on tap */
function InteractiveTicket({ interactive }: { interactive: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spring = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), spring);
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), spring);

  return (
    <div
      ref={cardRef}
      onMouseMove={(e) => {
        if (!interactive || !cardRef.current) return;
        const r = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - r.left) / r.width - 0.5);
        mouseY.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="h-full w-full [perspective:1400px]"
    >
      <motion.div style={{ rotateX, rotateY: tiltY, transformStyle: "preserve-3d" }} className="h-full w-full">
        <motion.div
          onClick={() => interactive && setIsFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (interactive && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsFlipped((f) => !f);
            }
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.9, ease: GALA_EASE }}
          style={{ transformStyle: "preserve-3d" }}
          className={`relative h-full w-full select-none rounded-[10px] luxury-focus-ring ${interactive ? "cursor-pointer" : ""}`}
          role="button"
          tabIndex={interactive ? 0 : -1}
          aria-label="GALA admission pass. Press Enter or Space to turn it over."
        >
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-20px_rgba(8,1,6,0.9)] ring-1 ring-black/20"
          >
            <Image
              src="/tickets-01.svg"
              alt="Official GALA admission ticket"
              fill
              sizes="(max-width: 1024px) 90vw, 600px"
              className="pointer-events-none object-cover"
            />
            {/* Slow sheen across the card stock */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.16)_50%,transparent_65%)] bg-[length:250%_100%] animate-[ticket-sheen_7s_ease-in-out_infinite]"
            />
          </div>
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-20px_rgba(8,1,6,0.9)] ring-1 ring-black/20"
          >
            <Image
              src="/back-ticket.jpg"
              alt="Back of the GALA admission ticket"
              fill
              sizes="(max-width: 1024px) 90vw, 600px"
              className="pointer-events-none object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────── The envelope, in 3D ───────────────────────────── */

const PASS_ASPECT = 2.85; // the ticket artwork is 1044 × 368

function EnvelopeScene({
  hint,
  venue,
  progress,
  settled,
}: {
  hint: string;
  venue?: string;
  progress: { current: number };
  settled: boolean;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setup = useCallback((ctx: StageContext) => buildEnvelope(ctx, progress, venue), []);
  return (
    <div>
      <Stage3D
        setup={setup}
        cursor={settled}
        className="aspect-[10/8.4] w-full"
        fallback={<EnvelopeStage hint={hint} />}
      />
      <p
        className={`mt-1 text-center text-[10.5px] uppercase tracking-[0.3em] text-[var(--color-silver)]/75 transition-opacity duration-700 ${settled ? "opacity-100" : "opacity-0"}`}
      >
        {hint}
      </p>
    </div>
  );
}

/* Paper ---------------------------------------------------------------------- */

type Edge = [number, number, number, number]; // x1, y1, x2, y2 in canvas pixels

/**
 * Aged ivory parchment: tea-stain mottling, fibres, fine tooth, edges browned
 * with handling. `edges` are the cut edges of this piece of paper, which age
 * darker than its middle.
 */
function parchmentCanvas(w: number, h: number, edges: Edge[]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ecdfc2";
  g.fillRect(0, 0, w, h);
  // Mottling: large soft blotches, warmer and cooler
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 40 + Math.random() * 260;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const warm = Math.random() < 0.7;
    grad.addColorStop(0, warm ? `rgba(176,128,70,${0.05 + Math.random() * 0.07})` : `rgba(255,250,236,${0.12 + Math.random() * 0.1})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Fibres
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const a = Math.random() * Math.PI;
    const l = 5 + Math.random() * 16;
    g.globalAlpha = 0.05 + Math.random() * 0.08;
    g.strokeStyle = Math.random() < 0.6 ? "#8a6a44" : "#fffaf0";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;
  // Fine tooth
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // Handled edges: a soft brown along every cut edge
  g.lineCap = "round";
  for (const [x1, y1, x2, y2] of edges) {
    for (const [lw, a] of [
      [70, 0.07],
      [30, 0.1],
      [8, 0.16],
    ]) {
      g.strokeStyle = `rgba(120,78,38,${a})`;
      g.lineWidth = lw;
      g.filter = "blur(6px)";
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
  g.filter = "none";
  return c;
}

/** Grey noise for the paper's relief (bump map) */
function toothCanvas(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.filter = "blur(0.6px)";
  g.drawImage(c, 0, 0);
  return c;
}

/** The lining: a silver damask of small four-pointed stars on deep plum */
function liningCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a0828";
  g.fillRect(0, 0, 256, 256);
  const star = (x: number, y: number, r: number, a: number) => {
    g.globalAlpha = a;
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.22, y - r * 0.22);
    g.lineTo(x + r, y);
    g.lineTo(x + r * 0.22, y + r * 0.22);
    g.lineTo(x, y + r);
    g.lineTo(x - r * 0.22, y + r * 0.22);
    g.lineTo(x - r, y);
    g.lineTo(x - r * 0.22, y - r * 0.22);
    g.closePath();
    g.fill();
  };
  g.fillStyle = "#dfe3ea";
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      star(32 + x * 64, 32 + y * 64, 12, 0.5);
      star(x * 64, y * 64, 4.5, 0.3);
    }
  g.globalAlpha = 1;
  return c;
}

const fontVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** The front: hand-addressed in plum ink, a silver hairline border */
function addressCanvas(w: number, h: number, venue: string | undefined, onReady: () => void) {
  const base = parchmentCanvas(w, h, [
    [0, 0, w, 0],
    [w, 0, w, h],
    [w, h, 0, h],
    [0, h, 0, 0],
  ]);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const script = fontVar("--font-script", "cursive");
  const serif = fontVar("--font-cinzel", "serif");
  const draw = () => {
    g.drawImage(base, 0, 0);
    // A fine double rule in silver foil
    g.strokeStyle = "rgba(150,156,168,0.85)";
    g.lineWidth = 3;
    g.strokeRect(w * 0.04, h * 0.06, w * 0.92, h * 0.88);
    g.lineWidth = 1.2;
    g.strokeRect(w * 0.052, h * 0.078, w * 0.896, h * 0.844);
    // Ink: slightly uneven, as from a nib
    const ink = (text: string, font: string, x: number, y: number, align: CanvasTextAlign = "left") => {
      g.font = font;
      g.textAlign = align;
      g.textBaseline = "alphabetic";
      g.fillStyle = "rgba(74,10,50,0.92)";
      g.fillText(text, x, y);
      g.globalAlpha = 0.25;
      g.fillText(text, x + 0.8, y + 0.6);
      g.globalAlpha = 1;
    };
    ink("To our Honoured Guest", `${h * 0.13}px ${script}`, w * 0.5, h * 0.42, "center");
    g.fillStyle = "rgba(74,10,50,0.7)";
    g.fillRect(w * 0.3, h * 0.47, w * 0.4, 1.5);
    ink("The Engineers' Gala", `${h * 0.085}px ${script}`, w * 0.5, h * 0.6, "center");
    if (venue) ink(venue, `${h * 0.068}px ${script}`, w * 0.5, h * 0.72, "center");
    ink("BY INVITATION", `600 ${h * 0.03}px ${serif}`, w * 0.5, h * 0.86, "center");
  };
  draw();
  document.fonts.load(`40px ${script}`).then(() => {
    draw();
    onReady();
  });
  return c;
}

/* The seal ------------------------------------------------------------------- */

/**
 * The stamp's impression as relief (light = raised): a recessed face inside
 * the poured rim, the club's mark and name standing up from it. `tint` draws
 * the colour pass instead: plum wax with its relief dusted in silver.
 */
function stampCanvas(tint: boolean, onReady: () => void) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const serif = fontVar("--font-cinzel", "serif");
  const raised = tint ? "#c9ced8" : "#ffffff";
  const draw = (mark?: HTMLImageElement) => {
    g.clearRect(0, 0, S, S);
    g.fillStyle = tint ? "#5a0c3a" : "#b4b4b4";
    g.fillRect(0, 0, S, S);
    // The pressed face sits lower than the rim
    g.fillStyle = tint ? "#4c0931" : "#6a6a6a";
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = raised;
    g.lineWidth = S * 0.012;
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.22, 0, Math.PI * 2);
    g.stroke();
    const text = "✦ VISION & INNOVATION CLUB ✦ ENP ";
    g.fillStyle = raised;
    g.font = `700 ${S * 0.05}px ${serif}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const R = S * 0.275;
    for (let i = 0; i < text.length; i++) {
      const a = (i / text.length) * Math.PI * 2 - Math.PI / 2;
      g.save();
      g.translate(S / 2 + Math.cos(a) * R, S / 2 + Math.sin(a) * R);
      g.rotate(a + Math.PI / 2);
      g.fillText(text[i], 0, 0);
      g.restore();
    }
    if (mark) {
      // The mark as a silhouette, raised in relief
      const h = S * 0.26;
      const w = (h * mark.naturalWidth) / mark.naturalHeight;
      const m = document.createElement("canvas");
      m.width = Math.ceil(w);
      m.height = Math.ceil(h);
      const mg = m.getContext("2d")!;
      mg.drawImage(mark, 0, 0, w, h);
      mg.globalCompositeOperation = "source-in";
      mg.fillStyle = raised;
      mg.fillRect(0, 0, w, h);
      g.drawImage(m, S / 2 - w / 2, S / 2 - h / 2);
    }
    if (!tint) {
      // Soften the relief a touch so it reads as pressed wax
      const copy = document.createElement("canvas");
      copy.width = copy.height = S;
      copy.getContext("2d")!.drawImage(c, 0, 0);
      g.filter = "blur(2px)";
      g.drawImage(copy, 0, 0);
      g.filter = "none";
    }
  };
  draw();
  const img = new window.Image();
  img.onload = () => {
    draw(img);
    onReady();
  };
  img.src = "/images/vic-icon.png";
  return c;
}

/** The poured outline: a circle, not quite round, as wax spreads */
function waxRadius(theta: number, R: number) {
  return R * (1 + 0.045 * Math.sin(3 * theta + 1.3) + 0.03 * Math.sin(7 * theta + 0.4) + 0.018 * Math.sin(13 * theta + 2.1));
}

/** One half of the broken seal: the poured edge on one side, a jagged break on the other */
function sealHalf(R: number, upper: boolean, breakLine: [number, number][]) {
  const sh = new THREE.Shape();
  const steps = 48;
  const from = upper ? 0 : Math.PI;
  sh.moveTo(Math.cos(from) * waxRadius(from, R), 0);
  for (let i = 1; i <= steps; i++) {
    const a = from + (i / steps) * Math.PI;
    const r = waxRadius(a, R);
    sh.lineTo(Math.cos(a) * r, i === steps ? 0 : Math.sin(a) * r);
  }
  // Back across the break (the break line runs right to left)
  const line = upper ? [...breakLine].reverse() : breakLine;
  for (const [x, y] of line) sh.lineTo(x, y);
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 6,
    curveSegments: 4,
  });
}

/* The scene ------------------------------------------------------------------ */

function buildEnvelope(ctx: StageContext, progress: { current: number }, venue?: string) {
  const { scene, camera, renderer } = ctx;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const EW = 5; // envelope
  const EH = 3.3;
  const top = EH / 2;
  const TW = 4.3; // ticket
  const TH = TW / PASS_ASPECT;
  const ss = THREE.MathUtils.smoothstep;
  const lerp = THREE.MathUtils.lerp;
  const PX = 400; // canvas pixels per unit
  const cw = EW * PX;
  const ch = EH * PX;
  // Envelope units → canvas pixels (canvas y runs downward)
  const toC = (x: number, y: number): [number, number] => [(x + EW / 2) * PX, (top - y) * PX];
  const edge = (a: [number, number], b: [number, number]): Edge => [...toC(...a), ...toC(...b)];

  // Materials -----------------------------------------------------------------
  const tooth = new THREE.CanvasTexture(toothCanvas());
  tooth.wrapS = tooth.wrapT = THREE.RepeatWrapping;
  tooth.repeat.set(1.6, 1.6);
  const paperMat = (c: HTMLCanvasElement, repeat: [number, number], offset: [number, number]) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(...repeat);
    t.offset.set(...offset);
    return new THREE.MeshStandardMaterial({ map: t, bumpMap: tooth, bumpScale: 0.9, roughness: 0.88 });
  };

  // Folds of the pocket (envelope coordinates)
  const vY = top - EH * 0.46;
  const bY = top - EH * 0.53;
  const pocketPaper = paperMat(
    parchmentCanvas(cw, ch, [
      edge([-EW / 2, top], [0.06, vY]),
      edge([EW / 2, top], [-0.06, vY]),
      edge([-EW / 2, -top], [0, bY]),
      edge([EW / 2, -top], [0, bY]),
      edge([-EW / 2, top], [-EW / 2, -top]),
      edge([EW / 2, top], [EW / 2, -top]),
      edge([-EW / 2, -top], [EW / 2, -top]),
    ]),
    [1 / EW, 1 / EH],
    [0.5, 0.5],
  );
  // The flap, in its hinge's coordinates (y from 0 down to -EH/2)
  const fc = toC(0, 0);
  const flapPaper = paperMat(
    parchmentCanvas(cw, ch / 2, [
      [0, 0, fc[0], ch / 2],
      [cw, 0, fc[0], ch / 2],
      [0, 0, cw, 0],
    ]),
    [1 / EW, 2 / EH],
    [0.5, 1],
  );
  const frontC = addressCanvas(cw, ch, venue, () => {
    (front.material as THREE.MeshStandardMaterial).map!.needsUpdate = true;
  });
  const frontMat = paperMat(frontC, [1, 1], [0, 0]);

  const liningTex = new THREE.CanvasTexture(liningCanvas());
  liningTex.colorSpace = THREE.SRGBColorSpace;
  liningTex.wrapS = liningTex.wrapT = THREE.RepeatWrapping;
  liningTex.repeat.set(0.9, 0.9);
  const lining = new THREE.MeshStandardMaterial({ map: liningTex, roughness: 0.5, metalness: 0.2 });
  const liningBack = lining.clone();
  liningBack.side = THREE.BackSide;

  // Wax: deep plum, glossy, its relief dusted with silver
  const stampTint = stampCanvas(true, () => (waxFace.map!.needsUpdate = true));
  const stampRelief = stampCanvas(false, () => (waxFace.bumpMap!.needsUpdate = true));
  const R = 0.46;
  const waxTex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    // Cap UVs are shape coordinates: map [-1.1R, 1.1R] to the stamp
    t.repeat.set(1 / (2.2 * R), 1 / (2.2 * R));
    t.offset.set(0.5, 0.5);
    return t;
  };
  const waxFace = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: waxTex(stampTint, true),
    bumpMap: waxTex(stampRelief, false),
    bumpScale: 4,
    roughness: 0.34,
    clearcoat: 0.7,
    clearcoatRoughness: 0.28,
  });
  const waxSide = new THREE.MeshPhysicalMaterial({ color: 0x4f0a33, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 });

  const shadowed = <T extends THREE.Object3D>(m: T) => {
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  /** A polygon whose free edges are slightly deckled (torn, not cut) */
  const shape = (pts: [number, number][], deckle: boolean[] = []) => {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (deckle[i]) {
        const n = 60;
        for (let k = 1; k < n; k++) {
          const t = k / n;
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const len = Math.hypot(dx, dy);
          const j = (Math.random() - 0.5) * 0.022;
          sh.lineTo(a[0] + dx * t + (-dy / len) * j, a[1] + dy * t + (dx / len) * j);
        }
      }
      if (i < pts.length - 1) sh.lineTo(b[0], b[1]);
    }
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  };

  // The letter, lying on the table. `flipper` turns it over. -------------------
  const flipper = new THREE.Group();
  scene.add(flipper);
  const env = new THREE.Group();
  env.rotation.x = -Math.PI / 2;
  flipper.add(env);

  // Inside of the back, lined; the outside is the addressed front
  env.add(shadowed(new THREE.Mesh(new THREE.PlaneGeometry(EW, EH), lining)));
  const front = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(EW, EH), frontMat));
  front.position.z = -0.006;
  front.rotation.y = Math.PI;
  env.add(front);

  // Pocket folds, each rising a hair toward its free edge as paper does
  const fold = (geo: THREE.BufferGeometry, pivot: [number, number, number], rot: [number, number]) => {
    const g = new THREE.Group();
    g.position.set(...pivot);
    g.rotation.set(rot[0], rot[1], 0);
    const m = shadowed(new THREE.Mesh(geo, pocketPaper));
    m.position.set(-pivot[0], -pivot[1], 0);
    g.add(m);
    env.add(g);
  };
  fold(shape([[-EW / 2, top], [0.06, vY], [0.06, -top], [-EW / 2, -top]], [true]), [-EW / 2, 0, 0.034], [0, -0.016]);
  fold(shape([[EW / 2, top], [-0.06, vY], [-0.06, -top], [EW / 2, -top]], [true]), [EW / 2, 0, 0.04], [0, 0.016]);
  fold(shape([[-EW / 2, -top], [0, bY], [EW / 2, -top]], [true, true]), [0, -top, 0.09], [0.02, 0]);

  // The pointed flap, hinged on the top edge, its two long edges deckled
  const hinge = new THREE.Group();
  hinge.position.set(0, top, 0.1);
  env.add(hinge);
  const flapGeo = shape([[-EW / 2, 0], [EW / 2, 0], [0, -EH * 0.5]], [false, true, true]);
  hinge.add(shadowed(new THREE.Mesh(flapGeo, flapPaper)));
  const flapIn = new THREE.Mesh(flapGeo, liningBack);
  flapIn.receiveShadow = true;
  hinge.add(flapIn);

  // The seal, poured over the flap's point; it breaks along a jagged line
  const breakLine: [number, number][] = [];
  for (let i = 1; i < 10; i++) {
    const x = R * 0.98 - (i / 10) * R * 1.96;
    breakLine.push([x, (Math.random() - 0.5) * 0.07]);
  }
  const sealUpper = shadowed(new THREE.Mesh(sealHalf(R, true, breakLine), [waxFace, waxSide]));
  sealUpper.position.set(0, -EH / 2, 0.05);
  hinge.add(sealUpper);
  const sealLower = shadowed(new THREE.Mesh(sealHalf(R, false, breakLine), [waxFace, waxSide]));
  env.add(sealLower);

  // The pass --------------------------------------------------------------------
  const cardStock = () => new THREE.MeshPhysicalMaterial({ color: 0xf1ebe6, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const passFront = cardStock();
  const passBack = cardStock();
  const passEdge = cardStock();
  const ticketPivot = new THREE.Group();
  env.add(ticketPivot);
  ticketPivot.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(TW, TH, 0.014), [passEdge, passEdge, passEdge, passEdge, passFront, passBack])));
  const show = (m: THREE.MeshPhysicalMaterial) => (t: THREE.Texture) => {
    m.map = t;
    m.color.set(0xffffff);
    m.needsUpdate = true;
  };
  ctx.texture("/tickets-01.svg").then(show(passFront));
  ctx.texture("/back-ticket.jpg").then(show(passBack));

  // The table: only its shadows show, on the velvet of the page
  const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.6 }));
  table.rotation.x = -Math.PI / 2;
  table.position.y = -0.01;
  table.receiveShadow = true;
  scene.add(table);

  // Light: a warm lamp low on the left, a rose fill, the room for the wax's gloss
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x2a0619, 0.6));
  const lamp = new THREE.DirectionalLight(0xffeedd, 2.2);
  lamp.position.set(-6.5, 6.5, 3.5);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.radius = 6;
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.02;
  Object.assign(lamp.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 22 });
  scene.add(lamp);
  const fill = new THREE.PointLight(0xd33791, 8, 0, 2);
  fill.position.set(4, 3, 3);
  scene.add(fill);
  scene.environmentIntensity = 0.55;

  // Camera: looking down at the table from the front ------------------------------
  // Seen almost straight on, as when the letter lies in front of you
  const ELEV = THREE.MathUtils.degToRad(84);
  const target = new THREE.Vector3(0, 0, -0.1);
  let dist = 10;

  let p = 0;
  let turned = 0;
  let rotY = 0;
  return {
    update(dt: number, t: number) {
      p = THREE.MathUtils.damp(p, progress.current, 5, dt);

      // 0. Turned over: the letter lifts, rolls onto its back and lands
      const flip = ss(p, 0.06, 0.24);
      flipper.rotation.z = (1 - flip) * Math.PI;
      flipper.position.y = Math.sin(flip * Math.PI) * 1.6;
      flipper.rotation.x = Math.sin(flip * Math.PI) * -0.12;

      // 1. The seal breaks: its lower half settles and turns a touch
      const crack = ss(p, 0.3, 0.37);
      sealLower.position.set(crack * 0.03, -crack * 0.05, 0.215);
      sealLower.rotation.z = crack * 0.08;

      // 2. The flap swings up and over, to lie open on the table
      const f = ss(p, 0.36, 0.6);
      hinge.rotation.x = lerp(-0.035, -Math.PI, f);
      hinge.position.z = lerp(0.1, -0.002, f);
      sealUpper.visible = f < 0.72;

      // 3. The pass slides out with a little friction, then lifts toward you
      const out = ss(p, 0.6, 0.82);
      const lift = ss(p, 0.8, 0.9);
      const settled = p > 0.9;
      rotY = THREE.MathUtils.damp(rotY, turned * Math.PI, 5, dt);
      const tilt = settled ? 1 : 0;
      ticketPivot.position.set(
        0,
        lerp(-0.3, top + 0.45, out) + lift * 0.25,
        0.022 + lift * (0.9 + Math.sin(t * 0.9) * 0.04) + Math.abs(Math.sin(rotY)) * 0.5,
      );
      ticketPivot.rotation.set(lift * 0.42 + tilt * ctx.pointer.y * -0.18, rotY + tilt * ctx.pointer.x * 0.3, lerp(0, -0.025, out));

      // Camera, with a little parallax; it drifts to frame the opened flap
      target.z = lerp(-0.1, -0.85, f);
      camera.position.set(
        target.x + ctx.pointer.x * 0.4,
        target.y + Math.sin(ELEV) * dist,
        target.z + Math.cos(ELEV) * dist + ctx.pointer.y * -0.3,
      );
      camera.lookAt(target);
    },
    resize(w: number, h: number) {
      camera.fov = 30;
      camera.updateProjectionMatrix();
      const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
      const halfH = Math.atan(Math.tan(halfV) * (w / h));
      const fitW = (EW * 0.62) / Math.tan(halfH);
      // From the envelope's near edge to the tip of the opened flap
      const fitD = (3.7 * Math.sin(ELEV)) / Math.tan(halfV);
      dist = Math.max(fitW, fitD);
    },
    onClick() {
      if (progress.current > 0.9) turned += 1;
    },
  };
}
