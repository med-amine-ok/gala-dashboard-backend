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

/** Days, hours and minutes to the doors (client-only, refreshed each half minute) */
function useCountdown() {
  const [left, setLeft] = useState<{ d: number; h: number; m: number } | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = EVENT_DATE.getTime() - Date.now();
      if (ms <= 0) return setLeft(null);
      setLeft({ d: Math.floor(ms / 86_400_000), h: Math.floor(ms / 3_600_000) % 24, m: Math.floor(ms / 60_000) % 60 });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return left;
}

/**
 * THE FAREWELL — a finale with a giant wordmark (after Godly's footer
 * collection and Still/Form's closing spread)
 * One closing line and the request, the time left to the doors, the practical
 * links in four quiet columns, and across the whole width at the very bottom
 * the Engineers' Gala mark, which the dust has been travelling toward all
 * along and forms here.
 */
export default function Footer() {
  const { texts, lang } = useLanguage();
  const f = texts.footer || {};
  const inv = texts.invitations || {};
  const fr = lang === "fr";
  const left = useCountdown();

  const columns: { title: string; items: { label: string; href?: string; external?: boolean }[] }[] = [
    {
      title: f.eventLabel || (fr ? "LA SOIRÉE" : "THE EVENING"),
      items: [
        ...(inv.date ? [{ label: inv.date }] : []),
        ...(inv.venue ? [{ label: inv.venue }] : []),
        { label: fr ? "Le programme" : "The programme", href: "#piliers" },
        { label: fr ? "Le pass" : "The pass", href: "#tarification" },
      ],
    },
    {
      title: fr ? "LE CLUB" : "THE CLUB",
      items: [
        { label: "Vision & Innovation Club", href: "#apropos" },
        { label: "École Nationale Polytechnique" },
      ],
    },
    {
      title: f.contactLabel || "CONCIERGE",
      items: [...(f.email ? [{ label: f.email, href: `mailto:${f.email}` }] : []), ...(f.address ? [{ label: f.address }] : [])],
    },
    {
      title: f.followLabel || "FOLLOW THE CLUB",
      items: SOCIALS.map((s) => ({ label: s.label, href: s.href, external: true })),
    },
  ];

  return (
    <footer className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-transparent px-6 pb-6 pt-24 text-[var(--color-cream)] sm:px-12 sm:pt-32 font-sans">
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col">
        {/* The closing line and the request */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            {f.tagline && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)] sm:text-[11px] sm:tracking-[0.34em]">{f.tagline}</p>
            )}
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1.2, ease: GALA_EASE }}
              className="mt-5 font-cormorant text-[clamp(44px,7vw,112px)] font-medium leading-[0.95] text-[var(--color-cream)]"
            >
              {fr ? (
                <>
                  À très bientôt,
                  <br />
                  <span className="italic">pour la soirée.</span>
                </>
              ) : (
                <>
                  See you
                  <br />
                  <span className="italic">on the evening.</span>
                </>
              )}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, delay: 0.2, ease: GALA_EASE }}
            className="lg:col-span-4 lg:pb-3"
          >
            {left && (
              <p className="flex items-baseline gap-4 text-[var(--color-cream)]/70">
                {[
                  { v: left.d, l: fr ? "jours" : "days" },
                  { v: left.h, l: fr ? "h" : "hrs" },
                  { v: left.m, l: "min" },
                ].map((u) => (
                  <span key={u.l} className="flex items-baseline gap-1.5">
                    <span className="font-cinzel text-[clamp(30px,3.2vw,44px)] font-semibold leading-none gala-engraved">{String(u.v).padStart(2, "0")}</span>
                    <span className="text-[11px] uppercase tracking-[0.2em]">{u.l}</span>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-2 text-[12.5px] text-[var(--color-cream)]/50">{fr ? "avant l'ouverture des portes" : "until the doors open"}</p>
            <div className="mt-6">
              <GalaButton href="/register">{texts.nav?.requestInvitation || "REQUEST INVITATION"}</GalaButton>
            </div>
          </motion.div>
        </div>

        {/* The directory */}
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-[var(--color-silver)]/12 pt-10 text-[13px] font-light leading-relaxed sm:mt-20 lg:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title} className="min-w-0">
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">{c.title}</h3>
              <ul className="space-y-1.5">
                {c.items.map((it) => (
                  <li key={it.label} className="text-[var(--color-cream)]/70">
                    {it.href ? (
                      <a
                        href={it.href}
                        target={it.external ? "_blank" : undefined}
                        rel={it.external ? "noopener noreferrer" : undefined}
                        className="group inline-flex items-center gap-1.5 break-words transition-colors hover:text-[var(--color-cream)]"
                      >
                        <span className="relative">
                          {it.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--color-cream)]/60 transition-all duration-500 group-hover:w-full" />
                        </span>
                        {it.external && <span aria-hidden className="text-[10px] opacity-60">↗</span>}
                      </a>
                    ) : (
                      <span className="block max-w-[260px]">{it.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The mark across the whole width — the dust forms it here; the image is its fallback twin */}
        <div className="mt-14 flex flex-1 items-end sm:mt-20">
          <div id="gala-logo-anchor" className="relative w-full">
            <Image
              src="/GALA-silver.png"
              alt="Engineers' Gala"
              width={631}
              height={215}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="gala-footer-mark h-auto w-full select-none drop-shadow-[0_10px_24px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-silver)]/10 pt-4 text-[11px] text-[var(--color-cream)]/50 md:flex-row">
          <p className="tracking-wide">
            © {new Date().getFullYear()} {f.copyright || "GALA. All rights reserved. Vision & Innovation Club."}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex min-h-[40px] items-center gap-2 uppercase tracking-[0.24em] transition-colors hover:text-[var(--color-cream)] luxury-focus-ring"
          >
            {f.backToTop || "Return to the entrance"} <span aria-hidden>↑</span>
          </button>
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
