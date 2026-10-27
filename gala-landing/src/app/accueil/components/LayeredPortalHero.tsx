"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import ManifestoSection from "../../manifesto/page";
import Real3DEntranceCanvas, { type EntranceFrame } from "./Real3DEntranceCanvas";

// Attendee photo (5472 x 3648) used for the out-of-focus hall beyond the doors
const HALL_PHOTO_ASPECT = 1.5;
const HALL_PHOTO_BASE_W = 100;

const smoothstep01 = (t: number) => {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
};

function setLayer(el: HTMLElement | null, opacity: number, y = 0, scale = 1) {
  if (!el) return;
  el.style.opacity = opacity.toFixed(3);
  el.style.transform =
    y === 0 && scale === 1
      ? ""
      : `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
}

export default function LayeredPortalHero() {
  const { texts } = useLanguage();

  // Root scroll trigger container & inner pinned stage references
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Layer references
  const layerL1RevealRef = useRef<HTMLDivElement>(null);
  const layerL5ContentRef = useRef<HTMLDivElement>(null);

  // Discrete typography & UI references for coordinated typography-led transition
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const heroSubtitleRef = useRef<HTMLHeadingElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroBackdropVignetteRef = useRef<HTMLDivElement>(null);
  const heroCountdownRef = useRef<HTMLDivElement>(null);

  // High-performance scroll progress ref for 3D camera flight (ZERO React re-renders on scroll)
  const scrollProgressRef = useRef<number>(0);
  const debugScrollSpanRef = useRef<HTMLSpanElement>(null);

  // Debug overlay state & FPS tracking
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Event countdown state (Target: Nov 8, 2026)
  const eventDate = new Date("2026-11-08T09:00:00");
  const [timeLeft, setTimeLeft] = useState({
    days: "74",
    hours: "14",
    minutes: "38",
    seconds: "00",
  });

  // Detection & Initial Mode Selection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("debug") === "1") {
      setIsDebug(true);
    }

    // Real-time FPS measurement loop when ?debug=1
    let fpsAnimId: number;
    let frames = 0;
    let lastTime = performance.now();
    const updateFps = (now: number) => {
      frames++;
      if (now - lastTime >= 500) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      fpsAnimId = requestAnimationFrame(updateFps);
    };
    if (urlParams.get("debug") === "1") {
      fpsAnimId = requestAnimationFrame(updateFps);
    }

    // Countdown timer
    const updateCountdown = () => {
      const diff = eventDate.getTime() - new Date().getTime();
      if (diff <= 0) return;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => {
      clearInterval(interval);
      if (fpsAnimId) cancelAnimationFrame(fpsAnimId);
    };
  }, []);

  // Reduced motion: no pin, no camera flight; About is laid out in normal flow
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The stage is held with CSS position: sticky inside a tall container, so the
  // browser compositor keeps it fixed (no main-thread pin/unpin swap, no jitter
  // at either end). Scroll only reports raw progress; all motion is derived from
  // the camera's own per-frame state in handleFrame below.
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    if (reducedMotion) {
      scrollProgressRef.current = 0;
      return;
    }

    const update = () => {
      const travel = container.offsetHeight - stage.offsetHeight;
      const top = container.getBoundingClientRect().top;
      const p = travel > 0 ? -top / travel : 0;
      scrollProgressRef.current = p < 0 ? 0 : p > 1 ? 1 : p;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reducedMotion]);

  // About text elements, faded in as the hero title gives way (bg is always there:
  // it is the hall seen beyond the doors)
  const aboutTextRef = useRef<HTMLElement[]>([]);
  const aboutBloomRef = useRef<HTMLDivElement>(null);
  const hallGlowRef = useRef<HTMLDivElement>(null);
  const hallPhotoRef = useRef<HTMLCanvasElement>(null);

  // Paint the hall photo once into a tiny canvas: upscaling it on screen gives
  // a soft, out-of-focus room for free (no per-frame CSS blur filter).
  useEffect(() => {
    const canvas = hallPhotoRef.current;
    if (!canvas) return;
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Same burgundy atmosphere as the About section's own photo treatment
      ctx.fillStyle = "rgba(30, 5, 9, 0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Darker towards the edges so the light gathers around the section
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
      vignette.addColorStop(0, "rgba(26, 4, 8, 0)");
      vignette.addColorStop(1, "rgba(26, 4, 8, 0.75)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    // Small optimised variant: it only feeds a 64px canvas
    img.src = "/_next/image?url=%2FAIMG_7652.jpg&w=256&q=60";
    return () => {
      img.onload = null;
    };
  }, [reducedMotion]);
  useEffect(() => {
    const root = layerL1RevealRef.current;
    aboutTextRef.current = root
      ? (["about-label", "about-heading", "about-divider", "about-body", "about-facts"]
          .map((c) => root.querySelector<HTMLElement>(`.${c}`))
          .filter(Boolean) as HTMLElement[])
      : [];
  }, [reducedMotion]);

  // Single per-frame writer for every DOM layer, called by the 3D canvas right
  // after it positions the camera. Only transform/opacity are touched.
  const handleFrame = useCallback((frame: EntranceFrame) => {
    const a = frame.approach;
    // All timings are in scroll progress of the pinned hero (0..1)
    const p = frame.progress;
    const span = (start: number, end: number) =>
      smoothstep01((p - start) / (end - start));

    // 1. The hero typography holds through most of the approach, then recedes
    //    as the doorway fills the frame, just before About appears (~88%). Depth-consistent drift:
    //    elements above the horizon slide up, those below slide down.
    const titleK = span(0.5, 0.84);
    setLayer(heroTitleRef.current, 1 - titleK, -32 * titleK, 1 + 0.03 * titleK);
    setLayer(heroBackdropVignetteRef.current, 1 - titleK);
    const subtitleK = span(0.45, 0.8);
    setLayer(heroSubtitleRef.current, 1 - subtitleK, -12 * subtitleK);
    const ctaK = span(0.3, 0.6);
    setLayer(heroCtaRef.current, 1 - ctaK, 16 * ctaK);
    const countdownK = span(0.2, 0.5);
    setLayer(heroCountdownRef.current, 1 - countdownK, 24 * countdownK);

    if (layerL5ContentRef.current) {
      layerL5ContentRef.current.style.pointerEvents = p < 0.3 ? "" : "none";
    }

    // 2. About the Event is seen through the doorway. Its transform is the
    //    doorway's projection through the same camera, so it grows with real
    //    perspective and is exactly 1:1 when the camera comes to rest.
    //    Nothing of it shows from afar: the doorway stays dark until the doors
    //    are open, then the hall beyond materialises, unfolding from the centre
    //    of the opening behind a brief warm bloom of light.
    const about = layerL1RevealRef.current;
    if (about) {
      // Nothing of it until ~88% of the scroll, then it materialises quickly
      const revealK = span(0.88, 0.96);
      const { x, y, scale } = frame.doorway;
      about.style.visibility = revealK > 0 ? "visible" : "hidden";
      about.style.transform = frame.arrived
        ? "none"
        : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;
      about.style.pointerEvents = frame.arrived ? "auto" : "none";
      // (a) Soft-edged ellipse growing from the middle of the doorway past the corners.
      // (b) Feathered edges, so the section melts into the lit hall instead of
      //     reading as a box; they tighten to nothing as the camera arrives,
      //     where the section fills the viewport exactly.
      const inner = revealK * 120;
      const feather = 14 * (1 - smoothstep01((a - 0.8) / 0.2));
      const layers: string[] = [];
      if (revealK < 1) {
        layers.push(
          `radial-gradient(ellipse 50% 50% at 50% 50%, #000 ${inner.toFixed(1)}%, transparent ${(inner + 45).toFixed(1)}%)`,
        );
      }
      if (feather > 0.05) {
        const f = feather.toFixed(2);
        const g = (100 - feather).toFixed(2);
        layers.push(
          `linear-gradient(to right, transparent 0%, #000 ${f}%, #000 ${g}%, transparent 100%)`,
          `linear-gradient(to bottom, transparent 0%, #000 ${f}%, #000 ${g}%, transparent 100%)`,
        );
      }
      const mask = layers.length ? layers.join(", ") : "none";
      about.style.maskImage = mask;
      about.style.setProperty("-webkit-mask-image", mask);
      about.style.maskComposite = "intersect";
      about.style.setProperty("-webkit-mask-composite", "source-in");
      if (aboutBloomRef.current) {
        aboutBloomRef.current.style.opacity = (Math.sin(Math.PI * revealK) * 0.85).toFixed(3);
      }

      // The hall beyond the doors: dark until they open, then warmly lit around
      // the section, so the opening has depth and the glass leaves read as glass.
      const hallK = span(0.84, 0.93);
      const hallGlow = hallGlowRef.current;
      if (hallGlow) {
        hallGlow.style.opacity = hallK.toFixed(3);
        hallGlow.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;
      }
      // The gala itself fills the whole opening: a soft, out-of-focus view of
      // the room (cover-fitted to the hall seen beyond the doors), so the
      // tall doorway is never empty around the section.
      const hallPhoto = hallPhotoRef.current;
      if (hallPhoto) {
        const { left, top, width, height } = frame.hall;
        const w = Math.max(width, height * HALL_PHOTO_ASPECT);
        const h = w / HALL_PHOTO_ASPECT;
        const px = left + (width - w) / 2;
        const py = top + (height - h) / 2;
        // Appears with the reveal, so nothing of the gala shows from afar
        hallPhoto.style.opacity = span(0.87, 0.95).toFixed(3);
        hallPhoto.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${(w / HALL_PHOTO_BASE_W).toFixed(4)})`;
      }
    }

    // 3. Its heading settles in once the hall has appeared (long after the
    //    hero title has gone, so the two headlines never overlap).
    const [label, heading, divider, body, facts] = aboutTextRef.current;
    const labelK = span(0.9, 0.95);
    const headingK = span(0.905, 0.96);
    const dividerK = span(0.92, 0.97);
    const bodyK = span(0.925, 0.975);
    setLayer(label, labelK, 8 * (1 - labelK));
    setLayer(heading, headingK, 14 * (1 - headingK));
    if (divider) {
      divider.style.opacity = dividerK.toFixed(3);
      divider.style.transform = dividerK >= 1 ? "" : `scaleX(${dividerK.toFixed(4)})`;
    }
    setLayer(body, bodyK, 10 * (1 - bodyK));
    const factsK = span(0.94, 0.985);
    setLayer(facts, factsK, 8 * (1 - factsK));

    if (debugScrollSpanRef.current) {
      debugScrollSpanRef.current.textContent = frame.progress.toFixed(3);
    }
  }, []);


  return (
    <div
      ref={containerRef}
      // Scroll length of the move: 1 viewport of stage + 120% (phones) / 150%
      className={`relative w-full ${reducedMotion ? "" : "h-[220svh] md:h-[250svh]"}`}
      id="home"
    >
      {/* Sticky Stage Element: EXACT website background token var(--color-dark) (#2D070D) */}
      <div
        ref={stageRef}
        className={`${reducedMotion ? "relative" : "sticky top-0"} w-full h-[100svh] min-h-[100svh] overflow-hidden text-[var(--color-cream)] bg-[#2D070D] bg-[radial-gradient(ellipse_at_50%_35%,#3D0812_0%,#2D070D_65%,#1E0409_100%)]`}
      >
        {/* About the Event, BEHIND the 3D canvas: it is seen through the doorway,
            where the scene clears the canvas to transparent. Transform written
            per frame by handleFrame from the doorway's projection. */}
        {/* The hall beyond the doors (only ever seen through the doorway) */}
        {!reducedMotion && (
          <div aria-hidden="true" className="absolute inset-0 z-0 bg-[#1a0408] pointer-events-none overflow-hidden">
            <canvas
              ref={hallPhotoRef}
              width={64}
              height={Math.round(64 / HALL_PHOTO_ASPECT)}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: HALL_PHOTO_BASE_W,
                height: HALL_PHOTO_BASE_W / HALL_PHOTO_ASPECT,
                transformOrigin: "0 0",
                opacity: 0,
              }}
            />
            <div
              ref={hallGlowRef}
              className="absolute -inset-[60%] will-change-transform bg-[radial-gradient(ellipse_32%_34%_at_50%_50%,rgba(122,26,42,0.75)_0%,rgba(70,12,22,0.55)_45%,rgba(26,4,8,0)_100%)]"
              style={{ opacity: 0, transformOrigin: "50% 50%" }}
            />
          </div>
        )}
        {!reducedMotion && (
          <div
            ref={layerL1RevealRef}
            id="manifesto-arrival"
            className="absolute inset-0 z-0 pointer-events-none will-change-transform overflow-hidden"
            style={{ transformOrigin: "50% 50%", visibility: "hidden" }}
          >
            <ManifestoSection />
            {/* Warm light blooming in the doorway as the hall appears */}
            <div
              ref={aboutBloomRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none mix-blend-screen bg-[radial-gradient(ellipse_at_center,rgba(242,232,216,0.55)_0%,rgba(190,70,90,0.22)_38%,transparent_72%)]"
              style={{ opacity: 0 }}
            />
          </div>
        )}

        {/* REAL 3D BURGUNDY & SILVER ENTRANCE MODEL (Live Three.js) */}
        <div className="absolute inset-0 w-full h-full z-[1] pointer-events-none">
          <Real3DEntranceCanvas
            scrollProgressRef={scrollProgressRef}
            onFrame={handleFrame}
          />
        </div>

        {/* =====================================================================
            3. PINNED VIEWPORT STAGE & DOM OVERLAYS
            ===================================================================== */}
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-between z-10 pointer-events-none">
          {/* =====================================================================
              LAYER 5 (L5): HERO CONTENT & BRANDING (Top Readable Layer)
              ===================================================================== */}
          <div
            ref={layerL5ContentRef}
            className="relative z-50 flex flex-col justify-between h-full pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-10 max-w-7xl mx-auto w-full pointer-events-none will-change-transform"
            style={{ transformOrigin: "50% 50%" }}
          >
            {/* Main Centered Composition */}
            <div className="my-auto flex flex-col items-center justify-center text-center max-w-3xl mx-auto pointer-events-auto relative px-3">
              {/* Soft subtle architectural contrast vignette behind typography */}
              <div
                ref={heroBackdropVignetteRef}
                className="absolute -inset-10 sm:-inset-16 bg-[radial-gradient(ellipse_at_center,rgba(25,3,7,0.50)_0%,rgba(35,5,10,0.25)_45%,transparent_75%)] pointer-events-none -z-1 will-change-transform"
              />

              {/* Monumental Brand Logo (Original High-Res Silver Artwork) */}
              <div
                ref={heroTitleRef}
                className="flex justify-center mb-3 xs:mb-4 sm:mb-6 relative will-change-transform"
              >
                <Image
                  src="/GALA-silver.png"
                  alt="ENGINEERS' GALA 2026"
                  width={540}
                  height={175}
                  priority
                  className="w-[240px] xs:w-[290px] sm:w-[360px] md:w-[460px] lg:w-[520px] h-auto object-contain select-none drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.80)] brightness-110 contrast-105"
                />
              </div>

              {/* Architectural Headline (All Caps matching reference) */}
              <h2
                ref={heroSubtitleRef}
                className="font-cinzel text-[15px] xs:text-xl sm:text-2xl md:text-4xl lg:text-5xl font-medium sm:font-light text-[var(--color-cream)] leading-[1.35] sm:leading-[1.2] mb-4 sm:mb-6 max-w-[285px] xs:max-w-[360px] sm:max-w-2xl whitespace-pre-line uppercase tracking-[0.18em] sm:tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.90)] will-change-transform"
              >
                {texts.hero?.headline || "Where ambition\nmeets opportunity."}
              </h2>

              {/* Couture Editorial Hero Invitation CTA (Letterpress Plaque) */}
              <div
                ref={heroCtaRef}
                className="mt-2 xs:mt-3 sm:mt-5 md:mt-6 pointer-events-auto will-change-transform flex justify-center w-full"
              >
                <Link href="/register" className="group inline-flex items-center">
                  <button
                    type="button"
                    className="relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3 min-h-[44px] rounded-[2px] bg-[#30070E]/85 hover:bg-[#400A14]/95 border border-[var(--color-cream)]/40 hover:border-[var(--color-cream)]/85 text-[var(--color-cream)] hover:text-white text-[11px] xs:text-[11.5px] sm:text-[12px] md:text-[12.5px] font-medium uppercase tracking-[0.20em] sm:tracking-[0.22em] transition-all duration-300 cursor-pointer backdrop-blur-[2px] luxury-focus-ring motion-reduce:transition-none"
                  >
                    <span className="relative pb-0.5">
                      {texts.hero?.requestCTA || "REQUEST YOUR INVITATION"}
                      {/* Thin, refined animated underline */}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-0 w-0 group-hover:w-full h-[1px] bg-[var(--color-cream)]/75 transition-all duration-300 ease-out motion-reduce:transition-none"
                      />
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      className="w-3.5 h-3.5 text-[var(--color-silver-light)] group-hover:text-white transition-transform duration-300 group-hover:translate-x-0.5 shrink-0 motion-reduce:transform-none"
                    />
                  </button>
                </Link>
              </div>
            </div>

            {/* Footer Countdown Bar (Clean, compact, borderless over glossy floor) */}
            <div
              ref={heroCountdownRef}
              className="w-full pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1.5 sm:gap-3 pointer-events-auto will-change-transform pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="flex items-center justify-center gap-2">
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] uppercase tracking-[0.24em] text-[var(--color-silver-light)] font-semibold text-center sm:text-left drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {texts.hero?.countdownLabel || "INVITATION WINDOW CLOSES IN"}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-8">
                {[
                  {
                    label: texts.hero?.countdown?.[0] || "DAYS",
                    val: timeLeft.days,
                  },
                  {
                    label: texts.hero?.countdown?.[1] || "HOURS",
                    val: timeLeft.hours,
                  },
                  {
                    label: texts.hero?.countdown?.[2] || "MINUTES",
                    val: timeLeft.minutes,
                  },
                  {
                    label: texts.hero?.countdown?.[3] || "SECONDS",
                    val: timeLeft.seconds,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-1">
                    <span className="font-cinzel text-base xs:text-lg sm:text-2xl font-bold text-white tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                      {item.val}
                    </span>
                    <span className="text-[8px] xs:text-[8.5px] sm:text-[10px] uppercase tracking-[0.16em] text-[var(--color-silver)] font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Temporary Debug Overlay (enabled with ?debug=1) */}
          {isDebug && (
            <div className="fixed bottom-4 left-4 z-[999] px-3.5 py-2.5 bg-black/90 border border-[var(--color-silver)]/50 rounded-lg text-xs font-mono text-white shadow-xl pointer-events-none flex flex-col gap-1 backdrop-blur-md">
              <div className="text-[var(--color-cream)] font-bold text-[11px] tracking-wide border-b border-white/20 pb-1">
                ENGINEERS&apos; GALA 3D HERO
              </div>
              <div>
                Scroll Progress: <span ref={debugScrollSpanRef}>0.000</span>
              </div>
              <div>
                FPS:{" "}
                <span
                  className={
                    fps < 30
                      ? "text-red-400"
                      : fps < 55
                        ? "text-yellow-300"
                        : "text-green-400"
                  }
                >
                  {fps}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reduced motion: the hero stays still and About follows in normal flow */}
      {reducedMotion && <ManifestoSection />}
    </div>
  );
}
