"use client";

import NavBar from "./components/NavBar";
import Accueil from "./accueil/page";
import Manifesto from "./manifesto/page";
import Historique from "./historique/page";
import CetteAnnee from "./annee/page";
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
    <div className="w-full min-h-screen bg-[var(--color-primary)] text-[var(--color-cream)]">
      <NavBar />

      <main className="w-full overflow-x-hidden">
        {/* 01 — HERO */}
        <section id="home">
          <Accueil />
        </section>

        {/* 02 — THE MANIFESTO */}
        <section id="manifesto">
          <Manifesto />
        </section>

        {/* 03 — GALA ARCHIVES */}
        <section id="historique">
          <Historique />
        </section>

        {/* 04 — THIS YEAR (GALA 2026) */}
        <section id="cetteannee">
          <CetteAnnee />
        </section>

        {/* 05 — INVITATION / TICKET */}
        <section id="tarification">
          <Pricing />
        </section>

        {/* 06 — THE STORY (HERITAGE & VIC) */}
        <section id="apropos">
          <Apropos />
        </section>

        {/* 07 — FOOTER */}
        <section id="footer">
          <Footer />
        </section>
      </main>
    </div>
  );
}
