"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Stage3D — one small WebGL stage that lives inside a section, in the page
 * flow, under that section's copy. A section hands it a `setup` that builds
 * its scene; the stage owns everything else:
 *  - a transparent renderer sized to its box (ResizeObserver), DPR capped,
 *  - a studio environment for silver and glass,
 *  - a render loop that only runs while the stage is on screen and the tab
 *    is visible,
 *  - a softened pointer (-1..1 across the stage) for parallax and tilt,
 *  - disposal of every geometry, material and texture on unmount.
 * With reduced motion or without WebGL it renders `fallback` instead.
 */

export interface StageContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isMobile: boolean;
  size: { w: number; h: number };
  /** Softened pointer over the stage, -1..1 on each axis (0 when away) */
  pointer: THREE.Vector2;
  /** True while the cursor is over the stage */
  hovering: () => boolean;
  /** Loads an image into a texture (sRGB, cached per stage) */
  texture: (url: string) => Promise<THREE.Texture>;
}

export interface StageHandle {
  update: (dt: number, t: number) => void;
  resize?: (w: number, h: number) => void;
  dispose?: () => void;
  /** Clicks on the stage (e.g. to turn a card over), with the point in NDC (-1..1) */
  onClick?: (ndc?: { x: number; y: number }) => void;
  /** Whether the point (NDC) is clickable: shows a hand cursor */
  hover?: (ndc: { x: number; y: number }) => boolean;
}

// The optimiser only serves its configured widths (Next's default device sizes) at q=75
const IMAGE_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048];
export const optimisedImage = (src: string, w = 1200) => {
  if (src.endsWith(".svg")) return src;
  const width = IMAGE_WIDTHS.find((s) => s >= w) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
};

export default function Stage3D({
  setup,
  className = "",
  fallback = null,
  cursor = false,
  active = true,
}: {
  setup: (ctx: StageContext) => StageHandle;
  className?: string;
  fallback?: React.ReactNode;
  /** Show a pointer cursor (the stage is clickable) */
  cursor?: boolean;
  /** Draw only while true (on top of being on screen), e.g. while another layer covers it */
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const setupRef = useRef(setup);
  setupRef.current = setup;
  const activeRef = useRef(active);
  activeRef.current = active;
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFailed(true);
      return;
    }
    const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block;";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.7;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    const size = { w: 1, h: 1 };
    const pointer = new THREE.Vector2();
    const target = new THREE.Vector2();
    let over = false;

    const loader = new THREE.TextureLoader();
    const cache = new Map<string, Promise<THREE.Texture>>();
    const textures: THREE.Texture[] = [];
    const texture = (url: string) => {
      let p = cache.get(url);
      if (!p) {
        p = url.endsWith(".svg")
          ? // Vectors are rasterised crisply at 2048px wide
            new Promise<THREE.Texture>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                const w = 2048;
                const h = Math.round((w * (img.naturalHeight || 1)) / (img.naturalWidth || 1));
                const c = document.createElement("canvas");
                c.width = w;
                c.height = h;
                c.getContext("2d")!.drawImage(img, 0, 0, w, h);
                const t = new THREE.CanvasTexture(c);
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = 8;
                textures.push(t);
                resolve(t);
              };
              img.onerror = reject;
              img.src = url;
            })
          : loader.loadAsync(url).then((t) => {
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = 8;
              textures.push(t);
              return t;
            });
        cache.set(url, p);
      }
      return p;
    };

    const ctx: StageContext = {
      scene,
      camera,
      renderer,
      isMobile,
      size,
      pointer,
      hovering: () => over,
      texture,
    };
    const handle = setupRef.current(ctx);

    // On phones the stage's height follows the address bar (dvh). Height-only
    // changes keep the canvas: it is drawn at the tallest height seen and
    // anchored to the top, so the picture never clears, stretches or jumps.
    let drawnH = 0;
    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      const sameW = w === size.w;
      if (isMobile && sameW && h <= drawnH && drawnH - h < 200) return;
      size.w = w;
      size.h = isMobile && sameW ? Math.max(h, drawnH) : h;
      drawnH = size.h;
      canvas.style.height = isMobile ? `${size.h}px` : "100%";
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      handle.resize?.(size.w, size.h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (e.pointerType !== "mouse") return;
      if (over && handle.hover) {
        const hand = handle.hover({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) });
        canvas.style.cursor = hand ? "pointer" : "";
      }
      target.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      if (!over) target.set(0, 0);
    };
    const onClick = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      handle.onClick?.({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("click", onClick);

    const timer = new THREE.Timer();
    timer.connect(document);
    const frame = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 1 / 20);
      pointer.x = THREE.MathUtils.damp(pointer.x, target.x, 3.5, dt);
      pointer.y = THREE.MathUtils.damp(pointer.y, target.y, 3.5, dt);
      handle.update(dt, timer.getElapsed());
      renderer.render(scene, camera);
    };

    // Only draw while on screen and the tab is visible
    let onScreen = false;
    // Shaders are compiled in the background first, so the first frame never stalls
    let compiled = false;
    const sync = () => renderer.setAnimationLoop(compiled && onScreen && activeRef.current && !document.hidden ? frame : null);
    const ready = () => {
      compiled = true;
      sync();
    };
    renderer.compileAsync(scene, camera).then(ready, ready);
    syncRef.current = sync;
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { rootMargin: "120px" },
    );
    io.observe(host);
    document.addEventListener("visibilitychange", sync);

    return () => {
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", sync);
      timer.dispose();
      handle.dispose?.();
      const seen = new Set<unknown>();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry && !seen.has(m.geometry)) {
          seen.add(m.geometry);
          m.geometry.dispose();
        }
        for (const mat of [m.material ?? []].flat() as THREE.Material[]) {
          if (!seen.has(mat)) {
            seen.add(mat);
            mat.dispose();
          }
        }
      });
      textures.forEach((t) => t.dispose());
      envRT.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => syncRef.current(), [active]);

  if (failed) return <>{fallback}</>;
  // Positioned by the caller (absolute/fixed), otherwise a containing block for the canvas
  const positioned = /(^|\s)!?(absolute|fixed)(\s|$)/.test(className);
  return (
    <div
      ref={ref}
      aria-hidden
      className={`${positioned ? "" : "relative"} ${cursor ? "cursor-pointer" : ""} ${className}`}
    />
  );
}

/** A soft round shadow texture for objects resting above the velvet */
export function softShadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(8,0,5,0.85)");
  grad.addColorStop(0.5, "rgba(8,0,5,0.35)");
  grad.addColorStop(1, "rgba(8,0,5,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Silver dust drifting through a stage (additive points, a few hundred) */
export function stageDust(count: number, spread: THREE.Vector3, size = 0.05) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(0xe8ecf4),
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(c);
    })(),
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

/** A silver picture frame (four bars) sized around a w × h picture */
export function silverFrame(w: number, h: number, bar: number, material: THREE.Material) {
  const g = new THREE.Group();
  const d = bar * 0.8;
  const parts: [number, number, number, number][] = [
    [w + bar * 2, bar, 0, h / 2 + bar / 2],
    [w + bar * 2, bar, 0, -h / 2 - bar / 2],
    [bar, h, w / 2 + bar / 2, 0],
    [bar, h, -w / 2 - bar / 2, 0],
  ];
  for (const [bw, bh, x, y] of parts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), material);
    m.position.set(x, y, 0);
    g.add(m);
  }
  return g;
}

/** Brushed-silver material for frames and trims */
export function silverMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.28 });
}
