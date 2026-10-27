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
        {/* I & II — THE ENTRANCE (HERO) & THE MANIFESTO */}
        <Accueil />

        {/* III — THE GALLERY (ARCHIVES) */}
        <section id="historique">
          <Historique />
        </section>

        {/* IV — THE PROGRAMME (GALA 2026) */}
        <section id="piliers">
          <ExperiencePillars />
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
