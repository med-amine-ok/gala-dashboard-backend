"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function ArchivesSection() {
  const { texts } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<string>("2025");

  // Configure edition images directly here:
  const editionImages: Record<string, string> = {
    "2025": "/DSCF7403.jpg",
    "2024": "/images/troisième.png",
    "2019": "/images/deuxième.png",
    "2017": "/images/lowla.png",
  };

  const years = ["2025", "2024", "2019", "2017"];
  const editionTexts = texts.archives?.editions?.[selectedYear] || texts.archives?.editions?.["2025"] || {};
  const currentEdition = {
    title: editionTexts?.title || `GALA ${selectedYear}`,
    story: editionTexts?.story || "",
    stats: editionTexts?.stats || [],
    image: editionImages[selectedYear] || editionImages["2025"],
  };

  return (
    <section
      id="historique"
      className="relative min-h-screen w-full bg-[#F5F1E8] text-[#1E1E1E] flex flex-col justify-center py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-[#E5DAC6]/60"
    >
      <div className="max-w-7xl w-full mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E] block mb-4">
              {texts.archives?.label || "THE ARCHIVES"}
            </span>
            <h2 className="font-cinzel text-4xl sm:text-6xl font-light text-[#1E1E1E] leading-tight whitespace-pre-line">
              {texts.archives?.headline || "Every edition\nleaves a story."}
            </h2>
          </div>

          {/* Minimal Horizontal Year Selector */}
          <div className="flex items-center gap-6 sm:gap-10 border-b border-[#E5DAC6] pb-3">
            {years.map((year) => {
              const isActive = selectedYear === year;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`group relative bg-transparent border-none cursor-pointer p-0 font-cinzel text-lg sm:text-xl transition-all duration-300 ${
                    isActive
                      ? "text-[#B89A5E] font-bold scale-105"
                      : "text-[#969085] hover:text-[#1E1E1E]"
                  }`}
                >
                  <span>{year}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeYearUnderline"
                      className="absolute -bottom-3 left-0 right-0 h-[2px] bg-[#B89A5E]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Edition Experience */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
          >
            {/* Left: Cinematic Editorial Image */}
            <div className="lg:col-span-7 relative group overflow-hidden rounded-2xl border border-[#E5DAC6] shadow-[0_20px_40px_-15px_rgba(30,30,30,0.06)] bg-[#FAF9F6]">
              <div className="relative h-[340px] sm:h-[460px] w-full overflow-hidden">
                <Image
                  src={currentEdition.image}
                  alt={currentEdition.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E]/40 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[#FAF9F6]">
                  <span className="font-cinzel text-lg sm:text-xl tracking-wider font-medium">
                    {currentEdition.title}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] font-mono px-3 py-1 rounded bg-black/40 backdrop-blur-xs border border-white/20">
                    EDITION {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Edition Story & Organic Numbers */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#B89A5E] font-semibold mb-3">
                  CHAPTER {selectedYear}
                </p>
                <h3 className="font-cinzel text-2xl sm:text-3xl text-[#1E1E1E] font-medium leading-snug mb-4">
                  {currentEdition.title}
                </h3>
                <p className="text-base text-[#6B665E] font-light leading-relaxed">
                  {currentEdition.story}
                </p>
              </div>

              {/* Organic Numbers (No boxy SaaS cards) */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E5DAC6]">
                {currentEdition.stats.map((st: any, idx: number) => (
                  <div key={idx} className="text-left">
                    <span className="font-cinzel text-2xl sm:text-3xl font-bold text-[#1E1E1E] block">
                      {st.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#969085] font-medium mt-1 block">
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Single Interaction CTA */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const yearEl = document.getElementById("cetteannee");
                    if (yearEl) yearEl.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#1E1E1E] hover:text-[#B89A5E] transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  <span>{texts.archives?.exploreCTA || "EXPLORE THE GALA UNIVERSE"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
