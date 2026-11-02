"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * GalaMedia — the rooms' photographs, drawn in WebGL and locked to the layout.
 *
 * Any element marked `data-gala-media` (a picture frame's inner box holding a
 * Next <Image>) gets a plane in a transparent canvas laid over the page. The
 * DOM keeps its layout, alt text and fallback; the plane takes over the look:
 *  - it forms out of silver dust the first time it comes into view,
 *  - it bows like heavy card stock with the speed of the scroll, colours
 *    parting slightly as it moves,
 *  - under the cursor it tilts toward the guest and a lens swells,
 *  - when the frame's photograph changes, the new one burns through the old
 *    along a silver seam.
 * One renderer, one shared geometry, textures cached by URL. Images stay
 * plain DOM with reduced motion or without WebGL.
 */

const VERT = /* glsl */ `
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2 uMouse;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // The middle of the card bows away with the scroll's speed; its edges hold
    p.z += sin(uv.y * 3.14159265) * sin(uv.x * 3.14159265) * uVelocity * 110.0;
    // A lens swells under the cursor
    float d = distance(uv, uMouse);
    p.z += uHover * 34.0 * smoothstep(0.5, 0.0, d);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uAspectA;
  uniform float uAspectB;
  uniform float uPlaneAspect;
  uniform float uMix;
  uniform float uReveal;
  uniform float uVelocity;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  // object-fit: cover
  vec2 cover(vec2 uv, float imgAspect) {
    vec2 s = uPlaneAspect > imgAspect ? vec2(1.0, imgAspect / uPlaneAspect) : vec2(uPlaneAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  vec3 sampleSplit(sampler2D tex, vec2 uv, float aspect, float shift) {
    return vec3(
      texture2D(tex, cover(uv + vec2(shift, 0.0), aspect)).r,
      texture2D(tex, cover(uv, aspect)).g,
      texture2D(tex, cover(uv - vec2(shift, 0.0), aspect)).b
    );
  }

  void main() {
    vec2 uv = vUv;
    // A touch of magnification toward the cursor
    uv = (uv - uMouse) * (1.0 - 0.07 * uHover) + uMouse;
    float shift = clamp(uVelocity, -1.0, 1.0) * 0.012;

    vec3 a = sampleSplit(uTexA, uv, uAspectA, shift);
    vec3 col = a;
    if (uMix > 0.001) {
      vec3 b = sampleSplit(uTexB, uv, uAspectB, shift);
      // The new photograph burns through along a noisy front, rimmed in silver
      float n = noise(vUv * 6.0 + 2.3) * 0.75 + noise(vUv * 19.0) * 0.25;
      float m = smoothstep(n - 0.07, n + 0.07, uMix * 1.16 - 0.08);
      col = mix(a, b, m);
      float seam = 1.0 - abs(m * 2.0 - 1.0);
      col += vec3(0.92, 0.94, 1.0) * pow(seam, 5.0) * 0.55 * step(uMix, 0.999);
    }

    // Forming out of silver dust the first time it is seen
    float rn = noise(vUv * 9.0 + 7.1) * 0.7 + noise(vUv * 40.0) * 0.3;
    float alpha = smoothstep(rn - 0.05, rn + 0.05, uReveal * 1.12 - 0.06);
    float edge = 1.0 - abs(alpha * 2.0 - 1.0);
    col += vec3(0.95, 0.96, 1.0) * edge * 1.1 * step(uReveal, 0.999);

    // The house grade: settled exposure, plum in the shadows, a soft vignette
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = (col - 0.5) * 1.05 + 0.5;
    col *= 0.9;
    col = mix(col, col * vec3(1.0, 0.82, 0.96), 0.22 * (1.0 - luma));
    float vig = smoothstep(0.92, 0.3, length(vUv - 0.5));
    col *= mix(0.72, 1.0, vig);
    col += uHover * 0.035;

    gl_FragColor = vec4(col * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

type Entry = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  src: string;
  nextSrc: string | null;
  mix: number;
  reveal: number;
  seen: boolean;
  hover: number;
  mouse: THREE.Vector2;
  mouseTarget: THREE.Vector2;
};

export default function GalaMedia() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    } catch {
      return; // the photographs stay plain DOM
    }
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    // A camera in which one unit is one CSS pixel at z = 0
    const FOV = 32;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 10000);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = h / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      camera.updateProjectionMatrix();
    };
    resize();

    const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    const loader = new THREE.TextureLoader();
    const cache = new Map<string, Promise<THREE.Texture>>();
    const textures: THREE.Texture[] = [];
    const load = (url: string) => {
      let p = cache.get(url);
      if (!p) {
        p = loader.loadAsync(url).then((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
          textures.push(t);
          return t;
        });
        cache.set(url, p);
      }
      return p;
    };
    const aspectOf = (t: THREE.Texture) => {
      const img = t.image as { width: number; height: number };
      return img.width / img.height;
    };

    const entries = new Map<Element, Entry>();
    const srcOf = (el: Element) => {
      const imgs = el.querySelectorAll("img");
      const img = imgs[imgs.length - 1] as HTMLImageElement | undefined; // the newest during a swap
      return img ? img.currentSrc || img.src : "";
    };
    const hideDom = (el: Element) => {
      el.querySelectorAll("img").forEach((img) => {
        if ((img as HTMLElement).style.opacity !== "0") (img as HTMLElement).style.opacity = "0";
      });
    };

    const create = (el: Element, src: string) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexA: { value: null },
          uTexB: { value: null },
          uAspectA: { value: 1 },
          uAspectB: { value: 1 },
          uPlaneAspect: { value: 1 },
          uMix: { value: 0 },
          uReveal: { value: 0 },
          uVelocity: { value: 0 },
          uHover: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uTime: { value: 0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);
      const entry: Entry = {
        mesh,
        src,
        nextSrc: null,
        mix: 0,
        reveal: 0,
        seen: false,
        hover: 0,
        mouse: new THREE.Vector2(0.5, 0.5),
        mouseTarget: new THREE.Vector2(0.5, 0.5),
      };
      entries.set(el, entry);
      load(src).then((t) => {
        material.uniforms.uTexA.value = t;
        material.uniforms.uAspectA.value = aspectOf(t);
        hideDom(el);
      });
      return entry;
    };

    const remove = (el: Element) => {
      const e = entries.get(el);
      if (!e) return;
      scene.remove(e.mesh);
      e.mesh.material.dispose();
      entries.delete(el);
    };

    // Pointer: which frame is under the cursor, and where
    const pointer = { x: -1, y: -1 };
    const onPointer = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      pointer.x = ev.clientX;
      pointer.y = ev.clientY;
    };

    let lastScroll = window.scrollY;
    let velocity = 0;
    const timer = new THREE.Timer();
    timer.connect(document);

    const frame = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 1 / 20);
      const t = timer.getElapsed();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Scroll speed in screens per second, softened
      const y = window.scrollY;
      const raw = dt > 0 ? (y - lastScroll) / vh / dt : 0;
      lastScroll = y;
      velocity = THREE.MathUtils.damp(velocity, THREE.MathUtils.clamp(raw * 0.35, -1, 1), 6, dt);

      // Keep the registry in step with the DOM
      const els = document.querySelectorAll("[data-gala-media]");
      const live = new Set<Element>();
      els.forEach((el) => {
        live.add(el);
        const src = srcOf(el);
        if (!src) return;
        const e = entries.get(el) || create(el, src);
        // A new photograph in the same frame: burn it through
        if (src !== e.src && src !== e.nextSrc && e.mesh.material.uniforms.uTexA.value) {
          e.nextSrc = src;
          load(src).then((tex) => {
            if (e.nextSrc !== src) return;
            const u = e.mesh.material.uniforms;
            u.uTexB.value = tex;
            u.uAspectB.value = aspectOf(tex);
            e.mix = 0.0001;
          });
        }
        if (e.mesh.material.uniforms.uTexA.value) hideDom(el);
      });
      entries.forEach((_, el) => {
        if (!live.has(el) || !el.isConnected) remove(el);
      });

      let any = false;
      entries.forEach((e, el) => {
        const r = el.getBoundingClientRect();
        const u = e.mesh.material.uniforms;
        const inView = r.bottom > -80 && r.top < vh + 80 && r.width > 2 && r.height > 2;
        e.mesh.visible = inView && !!u.uTexA.value;
        if (!e.mesh.visible) return;
        any = true;

        e.mesh.position.set(r.left + r.width / 2 - vw / 2, vh / 2 - (r.top + r.height / 2), 0);
        e.mesh.scale.set(r.width, r.height, 1);
        u.uPlaneAspect.value = r.width / r.height;

        // Forms from dust once it is well into view
        if (!e.seen && r.top < vh * 0.88 && r.bottom > vh * 0.08) e.seen = true;
        e.reveal = Math.min(1, e.reveal + (e.seen ? dt / 1.5 : 0));
        u.uReveal.value = e.reveal;

        // Burn-through
        if (e.mix > 0) {
          e.mix = Math.min(1, e.mix + dt / 1.15);
          if (e.mix >= 1 && e.nextSrc) {
            u.uTexA.value = u.uTexB.value;
            u.uAspectA.value = u.uAspectB.value;
            e.src = e.nextSrc;
            e.nextSrc = null;
            e.mix = 0;
          }
        }
        u.uMix.value = e.mix;

        // Hover lens and a little tilt toward the cursor
        const over = pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
        if (over) e.mouseTarget.set((pointer.x - r.left) / r.width, 1 - (pointer.y - r.top) / r.height);
        else e.mouseTarget.set(0.5, 0.5);
        e.hover = THREE.MathUtils.damp(e.hover, over ? 1 : 0, 5, dt);
        e.mouse.x = THREE.MathUtils.damp(e.mouse.x, e.mouseTarget.x, 8, dt);
        e.mouse.y = THREE.MathUtils.damp(e.mouse.y, e.mouseTarget.y, 8, dt);
        u.uMouse.value.copy(e.mouse);
        u.uHover.value = e.hover;
        e.mesh.rotation.y = (e.mouse.x - 0.5) * 0.09 * e.hover;
        e.mesh.rotation.x = -(e.mouse.y - 0.5) * 0.07 * e.hover;

        u.uVelocity.value = velocity;
        u.uTime.value = t;
      });

      if (any) renderer.render(scene, camera);
      else renderer.clear();
    };

    const onVisibility = () => renderer.setAnimationLoop(document.hidden ? null : frame);
    renderer.setAnimationLoop(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      timer.dispose();
      entries.forEach((_, el) => {
        el.querySelectorAll("img").forEach((img) => ((img as HTMLElement).style.opacity = ""));
      });
      [...entries.keys()].forEach(remove);
      geometry.dispose();
      textures.forEach((tx) => tx.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  // Above the rooms' content (so the frames' plum mounts never hide the
  // photographs), below the navigation
  return <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 z-[3]" />;
}
