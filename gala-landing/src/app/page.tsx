"use client";

import NavBar from "./components/NavBar";
import Accueil from "./accueil/page";
import ExperiencePillars from "./experience/page";
import Historique from "./historique/page";
import Pricing from "./ticket/page";
import Apropos from "./apropos/page";
import Footer from "./footer/page";
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

      <main className="w-full overflow-x-clip">
        {/* 01 & 02 — HERO PORTAL JOURNEY & THE MANIFESTO */}
        <Accueil />

        {/* 03 — THE FOUR PILLARS */}
        {/* <section id="piliers">
          <ExperiencePillars />
        </section> */}

        {/* 04 — GALA ARCHIVES */}
        <section id="historique">
          <Historique />
        </section>

        {/* 05 — INVITATION / TICKET PASS */}
        <section id="tarification">
          <Pricing />
        </section>

        {/* 05 — THE STORY (HERITAGE & VIC) */}
        <section id="apropos">
          <Apropos />
        </section>

        {/* 06 — FOOTER */}
        <section id="footer">
          <Footer />
        </section>
      </main>
    </div>
  );
}
