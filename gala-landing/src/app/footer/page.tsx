"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { texts } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full bg-[var(--color-dark)] text-[var(--color-cream)] pt-20 pb-16 px-6 sm:px-12 border-t border-[var(--color-silver)]/20 font-sans overflow-hidden">
      {/* Refined Ambient Glow */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,30,45,0.45)_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col justify-between">
        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-cream)]/60">
          <p>
            © {new Date().getFullYear()}{" "}
            {texts.footer?.copyright ||
              "GALA. All rights reserved. Vision & Innovation Club."}
          </p>

          <a
            href="https://medamine-portfolio-v3.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[var(--color-cream)]"
          >
            <span className="text-[11px] font-sans font-medium text-[var(--color-cream)]/60 group-hover:text-[var(--color-cream)] transition-colors">
              Designed & Developed by
            </span>
            <Image
              src="/logo-black.png"
              alt="MedAmine.dev Logo"
              width={40}
              height={40}
              className="w-8 h-8 object-contain filter brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-[11px] font-mono font-bold text-[var(--color-cream)] group-hover:text-[var(--color-silver)] transition-colors">
              MedAmine.dev
            </span>
          </a>

          <div className="flex gap-4">
            <span className="hover:text-[var(--color-silver)] cursor-pointer transition-colors">
              Privilege & Privacy
            </span>
            <span className="hover:text-[var(--color-silver)] cursor-pointer transition-colors">
              Terms of Invitation
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
