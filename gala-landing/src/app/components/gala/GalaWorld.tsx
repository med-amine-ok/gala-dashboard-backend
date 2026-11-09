"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * GalaWorld — "The evening gathers".
 *
 * One transparent WebGL layer — over the hero while the dust is the hero,
 * behind the rooms' content afterwards — so the dust makes a single journey: it is the hero's logo, tagline and invitation
 * button; on the first scroll it spirals into the entrance portal; when the
 * doorway becomes the About section it breathes back out and streams on into
 * the rooms, a few grains at first and more in each room; at the farewell
 * every grain flies home and becomes the event's mark (sampled from
 * /GALA-silver.png, in its own colours) exactly where the footer logo sits.
 * The plum velvet behind the rooms is plain CSS beneath the content.
 */

const ROOM_IDS = ["historique", "piliers", "tarification", "apropos", "footer"] as const;
const LOGO_SRC = "/GALA-silver.png";
export const LOGO_ANCHOR_ID = "gala-logo-anchor";
// The hero's tagline and invitation button are drawn in dust too
const HERO_COPY_IDS = ["gala-hero-tagline", "gala-hero-cta"];
const HERO_LOGO_ID = "gala-hero-logo";

const DUST_VERT = /* glsl */ `
  attribute vec3 aLogo;          // position inside the logo, unit width, centred
  attribute vec3 aLogoColor;     // the logo's own pixel colour
  attribute vec4 aContent;       // xyz: the hero copy pixel this grain stands for; w: 1 for copy grains
  attribute vec3 aContentColor;  // that pixel's colour
  attribute vec4 aRand;
  uniform float uTime;
  uniform float uReveal;         // share of the dust that has appeared (0..1)
  uniform float uGather;         // how far the drifting cloud has condensed (0..1)
  uniform float uForm;           // gathered into its figure (0..1)
  uniform float uScroll;         // world-space scroll for depth parallax
  uniform vec3 uLogoCenter;
  uniform float uLogoWidth;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uPointer;
  uniform float uPointerForce;
  uniform float uSink;           // pull into the entrance portal (0..1)
  uniform vec3 uPortal;          // the portal's vanishing point, deep in the scene
  uniform vec3 uPortalNear;      // the same point seen on the z = 0 plane
  uniform float uHero;           // 1 while the dust is over the hero
  uniform float uContentShow;    // the tagline's grains are present (0..1)
  uniform float uCtaShow;        // the button has dissolved into dust (0..1)
  uniform float uEmerging;       // 1 once the dust is coming back out of the door
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // ── Drifting: a deep field that rises past as the page scrolls ─────────
    vec3 p = position;
    float depth = 0.35 + 0.65 * (p.z + 9.0) / 12.0;   // far grains move less
    p.y = mod(p.y + uScroll * depth + 7.0, 14.0) - 7.0;
    p += 0.18 * vec3(
      sin(uTime * 0.21 + aRand.z * 6.2832),
      cos(uTime * 0.17 + aRand.w * 6.2832),
      sin(uTime * 0.13 + aRand.x * 6.2832)
    );
    // The cloud condenses toward the centre room after room
    p.xy *= mix(1.0, 0.42, uGather);
    p.z = mix(p.z, p.z * 0.5 - 1.0, uGather);

    // ── Home: the logo, or (over the hero) the letter of copy it came from ──
    float isCopy = step(0.5, aContent.w) * uHero;
    float isCta = step(1.5, aContent.w);
    vec3 home = mix(uLogoCenter + aLogo * uLogoWidth, aContent.xyz, isCopy);
    float t = clamp((uForm - aRand.x * 0.45) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 flight = vec3(sin(aRand.w * 31.0), cos(aRand.z * 23.0), sin(aRand.y * 17.0)) * sin(t * 3.14159) * 1.2;
    p = mix(p, home, t) + flight * (1.0 - uHero);

    // ── The portal: a draining vortex ───────────────────────────────────────
    // Grains nearest the doorway go first, the outer ones follow in waves;
    // each lifts and loosens, then spirals in faster and tighter, shrinking
    // into the depth of the door.
    float reach = clamp(length(p.xy - uPortalNear.xy) / 7.0, 0.0, 1.0);
    float delay = reach * 0.4 + aRand.y * 0.15;
    float s = clamp((uSink - delay) / 0.45, 0.0, 1.0);
    float se = s * s * (3.0 - 2.0 * s);
    vec3 off = p - uPortal;
    // A gentle quarter-turn of curl while converging fast: streams that bend
    // into the door rather than circles sweeping the screen
    float spin = (0.9 + aRand.z * 0.8) * se * (aRand.w > 0.5 ? 1.0 : -0.6);
    float ca = cos(spin), sa = sin(spin);
    off.xy = vec2(ca * off.x - sa * off.y, sa * off.x + ca * off.y);
    float loosen = sin(se * 3.14159) * (1.0 - se);
    // In: accelerate into the depth. Out: burst from the door, then ease to rest
    off *= (1.0 + 0.12 * loosen) * pow(1.0 - se, mix(2.2, 0.5, uEmerging));
    p = uPortal + off;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec3 d = world.xyz - uPointer;
    float dl = length(d.xy);
    world.xy += normalize(d.xy + 1e-4) * uPointerForce * exp(-dl * dl * 1.4) * 0.6;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;

    // Copy grains exist only once the copy has dissolved; the rest appear
    // one by one, a few at first and every one by the farewell
    float shown = mix(smoothstep(aRand.x - 0.04, aRand.x, uReveal), mix(uContentShow, uCtaShow, isCta), isCopy);
    float inFlight = sin(se * 3.14159);
    float size = mix(0.45 + aRand.y * 1.1, 0.55 + aRand.y * 0.35, t) * (1.0 + 0.2 * inFlight) * (1.0 + 0.3 * uHero);
    gl_PointSize = uSize * size * uPixelRatio / max(-mv.z, 0.5) * shown;

    float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aRand.z * 2.2) + aRand.z * 60.0);
    // Grains in flight dim a little rather than flare: a soft, quiet transformation
    vAlpha = shown * mix(twinkle, 0.85 + 0.15 * twinkle, t) * (1.0 - 0.35 * inFlight) * mix(mix(0.8, 1.1, t), 1.45, uHero);
    vec3 dustColor = mix(vec3(0.86, 0.88, 0.93), vec3(1.0, 0.76, 0.78), step(0.93, aRand.w));
    vec3 homeColor = mix(aLogoColor * 1.25, aContentColor * 1.15, isCopy) * (1.0 + 0.5 * uHero);
    // Warming to champagne as they stream into the light of the door
    vColor = mix(mix(dustColor, homeColor, t), vec3(1.0, 0.9, 0.84), inFlight * 0.2);
  }
`;

