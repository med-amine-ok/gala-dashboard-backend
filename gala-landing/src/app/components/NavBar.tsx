"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { lang, texts, toggleLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when menu overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const handleScrollTo = (id: string) => {
    setMenuOpen(false);
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navMenuItems = texts.nav?.menuItems || [
    { label: "The Experience", id: "home", subtitle: "Where ambition meets opportunity" },
    { label: "The Manifesto", id: "manifesto", subtitle: "One night. The right people." },
    { label: "The Archives", id: "historique", subtitle: "Chapters of excellence" },
    { label: "This Year · 2026", id: "cetteannee", subtitle: "The upcoming edition" },
    { label: "Official Ticket Pass", id: "tarification", subtitle: "Admission & access (1,000 DA)" },
    { label: "The Companion App", id: "app", subtitle: "Everything in your pocket" },
    { label: "The Story", id: "apropos", subtitle: "Our heritage and vision" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 font-sans ${
          scrolled
            ? "py-3.5 bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#E5DAC6]/70 shadow-[0_4px_25px_-10px_rgba(30,30,30,0.03)]"
            : "py-6 sm:py-8 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* LEFT: GALA Logo */}
          <button
            onClick={() => handleScrollTo("home")}
            className="group flex items-center gap-3 bg-transparent border-none cursor-pointer text-left p-0 transition-opacity hover:opacity-85"
            aria-label="GALA Home"
          >
            <Image
              src="/GALA.png"
              alt="GALA Logo"
              width={140}
              height={46}
              priority
              className="h-7 sm:h-8.5 w-auto object-contain select-none"
            />
          </button>

          {/* RIGHT: Minimalist Language Switcher + Editorial Menu Trigger + Architectural CTA */}
          <div className="flex items-center gap-5 sm:gap-7">
            {/* Editorial Language Switcher (No badges/boxes) */}
            <button
              onClick={toggleLanguage}
              className="group flex items-center text-[11px] uppercase tracking-[0.22em] font-medium text-[#6B665E] hover:text-[#1E1E1E] transition-colors cursor-pointer bg-transparent border-none p-0"
              aria-label="Toggle language"
            >
              <span
                className={
                  lang === "fr"
                    ? "text-[#1E1E1E] font-semibold"
                    : "text-[#969085] group-hover:text-[#6B665E]"
                }
              >
                FR
              </span>
              <span className="mx-1.5 text-[#B89A5E]/40 font-light">/</span>
              <span
                className={
                  lang === "en"
                    ? "text-[#1E1E1E] font-semibold"
                    : "text-[#969085] group-hover:text-[#6B665E]"
                }
              >
                EN
              </span>
            </button>

            {/* Subtle Divider */}
            <span className="w-[1px] h-3.5 bg-[#E5DAC6]" />

            {/* Architectural Menu Trigger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="group flex items-center gap-2.5 py-1 bg-transparent border-none cursor-pointer text-[#1E1E1E] hover:text-[#B89A5E] transition-colors p-0"
              aria-label="Open menu"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.24em]">
                {texts.nav?.menuLabel || "MENU"}
              </span>
              <div className="flex flex-col justify-center gap-1 w-4 h-3.5">
                <span className="w-full h-[1.5px] bg-current transition-transform duration-300 group-hover:translate-x-0.5" />
                <span className="w-2/3 h-[1.5px] bg-current transition-all duration-300 group-hover:w-full" />
              </div>
            </button>

            {/* Bespoke Luxury CTA Button */}
            <Link href="/register" className="hidden sm:block">
              <button className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-[10.5px] font-semibold uppercase tracking-[0.24em] transition-all duration-300 cursor-pointer shadow-xs border border-[#1E1E1E] hover:border-[#B89A5E]">
                <span>{texts.nav?.requestInvitation || "REQUEST INVITATION"}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* LUXURY FULLSCREEN OVERLAY MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E1E1E] flex flex-col justify-between p-6 sm:p-12 overflow-y-auto"
          >
            {/* Ambient subtle glows */}
            <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,#DED3BD_0%,transparent_70%)] opacity-25 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

            {/* Top Bar of Overlay */}
            <div className="flex items-center justify-between border-b border-[#E5DAC6] pb-6 max-w-7xl w-full mx-auto relative z-10">
              <button
                onClick={() => handleScrollTo("home")}
                className="bg-transparent border-none cursor-pointer p-0"
              >
                <Image
                  src="/GALA.png"
                  alt="GALA Logo"
                  width={140}
                  height={46}
                  priority
                  className="h-7 sm:h-8.5 w-auto object-contain"
                />
              </button>

              <button
                onClick={() => setMenuOpen(false)}
                className="group flex items-center gap-2.5 text-[#1E1E1E] hover:text-[#B89A5E] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.24em]">
                  {texts.nav?.closeLabel || "CLOSE"}
                </span>
                <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>

            {/* Navigation Destinations */}
            <div className="max-w-7xl w-full mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 relative z-10">
              <div className="space-y-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#B89A5E] font-semibold">
                  INDEX
                </p>
                <div className="space-y-4">
                  {navMenuItems.slice(0, 4).map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.4 }}
                      className="border-b border-[#E5DAC6]/40 pb-4"
                    >
                      <button
                        onClick={() => handleScrollTo(item.id)}
                        className="group flex items-baseline gap-4 text-left bg-transparent border-none cursor-pointer w-full p-0"
                      >
                        <span className="font-mono text-xs text-[#B89A5E] tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                          0{idx + 1}
                        </span>
                        <div>
                          <span className="font-cinzel text-2xl sm:text-3xl lg:text-4xl text-[#1E1E1E] group-hover:text-[#B89A5E] transition-all duration-300 block">
                            {item.label}
                          </span>
                          <span className="text-xs text-[#969085] font-light mt-1 block">
                            {item.subtitle}
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#B89A5E] font-semibold">
                  EXPERIENCE
                </p>
                <div className="space-y-4">
                  {navMenuItems.slice(4).map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * (idx + 4), duration: 0.4 }}
                      className="border-b border-[#E5DAC6]/40 pb-4"
                    >
                      <button
                        onClick={() => handleScrollTo(item.id)}
                        className="group flex items-baseline gap-4 text-left bg-transparent border-none cursor-pointer w-full p-0"
                      >
                        <span className="font-mono text-xs text-[#B89A5E] tracking-widest opacity-70 group-hover:opacity-100 transition-opacity">
                          0{idx + 5}
                        </span>
                        <div>
                          <span className="font-cinzel text-2xl sm:text-3xl lg:text-4xl text-[#1E1E1E] group-hover:text-[#B89A5E] transition-all duration-300 block">
                            {item.label}
                          </span>
                          <span className="text-xs text-[#969085] font-light mt-1 block">
                            {item.subtitle}
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar of Overlay */}
            <div className="border-t border-[#E5DAC6] border-b border-[#E5DAC6] pt-6 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#969085] relative z-10">
              <p className="tracking-wider uppercase text-[11px]">ALGIERS · HOTEL MERCURE · NOVEMBER 08, 2026</p>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <span className="text-xs uppercase tracking-[0.24em] font-semibold text-[#B89A5E] hover:text-[#1E1E1E] transition-colors cursor-pointer inline-flex items-center gap-2">
                  <span>{texts.nav?.requestInvitation || "REQUEST INVITATION"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
