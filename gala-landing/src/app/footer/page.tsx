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
    <footer className="relative w-full bg-[#F5F1E8] text-[#1E1E1E] pt-20 pb-16 px-6 sm:px-12 border-t border-[#E5DAC6] font-sans overflow-hidden">
      {/* Refined Ambient Glow */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,#DED3BD_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col justify-between">
        {/* Top Segment: Monumental Wordmark & Tagline */}
        <div className="border-b border-[#E5DAC6] pb-16 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-cinzel text-5xl sm:text-7xl lg:text-8xl font-bold tracking-[0.1em] text-[#1E1E1E] block">
              {texts.footer?.brand || "GALA"}
            </span>
            <p className="text-xs uppercase tracking-[0.25em] text-[#B89A5E] font-semibold mt-3">
              {texts.footer?.tagline || "AN EVENING OF AMBITION · CONNECTION · OPPORTUNITY"}
            </p>
          </div>

          {/* Scroll to top button */}
          <button
            onClick={scrollToTop}
            className="group self-start md:self-auto flex items-center gap-3 px-6 py-3 rounded-full border border-[#E5DAC6] bg-[#FAF9F6] hover:bg-[#1E1E1E] hover:text-[#FAF9F6] text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1E1E] transition-all cursor-pointer shadow-2xs"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>


        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#969085]">
          <p>© {new Date().getFullYear()} {texts.footer?.copyright || "GALA. All rights reserved. Vision & Innovation Club."}</p>

          <a
            href="https://medamine-portfolio-v3.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[#1E1E1E]"
          >
            <span className="text-[11px] font-sans font-medium text-[#6B665E] group-hover:text-[#1E1E1E] transition-colors">
              Designed & Developed by
            </span>
            <Image
              src="/logo-black.png"
              alt="MedAmine.dev Logo"
              width={40}
              height={40}
              className="w-8 h-8 object-contain"
            />
            <span className="text-[11px] font-mono font-bold text-[#1E1E1E] group-hover:text-[#B89A5E] transition-colors">
              MedAmine.dev
            </span>
          </a>

          <div className="flex gap-4">
            <span className="hover:text-[#1E1E1E] cursor-pointer transition-colors">Privilege & Privacy</span>
            <span className="hover:text-[#1E1E1E] cursor-pointer transition-colors">Terms of Invitation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
