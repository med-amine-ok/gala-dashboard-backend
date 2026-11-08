"use client";

import NavBar from "./components/NavBar";
import Accueil from "./accueil/page";
import HotelWalk from "./components/hotel/HotelWalk";
import GalaWorld from "./components/gala/GalaWorld";
import SmoothScroll from "./components/gala/SmoothScroll";
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
      <SmoothScroll />
      <NavBar />

      {/* The hall every room after the entrance stands in (fixed WebGL, behind the content) */}
      <GalaWorld />

      <main className="relative z-[1] w-full overflow-x-clip">
        {/* I & II — THE ENTRANCE (HERO) & THE MANIFESTO */}
        <Accueil />

        {/* III–VI — THE HOTEL: through the portal, one walk through a palace hotel:
            the reception, the salon of frames, the ballroom, the club and its farewell wall */}
        <HotelWalk />

      </main>
    </div>
  );
}
