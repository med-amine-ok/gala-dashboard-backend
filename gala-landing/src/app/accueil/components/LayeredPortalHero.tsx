"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "../../../context/LanguageContext";
import ManifestoSection from "../../manifesto/page";
import Real3DEntranceCanvas from "./Real3DEntranceCanvas";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LayeredPortalHero() {
  const { texts } = useLanguage();

  // Root scroll trigger container & inner pinned stage references
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Layer references
  const layerL1RevealRef = useRef<HTMLDivElement>(null);
  const layerL5ContentRef = useRef<HTMLDivElement>(null);

  // Scroll progress state for 3D camera flight
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Debug overlay state & FPS tracking
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);

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

  // GSAP ScrollTrigger orchestration for the pinned scroll & unpin handoff
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const isMobile = window.innerWidth < 768;
    const pinDistance = isMobile ? "+=160%" : "+=220%";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          pin: stage, // Pin inner stage so container's parent hierarchy in React is never disrupted
          start: "top top",
          end: pinDistance,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollProgress(p);
          },
        },
      });

      // Layer 5: Hero Content (Logo, headline, metadata, countdown, CTA)
      // Moves toward camera slightly, then fades & blurs out in the first 0.0 -> 0.35
      if (layerL5ContentRef.current) {
        tl.to(
          layerL5ContentRef.current,
          {
            scale: 1.15,
            y: -35,
            opacity: 0,
            filter: "blur(8px)",
            ease: "power1.out",
            duration: 0.35,
          },
          0
        );
      }





      // Layer 1: Next-Section Arrival (Manifesto)
      // As the camera passes between the open glass doors into the warm ivory lobby (0.58 -> 1.0),
      // the arrival unmasks smoothly from the glowing lobby aperture to full screen (100svh).
      if (layerL1RevealRef.current) {
        tl.fromTo(
          layerL1RevealRef.current,
          {
            opacity: 0,
            clipPath: isMobile
              ? "inset(24% 12% 24% 12% round 120px 120px 0 0)"
              : "inset(18% 30% 18% 30% round 180px 180px 0 0)",
            scale: 0.94,
          },
          {
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0% round 0px 0px 0 0)",
            scale: 1.0,
            ease: "power2.inOut",
            duration: 0.42,
          },
          0.58
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      id="home"
    >
      {/* Pinned Stage Element: GSAP pins this inner stage so containerRef remains untouched in React */}
      <div
        ref={stageRef}
        className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden bg-[#140206] text-[var(--color-cream)]"
      >
        {/* Deep Imperial Burgundy Radial Atmosphere Backing (Pure oxblood dusk, zero pink) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,8,16,0.65)_0%,rgba(20,2,6,0.92)_55%,#100104_100%)] pointer-events-none" />

        {/* REAL 3D BURGUNDY & SILVER ENTRANCE MODEL (Live Three.js) */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto">
          <Real3DEntranceCanvas scrollProgress={scrollProgress} />
        </div>

        {/* =====================================================================
            3. PINNED VIEWPORT STAGE & DOM OVERLAYS
            ===================================================================== */}
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-between z-10 pointer-events-none">
          {/* Layer 1: Next-Section Arrival (Manifesto) */}
          <div
            ref={layerL1RevealRef}
            id="manifesto-arrival"
            className="absolute inset-0 z-20 pointer-events-none will-change-transform overflow-hidden"
            style={{
              transformOrigin: "50% 48%",
              opacity: 0,
              clipPath: "inset(18% 30% 18% 30% round 180px 180px 0 0)",
            }}
          >
            <ManifestoSection />
          </div>

          {/* =====================================================================
              LAYER 5 (L5): HERO CONTENT & BRANDING (Top Readable Layer)
              ===================================================================== */}
          <div
            ref={layerL5ContentRef}
            className="relative z-50 flex flex-col justify-between h-full pt-20 sm:pt-24 pb-6 sm:pb-8 px-4 sm:px-10 max-w-7xl mx-auto w-full pointer-events-none will-change-transform"
            style={{ transformOrigin: "50% 48%" }}
          >
            {/* Main Centered Composition */}
            <div className="my-auto flex flex-col items-center text-center max-w-3xl mx-auto pointer-events-auto relative">
              {/* Soft subtle contrast vignette behind typography */}
              <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(16,2,6,0.25)_0%,transparent_70%)] pointer-events-none -z-1" />

              {/* Top Edition & Venue Badge */}
              <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-5">
                <span className="text-[9px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-silver)] px-4 py-1.5 border border-[var(--color-silver)]/25 rounded-full bg-[#1c0308]/80 backdrop-blur-sm">
                  {(texts.hero?.edition || "ALGIERS · 2026") + " · ENP"}
                </span>
              </div>

              {/* Monumental Brand Logo (Original High-Res Silver Artwork) */}
              <div className="flex justify-center mb-4 sm:mb-6 relative">
                <Image
                  src="/GALA-silver.png"
                  alt="ENGINEERS' GALA 2026"
                  width={540}
                  height={175}
                  priority
                  className="w-[220px] xs:w-[280px] sm:w-[410px] md:w-[480px] lg:w-[530px] h-auto object-contain select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] brightness-105"
                />
              </div>

              {/* Architectural Headline */}
              <h2 className="font-cinzel text-xl sm:text-3xl md:text-5xl font-light text-[var(--color-cream)] leading-[1.2] mb-5 sm:mb-7 max-w-2xl whitespace-pre-line tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                {texts.hero?.headline || "Where ambition\nmeets opportunity."}
              </h2>

              {/* Restrained Luxury Silver Invitation CTA */}
              <div className="flex items-center justify-center">
                <Link href="/register">
                  <button
                    className="group flex items-center justify-center gap-3 px-7 sm:px-10 py-3 sm:py-3.5 rounded-full border border-[var(--color-silver)]/55 hover:border-[var(--color-silver-light)] bg-gradient-to-r from-[#3D0812] to-[#5C0D1B] hover:from-[#4D0C18] hover:to-[#731323] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-cream)] transition-all duration-300 shadow-[0_10px_30px_rgba(45,7,13,0.7)] hover:shadow-[0_12px_35px_rgba(229,229,229,0.25)] backdrop-blur-md cursor-pointer luxury-focus-ring"
                    aria-label="Request invitation for Engineers Gala 2026"
                  >
                    <span>{texts.hero?.requestCTA || "REQUEST INVITATION"}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--color-silver)] transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Footer Countdown Bar */}
            <div className="w-full pt-3 sm:pt-5 border-t border-[var(--color-silver)]/25 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
              <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.22em] text-[var(--color-silver)]/90 font-medium">
                {texts.hero?.countdownLabel || "INVITATION WINDOW CLOSES IN"}
              </p>

              <div className="flex items-center gap-3 xs:gap-4 sm:gap-8">
                {[
                  { label: texts.hero?.countdown?.[0] || "DAYS", val: timeLeft.days },
                  { label: texts.hero?.countdown?.[1] || "HOURS", val: timeLeft.hours },
                  { label: texts.hero?.countdown?.[2] || "MINUTES", val: timeLeft.minutes },
                  { label: texts.hero?.countdown?.[3] || "SECONDS", val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-1">
                    <span className="font-cinzel text-base xs:text-lg sm:text-2xl font-bold text-[var(--color-cream)] tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
                      {item.val}
                    </span>
                    <span className="text-[8px] xs:text-[9px] uppercase tracking-wider text-[var(--color-silver)] font-semibold">
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
              <div>Scroll Progress: {scrollProgress.toFixed(3)}</div>
              <div>FPS: <span className={fps < 30 ? "text-red-400" : fps < 55 ? "text-yellow-300" : "text-green-400"}>{fps}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
