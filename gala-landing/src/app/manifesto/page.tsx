"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ManifestoSection() {
  const { texts } = useLanguage();

  return (
    <section
      id="manifesto"
      className="relative w-full h-full min-h-[100svh] bg-[var(--color-dark)] text-[var(--color-cream)] flex flex-col justify-center px-6 sm:px-12 overflow-hidden py-16 sm:py-24"
    >
      {/* Background Photography with Authentic Burgundy Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/AIMG_7652.jpg"
          alt="GALA Attendees Gathering & Fellowship"
          fill
          priority={false}
          sizes="100vw"
          className="object-cover object-center scale-100 opacity-35 filter brightness-[0.72] contrast-[1.12] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,7,13,0.35)_0%,rgba(20,3,6,0.92)_85%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-dark)] via-transparent to-[var(--color-dark)]" />
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col justify-center">
        {/* Category Label */}
        <div className="mb-6 sm:mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
            {texts.manifesto?.label || "THE GALA EXPERIENCE"}
          </span>
        </div>

        {/* Large Cinzel Statement */}
        <h2 className="font-cinzel text-3xl sm:text-5xl lg:text-7xl font-light text-[var(--color-cream)] leading-[1.12] mb-6 sm:mb-8 whitespace-pre-line">
          {texts.manifesto?.headline ||
            "One day.\nThe right people.\nEndless possibilities."}
        </h2>

        {/* Expanding Silver Line Divider */}
        <div className="origin-left w-full h-[1px] bg-gradient-to-r from-[var(--color-silver)] via-[var(--color-silver-light)] to-transparent mb-8 sm:mb-10" />

        {/* Editorial Sanctuary Lead Statement */}
        <p className="max-w-2xl text-base sm:text-lg text-[var(--color-cream)]/85 font-light leading-relaxed">
          {texts.manifesto?.paragraph1 ||
            "GALA is not merely an annual gathering. It is an intentional sanctuary designed for high-calibre engineering minds and forward-thinking corporate titans to cross paths."}
        </p>
      </div>
    </section>
  );
}
