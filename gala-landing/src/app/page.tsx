"use client";

import NavBar from "./components/NavBar";
import Accueil from "./accueil/page";
import Historique from "./historique/page";
import Pricing from "./ticket/page";
import Apropos from "./apropos/page";
import Footer from "./footer/page";
import GalaWorld from "./components/gala/GalaWorld";
import GalaMedia from "./components/gala/GalaMedia";
import mixpanel from "mixpanel-browser";

// Initialize Mixpanel if token is provided
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "https://api-eu.mixpanel.com",
  });
}

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-[var(--color-dark)] text-[var(--color-cream)]">
      <NavBar />

      {/* The hall every room after the entrance stands in (fixed WebGL, behind the content) */}
      <GalaWorld />
      {/* The rooms' photographs, drawn in WebGL over their frames */}
      <GalaMedia />

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
