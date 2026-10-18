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
      className="relative min-h-screen w-full bg-[var(--color-primary)] text-[var(--color-cream)] flex flex-col justify-center py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-[var(--color-silver)]/20"
    >
      {/* Ambient subtle glow */}
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(91,15,26,0.4)_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)] block mb-4">
              {texts.archives?.label || "THE ARCHIVES"}
            </span>
            <h2 className="font-cinzel text-4xl sm:text-6xl font-light text-[var(--color-cream)] leading-tight whitespace-pre-line">
              {texts.archives?.headline || "Every edition\nleaves a story."}
            </h2>
          </div>

          {/* Minimal Horizontal Year Selector */}
          <div className="flex items-center gap-6 sm:gap-10 border-b border-[var(--color-silver)]/20 pb-3">
            {years.map((year) => {
              const isActive = selectedYear === year;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`group relative bg-transparent border-none cursor-pointer p-0 font-cinzel text-lg sm:text-xl transition-all duration-300 ${
                    isActive
                      ? "text-[var(--color-silver)] font-bold scale-105"
                      : "text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]"
                  }`}
                >
                  <span>{year}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeYearUnderline"
                      className="absolute -bottom-3 left-0 right-0 h-[2px] bg-[var(--color-silver)]"
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
            <div className="lg:col-span-7 relative group overflow-hidden rounded-2xl border border-[var(--color-silver)]/30 shadow-[0_20px_40px_-15px_rgba(45,7,13,0.7)] bg-[var(--color-dark)]">
              <div className="relative h-[340px] sm:h-[460px] w-full overflow-hidden">
                <Image
                  src={currentEdition.image}
                  alt={currentEdition.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.85] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark)]/90 via-[var(--color-dark)]/25 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-[var(--color-cream)]">
                  <span className="font-cinzel text-lg sm:text-xl tracking-wider font-medium">
                    {currentEdition.title}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] font-mono px-3 py-1 rounded bg-[var(--color-dark)]/80 backdrop-blur-xs border border-[var(--color-silver)]/40 text-[var(--color-silver)]">
                    EDITION {selectedYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Edition Story & Organic Numbers */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-silver)] font-semibold mb-3">
                  CHAPTER {selectedYear}
                </p>
                <h3 className="font-cinzel text-2xl sm:text-3xl text-[var(--color-cream)] font-medium leading-snug mb-4">
                  {currentEdition.title}
                </h3>
                <p className="text-base text-[var(--color-cream)]/85 font-light leading-relaxed">
                  {currentEdition.story}
                </p>
              </div>

              {/* Organic Numbers */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--color-silver)]/20">
                {currentEdition.stats.map((st: any, idx: number) => (
                  <div key={idx} className="text-left">
                    <span className="font-cinzel text-2xl sm:text-3xl font-bold text-[var(--color-silver)] block">
                      {st.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cream)]/70 font-medium mt-1 block">
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
                  className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)] hover:text-[var(--color-silver)] transition-colors cursor-pointer bg-transparent border-none p-0"
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
