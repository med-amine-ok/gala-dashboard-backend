"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, RotateCw, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function TicketPricing() {
  const { texts } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [6, -6]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-8, 8]),
    springConfig,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      id="tarification"
      className="relative min-h-screen w-full bg-[var(--color-primary)] text-[var(--color-cream)] flex flex-col justify-center py-20 sm:py-32 px-4 sm:px-12 overflow-hidden border-t border-[var(--color-silver)]/20 font-sans"
    >
      {/* Ambient Luxury Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(91,15,26,0.45)_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(192,192,192,0.12)_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)] block mb-3">
            {texts.invitations?.label || "OFFICIAL ADMISSION PASS"}
          </span>
          <h2 className="font-cinzel text-3xl sm:text-5xl font-light text-[var(--color-cream)] leading-tight mb-3 whitespace-pre-line">
            {texts.invitations?.headline || "Your entrance\nto the evening."}
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-cream)]/85 font-light leading-relaxed">
            {texts.invitations?.description ||
              "A single symbolic pass granting full access to the complete GALA experience, conferences, corporate exhibition stands, CV review corner, and networking cocktail."}
          </p>
        </div>

        {/* 3D DOUBLE-SIDED PHYSICAL TICKET PASS */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex justify-center [perspective:1400px] mb-6 sm:mb-8 w-full"
        >
          <motion.div
            onClick={() => setIsFlipped((prev) => !prev)}
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl aspect-[1200/420] cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-label="Click to flip ticket pass"
          >
            {/* ================= FRONT SIDE OF TICKET (tickets-01.svg) ================= */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
              className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(45,7,13,0.7)] border border-[var(--color-silver)]/60 bg-[var(--color-dark)]"
            >
              <Image
                src="/tickets-01.svg"
                alt="Official GALA Admission Ticket Pass"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
                priority
                className="object-contain w-full h-full select-none pointer-events-none"
              />
            </div>

            {/* ================= BACK SIDE OF TICKET (/back-ticket.jpg) ================= */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className="absolute inset-0 w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_50px_-15px_rgba(45,7,13,0.85)] border border-[var(--color-silver)]/40 bg-[var(--color-dark)]"
            >
              <Image
                src="/back-ticket.jpg"
                alt="Official GALA Ticket Back"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1000px"
                priority
                className="object-contain w-full h-full select-none pointer-events-none"
              />
            </div>
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <button className="flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-full bg-[var(--color-maroon)] text-[var(--color-cream)] hover:bg-[var(--color-dark)] hover:text-[var(--color-silver)] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-md cursor-pointer border border-[var(--color-silver)] hover:border-[var(--color-silver-light)]">
              <span>
                {texts.invitations?.selectCTA ||
                  "REQUEST YOUR ADMISSION PASS (1,000 DA)"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
