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
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      if (layerL1RevealRef.current) {
        layerL1RevealRef.current.style.opacity = "1";
        layerL1RevealRef.current.style.pointerEvents = "auto";
      }
      return;
    }

    // Balanced pacing: 1.5 - 2.5s of deliberate scrolling (crisp, elegant, never sluggish)
    const isMobile = window.innerWidth < 768;
    const pinDistance = isMobile ? "+=140%" : "+=180%";

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
            scrollProgressRef.current = p;
            if (debugScrollSpanRef.current) {
              debugScrollSpanRef.current.textContent = p.toFixed(3);
            }
            // Ensure next section is interactive when established, hero interactive when resting
            if (layerL1RevealRef.current) {
              layerL1RevealRef.current.style.pointerEvents =
                p >= 0.70 ? "auto" : "none";
            }
            if (layerL5ContentRef.current) {
              layerL5ContentRef.current.style.pointerEvents =
                p <= 0.20 ? "auto" : "none";
            }
          },
        },
      });

      // ── PHASE 3: TYPOGRAPHY-LED HERO RETREAT (0.00 -> 0.28) ────────────────
      // 1. Large "ENGINEERS' GALA" title recedes smoothly from focus first
      if (heroTitleRef.current) {
        tl.to(
          heroTitleRef.current,
          {
            y: -30,
            scale: 1.05,
            opacity: 0,
            filter: "blur(5px)",
            ease: "power1.inOut",
            duration: 0.20,
          },
          0,
        );
      }

      // 2. Subtitle "WHERE AMBITION MEETS OPPORTUNITY." fades SLIGHTLY LATER than main title
      if (heroSubtitleRef.current) {
        tl.to(
          heroSubtitleRef.current,
          {
            y: -18,
            opacity: 0,
            filter: "blur(4px)",
            ease: "power1.inOut",
            duration: 0.20,
          },
          0.08,
        );
      }

      // 2b. Hero Invitation CTA button fades out with subtitle
      if (heroCtaRef.current) {
        tl.to(
          heroCtaRef.current,
          {
            y: -14,
            opacity: 0,
            filter: "blur(3px)",
            ease: "power1.inOut",
            duration: 0.18,
          },
          0.06,
        );
      }

      // 3. Central countdown bar fades out cleanly
      if (heroCountdownRef.current) {
        tl.to(
          heroCountdownRef.current,
          {
            y: 15,
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.18,
          },
          0.02,
        );
      }

      // 4. Subtle contrast vignette behind typography fades away
      if (heroBackdropVignetteRef.current) {
        tl.to(
          heroBackdropVignetteRef.current,
          {
            opacity: 0,
            ease: "power1.inOut",
            duration: 0.18,
          },
          0,
        );
      }

      // ── PHASE 5: ABOUT THE EVENT SECTION & TYPOGRAPHY REVEAL (0.48 -> 0.78) ───
      // The section emerges beyond the entrance as the camera passes through the doorway
      if (layerL1RevealRef.current) {
        const aboutRoot = layerL1RevealRef.current;
        const aboutBg = aboutRoot.querySelector(".about-bg");
        const aboutLabel = aboutRoot.querySelector(".about-label");
        const aboutHeading = aboutRoot.querySelector(".about-heading");
        const aboutDivider = aboutRoot.querySelector(".about-divider");
        const aboutBody = aboutRoot.querySelector(".about-body");

        // Section container emergence
        tl.fromTo(
          aboutRoot,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "power1.inOut",
            duration: 0.22,
          },
          0.48,
        );

        // Atmosphere & attendee photography
        if (aboutBg) {
          tl.fromTo(
            aboutBg,
            { opacity: 0, scale: 1.06 },
            {
              opacity: 1,
              scale: 1.0,
              ease: "power2.out",
              duration: 0.24,
            },
            0.48,
          );
        }

        // Category label ("THE GALA MANIFESTO") with subtle lift
        if (aboutLabel) {
          tl.fromTo(
            aboutLabel,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.18,
            },
            0.52,
          );
        }

        // About Heading ("One day. The right people. Endless possibilities.") with refined upward movement
        if (aboutHeading) {
          tl.fromTo(
            aboutHeading,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.22,
            },
            0.56,
          );
        }

        // Silver divider line expands smoothly
        if (aboutDivider) {
          tl.fromTo(
            aboutDivider,
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 1,
              ease: "power2.out",
              duration: 0.18,
            },
            0.60,
          );
        }

        // Editorial lead paragraph fades in
        if (aboutBody) {
          tl.fromTo(
            aboutBody,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              duration: 0.20,
            },
            0.64,
          );
        }
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" id="home">
      {/* Pinned Stage Element: EXACT website background token var(--color-dark) (#2D070D) */}
      <div
        ref={stageRef}
        className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden text-[var(--color-cream)] bg-[#2D070D] bg-[radial-gradient(ellipse_at_50%_35%,#3D0812_0%,#2D070D_65%,#1E0409_100%)]"
      >
        {/* REAL 3D BURGUNDY & SILVER ENTRANCE MODEL (Live Three.js) */}
        <div className="absolute inset-0 w-full h-full z-[1] pointer-events-auto">
          <Real3DEntranceCanvas scrollProgressRef={scrollProgressRef} />
        </div>

        {/* =====================================================================
            3. PINNED VIEWPORT STAGE & DOM OVERLAYS
            ===================================================================== */}
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-between z-10 pointer-events-none">
          {/* Layer 1: Next-Section Arrival (Manifesto / About the Event) */}
          <div
            ref={layerL1RevealRef}
            id="manifesto-arrival"
            className="absolute inset-0 z-20 pointer-events-none will-change-transform overflow-hidden"
            style={{
              transformOrigin: "50% 50%",
              opacity: 0,
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
    </div>
  );
}
