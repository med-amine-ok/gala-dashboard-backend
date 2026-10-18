"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { texts } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[var(--color-dark)] text-[var(--color-cream)] pt-20 pb-16 px-6 sm:px-12 border-t border-[var(--color-silver)]/20 font-sans overflow-hidden">
      {/* Refined Ambient Glow */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,30,45,0.45)_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col justify-between">
        {/* Top Segment: Monumental Wordmark & Tagline */}
        <div className="border-b border-[var(--color-silver)]/20 pb-16 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-cinzel text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[0.1em] text-[var(--color-cream)] block">
              {texts.footer?.brand || "GALA"}
            </span>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-silver)] font-semibold mt-3">
              {texts.footer?.tagline || "AN EVENING OF AMBITION · CONNECTION · OPPORTUNITY"}
            </p>
          </div>

          {/* Scroll to top button */}
          <button
            onClick={scrollToTop}
            className="group self-start md:self-auto flex items-center gap-3 px-6 py-3 rounded-full border border-[var(--color-silver)]/40 bg-[var(--color-maroon)] hover:bg-[var(--color-primary)] hover:border-[var(--color-silver)] text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)] hover:text-[var(--color-silver)] transition-all cursor-pointer shadow-xs"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-cream)]/60">
          <p>© {new Date().getFullYear()} {texts.footer?.copyright || "GALA. All rights reserved. Vision & Innovation Club."}</p>

          <a
            href="https://medamine-portfolio-v3.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[var(--color-cream)]"
          >
            <span className="text-[11px] font-sans font-medium text-[var(--color-cream)]/60 group-hover:text-[var(--color-cream)] transition-colors">
              Designed & Developed by
            </span>
            <Image
              src="/logo-black.png"
              alt="MedAmine.dev Logo"
              width={40}
              height={40}
              className="w-8 h-8 object-contain filter brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-[11px] font-mono font-bold text-[var(--color-cream)] group-hover:text-[var(--color-silver)] transition-colors">
              MedAmine.dev
            </span>
          </a>

          <div className="flex gap-4">
            <span className="hover:text-[var(--color-silver)] cursor-pointer transition-colors">Privilege & Privacy</span>
            <span className="hover:text-[var(--color-silver)] cursor-pointer transition-colors">Terms of Invitation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
