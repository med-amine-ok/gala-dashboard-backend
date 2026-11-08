"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Smooth, inertial scrolling for the landing page (Lenis, as on most Awwwards
 * sites). A fast flick of the wheel or trackpad no longer jumps the page in
 * big steps: the scroll glides to where you sent it, so the pinned scenes (the
 * entrance, the reel, the letter) move continuously instead of in jolts.
 * It drives the browser's own scroll, so sticky sections and every scroll-
 * linked animation keep working. Touch keeps the phone's native momentum;
 * with reduced motion nothing changes.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      // How quickly the page catches up with the wheel (lower = silkier)
      lerp: 0.085,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      // In-page links (#tarification, the menu) glide there too
      anchors: { offset: 0, duration: 1.4 },
    });
    // Other code that scrolls the page (chapter rail, back to top) uses
    // window.scrollTo; Lenis follows it
    return () => lenis.destroy();
  }, []);
  return null;
}
