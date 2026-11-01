"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { GALA_EASE, GalaButton, GalaStar } from "../components/gala/Room";

const EVENT_DATE = new Date("2026-11-08T09:00:00");

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/vic.enp/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/vicenp/" },
  { label: "Facebook", href: "https://www.facebook.com/vic.enpa" },
  { label: "TikTok", href: "https://www.tiktok.com/@vic.enp" },
];

/**
 * THE FAREWELL
 * The last view of the evening: the mark, the date, one more invitation, and the
 * practical details in a single quiet register.
 */
export default function Footer() {
  const { texts } = useLanguage();
  const f = texts.footer || {};
  const inv = texts.invitations || {};
  const [days, setDays] = useState<number | null>(null);

  // Client-only (no hydration mismatch); whole days, same as the hero countdown
  useEffect(() => {
    const diff = EVENT_DATE.getTime() - Date.now();
    setDays(diff > 0 ? Math.floor(diff / 86_400_000) : null);
  }, []);

  // "The doors open in {days} days" → the number set apart at display size
  const [before, after] = String(f.countdown || "").split("{days}");

  return (
    <footer className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-transparent px-6 pb-6 pt-20 text-[var(--color-cream)] sm:px-12 font-sans">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col">
        {/* The finale: the mark the dust has been gathering into */}
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: GALA_EASE }}
            className="flex items-center gap-4"
          >
            <span className="h-px w-10 bg-gradient-to-l from-[var(--color-silver)]/60 to-transparent sm:w-16" />
            <GalaStar className="w-9 text-[var(--color-silver-light)]" />
            <span className="h-px w-10 bg-gradient-to-r from-[var(--color-silver)]/60 to-transparent sm:w-16" />
          </motion.div>

          {/* The dust forms the mark here; the image is its fallback twin */}
          <div id="gala-logo-anchor" className="relative mt-6">
            <Image
              src="/GALA-silver.png"
              alt="Engineers' Gala"
              width={631}
              height={215}
              priority={false}
              className="gala-footer-mark h-auto w-[280px] select-none sm:w-[420px] lg:w-[460px] drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            />
          </div>

          {f.tagline && (
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)] sm:text-[11px] sm:tracking-[0.36em]">
              {f.tagline}
            </p>
          )}

          {days !== null && f.countdown && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.1, delay: 0.2, ease: GALA_EASE }}
              className="mt-4 flex flex-wrap items-baseline justify-center gap-x-3 font-cormorant text-[clamp(24px,3vw,38px)] italic text-[var(--color-cream)]/90"
            >
              <span>{before.trim()}</span>
              <span className="font-cinzel text-[clamp(52px,6.5vw,96px)] font-semibold not-italic leading-none gala-engraved">
                {String(days).padStart(2, "0")}
              </span>
              <span>{after.trim()}</span>
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1, delay: 0.35, ease: GALA_EASE }}
            className="mt-6"
          >
            <GalaButton href="/register">{texts.nav?.requestInvitation || "REQUEST INVITATION"}</GalaButton>
          </motion.div>
        </div>

        {/* Practical details along the bottom edge */}
        <div className="grid grid-cols-1 gap-6 border-t border-[var(--color-silver)]/12 pt-5 text-[12.5px] font-light leading-relaxed text-[var(--color-cream)]/68 sm:grid-cols-3 sm:gap-8">
          <div>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.eventLabel || "THE EVENING"}
            </h4>
            {inv.date && <p>{inv.date}</p>}
            {inv.venue && <p>{inv.venue}</p>}
          </div>
          <div>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.contactLabel || "CONCIERGE"}
            </h4>
            {f.email && (
              <a href={`mailto:${f.email}`} className="block transition-colors hover:text-[var(--color-cream)]">
                {f.email}
              </a>
            )}
            {f.address && <p className="max-w-xs">{f.address}</p>}
          </div>
          <div>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.followLabel || "FOLLOW THE CLUB"}
            </h4>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {SOCIALS.map((so) => (
                <li key={so.label}>
                  <a
                    href={so.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[var(--color-cream)]"
                  >
                    {so.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-silver)]/10 pt-4 text-[11px] text-[var(--color-cream)]/50 md:flex-row">
          <p className="tracking-wide">
            © {new Date().getFullYear()} {f.copyright || "GALA. All rights reserved. Vision & Innovation Club."}
          </p>
          <a
            href="https://medamine-portfolio-v3.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="tracking-wide transition-colors hover:text-[var(--color-cream)]/80"
          >
            Designed &amp; developed by MedAmine.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
