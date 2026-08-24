"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { ArrowUp } from "lucide-react";

export default function Accueil() {
  const { texts } = useLanguage();

  const eventDate = new Date("2025-11-08T09:00:00");

  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const [showButton, setShowButton] = useState(false);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

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
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate]);

  // Show scroll-to-top button after some scroll
  useEffect(() => {
    const handleScroll = () => setShowButton(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main
      className="relative min-h-screen bg-cover bg-center text-[#F7F4EE] font-sans overflow-hidden rounded-bl-[70px] bg-[#121212]"
      style={{
        background: `linear-gradient(180deg, #121212 0%, #1A1A1A 60%, #161616 100%)`,
      }}
    >
      {/* Decorative Champagne & Lavender Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-radial from-[#DFC598]/15 via-[#ECE5F8]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#ECE5F8]/15 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Floating background animation */}
      <motion.div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
        animate={{ scale: [1, 1.03, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="relative flex flex-col items-center justify-center text-center px-4 py-20 min-h-screen translate-y-10 z-10">
        {/* Logo animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <Image
            src="/images/Isolation_Mode.svg"
            alt="Logo Gala"
            width={450}
            height={250}
            priority
          />
        </motion.div>

        {/* Description animation */}
        <motion.p
          className="text-lg sm:text-xl mt-6 mb-4 text-[#D5CEC0] max-w-4xl leading-relaxed whitespace-pre-line font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeInOut" }}
        >
          {texts.accueil?.description}
        </motion.p>

        {/* Time & Place animation */}
        <motion.div
          className="flex flex-col md:flex-row gap-6 mt-6 text-base md:text-lg text-[#EAE3D5] font-semibold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs">
            <Image src="/images/time.png" alt="Heure" width={20} height={20} />
            <span>{texts.accueil?.date}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs">
            <Image src="/images/place.png" alt="Lieu" width={20} height={20} />
            <span>{texts.accueil?.place}</span>
          </div>
        </motion.div>

        {/* Button with hover/tap animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6, ease: "easeInOut" }}
        >
          <Link href="/register">
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 35px rgba(223, 197, 152, 0.4)",
              }}
              whileTap={{ scale: 0.96 }}
              className="cursor-pointer mt-8 bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#DFC598] text-[#1A1A1A] font-bold text-xl md:text-2xl px-10 py-3.5 rounded-full transition-transform duration-300 shadow-xl shadow-[#C5A880]/20 border border-[#E5DAC6]"
            >
              {texts.accueil?.button}
            </motion.button>
          </Link>
        </motion.div>

        {/* Countdown with animated pulse */}
        <motion.div
          className="mt-16 px-6 sm:px-10 md:px-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6, ease: "easeInOut" }}
        >
          <div className="uppercase tracking-widest text-xs sm:text-sm font-semibold mb-4 text-[#C5A880] text-center">
            {texts.accueil?.remaining}
          </div>
          <div className="flex justify-center gap-3 sm:gap-6 text-center flex-wrap">
            {texts.accueil?.countdown?.map((label: string, index: number) => {
              const keys = ["days", "hours", "minutes", "seconds"] as const;
              const value = timeLeft[keys[index]];
              return (
                <motion.div
                  key={label}
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2 + index * 0.2,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center min-w-[65px] sm:min-w-[85px] p-3 rounded-2xl bg-white/5 border border-[#EAE3D5]/10 backdrop-blur-xs"
                >
                  <div className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#DFC598] drop-shadow-[0_0_15px_rgba(223,197,152,0.3)]">
                    {value}
                  </div>
                  <div className="text-xs sm:text-xs mt-1 text-[#96928B] uppercase tracking-wider font-medium">
                    {label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Scroll to top button */}
      {showButton && (
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed z-200 bottom-8 right-8 bg-gradient-to-r from-[#DFC598] to-[#C5A880] text-[#1A1A1A] p-3.5 rounded-full shadow-xl hover:scale-110 transition-transform duration-300 border border-[#E5DAC6] cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 font-bold" />
        </motion.button>
      )}
    </main>
  );
}
