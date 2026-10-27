"use client";

import { useRef, useState } from "react";
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
import {
  GALA_EASE,
  GalaButton,
  RevealHeading,
  RoomOrnament,
  RoomSpotlight,
} from "../components/gala/Room";

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
 * Editorial split: the invitation text on one side, the pass on the other,
 * presented like fine stationery. Scrolling opens the envelope: the seal cracks,
 * the flap lifts and the ticket slides up to rest in the envelope's lip.
 */
export default function TicketPricing() {
  const { texts } = useLanguage();
  const t = texts.invitations || {};
  const inclusions: string[] = t.inclusions || [];

  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-dark)] px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <RoomSpotlight x="68%" y="42%" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-14">
          {/* The invitation text */}
          <div className="lg:col-span-5">
            <RoomOrnament numeral="V" label={t.roomLabel || "THE INVITATION"} align="start" />
            <RevealHeading
              text={t.headline || "Your entrance\nto the evening."}
              className="mt-6 font-cinzel text-[34px] font-light leading-[1.08] sm:text-5xl"
            />
            {t.description && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: 0.25, ease: GALA_EASE }}
                className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-[var(--color-cream)]/75 sm:text-base"
              >
                {t.description}
              </motion.p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: 0.4, ease: GALA_EASE }}
              className="mt-10 flex items-end gap-6 border-t border-[var(--color-silver)]/15 pt-8"
            >
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]">
                  {t.label || "OFFICIAL ADMISSION PASS"}
                </span>
                <span className="mt-2 block font-cinzel text-4xl font-light text-[var(--color-cream)] sm:text-5xl">
                  {t.price || "1,000 DA"}
                </span>
              </div>
              <dl className="mb-1 space-y-1 text-[12.5px] font-light text-[var(--color-cream)]/70">
                <div>
                  <dt className="sr-only">Date</dt>
                  <dd>{t.date}</dd>
                </div>
                <div>
                  <dt className="sr-only">Venue</dt>
                  <dd>{t.venue}</dd>
                </div>
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: 0.5, ease: GALA_EASE }}
              className="mt-9"
            >
              <GalaButton href="/register">{t.selectCTA || "REQUEST YOUR ADMISSION PASS"}</GalaButton>
            </motion.div>
          </div>

          {/* The pass, in its envelope */}
          <div className="lg:col-span-7">
            <EnvelopeStage hint={t.flipHint || "Tap the ticket to turn it over"} />
          </div>
        </div>

        {/* What the pass grants */}
        {inclusions.length > 0 && (
          <div className="mt-24 border-t border-[var(--color-silver)]/12 pt-14 sm:mt-28">
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]">
              {t.inclusionsTitle || "FULL ADMISSION PRIVILEGES"}
            </span>
            <ul className="mt-8 grid grid-cols-1 gap-x-16 md:grid-cols-2">
              {inclusions.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.9, delay: (i % 2) * 0.08, ease: GALA_EASE }}
                  className="flex items-baseline gap-5 border-b border-[var(--color-silver)]/10 py-4"
                >
                  <span className="font-cinzel text-[12px] tabular-nums text-[var(--color-silver)]/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-light leading-relaxed text-[var(--color-cream)]/82">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
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
    (l) => `drop-shadow(0 ${6 + l * 18}px ${10 + l * 22}px rgba(8,1,3,${0.45 + l * 0.25}))`,
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
            <rect width="26" height="26" fill="#25060c" />
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
            className="absolute inset-x-0 bottom-0 overflow-hidden rounded-[4px] shadow-[0_50px_80px_-40px_rgba(8,1,3,0.95)]"
            style={{ top: ENV_TOP }}
          >
            <svg className="h-full w-full">
              <rect width="100%" height="100%" fill="url(#gala-liner)" />
            </svg>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,1,3,0.6)_0%,rgba(8,1,3,0.12)_45%)]" />
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
                <div className="absolute inset-0 [clip-path:polygon(0_0,100%_0,50%_100%)] bg-[linear-gradient(180deg,#5e1424_0%,#4a0e1b_70%,#3f0b16_100%)]" />
                <motion.div
                  style={{ opacity: flapOutsideShade }}
                  className="absolute inset-0 bg-[#080103] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                />
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 0 L50 100 L100 0" fill="none" stroke="rgba(255,214,222,0.30)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
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
                  <motion.div style={{ opacity: flapInsideShade }} className="absolute inset-0 bg-[#080103]" />
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
                  <stop offset="0" stopColor="#5a1222" />
                  <stop offset="1" stopColor="#47101c" />
                </linearGradient>
                <linearGradient id="gala-right" x1="1" y1="0" x2="0" y2="0.3">
                  <stop offset="0" stopColor="#4a0f1c" />
                  <stop offset="1" stopColor="#380912" />
                </linearGradient>
                <linearGradient id="gala-bottom" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#350811" />
                  <stop offset="1" stopColor="#4e101d" />
                </linearGradient>
              </defs>
              {/* Side flaps meet in the middle; their top edges form the lip */}
              <path d="M0 0 L52 46 L52 100 L0 100 Z" fill="url(#gala-left)" />
              <path d="M100 0 L48 46 L48 100 L100 100 Z" fill="url(#gala-right)" />
              {/* Bottom flap folded over them */}
              <path d="M0 100 L50 52 L100 100 Z" fill="url(#gala-bottom)" />
              {/* Seams: a soft shadow under each fold, a lit paper edge on the lip */}
              <path d="M0 100 L50 52 L100 100" fill="none" stroke="rgba(8,1,3,0.45)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d="M0.5 99 L50 53.2 L99.5 99" fill="none" stroke="rgba(255,214,222,0.14)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M0 0 L50 44.2 L100 0" fill="none" stroke="rgba(255,220,226,0.38)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              {/* Paper grain over the whole front */}
              <rect width="100" height="100" filter="url(#gala-paper)" opacity="0.9" style={{ mixBlendMode: "overlay" }} />
            </svg>
            {/* Shadow the lifting flap casts on the envelope */}
            <motion.div
              style={{ opacity: flapCastShadow }}
              className="absolute inset-x-0 top-0 h-[60%] bg-[#080103] [clip-path:polygon(0_0,100%_0,50%_100%)] blur-[10px]"
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

/** One half of the wax seal (the seal is split along its middle when the flap lifts) */
function WaxSeal({ half, className = "" }: { half: "upper" | "lower"; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#b01b34_0%,#73101f_55%,#4a0712_100%)] shadow-[0_6px_16px_rgba(8,1,3,0.55),inset_0_1px_2px_rgba(255,220,220,0.3)] ring-1 ring-[var(--color-silver)]/45 sm:h-16 sm:w-16 ${className}`}
      style={{
        // A slightly ragged break line rather than a ruler-straight cut
        clipPath:
          half === "upper"
            ? "polygon(0 0, 100% 0, 100% 50%, 78% 46%, 61% 53%, 44% 47%, 27% 54%, 0 49%)"
            : "polygon(0 49%, 27% 54%, 44% 47%, 61% 53%, 78% 46%, 100% 50%, 100% 100%, 0 100%)",
      }}
    >
      <span className="font-cinzel text-lg text-[var(--color-silver-light)] sm:text-xl">✦</span>
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
            className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-20px_rgba(8,1,3,0.9)] ring-1 ring-black/20"
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
            className="absolute inset-0 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-20px_rgba(8,1,3,0.9)] ring-1 ring-black/20"
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
