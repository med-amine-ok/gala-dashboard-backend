"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Users, Building2, MessageSquare, Sparkles } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function ThisYearSection() {
  const { texts } = useLanguage();
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax for company 3D gallery
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-20, 20]), springConfig);
  const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const chapters = texts.thisYear?.chapters || [
    {
      id: "people",
      number: "01",
      title: "The People",
      subtitle: "Curated Excellence",
      description:
        "Selected graduates, high-achieving researchers, and rising engineering leaders representing Algeria's foremost institutions.",
      image: "/images/sora jama3ia 1.svg",
      icon: Users,
    },
    {
      id: "companies",
      number: "02",
      title: "The Companies",
      subtitle: "Pioneering Institutions",
      description:
        "Prestigious multinational corporations, energy giants, technology pioneers, and top consulting firms actively seeking tomorrow's leadership.",
      image: "/images/lema.svg",
      icon: Building2,
    },
    {
      id: "conversations",
      number: "03",
      title: "The Conversations",
      subtitle: "Private Salons & Talks",
      description:
        "Intimate TED-style keynotes, 1-on-1 executive review salons, and roundtables tackling the forefront of engineering and AI.",
      image: "/images/host.svg",
      icon: MessageSquare,
    },
    {
      id: "experience",
      number: "04",
      title: "The Experience",
      subtitle: "Five-Star Hospitality",
      description:
        "A refined atmosphere featuring ambient classical lighting, curated dining, personalized companion app access, and unforgettable hospitality.",
      image: "/images/gpt.svg",
      icon: Sparkles,
    },
  ];

  const featuredCompanies = [
    { name: "Sonatrach", sector: "Energy & Hydrocarbons" },
    { name: "Schlumberger", sector: "Global Energy Tech" },
    { name: "TotalEnergies", sector: "Clean Energies & Power" },
    { name: "Siemens", sector: "Industrial Automation & AI" },
    { name: "Baker Hughes", sector: "Energy Technology" },
    { name: "Sonelgaz", sector: "Power Grid & Renewable" },
    { name: "KPMG", sector: "Advisory & Transformation" },
    { name: "PwC", sector: "Strategic Consulting" },
  ];

  return (
    <section
      id="cetteannee"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full bg-[#F5F1E8] text-[#1E1E1E] flex flex-col justify-center py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-[#E5DAC6]/60"
    >
      {/* Ambient Lavender & Gold Glows */}
      <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#DED3BD_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E] block mb-4">
            {texts.thisYear?.label || "THIS YEAR"}
          </span>
          <h2 className="font-cinzel text-4xl sm:text-6xl font-light text-[#1E1E1E] leading-tight mb-6 whitespace-pre-line">
            {texts.thisYear?.headline || "This is\nGALA 2026."}
          </h2>
          <p className="text-base sm:text-lg text-[#6B665E] font-light leading-relaxed">
            {texts.thisYear?.intro ||
              "A transcendent evening built around four core pillars of luxury, leadership, and opportunity."}
          </p>
        </div>

        {/* 4 Interactive Chapters Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 border-b border-[#E5DAC6] pb-8">
          {chapters.map((ch: any, idx: number) => {
            const isActive = activeChapter === idx;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(idx)}
                className={`group text-left p-4 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-transparent border ${
                  isActive
                    ? "bg-[#FAF9F6] border-[#B89A5E] shadow-[0_10px_25px_-10px_rgba(184,154,94,0.15)]"
                    : "border-transparent hover:border-[#E5DAC6] hover:bg-[#FAF9F6]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-mono text-xs font-semibold ${
                      isActive ? "text-[#B89A5E]" : "text-[#969085]"
                    }`}
                  >
                    {ch.number || `0${idx + 1}`}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isActive ? "bg-[#B89A5E]" : "bg-transparent"
                    }`}
                  />
                </div>
                <p className="font-cinzel text-lg sm:text-xl font-medium text-[#1E1E1E] mb-1">
                  {ch.title}
                </p>
                <p className="text-xs text-[#969085] tracking-wide">{ch.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Chapter Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          {/* Chapter Description */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] text-[#B89A5E] font-semibold">
              PILLAR {chapters[activeChapter].number}
            </span>
            <h3 className="font-cinzel text-3xl sm:text-4xl text-[#1E1E1E] font-medium leading-snug">
              {chapters[activeChapter].title}
            </h3>
            <p className="text-base sm:text-lg text-[#6B665E] font-light leading-relaxed">
              {chapters[activeChapter].description}
            </p>

            {/* Special Highlight for Chapter 2 (Companies) */}
            {activeChapter === 1 && (
              <div className="pt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#969085] font-medium mb-3">
                  PARTICIPATING INDUSTRY LEADERS
                </p>
                <div className="flex flex-wrap gap-2">
                  {featuredCompanies.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5DAC6] text-[#1E1E1E] font-medium"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chapter Visual Showcase with 3D Parallax */}
          <div className="lg:col-span-6 relative [perspective:1000px]">
            <motion.div
              style={{ x: parallaxX, y: parallaxY }}
              className="relative h-[320px] sm:h-[420px] rounded-2xl bg-[#FAF9F6] border border-[#E5DAC6] p-6 shadow-[0_25px_50px_-15px_rgba(30,30,30,0.06)] overflow-hidden flex items-center justify-center"
            >
              {/* Inner Decorative Champagne Gold Frame */}
              <div className="absolute inset-4 border border-[#B89A5E]/20 rounded-xl pointer-events-none" />

              <div className="relative w-full h-full p-4 flex items-center justify-center">
                <Image
                  src={chapters[activeChapter].image}
                  alt={chapters[activeChapter].title}
                  width={460}
                  height={300}
                  className="max-h-full w-auto object-contain drop-shadow-md"
                />
              </div>
            </motion.div>
          </div>
        </div>

        
      </div>
    </section>
  );
}
