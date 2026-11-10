"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { heroTextureProgress } from "./TextureGenerator";

/**
 * Shown over the hero while the 3D entrance loads: the Gala's mark, a fine
 * silver line that fills with the real progress (the baked textures, then the
 * scene's shaders), and a soft fade once the first frame is drawn.
 */
export default function HeroLoader({ ready, label }: { ready: boolean; label: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let raf = 0;
    let shown = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // Textures are the first 70%; the shaders creep towards 97% until ready
      const compile = Math.min(1, (now - start) / 4000);
      const target = readyRef.current ? 1 : Math.min(0.97, heroTextureProgress() * 0.7 + compile * 0.27);
      shown += (target - shown) * (readyRef.current ? 0.25 : 0.08);
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown.toFixed(4)})`;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(shown * 100)).padStart(2, "0");
      if (readyRef.current && shown > 0.995) {
        setFading(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Never in the way for long, whatever happens
    const safety = window.setTimeout(() => setFading(true), 15000);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (!fading) return;
    const t = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(t);
  }, [fading]);

  if (gone) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`absolute inset-0 z-[60] flex flex-col items-center justify-center bg-[#2E061E] bg-[radial-gradient(ellipse_at_50%_42%,#4a0b33_0%,#2E061E_60%,#1a0211_100%)] transition-opacity duration-[900ms] ease-out motion-reduce:transition-none ${fading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <Image
        src="/GALA-silver.png"
        alt=""
        width={540}
        height={175}
        priority
        className="w-[180px] sm:w-[240px] h-auto opacity-90 select-none animate-[galaBreath_2.8s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <div className="mt-8 w-[180px] sm:w-[240px]">
        <div className="relative h-px w-full bg-[var(--color-cream)]/15 overflow-hidden">
          <div
            ref={barRef}
            className="absolute inset-0 origin-left bg-gradient-to-r from-[var(--color-silver)] via-white to-[var(--color-silver)]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[var(--color-silver-light)]">
          <span>{label}</span>
          <span className="font-cinzel tabular-nums tracking-[0.1em]">
            <span ref={pctRef}>00</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
