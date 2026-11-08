"use client";

import { useCallback, useRef, useState } from "react";
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
import { buildEnvelope } from "../components/gala/Letter";

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

/**
 * The terms of the invitation: the pass and its price, what it includes (each
 * line with a silver check), when and where, and one clear request.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InvitationTerms({ t, compact = false }: { t: any; compact?: boolean }) {
  const { lang } = useLanguage();
  const fr = lang === "fr";
  const inclusions: string[] = t.inclusions || [];
  const when = [t.date, t.venue].filter(Boolean).join(" · ");
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

      {inclusions.length > 0 ? (
        <div className={compact ? "mt-4" : "mt-6"}>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[var(--color-cream)]/60">
            {fr ? "Votre pass comprend" : "Your pass includes"}
          </p>
          <ul className={`mt-3 ${compact ? "space-y-2 [@media(max-height:700px)]:space-y-1" : "space-y-3"}`}>
            {inclusions.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: GALA_EASE }}
                className="flex items-start gap-3"
              >
                <span
                  aria-hidden
                  className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--color-silver-light)]/55 bg-[#3a0a28]/70"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5.2 4.1 7.2 8 3" stroke="#e8ecf2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className={`leading-snug text-[var(--color-cream)]/85 ${compact ? "text-[13.5px]" : "text-[15px]"}`}>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        t.description && <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-[var(--color-cream)]/75">{t.description}</p>
      )}

      {when && (
        <p className={`flex items-center gap-3 border-y border-[var(--color-silver)]/12 font-cormorant italic text-[var(--color-cream)]/90 ${compact ? "mt-4 py-2.5 text-[18px]" : "mt-8 py-4 text-[20px]"}`}>
          <GalaStar satellites={false} className="h-3.5 w-3.5 shrink-0 text-[var(--color-silver)]" />
          {when}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1, delay: 0.3, ease: GALA_EASE }}
        className={compact ? "mt-5" : "mt-8"}
      >
        <GalaButton href="/register">{t.selectCTA || "REQUEST YOUR ADMISSION PASS"}</GalaButton>
        <p className={`mt-3 text-[12.5px] text-[var(--color-cream)]/50 ${compact ? "[@media(max-height:700px)]:hidden" : ""}`}>
          {fr ? "Environ 3 minutes · réponse par e-mail" : "About 3 minutes · we reply by email"}
        </p>
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
