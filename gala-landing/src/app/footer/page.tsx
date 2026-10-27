"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { GALA_EASE, GalaButton } from "../components/gala/Room";

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

  const countdown =
    days !== null && f.countdown ? String(f.countdown).replace("{days}", String(days)) : null;

  return (
    <footer className="relative w-full overflow-hidden bg-[var(--color-dark)] px-6 pb-10 pt-28 text-[var(--color-cream)] sm:px-12 sm:pt-36 font-sans">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_22%,rgba(122,26,42,0.38)_0%,transparent_75%)]"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* The mark, once more */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.2, ease: GALA_EASE }}
          className="flex flex-col items-center text-center"
        >
          <Image
            src="/GALA-silver.png"
            alt="Engineers' Gala"
            width={540}
            height={175}
            className="h-auto w-[220px] select-none sm:w-[300px] drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
          />
          {f.tagline && (
            <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--color-silver)]">
              {f.tagline}
            </p>
          )}
          {countdown && (
            <p className="mt-8 font-cinzel text-2xl font-light text-[var(--color-cream)]/90 sm:text-3xl">
              {countdown}
            </p>
          )}
          <div className="mt-10">
            <GalaButton href="/register">
              {texts.nav?.requestInvitation || "REQUEST INVITATION"}
            </GalaButton>
          </div>
        </motion.div>

        {/* Practical details */}
        <div className="mt-24 grid grid-cols-1 gap-10 border-t border-[var(--color-silver)]/12 pt-12 text-[13px] font-light leading-relaxed text-[var(--color-cream)]/70 sm:grid-cols-3 sm:gap-8">
          <div>
            <h4 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.eventLabel || "THE EVENING"}
            </h4>
            {inv.date && <p>{inv.date}</p>}
            {inv.venue && <p>{inv.venue}</p>}
          </div>
          <div>
            <h4 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.contactLabel || "CONCIERGE"}
            </h4>
            {f.email && (
              <a href={`mailto:${f.email}`} className="block transition-colors hover:text-[var(--color-cream)]">
                {f.email}
              </a>
            )}
            {f.address && <p className="mt-1 max-w-xs">{f.address}</p>}
          </div>
          <div>
            <h4 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">
              {f.followLabel || "FOLLOW THE CLUB"}
            </h4>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[var(--color-cream)]"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Signature line */}
        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-[var(--color-silver)]/10 pt-8 text-[11px] text-[var(--color-cream)]/50 md:flex-row">
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
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex cursor-pointer items-center gap-2 whitespace-nowrap bg-transparent text-[10.5px] uppercase tracking-[0.24em] text-[var(--color-silver)] transition-colors hover:text-[var(--color-cream)] luxury-focus-ring"
          >
            {f.backToTop || "Return to the entrance"}
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true" className="transition-transform duration-500 group-hover:-translate-y-0.5">
              <path d="M5 11V1M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
