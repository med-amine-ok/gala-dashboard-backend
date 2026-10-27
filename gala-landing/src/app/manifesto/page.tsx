"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ManifestoSection() {
  const { texts } = useLanguage();

  return (
    <section
      id="manifesto"
      className="relative w-full h-full min-h-[100svh] bg-[var(--color-dark)] text-[var(--color-cream)] flex flex-col justify-center px-6 sm:px-12 overflow-hidden py-12 sm:py-24"
    >
      {/* Background Photography with Authentic Burgundy Atmosphere */}
      <div className="about-bg absolute inset-0 z-0 overflow-hidden pointer-events-none will-change-transform">
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
        <div className="about-label mb-5 sm:mb-6 will-change-transform">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
            II <span className="mx-1.5 text-[var(--color-silver)]/50">·</span>{" "}
            {texts.manifesto?.label || "THE GALA EXPERIENCE"}
          </span>
        </div>

        {/* Large Cinzel Statement / About Heading */}
        <h2 className="about-heading font-cinzel text-3xl sm:text-5xl lg:text-[min(4.5rem,10vh)] font-light text-[var(--color-cream)] leading-[1.12] mb-6 sm:mb-8 whitespace-pre-line will-change-transform">
          {texts.manifesto?.headline ||
            "One day.\nThe right people.\nEndless possibilities."}
        </h2>

        {/* Expanding Silver Line Divider */}
        <div className="about-divider origin-left w-full h-[1px] bg-gradient-to-r from-[var(--color-silver)] via-[var(--color-silver-light)] to-transparent mb-6 sm:mb-8 will-change-transform" />

        {/* Editorial Sanctuary Lead Statement */}
        <p className="about-body max-w-2xl text-base sm:text-lg text-[var(--color-cream)]/85 font-light leading-relaxed will-change-transform">
          {texts.manifesto?.paragraph1 ||
            "GALA is not merely an annual gathering. It is an intentional sanctuary designed for high-calibre engineering minds and forward-thinking corporate titans to cross paths."}
        </p>

        {/* The essentials: when and where */}
        <dl className="about-facts mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-x-10 gap-y-2.5 text-[11px] sm:text-[12px] uppercase tracking-[0.22em] text-[var(--color-cream)]/80 will-change-transform">
          {[
            { term: "Date", value: texts.invitations?.date },
            { term: "Venue", value: texts.invitations?.venue },
          ]
            .filter((f) => f.value)
            .map((f) => (
              <div key={f.term} className="flex items-center gap-3">
                <dt className="sr-only">{f.term}</dt>
                <span aria-hidden="true" className="text-[var(--color-silver)]">
                  ✦
                </span>
                <dd>{f.value}</dd>
              </div>
            ))}
        </dl>
      </div>
    </section>
  );
}
