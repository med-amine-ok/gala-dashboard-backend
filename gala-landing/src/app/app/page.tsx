"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Calendar, Briefcase, Camera, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function AppSection() {
  const { texts } = useLanguage();
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs = [
    {
      id: "pass",
      title: texts.app?.tabs?.[0]?.title || "Digital Invitation Pass",
      desc:
        texts.app?.tabs?.[0]?.desc ||
        "Encrypted dynamic QR code for instant, seamless five-star check-in at the ballroom entrance.",
      icon: QrCode,
      screenHighlight: "PASS N° 2026-VIP-001 · CONFIRMED",
    },
    {
      id: "agenda",
      title: texts.app?.tabs?.[1]?.title || "Live Interactive Agenda",
      desc:
        texts.app?.tabs?.[1]?.desc ||
        "Real-time notifications for keynotes, speaker changes, and personalized roundtable schedules.",
      icon: Calendar,
      screenHighlight: "09:30 AM · KEYNOTE: INDUSTRIAL AI",
    },
    {
      id: "companies",
      title: texts.app?.tabs?.[2]?.title || "Enterprise Matchmaking",
      desc:
        texts.app?.tabs?.[2]?.desc ||
        "Explore corporate profiles, view job opportunities, and share your vetted CV with recruiters in one tap.",
      icon: Briefcase,
      screenHighlight: "32 MULTINATIONALS · 1-TAP CV DROP",
    },
    {
      id: "capture",
      title: texts.app?.tabs?.[3]?.title || "Capture & Gallery",
      desc:
        texts.app?.tabs?.[3]?.desc ||
        "Upload and discover high-resolution moments from the official event photographers in real time.",
      icon: Camera,
      screenHighlight: "OFFICIAL 4K GALA PHOTOGRAPHY",
    },
  ];

  return (
    <section
      id="app"
      className="relative min-h-screen w-full bg-[#F5F1E8] text-[#1E1E1E] flex flex-col justify-center py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-[#E5DAC6]/60 font-sans"
    >
      {/* Soft Lavender Ambient Back-Light */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-50 blur-3xl pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E] block mb-4">
            {texts.app?.label || "THE GALA COMPANION"}
          </span>
          <h2 className="font-cinzel text-4xl sm:text-6xl font-light text-[#1E1E1E] leading-tight mb-4 whitespace-pre-line">
            {texts.app?.headline || "Everything,\nin your pocket."}
          </h2>
          <p className="text-base sm:text-lg text-[#6B665E] font-light leading-relaxed">
            {texts.app?.description ||
              "Your personal companion and digital concierge throughout the GALA experience."}
          </p>
        </div>

        {/* 3D Smartphone & Features Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Interactive Feature Selection */}
          <div className="lg:col-span-6 space-y-4">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left p-6 rounded-2xl transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? "bg-[#FAF9F6] border-[#B89A5E] shadow-[0_15px_30px_-10px_rgba(184,154,94,0.15)]"
                      : "bg-transparent border-transparent hover:border-[#E5DAC6] hover:bg-[#FAF9F6]/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]"
                          : "bg-[#FAF9F6] text-[#969085] border border-[#E5DAC6]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <h4
                        className={`font-cinzel text-lg sm:text-xl font-medium mb-1 transition-colors ${
                          isActive ? "text-[#1E1E1E]" : "text-[#6B665E]"
                        }`}
                      >
                        {tab.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#6B665E] font-light leading-relaxed">
                        {tab.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Launch App CTA */}
            <div className="pt-6">
              <a
                href="https://gala-app.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-md border border-[#1E1E1E] hover:border-[#B89A5E]"
              >
                <span>{texts.app?.downloadCTA || "LAUNCH COMPANION APP"}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-[#969085] uppercase tracking-wider mt-3">
                {texts.app?.subnote || "Available exclusively for GALA invitation holders."}
              </p>
            </div>
          </div>

          {/* Right Column: 3D Smartphone Device Mockup */}
          <div className="lg:col-span-6 flex justify-center [perspective:1200px]">
            <motion.div
              whileHover={{ rotateY: -8, rotateX: 4 }}
              transition={{ duration: 0.5 }}
              className="relative w-[300px] sm:w-[340px] rounded-[48px] bg-[#1E1E1E] p-4 shadow-[0_35px_70px_-20px_rgba(30,30,30,0.25)] border-[4px] border-[#2D2D2D] [transform-style:preserve-3d]"
            >
              {/* Phone Speaker & Dynamic Island */}
              <div className="w-28 h-5 rounded-full bg-[#121212] mx-auto mb-3 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1E1E1E] mr-2" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A2A2A]" />
              </div>

              {/* Phone Screen Canvas */}
              <div className="relative rounded-[36px] bg-[#FAF9F6] p-6 h-[540px] flex flex-col justify-between overflow-hidden border border-[#E5DAC6]/60">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#969085]">
                  <span>09:41</span>
                  <span className="text-[#B89A5E] font-bold">5G · GALA PASS</span>
                </div>

                {/* App Brand Header */}
                <div className="text-center pt-2">
                  <span className="font-cinzel text-xl font-bold tracking-[0.2em] text-[#1E1E1E]">
                    GALA
                  </span>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#B89A5E]">
                    OFFICIAL COMPANION
                  </p>
                </div>

                {/* Dynamic Screen Content Based on Active Tab */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 rounded-2xl bg-[#F5F1E8] border border-[#E5DAC6] text-center space-y-3 shadow-xs"
                  >
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#B89A5E] block">
                      FEATURE PREVIEW
                    </span>
                    <h5 className="font-cinzel text-base font-bold text-[#1E1E1E]">
                      {tabs[activeTab].title}
                    </h5>
                    <div className="w-24 h-24 mx-auto rounded-xl bg-white border border-[#E5DAC6] flex items-center justify-center p-2">
                      <Image
                        src="/images/tlf.svg"
                        alt="App interface"
                        width={80}
                        height={80}
                        className="object-contain"
                      />
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-[#6E4FA0] px-3 py-1 rounded-full bg-[#ECE5F8] border border-[#DDD0F3]">
                      {tabs[activeTab].screenHighlight}
                    </span>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom App Navigation Bar */}
                <div className="grid grid-cols-4 gap-1 p-2 rounded-2xl bg-[#1E1E1E] text-[#FAF9F6] text-center">
                  {tabs.map((t, idx) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTab(idx)}
                      className={`p-1.5 rounded-lg cursor-pointer text-[9px] font-medium uppercase tracking-wider ${
                        activeTab === idx ? "bg-[#B89A5E] text-[#121212]" : "text-[#969085]"
                      }`}
                    >
                      {t.id}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
