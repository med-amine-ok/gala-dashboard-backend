"use client";

import NavBar from "./components/NavBar";
import Accueil from "./accueil/page";
import Historique from "./historique/page";
import Pricing from "./ticket/page";
import Apropos from "./apropos/page";
import Footer from "./footer/page";
import GalaWorld from "./components/gala/GalaWorld";
import { useEffect } from "react";

export default function Home() {
  // Analytics load only if configured, and only once the page is idle, so
  // they never compete with the entrance for the first seconds
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) return;
    const start = () =>
      import("mixpanel-browser").then(({ default: mixpanel }) =>
        mixpanel.init(token, {
          autocapture: true,
          record_sessions_percent: 100,
          api_host: "https://api-eu.mixpanel.com",
        }),
      );
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 4000 });
    else window.setTimeout(start, 2500);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[var(--color-dark)] text-[var(--color-cream)]">
      <NavBar />

      {/* The hall every room after the entrance stands in (fixed WebGL, behind the content) */}
      <GalaWorld />

      <main className="relative z-[1] w-full overflow-x-clip">
        {/* I & II — THE ENTRANCE (HERO) & THE MANIFESTO */}
        <Accueil />

        {/* III — THE CHAPTERS: past editions and this year's programme, one story */}
        <section id="historique" className="relative">
          {/* Hand-off: the entrance's dark hall dissolves into the enfilade */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] bg-gradient-to-b from-[#2E061E]/70 via-[#2E061E]/30 to-transparent" />
          <Historique />
        </section>

        {/* V — THE INVITATION */}
        <section id="tarification">
          <Pricing />
        </section>

        {/* VI — THE HOSTS (VIC) */}
        <section id="apropos">
          <Apropos />
        </section>

        {/* THE FAREWELL (FOOTER) */}
        <section id="footer">
          <Footer />
        </section>
      </main>
    </div>
  );
}
