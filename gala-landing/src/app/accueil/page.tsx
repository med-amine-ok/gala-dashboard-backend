"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function HeroSection() {
  const { texts } = useLanguage();

  // Countdown to event
  const eventDate = new Date("2026-11-08T09:00:00");
  const [timeLeft, setTimeLeft] = useState({
    days: "74",
    hours: "14",
    minutes: "38",
    seconds: "00",
  });

  useEffect(() => {
    const updateCountdown = () => {
      const diff = eventDate.getTime() - new Date().getTime();
      if (diff <= 0) return;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToManifesto = () => {
    const manifestoSection = document.getElementById("manifesto");
    if (manifestoSection) {
      manifestoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen w-full bg-[#F5F1E8] text-[#1E1E1E] flex flex-col justify-between pt-32 sm:pt-25 pb-12 px-6 sm:px-12 overflow-hidden font-sans"
    >
      {/* BACKGROUND PHOTOGRAPHY (DSCF7403.jpg) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/AIMG_7652.jpg"
          alt="GALA Ambience"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 filter brightness-[0.92] contrast-[1.04]"
        />
        {/* Luxury Warm Ivory & Vignette Overlay */}
        {/* <div className="absolute inset-0 bg-[#F5F1E8]/80 backdrop-blur-[2px]" /> */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F1E8]/85 via-[#F5F1E8]/70 to-[#F5F1E8]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(18, 18, 17, 0.85)_80%)]" />
      
      </div>

      {/* Refined Ambient Luxury Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,#DED3BD_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none z-1" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-45 blur-3xl pointer-events-none z-1" />

      {/* Subtle Luxury Paper Texture / Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#B89A5E_0.8px,transparent_0.8px)] [background-size:32px_32px] opacity-15 pointer-events-none z-1" />

      {/* MAIN CENTERED HERO CONTENT */}
      <div className="max-w-4xl w-full mx-auto text-center z-10 my-auto flex flex-col items-center">
        {/* Top Edition & Venue Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E]">
            {texts.hero?.edition || "ALGIERS · 2026"}
          </span>
          <span className="w-8 sm:w-12 h-[1px] bg-[#B89A5E]/40" />
          <span className="text-xs uppercase tracking-[0.22em] text-[#969085]">
            {texts.hero?.venue || "HOTEL MERCURE"}
          </span>
        </motion.div>

        {/* Monumental Brand Logo */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <Image
            src="/GALA.png"
            alt="GALA"
            width={580}
            height={190}
            priority
            className="w-[280px] sm:w-[420px] md:w-[520px] lg:w-[580px] h-auto object-contain select-none drop-shadow-sm"
          />
        </motion.div>

        {/* Architectural Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-cinzel text-3xl sm:text-5xl xl:text-6xl font-light text-[#1E1E1E] leading-[1.15] mb-6 max-w-3xl whitespace-pre-line"
        >
          {texts.hero?.headline || "Where ambition\nmeets opportunity."}
        </motion.h2>

        {/* Editorial Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-[#6B665E] max-w-2xl font-light leading-relaxed mb-10 sm:mb-12"
        >
          {texts.hero?.subheadline ||
            "An exclusive evening uniting elite engineers, pioneering organizations, and visionary leaders in a five-star luxury setting."}
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto"
        >
          <Link href="/register">
            <button className="group flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-md cursor-pointer border border-[#1E1E1E] hover:border-[#B89A5E]">
              <span>{texts.hero?.requestCTA || "REQUEST INVITATION"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>

          <button
            onClick={scrollToManifesto}
            className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-4 rounded-full bg-transparent hover:bg-[#ECE5F8] text-xs font-medium uppercase tracking-[0.2em] text-[#6B665E] hover:text-[#6E4FA0] transition-colors cursor-pointer border border-[#E5DAC6]/80 hover:border-[#DDD0F3]"
          >
            <span>{texts.hero?.discoverCTA || "DISCOVER GALA"}</span>
            <ArrowDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
          </button>
        </motion.div>
      </div>

      {/* FOOTER COUNTDOWN BAR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="max-w-7xl w-full mx-auto pt-8 border-t border-[#E5DAC6]/70 flex flex-col sm:flex-row items-center justify-between gap-4 z-10"
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#969085] font-medium">
          {texts.hero?.countdownLabel || "INVITATION WINDOW CLOSES IN"}
        </p>

        <div className="flex items-center gap-4 sm:gap-8">
          {[
            { label: texts.hero?.countdown?.[0] || "DAYS", val: timeLeft.days },
            {
              label: texts.hero?.countdown?.[1] || "HOURS",
              val: timeLeft.hours,
            },
            {
              label: texts.hero?.countdown?.[2] || "MINUTES",
              val: timeLeft.minutes,
            },
            {
              label: texts.hero?.countdown?.[3] || "SECONDS",
              val: timeLeft.seconds,
            },
          ].map((item, idx) => (
            <div key={idx} className="flex items-baseline gap-1.5">
              <span className="font-cinzel text-xl sm:text-2xl font-bold text-[#1E1E1E]">
                {item.val}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#B89A5E] font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