const DUST_FRAG = /* glsl */ `
  uniform float uOverlay;
  uniform float uDim;            // softer once the dust travels with the sections
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float a = exp(-r2 * 5.0) * 0.75 + exp(-r2 * 36.0) * 0.8;
    // Premultiplied: rgb adds light; alpha (over the hero only) shades what
    // lies behind each grain, so the mark reads over the bright façade too
    gl_FragColor = vec4(vColor * a * vAlpha * uDim, uOverlay * a * vAlpha * uDim);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** Samples the logo into N points (unit width, centred) with their colours */
async function sampleLogo(n: number) {
  // onload rather than decode(): decode() can reject for a page that isn't painting
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = LOGO_SRC;
  });
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] > 110) pts.push(x, y, i);
    }
  }
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const count = pts.length / 3;
  for (let k = 0; k < n; k++) {
    // Stratified so every stroke of the mark is covered evenly
    const j = Math.min(count - 1, Math.floor(((k + Math.random()) / n) * count)) * 3;
    const x = pts[j] + Math.random() - 0.5;
    const y = pts[j + 1] + Math.random() - 0.5;
    const i = pts[j + 2];
    pos[k * 3] = x / W - 0.5;
    pos[k * 3 + 1] = -(y / H - 0.5) * (H / W);
    pos[k * 3 + 2] = (Math.random() - 0.5) * 0.004;
    // sRGB pixel → linear, brightened so silver reads as silver after tone mapping
    for (let ch = 0; ch < 3; ch++) col[k * 3 + ch] = Math.pow(data[i + ch] / 255, 2.2) * 1.15 + 0.08;
  }
  // Shuffle so formation order (aRand.x) isn't tied to raster order
  for (let k = n - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    for (let ch = 0; ch < 3; ch++) {
      [pos[k * 3 + ch], pos[r * 3 + ch]] = [pos[r * 3 + ch], pos[k * 3 + ch]];
      [col[k * 3 + ch], col[r * 3 + ch]] = [col[r * 3 + ch], col[k * 3 + ch]];
    }
  }
  return { pos, col, aspect: H / W };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

export default function GalaWorld() {
  const mountRef = useRef<HTMLDivElement>(null);
  const warm = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    let disposed = false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // the page keeps its solid burgundy background and the image logo
    }
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 11);


    // ── The dust ─────────────────────────────────────────────────────────────
    const N = isMobile ? 9000 : 22000;
    const field = new Float32Array(N * 3);
    // A soft nebula (gaussian), so the cloud has no edges as it condenses
    const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
    for (let i = 0; i < N; i++) {
      field[i * 3] = gauss() * 4.6;
      field[i * 3 + 1] = gauss() * 3.6;
      field[i * 3 + 2] = Math.max(-9, Math.min(3, -3 + gauss() * 2.6));
    }
    const rand = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) rand[i] = Math.random();
    const logoPos = new THREE.BufferAttribute(new Float32Array(N * 3), 3);
    const logoCol = new THREE.BufferAttribute(new Float32Array(N * 3).fill(0.85), 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(field, 3));
    geo.setAttribute("aLogo", logoPos);
    geo.setAttribute("aLogoColor", logoCol);
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    // Every other grain also stands for a pixel of the hero's copy
    const contentAttr = new THREE.BufferAttribute(new Float32Array(N * 4), 4);
    const contentColAttr = new THREE.BufferAttribute(new Float32Array(N * 3).fill(0.9), 3);
    geo.setAttribute("aContent", contentAttr);
    geo.setAttribute("aContentColor", contentColAttr);
    const copyIdx: number[] = [];
    for (let i = 0; i < N; i++) if (i % 2 === 0) copyIdx.push(i);
    const dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uGather: { value: 0 },
        uForm: { value: 0 },
        uScroll: { value: 0 },
        uLogoCenter: { value: new THREE.Vector3(0, 0, 0) },
        uLogoWidth: { value: 6 },
        uSize: { value: isMobile ? 26 : 30 },
        uPixelRatio: { value: dpr },
        uPointer: { value: new THREE.Vector3(999, 999, 0) },
        uPointerForce: { value: 0 },
        uSink: { value: 0 },
        uPortal: { value: new THREE.Vector3(0, -0.4, -14) },
        uPortalNear: { value: new THREE.Vector3(0, -0.3, 0) },
        uHero: { value: 0 },
        uContentShow: { value: 0 },
        uCtaShow: { value: 0 },
        uEmerging: { value: 0 },
        uOverlay: { value: 0 },
        uDim: { value: 1 },
      },
      vertexShader: DUST_VERT,
      fragmentShader: DUST_FRAG,
      transparent: true,
      depthWrite: false,
      // Premultiplied "over": additive light where alpha is 0, a soft shade where it isn't
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const dust = new THREE.Points(geo, dustMat);
    dust.frustumCulled = false;
    scene.add(dust);

    let logoReady = false;
    sampleLogo(N)
      .then(({ pos, col }) => {
        if (disposed) return;
        (logoPos.array as Float32Array).set(pos);
        (logoCol.array as Float32Array).set(col);
        logoPos.needsUpdate = true;
        logoCol.needsUpdate = true;
        logoReady = true;
        // The dust now draws the footer mark: hide the image twin (CSS keys off this)
        document.documentElement.dataset.galaDust = "on";
        // Hide the image twins directly too, so it never depends on stylesheet timing
        document.querySelectorAll<HTMLElement>(".gala-hero-mark, .gala-footer-mark").forEach((el) => {
          el.style.visibility = "hidden";
        });
      })
      .catch((err) => console.warn("GalaWorld: logo sampling failed", err));

    // One transparent layer above the whole page: the dust can travel from
    // the hero, through the door, into the rooms without ever changing layer
    renderer.setClearColor(0x000000, 0);

    // ── Scroll ───────────────────────────────────────────────────────────────
    let anchors: number[] = [];
    let firstTop = Infinity;
    const measure = () => {
      const vh = window.innerHeight;
      const els = ROOM_IDS.map((id) => document.getElementById(id));
      if (els.some((e) => !e)) return;
      const tops = els.map((e) => e!.getBoundingClientRect().top + window.scrollY);
      firstTop = tops[0];
      const maxScroll = Math.max(document.documentElement.scrollHeight - vh, 0);
      anchors = tops.map((t) => t - vh * 0.5);
      anchors.push(Math.max(maxScroll, anchors[anchors.length - 1] + 1));
    };
    // 0 → Gallery … 4 → footer; negative while arriving from the hero
    const progressAt = (scroll: number) => {
      if (!anchors.length) return -1;
      if (scroll <= anchors[0]) return Math.max(-1, (scroll - anchors[0]) / window.innerHeight);
      for (let i = 0; i < anchors.length - 1; i++) {
        if (scroll < anchors[i + 1]) return i + (scroll - anchors[i]) / (anchors[i + 1] - anchors[i]);
      }
      return anchors.length - 1;
    };

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: 0, tActive: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.tActive = 1;
    };
    const onLeave = () => (pointer.tActive = 0);

    // Phones report a new height whenever the address bar slides in or out;
    // resizing the canvas then clears it and jolts the camera, so those small
    // height-only changes are ignored (the canvas keeps its size)
    let sizedW = 0;
    let sizedH = 0;
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (isMobile && w === sizedW && Math.abs(h - sizedH) < 160) return;
      sizedW = w;
      sizedH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 0.85 ? 58 : camera.aspect < 1.4 ? 46 : 40;
      camera.updateProjectionMatrix();
      measure();
    };
    resize();

    // Screen point → world point on the plane z = planeZ
    const ray = new THREE.Vector3();
    const onPlane = (ndcX: number, ndcY: number, out: THREE.Vector3, planeZ = 0) => {
      ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
      return out.copy(camera.position).addScaledVector(ray, (planeZ - camera.position.z) / ray.z);
    };
    const left = new THREE.Vector3();
    const right = new THREE.Vector3();
    // An element's rect → logo centre and width on the z = 0 plane
    const fitLogo = (r: DOMRect, vw: number, vh: number) => {
      const cy = -(((r.top + r.height / 2) / vh) * 2 - 1);
      onPlane(((r.left + r.width / 2) / vw) * 2 - 1, cy, dustMat.uniforms.uLogoCenter.value);
      onPlane((r.left / vw) * 2 - 1, cy, left);
      onPlane((r.right / vw) * 2 - 1, cy, right);
      dustMat.uniforms.uLogoWidth.value = right.x - left.x;
    };

    let sScroll = window.scrollY;
    let progress = progressAt(window.scrollY);
    let form = 0;

    // ── The hero's copy, rasterised word by word into grains ────────────────
    let copyDirty = true;
    let copyReady = false;
    let copyFontsReady = false;
    let copyShow = 0;
    let inFront: boolean | null = null;
    document.fonts.ready.then(() => (copyFontsReady = true));
    // While the dust draws them, the real tagline and button stay in place
    // (readable by screen readers, the button still clickable) but unseen
    // The tagline is dust from the start; the button stays a real button
    // until the walk begins, then dissolves (see ctaShow in the frame loop)
    const setCopyDust = (on: boolean) => {
      const tagline = document.getElementById(HERO_COPY_IDS[0]);
      if (tagline) tagline.style.color = on ? "transparent" : "";
    };
    const ctaLink = () => document.getElementById(HERO_COPY_IDS[1])?.firstElementChild as HTMLElement | null;
    const sampleCopy = () => {
      const roots = HERO_COPY_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
      if (!roots.length) return;
      setCopyDust(false);
      const l = ctaLink();
      if (l) l.style.opacity = "";
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // A window with no size yet (hidden tab, mid-resize): try again later
      // rather than throwing inside the animation loop
      if (!vw || !vh) {
        copyDirty = true;
        return;
      }
      const c = document.createElement("canvas");
      c.width = vw;
      c.height = vh;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      const visible = (el: Element) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05;
      };
      const range = document.createRange();
      for (const root of roots) {
      // Frames and hairlines (the invitation button's border)
      root.querySelectorAll<HTMLElement>("*").forEach((el) => {
        const cs = getComputedStyle(el);
        const bw = parseFloat(cs.borderTopWidth);
        if (bw > 0 && cs.borderTopStyle !== "none" && visible(el)) {
          const r = el.getBoundingClientRect();
          g.strokeStyle = cs.borderTopColor;
          g.lineWidth = Math.max(1.4, bw * 1.4);
          g.strokeRect(r.left + 0.5, r.top + 0.5, r.width - 1, r.height - 1);
        }
      });
      // The button's arrow
      root.querySelectorAll<SVGElement>("svg").forEach((svg) => {
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        g.strokeStyle = getComputedStyle(svg).color;
        g.lineWidth = 1.6;
        const y = r.top + r.height / 2;
        g.beginPath();
        g.moveTo(r.left + r.width * 0.15, y);
        g.lineTo(r.right - r.width * 0.15, y);
        g.moveTo(r.right - r.width * 0.45, r.top + r.height * 0.22);
        g.lineTo(r.right - r.width * 0.15, y);
        g.lineTo(r.right - r.width * 0.45, r.bottom - r.height * 0.22);
        g.stroke();
      });
      // Every word of text, in its own face, size, tracking and colour
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || !visible(el) || !n.textContent?.trim()) continue;
        const cs = getComputedStyle(el);
        g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        g.fillStyle = cs.color;
        (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
        g.textBaseline = "middle";
        const text = n.textContent;
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const r = range.getBoundingClientRect();
          if (!r.width) continue;
          const word = cs.textTransform === "uppercase" ? m[0].toUpperCase() : m[0];
          g.fillText(word, r.left, r.top + r.height / 2);
        }
      }
      }
      const data = g.getImageData(0, 0, vw, vh).data;
      const pts: number[] = [];
      for (let y = 0; y < vh; y++) {
        for (let x = 0; x < vw; x++) {
          const i = (y * vw + x) * 4;
          if (data[i + 3] > 70) pts.push(x, y, i);
        }
      }
      // Split the pixels: the tagline's, and the button's
      const ctaRoot = document.getElementById(HERO_COPY_IDS[1]);
      const cr = ctaRoot?.getBoundingClientRect();
      const tagPts: number[] = [];
      const ctaPts: number[] = [];
      for (let k = 0; k < pts.length; k += 3) {
        const inCta = cr && pts[k] >= cr.left - 2 && pts[k] <= cr.right + 2 && pts[k + 1] >= cr.top - 2 && pts[k + 1] <= cr.bottom + 2;
        (inCta ? ctaPts : tagPts).push(pts[k], pts[k + 1], pts[k + 2]);
      }
      if (!tagPts.length && !ctaPts.length) {
        if (copyReady) setCopyDust(true);
        return;
      }
      const cA = contentAttr.array as Float32Array;
      const cC = contentColAttr.array as Float32Array;
      const v = new THREE.Vector3();
      const order = copyIdx.slice().sort(() => Math.random() - 0.5);
      // A quarter of the copy grains are the button (w = 2), the rest the tagline (w = 1)
      const ctaCount = ctaPts.length ? Math.floor(order.length * 0.25) : 0;
      const assign = (idxs: number[], list: number[], kind: number) => {
        const count = list.length / 3;
        idxs.forEach((idx, k) => {
          const j = Math.min(count - 1, Math.floor(((k + Math.random()) / idxs.length) * count)) * 3;
          const px = list[j] + Math.random() - 0.5;
          const py = list[j + 1] + Math.random() - 0.5;
          onPlane((px / vw) * 2 - 1, -((py / vh) * 2 - 1), v);
          cA[idx * 4] = v.x;
          cA[idx * 4 + 1] = v.y;
          cA[idx * 4 + 2] = 0;
          cA[idx * 4 + 3] = kind;
          const i = list[j + 2];
          const a = data[i + 3] / 255;
          for (let ch = 0; ch < 3; ch++) cC[idx * 3 + ch] = Math.pow(data[i + ch] / 255, 2.2) * (0.6 + 0.4 * a) + 0.05;
        });
      };
      if (ctaCount) assign(order.slice(0, ctaCount), ctaPts, 2);
      if (tagPts.length) assign(order.slice(ctaCount), tagPts, 1);
      contentAttr.needsUpdate = true;
      contentColAttr.needsUpdate = true;
      copyReady = true;
      setCopyDust(true);
    };

    // A soft light in the doorway that swells while the dust pours through it
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { uIntensity: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uIntensity;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r2 = dot(p, p);
          float r = sqrt(r2);
          // Round, and fully dark well before the quad's edge: no visible square
          float a = (exp(-r2 * 6.0) * 0.55 + exp(-r2 * 40.0) * 0.6) * (1.0 - smoothstep(0.45, 0.95, r)) * uIntensity;
          gl_FragColor = vec4(vec3(1.0, 0.88, 0.8) * a, 0.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const portalGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMat);
    portalGlow.scale.set(14, 14, 1);
    portalGlow.renderOrder = -1;
    portalGlow.visible = false;
    scene.add(portalGlow);
    const timer = new THREE.Timer();
    timer.connect(document);

    const frame = () => {
      timer.update();
      const dt = Math.min(timer.getDelta(), 1 / 20);
      const t = timer.getElapsed();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // One softened scroll drives everything, so wheel notches become one glide
      sScroll = THREE.MathUtils.damp(sScroll, window.scrollY, 7, dt);
      progress = THREE.MathUtils.damp(progress, progressAt(sScroll), 6, dt);
      pointer.x = THREE.MathUtils.damp(pointer.x, pointer.tx, 3, dt);
      pointer.y = THREE.MathUtils.damp(pointer.y, pointer.ty, 3, dt);
      pointer.active = THREE.MathUtils.damp(pointer.active, pointer.tActive, 3, dt);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.35, 2, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.22, 2, dt);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      // ── One journey: the hero's figures → into the door → out into the rooms ──
      const heroSpan = Math.max(1, firstTop - vh);
      const heroP = clamp01(sScroll / heroSpan);
      // While this is true the grains still belong to the hero's logo and copy
      const heroLive = heroP < 0.6;
      // They spiral into the doorway as the camera walks up to it, finishing
      // as the doors swing open (hero doors: 28–60% of its scroll)…
      const sinkIn = smooth((heroP - 0.02) / 0.5);
      // …and breathe back out of it the moment the doorway becomes the About
      // section (~86%), streaming on into the rooms without a break: every
      // grain leaves the door, spreads, and all but a few melt away
      // The rooms are behind the hero, so the dust pours out along the
      // threshold where the hero gives way to the Gallery, as it rises
      const emergeStart = heroSpan;
      const emerge = smooth((sScroll - emergeStart) / (vh * 1.3));
      const sink = Math.min(sinkIn, 1 - emerge);
      const sectionReveal = 0.035 + 0.965 * Math.pow(smooth((progress + 0.6) / 4.4), 1.6);
      // A generous share of the dust pours out, never so much that it veils the copy
      const breath = 0.4 * (1 - smooth((emerge - 0.5) / 0.5));
      const reveal = sScroll < emergeStart ? 1 : Math.max(sectionReveal, breath);
      const gather = smooth((progress - 0.8) / 3.2);
      // Way in: the doorway. Way out: the threshold (the Gallery's top edge),
      // never higher than the middle of the screen
      const seam = clamp01((firstTop - sScroll) / vh);
      const outY = -((Math.max(seam, 0.5) * 2) - 1);
      const portalY = sScroll >= emergeStart ? outY : -0.06;
      onPlane(0, portalY, dustMat.uniforms.uPortal.value, -16);
      onPlane(0, portalY, dustMat.uniforms.uPortalNear.value, 0);

      // The copy is sampled while it sits at rest
      if (copyDirty && window.scrollY < 4 && sScroll < 4 && copyFontsReady) {
        copyDirty = false;
        sampleCopy();
      }
      // The copy grains settle in softly the first time they are ready
      copyShow = THREE.MathUtils.damp(copyShow, copyReady ? 1 : 0, 2.5, dt);

      let target = 0;
      let rate = 2.2;
      if (logoReady) {
        if (heroLive) {
          const hero = document.getElementById(HERO_LOGO_ID);
          if (hero) {
            fitLogo(hero.getBoundingClientRect(), vw, vh);
            // The mark holds its shape and is drawn whole into the doorway
            target = 1;
            rate = 6;
          }
        } else {
          const anchor = document.getElementById(LOGO_ANCHOR_ID);
          if (anchor) {
            const r = anchor.getBoundingClientRect();
            fitLogo(r, vw, vh);
            // The mark re-forms as the footer slot rises into view
            target = smooth((vh * 1.05 - (r.top + r.height / 2)) / (vh * 0.5));
          }
        }
      }
      // Gathering is quicker than scattering, so the mark settles cleanly.
      // (While the grains are inside the door, re-homing them is unseen.)
      form = THREE.MathUtils.damp(form, target, target > form ? rate : Math.max(rate, 3.5), dt);

      const u = dustMat.uniforms;
      u.uTime.value = t;
      u.uReveal.value = reveal;
      u.uGather.value = gather;
      u.uForm.value = form;
      u.uScroll.value = sScroll * 0.0016;
      onPlane(pointer.x, pointer.y, u.uPointer.value);
      u.uPointerForce.value = pointer.active * (1 - form * 0.6) * (1 - sink);
      u.uSink.value = sink;
      u.uHero.value = heroLive ? 1 : 0;
      u.uContentShow.value = copyShow;
      // Which way the grains are travelling through the door (unseen while they are inside it)
      u.uEmerging.value = sScroll >= emergeStart ? 1 : 0;
      // Over the bright façade each grain shades what lies behind it a little
      u.uOverlay.value = 0.22 * (1 - smooth(emerge * 2));
      // Over the hero the dust keeps its full light; travelling with the
      // sections it is a quiet presence, brightening again as it forms the
      // footer's mark
      u.uDim.value = heroLive ? 1 : THREE.MathUtils.lerp(0.18, 1, form);
      u.uSize.value = (isMobile ? 26 : 30) * (heroLive ? 1 + 0.25 * (1 - form) : 1.15);

      // The button dissolves the moment the walk begins
      const ctaShow = copyReady ? smooth((heroP - 0.004) / 0.035) : 0;
      u.uCtaShow.value = ctaShow;
      const link = ctaLink();
      if (link && copyReady) link.style.opacity = heroLive ? String(1 - ctaShow) : "";

      // Layering: above the hero's 3D while the dust is the hero; behind the
      // rooms' content afterwards. The change happens while every grain is
      // inside the door, so it is never seen.
      const front = sScroll < heroSpan * 0.75;
      if (front !== inFront) {
        inFront = front;
        mount.style.zIndex = front ? "2" : "0";
      }

      // The doorway holds a soft light while dust pours in, and again as it pours out
      const bump = (x: number) => Math.pow(Math.sin(clamp01(x) * Math.PI), 1.6);
      const glow = bump(sinkIn) * 0.45;
      glowMat.uniforms.uIntensity.value = glow;
      portalGlow.visible = glow > 0.002;
      portalGlow.position.copy(u.uPortal.value);

      // The room behind warms as the dust gathers toward the farewell
      if (warm.current) warm.current.style.opacity = String(Math.min(1, gather * 0.5 + (heroLive ? 0 : form) * 0.6));

      renderer.render(scene, camera);
    };

    let running = false;
    const updateActivity = () => {
      // The dust lives over the hero; once the hotel walk takes the screen
      // (an opaque scene in front of it) it stops drawing altogether
      const hero = document.getElementById("home");
      const heroEnd = hero ? hero.offsetHeight - window.innerHeight + 40 : Infinity;
      const active = !document.hidden && window.scrollY < heroEnd;
      if (active && !running) {
        running = true;
        renderer.setAnimationLoop(frame);
      } else if (!active && running) {
        running = false;
        renderer.setAnimationLoop(null);
      }
    };

    const ro = new ResizeObserver(() => {
      measure();
      updateActivity();
    });
    ro.observe(document.body);
    const onResize = () => {
      copyDirty = true;
      resize();
      updateActivity();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("load", measure);
    window.addEventListener("scroll", updateActivity, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", updateActivity);

    renderer.compileAsync(scene, camera).then(updateActivity, updateActivity);

    return () => {
      disposed = true;
      delete document.documentElement.dataset.galaDust;
      document.querySelectorAll<HTMLElement>(".gala-hero-mark, .gala-footer-mark").forEach((el) => {
        el.style.visibility = "";
      });
      setCopyDust(false);
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", measure);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", updateActivity);
      timer.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        (mesh.material as THREE.Material | undefined)?.dispose?.();
      });
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <>
      {/* The velvet behind the rooms (the hero covers it): the post template's
          tufted plum velvet, its pools of light drifting, deepened for the copy */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="gala-velvet absolute inset-0" />
        <div className="gala-velvet-light absolute -inset-[10%]" />
        <div className="gala-velvet-veil absolute inset-0" />
        <div
          ref={warm}
          className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_42%,rgba(211,55,145,0.32)_0%,transparent_75%)] mix-blend-screen"
        />
      </div>
      {/* The dust: over the hero while it is the hero, behind the rooms' content after */}
      <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
    </>
  );
}
