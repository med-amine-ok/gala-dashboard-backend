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
    <footer className="relative w-full bg-[var(--color-dark)] text-[var(--color-cream)] pt-16 pb-14 px-6 sm:px-12 border-t border-[var(--color-silver)]/20 font-sans overflow-hidden">
      {/* Subtle Animated Dark Gradient Atmosphere matching Ticket Section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-dark)] via-[#360810]/30 to-[var(--color-dark)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,30,45,0.45)_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col justify-between relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--color-cream)]/70">
          <p className="font-light tracking-wide">
            © {new Date().getFullYear()}{" "}
            {texts.footer?.copyright ||
              "GALA. All rights reserved. Vision & Innovation Club."}
          </p>

          <a
            href="https://medamine-portfolio-v3.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[var(--color-cream)]"
          >
            <span className="text-[11px] font-sans font-medium text-[var(--color-silver)]/75 group-hover:text-[var(--color-cream)] transition-colors">
              Designed & Developed by
            </span>
            <div className="w-6 h-6 rounded-full p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <Image
                src="/logo-black.png"
                alt="MedAmine.dev Logo"
                width={24}
                height={24}
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-[var(--color-silver-light)] group-hover:text-[var(--color-cream)] transition-colors">
              MedAmine.dev
            </span>
          </a>

          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-silver)]/40 hover:border-[var(--color-silver)] text-[11px] uppercase tracking-[0.2em] text-[var(--color-silver)] hover:text-[var(--color-cream)] hover:bg-white/5 transition-all cursor-pointer bg-transparent luxury-focus-ring"
            aria-label="Back to top of page"
          >
            <span>TOP</span>
            <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
