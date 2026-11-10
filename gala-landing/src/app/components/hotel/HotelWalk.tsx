"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import Stage3D, { type StageContext } from "../gala/Stage3D";
import { GALA_EASE, GalaButton } from "../gala/Room";
import { CHAPTER_IMAGES, NUMERALS, type Chapter } from "../gala/Programme";
import { buildHotel, hotelPlan, type FrameItem, type HotelWords } from "./buildHotel";
import Historique from "../../historique/page";
import Pricing from "../../ticket/page";
import Apropos from "../../apropos/page";
import Footer from "../../footer/page";
import { CREDIT, SOCIALS } from "../../../lib/socials";
import { REGISTRATION_OPENS, registrationIsOpen } from "../../../lib/event";

// One photo per edition, named after its year
const EDITION_IMAGES: Record<string, string> = {
  "2017": "/images/2017.jpg",
  "2018": "/images/2018.jpg",
  "2019": "/images/2019.png",
  "2021": "/images/2021.jpg",
  "2022": "/images/2022.jpg",
  "2023": "/images/2023.jpg",
  "2024": "/images/2024.webp",
  "2025": "/images/2025.webp",
};
const YEARS = ["2017", "2018", "2019", "2021", "2022", "2023", "2024", "2025"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/**
 * THE HOTEL — after the portal, one continuous walk through a palace hotel in
 * the manner of the Hôtel El Djazaïr (Algiers). Its words live in the rooms:
 * the manifesto engraved beside the reception arch, a plaque under every frame
 * in the salon, the invitation's terms on a place card by the letter, the club
 * in the Salon des Ambassadeurs. Scrolling walks you through it.
 * Reduced motion / no WebGL: the previous sections, in order.
 */
export default function HotelWalk() {
  const reduce = useReducedMotion();
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  if (reduce || webgl === false) {
    return (
      <>
        <section id="historique" className="relative">
          <Historique />
        </section>
        <section id="tarification">
          <Pricing />
        </section>
        <section id="apropos">
          <Apropos />
        </section>
        <section id="footer">
          <Footer />
        </section>
      </>
    );
  }
  return <Walk />;
}

function Walk() {
  const { texts, lang } = useLanguage();
  const fr = lang === "fr";
  const a = texts.archives || {};
  const chapters: Chapter[] = texts.thisYear?.chapters || [];

  // From this year back to the first: 2026's four acts, then every edition, newest first
  const frames: FrameItem[] = useMemo(() => {
    const eds = YEARS.map((year, i) => {
      const e = a.editions?.[year] || {};
      return {
        src: EDITION_IMAGES[year],
        yearCard: year,
        eyebrow: `Chapter ${ROMAN[i]} · ${year}`,
        title: (e.title || `GALA ${year}`).replace(/^(GALA\s+)?\d{4}\s*·\s*/, ""),
        story: e.story || "",
        stats: e.stats || [],
      };
    });
    const acts = chapters.map((c, i) => ({
      src: CHAPTER_IMAGES[c.id] || CHAPTER_IMAGES.people,
      eyebrow: `2026 · ${NUMERALS[i]} · ${c.subtitle}`,
      title: c.title,
      story: c.description,
    }));
    return [...acts, ...eds.reverse()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Registration: closed (a sealed letter and its clock) until it opens, then
  // the walk is rebuilt with the letter that opens and its pass
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (registrationIsOpen()) return setOpen(true);
    setOpen(false);
    const wait = REGISTRATION_OPENS.getTime() - Date.now();
    if (wait > 2_000_000_000) return;
    const id = window.setTimeout(() => setOpen(true), wait + 500);
    return () => window.clearTimeout(id);
  }, []);

  // The words of each room, engraved in the scene
  const words: HotelWords = useMemo(() => {
    const m = texts.manifesto || {};
    const t = texts.invitations || {};
    const s = texts.story || {};
    return {
      manifesto: {
        label: m.label || "THE GALA MANIFESTO",
        headline: m.headline || "One day.\nThe right people.\nEndless possibilities.",
        body: m.paragraph1,
        quote: m.quote,
      },
      invitation: {
        label: t.label || "OFFICIAL ADMISSION PASS",
        price: t.price || "1,000 DA",
        inclusions: t.inclusions || [],
        when: t.date,
        ...(open
          ? {}
          : {
              sealed: {
                opensAt: REGISTRATION_OPENS.getTime(),
                eyebrow: fr ? "L'invitation est scellée" : "The invitation is sealed",
                title: texts.register?.closed?.title || (fr ? "Les inscriptions ouvrent le 10 novembre." : "Registration opens on 10 November."),
                countdown: texts.register?.closed?.countdown || (fr ? "Ouverture dans" : "Opens in"),
                labels: fr ? (["jours", "heures", "min", "sec"] as [string, string, string, string]) : (["days", "hours", "min", "sec"] as [string, string, string, string]),
                note: t.date,
              },
            }),
      },
      club: {
        label: s.roomLabel || "THE HOSTS",
        lead: s.lead,
        headline: (s.headline || "").replace(/\n/g, " "),
        stats: s.stats || [],
        pillars: s.pillars || [],
      },
      venue: t.venue,
      farewell: farewellWords(texts, fr),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, open]);

  const plan = hotelPlan(frames.length, !open);
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [u, setU] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
    setU(Math.round(v * plan.total * 50) / 50);
  });

  // The walk lies under the portal: it only starts drawing as the doors come
  // close (the last ~30% of the portal), just before the portal dissolves into it
  const { scrollYProgress: arriving } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const [active, setActive] = useState(false);
  useMotionValueEvent(arriving, "change", (v) => setActive(v > 0.75));

  // The hotel is built once the entrance has loaded (when the browser is idle,
  // or as soon as you start scrolling), so it never slows the first screen
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setArmed(true);
    };
    const onScroll = () => window.scrollY > window.innerHeight * 0.15 && arm();
    window.addEventListener("scroll", onScroll, { passive: true });
    const idle = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(arm, { timeout: 2500 });
      else setTimeout(arm, 1200);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => {
      done = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", idle);
    };
  }, []);

  // Fonts first, so the engraved words use the Gala's typefaces
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => live && setFontsReady(true));
    return () => {
      live = false;
    };
  }, []);

  const setup = useCallback(
    (ctx: StageContext) => buildHotel(ctx, frames, words, progress),
    // Rebuilt when the language changes (the engraved words change)
    [frames, words],
  );

  const at = (x: number) => `calc((100% - 100vh) * ${Math.max(0, x) / plan.total})`;
  const goTo = (x: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((el.offsetHeight - window.innerHeight) * x) / plan.total + 2, behavior: "smooth" });
  };

  // Where you are
  const frameIdx = Math.max(0, Math.min(frames.length - 1, Math.round((u - plan.frameU(0)) / 0.85)));
  const inSalon = u > plan.frameU(0) - 0.45 && u < plan.salonEnd + 0.2;
  const inInvitation = u > plan.letterEnd - 0.2 && u < plan.invitationEnd + 0.1;
  const settled = u > plan.passHeld - 0.15 && u < plan.invitationEnd + 0.05;
  const rooms = [
    { label: fr ? "Réception" : "Reception", from: 0, to: plan.receptionEnd, go: plan.panelLeft },
    { label: "Archives", from: plan.receptionEnd, to: plan.salonEnd, go: plan.frameU(0) },
    { label: "Invitation", from: plan.salonEnd, to: plan.letterClosed + 0.3, go: plan.passHeld },
    { label: fr ? "Le club" : "The club", from: plan.letterClosed + 0.3, to: plan.total, go: plan.clubIn },
  ];
  const roomNow = Math.max(0, rooms.findIndex((r) => u >= r.from && u < r.to));
  const current = u >= plan.total - 0.01 ? rooms.length - 1 : roomNow;
  // The silver line fills evenly between the four stops
  const r = rooms[current];
  const within = Math.min(1, Math.max(0, (u - r.from) / Math.max(0.001, r.to - r.from)));
  const fill = Math.min(1, (current + within) / (rooms.length - 1));

  return (
    <div
      // Laid under the whole portal (the hero is exactly 160svh / 175svh tall,
      // 60svh / 75svh of it scroll), pinned from the top of the page: the portal
      // dissolves straight into the live hotel, nothing scrolls by in between
      className="relative z-0 -mt-[160svh] h-[calc(var(--walk-h)+60svh)] md:-mt-[175svh] md:h-[calc(var(--walk-h)+75svh)]"
      style={{ ["--walk-h" as string]: `${plan.total * 72 + 100}vh` }}
    >
      {/* The walk itself starts where the portal ends; anchors for the menu and the page's dust */}
      <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-[60svh] h-[var(--walk-h)] md:top-[75svh]">
        <div id="historique" className="absolute left-0" style={{ top: at(plan.frameU(0) - 0.6) }} />
        <div id="piliers" className="absolute left-0" style={{ top: at(plan.frameU(0) - 0.3) }} />
        <div id="tarification" className="absolute left-0" style={{ top: at(plan.letterStart - 0.3) }} />
        <div id="apropos" className="absolute left-0" style={{ top: at(plan.clubIn - 0.5) }} />
        <div id="footer" className="absolute left-0" style={{ top: at(plan.farewell - 0.4) }} />
      </div>

      {/* The rooms' words, for screen readers (the eyes read them in the hotel) */}
      <RoomWords frames={frames} words={words} />

      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-[#2a1520]">
        {fontsReady && armed && <Stage3D setup={setup} cursor={settled} active={active} className="absolute inset-0" />}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(14,1,8,0.45)_100%)]" />

        <AnimatePresence>
          {inSalon && (
            <motion.div
              key="salon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[84px] sm:px-10"
            >
              <div className="mx-auto flex max-w-7xl items-baseline justify-between [text-shadow:0_1px_12px_rgba(14,1,8,0.8)]">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-cream)]/85">III · {a.label || "THE ARCHIVES"}</span>
                <span className="font-cinzel text-[11px] tracking-[0.24em] text-[var(--color-cream)]/80">
                  {String(frameIdx + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}
                </span>
              </div>
            </motion.div>
          )}
          {inInvitation && (
            <motion.div
              key="invitation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: GALA_EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute inset-x-0 bottom-[78px] z-10 flex flex-col items-center gap-3 px-5 sm:bottom-[92px]"
            >
              {open ? (
                <GalaButton href="/register">{texts.invitations?.selectCTA || "REQUEST YOUR ADMISSION PASS"}</GalaButton>
              ) : (
                <p className="font-cormorant text-[19px] italic text-[var(--color-cream)]/90 [text-shadow:0_1px_12px_rgba(14,1,8,0.95)] sm:text-[21px]">
                  {fr ? "L'enveloppe s'ouvrira avec les inscriptions." : "The envelope opens when registration does."}
                </p>
              )}
              <p
                className={`text-[11px] uppercase tracking-[0.26em] text-[var(--color-cream)]/70 transition-opacity duration-700 [text-shadow:0_1px_10px_rgba(14,1,8,0.9)] ${settled ? "opacity-100" : "opacity-0"}`}
              >
                {texts.invitations?.flipHint || (fr ? "Touchez le pass pour le retourner" : "Tap the pass to turn it over")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The four rooms, evenly spaced */}
        <nav aria-label={fr ? "Les salles" : "The rooms"} className="absolute inset-x-0 bottom-0 z-20 px-6 pb-4 sm:px-10 sm:pb-6">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute left-[5px] right-[5px] top-[5px] h-px bg-[var(--color-cream)]/20" />
            <div
              className="absolute left-[5px] top-[5px] h-px bg-[linear-gradient(90deg,var(--color-silver),var(--color-silver-light))]"
              style={{ width: `calc((100% - 10px) * ${fill})` }}
            />
            <ol className="relative flex justify-between">
              {rooms.map((room, i) => (
                <li key={room.label} className={`flex ${i === 0 ? "justify-start" : i === rooms.length - 1 ? "justify-end" : "justify-center"}`}>
                  <button
                    type="button"
                    onClick={() => goTo(room.go)}
                    aria-current={i === current ? "step" : undefined}
                    className={`group flex flex-col gap-2 luxury-focus-ring ${i === 0 ? "items-start" : i === rooms.length - 1 ? "items-end" : "items-center"}`}
                  >
                    <span
                      className={`block h-[11px] w-[11px] rotate-45 border transition-colors duration-700 ${
                        i <= current ? "border-[var(--color-silver-light)] bg-[var(--color-silver-light)]" : "border-[var(--color-cream)]/40 bg-[#1d0210] group-hover:border-[var(--color-silver-light)]"
                      }`}
                    />
                    <span
                      className={`whitespace-nowrap font-cinzel text-[10px] tracking-[0.18em] transition-opacity duration-700 [text-shadow:0_1px_10px_rgba(14,1,8,0.9)] sm:text-[10.5px] ${
                        i === current ? "opacity-100" : "opacity-55 group-hover:opacity-85"
                      }`}
                    >
                      {room.label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>
    </div>
  );
}

/** Every word engraved in the hotel, for assistive technology */
/** The page's last words, for the farewell wall in the club */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function farewellWords(texts: any, fr: boolean): HotelWords["farewell"] {
  const f = texts.footer || {};
  const inv = texts.invitations || {};
  return {
    tagline: f.tagline,
    title: fr ? ["À très bientôt,", "pour la soirée."] : ["See you", "on that evening."],
    countdownLabels: fr ? ["jours", "h", "min"] : ["days", "hrs", "min"],
    until: fr ? "avant l'ouverture des inscriptions" : "until registration opens",
    cta: texts.nav?.requestInvitation || "REQUEST INVITATION",
    columns: [
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
        items: [{ label: "Vision & Innovation Club", href: "#apropos" }, { label: "École Nationale Polytechnique" }],
      },
      {
        title: f.contactLabel || "CONCIERGE",
        items: [...(f.email ? [{ label: f.email, href: `mailto:${f.email}` }] : []), ...(f.address ? [{ label: f.address }] : [])],
      },
      { title: f.followLabel || "FOLLOW THE CLUB", items: SOCIALS },
    ],
    copyright: f.copyright || "GALA. All rights reserved. Vision & Innovation Club.",
    backToTop: f.backToTop || "Return to the entrance",
    credit: CREDIT,
  };
}

// The rooms' words never change while you walk: rendered once, not on every scroll step
const RoomWords = memo(function RoomWords({ frames, words }: { frames: FrameItem[]; words: HotelWords }) {
  return (
    <div className="sr-only">
      <h2>{words.manifesto.headline}</h2>
      {words.manifesto.body && <p>{words.manifesto.body}</p>}
      {words.manifesto.quote && <p>{words.manifesto.quote}</p>}
      <ol>
        {frames.map((f) => (
          <li key={f.eyebrow}>
            <h3>
              {f.eyebrow}: {f.title}
            </h3>
            {f.story && <p>{f.story}</p>}
          </li>
        ))}
      </ol>
      <h2>{words.invitation.label}</h2>
      <p>{words.invitation.price}</p>
      <ul>
        {words.invitation.inclusions.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <h2>{words.club.label}</h2>
      {words.club.lead && <p>{words.club.lead}</p>}
      <ul>
        {words.club.pillars.map((p) => (
          <li key={p.title}>
            {p.title}: {p.desc}
          </li>
        ))}
      </ul>
      {/* The farewell wall's links, reachable from the keyboard */}
      <h2>
        {words.farewell.title.join(" ")}
      </h2>
      <a href="/register">{words.farewell.cta}</a>
      {words.farewell.columns.map((c) => (
        <ul key={c.title} aria-label={c.title}>
          {c.items.map((it) => (
            <li key={it.label}>{it.href ? <a href={it.href} target={/^https?:/.test(it.href) ? "_blank" : undefined} rel="noopener noreferrer">{it.label}</a> : it.label}</li>
          ))}
        </ul>
      ))}
      <p>
        © {new Date().getFullYear()} {words.farewell.copyright}
      </p>
      <a href={words.farewell.credit.href} target="_blank" rel="noopener noreferrer">
        {words.farewell.credit.label}
      </a>
    </div>
  );
});
