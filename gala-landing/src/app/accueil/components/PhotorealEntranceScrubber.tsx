"use client";

import React, { useEffect, useRef, useState } from "react";

interface PhotorealEntranceScrubberProps {
  scrollProgress: number;
  onLoaded?: () => void;
}

const FRAME_PATHS = [
  "/entrance/frame_0.jpg",
  "/entrance/frame_1.jpg",
  "/entrance/frame_2.jpg",
  "/entrance/frame_3.jpg",
  "/entrance/frame_4.jpg",
];

export default function PhotorealEntranceScrubber({
  scrollProgress,
  onLoaded,
}: PhotorealEntranceScrubberProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);
  const progressRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Parallax state for subtle desktop mouse response
  const mouseRef = useRef({ x: 0, y: 0, currentX: 0, currentY: 0 });

  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Preload frames progressively (first frame first for instantaneous poster display)
  useEffect(() => {
    let isCancelled = false;
    const images: HTMLImageElement[] = [];

    // Load first frame immediately
    const img0 = new Image();
    img0.src = FRAME_PATHS[0];
    img0.onload = () => {
      if (isCancelled) return;
      images[0] = img0;
      imagesRef.current = images;
      setFirstFrameLoaded(true);
      if (onLoaded) onLoaded();

      // Load remaining frames progressively
      FRAME_PATHS.slice(1).forEach((path, idx) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
          if (!isCancelled) {
            images[idx + 1] = img;
          }
        };
      });
    };

    return () => {
      isCancelled = true;
    };
  }, [onLoaded]);

  // Mouse move listener for subtle desktop parallax
  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseRef.current.x = (e.clientX - halfW) / halfW;
      mouseRef.current.y = (e.clientY - halfH) / halfH;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Main high-performance render loop using requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const images = imagesRef.current;
      if (!images[0]) return;

      // Smooth mouse parallax interpolation
      const mouse = mouseRef.current;
      mouse.currentX += (mouse.x - mouse.currentX) * 0.05;
      mouse.currentY += (mouse.y - mouse.currentY) * 0.05;

      const p = Math.max(0, Math.min(1, progressRef.current));
      // Eased progress (slightly slower start, smooth acceleration into entrance)
      const easedP = Math.pow(p, 1.25);

      // Map progress across the 5 frames (0.0 to 4.0)
      const maxIdx = images.length - 1;
      const targetVal = easedP * maxIdx;
      const baseIdx = Math.min(maxIdx, Math.floor(targetVal));
      const nextIdx = Math.min(maxIdx, baseIdx + 1);
      const blend = targetVal - baseIdx;

      const imgA = images[baseIdx] || images[0];
      const imgB = images[nextIdx] || imgA;

      // Draw helper with object-fit: cover and subtle zoom/parallax
      const drawCover = (
        img: HTMLImageElement,
        alpha: number,
        scaleOffset: number
      ) => {
        if (!img || !img.complete) return;
        ctx.globalAlpha = alpha;

        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;

        const hRatio = cw / iw;
        const vRatio = ch / ih;
        const baseRatio = Math.max(hRatio, vRatio);

        // Subtle scale dynamics between frames for seamless forward flight
        const finalRatio = baseRatio * (1 + scaleOffset * 0.08);

        const nw = iw * finalRatio;
        const nh = ih * finalRatio;

        // Apply smoothed desktop parallax (scaled to canvas coordinates)
        const parallaxOffsetX = mouse.currentX * 14 * dpr;
        const parallaxOffsetY = mouse.currentY * 8 * dpr;

        const x = (cw - nw) / 2 + parallaxOffsetX;
        const y = (ch - nh) / 2 + parallaxOffsetY;

        ctx.drawImage(img, 0, 0, iw, ih, x, y, nw, nh);
      };

      // Clear with dark burgundy base
      ctx.fillStyle = "#180306";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw base frame
      drawCover(imgA, 1.0, blend * 0.5);

      // Smoothly cross-fade to next frame as camera glides
      if (imgB !== imgA && blend > 0.005) {
        drawCover(imgB, blend, -(1 - blend) * 0.5);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden bg-[#180306]">
      {/* High-Performance 2D Canvas Scrubber */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover transition-opacity duration-700 ${
          firstFrameLoaded ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Subtle dusk atmospheric gradient overlay to tie seamlessly into the site header and footer */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#140206] via-transparent to-[rgba(20,2,6,0.5)] opacity-60" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(20,2,6,0.75)_100%)]" />
    </div>
  );
}
