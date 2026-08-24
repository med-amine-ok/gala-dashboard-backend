"use client";

import Image from "next/image";
import Link from "next/link";
import Historique from "./historique/page";
import Accueil from "./accueil/page";
import Apropos from "./apropos/page";
import NavBar from "./components/NavBar";
import CetteAnnee from "./annee/page";
import Agenda from "./agenda/page";
//Import Mixpanel SDK
import mixpanel from "mixpanel-browser";
import RegistrationPage from "./register/page";
import Footer from "./footer/page";
import Pricing from "./ticket/page";
import App from "./app/page";

// Create an instance of the Mixpanel object, your token is already added to this snippet
mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
  autocapture: true,
  record_sessions_percent: 100,
  api_host: "https://api-eu.mixpanel.com",
});

export default function Home() {
  return (
    <div>
      <main className="w-full overflow-x-hidden bg-[#F7F4EE] text-[#1A1A1A]">
        <div className="fixed top-0 left-0 w-full z-50">
          <NavBar />
        </div>

        <section id="home" className="min-h-screen scroll-mt-16">
          <Accueil />
        </section>
        <section id="historique" className="min-h-screen scroll-mt-16">
          <Historique />
        </section>
        <section id="cetteannee" className="min-h-screen scroll-mt-16">
          <CetteAnnee />
        </section>
        {/* <section id="agenda" className="min-h-screen scroll-mt-16">
          <Agenda />
        </section> */}
        {/* Add other sections like Apropos, CetteAnnee, Contact here */}
        {/* Historique section */}
        <section id="tarification" className="min-h-screen scroll-mt-16 ">
          <Pricing />
        </section>
        <section id="app" className="min-h-screen scroll-mt-16 ">
          <App />
        </section>
        <section id="apropos" className="min-h-screen scroll-mt-16 ">
          <Apropos />
        </section>

        {/*

        
         <section id="register">
          <RegistrationPage />
        </section>
        */}
        <section id="contact">
          <Footer />
        </section>
      </main>
    </div>
  );
}
