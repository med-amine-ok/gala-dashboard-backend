"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ExperiencePillars() {
  const { texts } = useLanguage();

  const chapters = texts.thisYear?.chapters || [
    {
      id: "people",
      number: "01",
      title: "The Talents",
      subtitle: "Curated Excellence",
      description:
        "Selected graduates, high-achieving researchers, and rising engineering leaders representing Algeria's foremost institutions.",
      image: "/images/sora jama3ia 1.svg",
    },
    {
      id: "companies",
      number: "02",
      title: "The Companies",
      subtitle: "Pioneering Institutions",
      description:
        "Prestigious multinational corporations, energy giants, technology pioneers, and top consulting firms actively seeking tomorrow's leadership.",
      image: "/images/lema.svg",
    },
    {
      id: "conversations",
      number: "03",
      title: "The Conversations",
      subtitle: "Private Salons & Talks",
      description:
        "Intimate TED-style keynotes, 1-on-1 executive review salons, and roundtables tackling the forefront of engineering and AI.",
      image: "/images/host.svg",
    },
    {
      id: "experience",
      number: "04",
      title: "The Experience",
      subtitle: "Five-Star Hospitality",
      description:
        "A refined atmosphere featuring ambient classical lighting, curated dining, personalized companion app access, and unforgettable hospitality.",
      image: "/images/gpt.svg",
    },
  ];

  const featuredCompanies = texts.thisYear?.featuredCompanies || [
    "Sonatrach",
    "Schlumberger",
    "TotalEnergies",
    "Siemens",
    "Baker Hughes",
    "Sonelgaz",
    "KPMG",
    "PwC",
  ];

  return (
    <section
      id="piliers"
      className="relative w-full bg-[var(--color-dark)] text-[var(--color-cream)] py-24 sm:py-36 px-6 sm:px-12 border-t border-[var(--color-silver)]/20 overflow-hidden font-sans"
    >
      {/* Subtle Animated Dark Gradient Atmosphere matching Ticket Section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-dark)] via-[#360810]/30 to-[var(--color-dark)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,30,45,0.22)_0%,transparent_75%)] pointer-events-none" />

      {/* Floating Animated Luxury Glows */}
      <div className="absolute top-[15%] right-[-8%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,30,45,0.45)_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none animate-glow-slow" />
      <div className="absolute bottom-[10%] left-[-8%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(192,192,192,0.12)_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none animate-glow-reverse" />

      <div className="max-w-7xl w-full mx-auto relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)] bg-[var(--color-dark)]/90 px-4 py-1.5 rounded-full border border-[var(--color-silver)]/30 backdrop-blur-xs inline-block mb-4 shadow-xs"
          >
            {texts.thisYear?.label || "THE FOUR PILLARS"}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-cinzel text-4xl sm:text-6xl font-light text-[var(--color-cream)] leading-tight mb-6 whitespace-pre-line"
          >
            {texts.thisYear?.headline || "This is\nGALA 2026."}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base sm:text-lg text-[var(--color-cream)]/85 font-light leading-relaxed"
          >
            {texts.thisYear?.intro ||
              "An extraordinary evening structured around four defining pillars of engineering distinction, high-level synergy, and executive hospitality."}
          </motion.p>
        </div>

        {/* The 4 Architectural Chapter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-20 sm:mb-24">
          {chapters.map((chapter: any, idx: number) => (
            <motion.div
              key={chapter.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: 0.12 * idx,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative flex flex-col justify-between rounded-2xl bg-[#360810]/45 backdrop-blur-md border border-[var(--color-silver)]/25 hover:border-[var(--color-silver)]/60 transition-all duration-500 overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.7)] hover:shadow-[0_20px_50px_-15px_rgba(139,30,45,0.45)] hover:-translate-y-1"
            >
              {/* Image Preview Window */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#1f0509]">
                <Image
                  src={chapter.image}
                  alt={chapter.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover object-center filter brightness-[0.92] contrast-[1.08] saturate-[0.9] group-hover:scale-105 group-hover:brightness-100 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark)]/80 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 font-mono text-xs uppercase tracking-widest text-[var(--color-cream)] px-2.5 py-1 rounded bg-[var(--color-dark)]/90 backdrop-blur-xs border border-[var(--color-silver)]/30">
                  {chapter.number}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-silver)] font-semibold block mb-2">
                    {chapter.subtitle}
                  </span>
                  <h3 className="font-cinzel text-xl sm:text-2xl text-[var(--color-cream)] font-medium mb-3 leading-snug">
                    {chapter.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-cream)]/80 font-light leading-relaxed">
                    {chapter.description}
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-[var(--color-silver)]/15 flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--color-silver)]/75 font-medium">
                  <span>CHAPTER {chapter.number}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-silver)]/40 group-hover:bg-[var(--color-silver)] transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Enterprise Partners Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="pt-10 border-t border-[var(--color-silver)]/20"
        >
          <div className="text-center mb-8">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-silver)]/75 font-medium">
              HISTORIC INDUSTRY & HIRING PARTNERS
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-12 gap-y-4 max-w-5xl mx-auto">
            {featuredCompanies.map((company: string, idx: number) => (
              <span
                key={idx}
                className="font-cinzel text-base sm:text-xl font-medium tracking-wider text-[var(--color-silver)]/70 hover:text-[var(--color-cream)] transition-colors select-none"
              >
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
