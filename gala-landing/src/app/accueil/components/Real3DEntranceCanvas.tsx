"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createBurgundyStoneTextures,
  createBurgundyFloorTextures,
  createRedCarpetTextures,
  createBrushedSilverTextures,
  createBannerFabricTextures,
  createVelvetRopeNormalMap,
  createSoftRadialShadowTexture,
  createGalaStudioEnvironmentMap,
} from "./TextureGenerator";

interface Real3DEntranceCanvasProps {
  scrollProgress?: number;
  scrollProgressRef?:
    | React.RefObject<number | null>
    | React.MutableRefObject<number>;
  onLoaded?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PBR OFFICIAL BANNER TEXTURES
   ───────────────────────────────────────────────────────────────────────────── */

function renderBannerBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  // Simple, elegant brushed sterling silver background with subtle, gentle satin gradation
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0.0, "#D6DCE4");
  bgGrad.addColorStop(0.5, "#CCD3DC");
  bgGrad.addColorStop(1.0, "#BCC4CE");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Microscopic brushed silver weave grain
  ctx.fillStyle = "rgba(255, 255, 255, 0.40)";
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1.0);
  }
  ctx.fillStyle = "rgba(20, 26, 34, 0.04)";
  for (let y = 1; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1.0);
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
  for (let x = 0; x < width; x += 3) {
    ctx.fillRect(x, 0, 1.0, height);
  }
  ctx.fillStyle = "rgba(20, 26, 34, 0.03)";
  for (let x = 1; x < width; x += 3) {
    ctx.fillRect(x, 0, 1.0, height);
  }

  // Tailored chevron perimeter sewn border in deep graphite titanium thread
  const m = 46;
  const ySh = Math.round(height * 0.825); // 1267px
  const yTip = height - 50; // 1486px
  const cx = width / 2;

  // Outer tailored stitch line in dark titanium thread
  ctx.save();
  ctx.strokeStyle = "rgba(32, 38, 48, 0.65)";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 4]);
  ctx.beginPath();
  ctx.moveTo(m, m);
  ctx.lineTo(width - m, m);
  ctx.lineTo(width - m, ySh);
  ctx.lineTo(cx, yTip);
  ctx.lineTo(m, ySh);
  ctx.closePath();
  ctx.stroke();

  // Inner subtle stitch piping in soft pewter thread
  const m2 = m + 12;
  const ySh2 = ySh - 4;
  const yTip2 = yTip - 18;
  ctx.strokeStyle = "rgba(80, 90, 104, 0.40)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(m2, m2);
  ctx.lineTo(width - m2, m2);
  ctx.lineTo(width - m2, ySh2);
  ctx.lineTo(cx, yTip2);
  ctx.lineTo(m2, ySh2);
  ctx.closePath();
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draw official Gala diamond star insignia and companion stars on banner
 */
function drawBannerDiamondStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  fillColor = "#121722",
) {
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  // Center monumental 4-pointed diamond star
  const rOuter = 44 * scale;
  const rInner = 9.5 * scale;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Flanking diamond satellite stars (left & right)
  const flankDist = 68 * scale;
  const flankR = 16 * scale;
  const flankInner = 4 * scale;
  [-1, 1].forEach((dir) => {
    const fx = cx + dir * flankDist;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? flankR : flankInner;
      const x = fx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Left Wall Banner: Official Event Slogan (The Sanctuary & Synergy)
 * Rendered with official Gala star emblem and bold, legible Cinzel typography on silver satin.
 */
function getLeftBannerTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1536;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  renderBannerBase(ctx, width, height);

  const cx = width / 2;

  const drawTracked = (text: string, yPos: number, spacing: number) => {
    const letters = text.split("");
    const totalW = letters.length * spacing;
    let startX = cx - totalW / 2 + spacing / 2;
    for (const char of letters) {
      ctx.fillText(char, startX, yPos);
      startX += spacing;
    }
  };

  ctx.save();
  ctx.textAlign = "center";

  // 1. Official Gala Diamond Star Emblem (Primary Brand Artwork Mark)
  drawBannerDiamondStar(ctx, cx, 185, 1.15, "#101620");

  // 2. Top Eyebrow Tag
  ctx.font = "700 28px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#2D3644";
  ctx.shadowColor = "rgba(255, 255, 255, 0.90)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  drawTracked("— A SANCTUARY FOR AMBITION —", 275, 20);

  // 3. Primary Monumental Slogan (High-contrast, bold, clear from distance)
  ctx.font = "800 66px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#0A0E16";
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  drawTracked("CONNECTIONS", 420, 42);
  drawTracked("THAT MATTER", 505, 42);

  // 4. Decorative Thread Divider with Center Diamond Star
  const divY1 = 605;
  ctx.strokeStyle = "rgba(45, 55, 70, 0.55)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx - 180, divY1);
  ctx.lineTo(cx - 28, divY1);
  ctx.moveTo(cx + 28, divY1);
  ctx.lineTo(cx + 180, divY1);
  ctx.stroke();

  ctx.fillStyle = "#161D26";
  ctx.beginPath();
  ctx.moveTo(cx, divY1 - 8);
  ctx.lineTo(cx + 8, divY1);
  ctx.lineTo(cx, divY1 + 8);
  ctx.lineTo(cx - 8, divY1);
  ctx.closePath();
  ctx.fill();

  // 5. Secondary Event Quote
  ctx.font = "700 52px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#121822";
  ctx.shadowColor = "rgba(255, 255, 255, 0.90)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  drawTracked("CONVERSATIONS", 715, 36);
  drawTracked("THAT CREATE", 785, 36);
  drawTracked("OPPORTUNITY", 855, 36);

  // 6. Lower Motto Divider & Core Values
  const divY2 = 960;
  ctx.strokeStyle = "rgba(45, 55, 70, 0.45)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 200, divY2);
  ctx.lineTo(cx - 24, divY2);
  ctx.moveTo(cx + 24, divY2);
  ctx.lineTo(cx + 200, divY2);
  ctx.stroke();

  ctx.fillStyle = "#202834";
  ctx.beginPath();
  ctx.moveTo(cx, divY2 - 6);
  ctx.lineTo(cx + 6, divY2);
  ctx.lineTo(cx, divY2 + 6);
  ctx.lineTo(cx - 6, divY2);
  ctx.closePath();
  ctx.fill();

  ctx.font = "700 32px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#283240";
  ctx.shadowColor = "rgba(255, 255, 255, 0.80)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  drawTracked("INNOVATION · LEADERSHIP · IMPACT", 1055, 24);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Right Wall Banner: Official Event Slogan (The Gala Manifesto)
 * Rendered with official Gala star emblem and bold, legible Cinzel typography on silver satin.
 */
function getRightBannerTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1536;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  renderBannerBase(ctx, width, height);

  const cx = width / 2;

  const drawTracked = (text: string, yPos: number, spacing: number) => {
    const letters = text.split("");
    const totalW = letters.length * spacing;
    let startX = cx - totalW / 2 + spacing / 2;
    for (const char of letters) {
      ctx.fillText(char, startX, yPos);
      startX += spacing;
    }
  };

  ctx.save();
  ctx.textAlign = "center";

  // 1. Official Gala Diamond Star Emblem (Primary Brand Artwork Mark)
  drawBannerDiamondStar(ctx, cx, 185, 1.15, "#101620");

  // 2. Top Eyebrow Tag
  ctx.font = "700 28px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#2D3644";
  ctx.shadowColor = "rgba(255, 255, 255, 0.90)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  drawTracked("— THE GALA MANIFESTO —", 275, 20);

  // 3. Primary Monumental Slogan (High-contrast, bold, clear from distance)
  ctx.font = "800 66px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#0A0E16";
  ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  drawTracked("ONE NIGHT.", 420, 42);
  drawTracked("THE RIGHT PEOPLE.", 505, 38);

  // 4. Decorative Thread Divider with Center Diamond Star
  const divY1 = 605;
  ctx.strokeStyle = "rgba(45, 55, 70, 0.55)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx - 180, divY1);
  ctx.lineTo(cx - 28, divY1);
  ctx.moveTo(cx + 28, divY1);
  ctx.lineTo(cx + 180, divY1);
  ctx.stroke();

  ctx.fillStyle = "#161D26";
  ctx.beginPath();
  ctx.moveTo(cx, divY1 - 8);
  ctx.lineTo(cx + 8, divY1);
  ctx.lineTo(cx, divY1 + 8);
  ctx.lineTo(cx - 8, divY1);
  ctx.closePath();
  ctx.fill();

  // 5. Secondary Monumental Climax
  ctx.font = "800 64px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#121822";
  ctx.shadowColor = "rgba(255, 255, 255, 0.90)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  drawTracked("ENDLESS", 735, 42);
  drawTracked("POSSIBILITIES", 815, 42);

  // 6. Lower Motto Divider & Core Values
  const divY2 = 960;
  ctx.strokeStyle = "rgba(45, 55, 70, 0.45)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 200, divY2);
  ctx.lineTo(cx - 24, divY2);
  ctx.moveTo(cx + 24, divY2);
  ctx.lineTo(cx + 200, divY2);
  ctx.stroke();

  ctx.fillStyle = "#202834";
  ctx.beginPath();
  ctx.moveTo(cx, divY2 - 6);
  ctx.lineTo(cx + 6, divY2);
  ctx.lineTo(cx, divY2 + 6);
  ctx.lineTo(cx - 6, divY2);
  ctx.closePath();
  ctx.fill();

  ctx.font = "700 32px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = "#283240";
  ctx.shadowColor = "rgba(255, 255, 255, 0.80)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  drawTracked("EXCELLENCE · NETWORK · DESTINY", 1055, 24);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Creates a subdivided, naturally draping luxury cloth geometry for hanging banners.
 * Includes gentle catenary curvature under gravity, soft vertical drape folds,
 * tapered chevron bottom edge, and stores basePositions for procedural indoor breathing.
 */
function createBannerFabricGeometry(
  bw: number,
  bhTop: number,
  bhBot: number,
  bhTip: number,
  nx = 24,
  ny = 36,
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vBot = (bhBot - bhTip) / (bhTop - bhTip);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    let y: number;
    let w: number;

    if (v >= vBot) {
      y = bhBot + ((v - vBot) / (1 - vBot)) * (bhTop - bhBot);
      w = bw;
    } else {
      y = bhTip + (v / vBot) * (bhBot - bhTip);
      w = bw * Math.max(0.015, v / vBot); // Subtle hem point width at the very tip
    }

    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const x = (u - 0.5) * 2.0 * w;

      // Realistic hanging cloth resting profile:
      // 1. Natural catenary sag between rail and weighted bottom
      const catenary = Math.sin(v * Math.PI) * 0.016;
      // 2. Vertical drape pleats & cloth tension variation
      const drapeFolds =
        Math.sin(u * Math.PI * 6) * 0.009 * Math.sin(v * Math.PI * 0.9 + 0.1) +
        Math.cos(u * Math.PI * 2) * 0.005 * (1.0 - v * 0.4);
      // 3. Subtle corner hem curl
      const hemCurl = (1.0 - v) * 0.005 * Math.cos(u * Math.PI * 2);

      const z = catenary + drapeFolds + hemCurl;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + (i + 1);
      const d = (j + 1) * (nx + 1) + i;
      indices.push(a, b, d, b, c, d);
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  geom.userData.basePositions = new Float32Array(positions);
  geom.userData.bhTop = bhTop;
  geom.userData.bhTip = bhTip;
  geom.userData.bw = bw;

  return geom;
}

/**
 * Creates a sagging catenary / bezier curve for velvet ropes between two 3D points
 */
function createSaggingRopeGeometry(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  sag: number,
  radius = 0.034,
): THREE.TubeGeometry {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.y -= sag;

  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  return new THREE.TubeGeometry(curve, 48, radius, 16, false);
}


export default function Real3DEntranceCanvas({
  scrollProgress,
  scrollProgressRef,
  onLoaded,
}: Real3DEntranceCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    if (typeof scrollProgress === "number" && !isNaN(scrollProgress)) {
      scrollRef.current = scrollProgress;
    }
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;
    let isMobile = width < 768;

    // ── 1. RENDERER ──────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      console.warn("WebGL not supported:", e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6),
    );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isMobile ? 1.0 : 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";

    mount.appendChild(renderer.domElement);

    // ── 2. SCENE & WARM LUMINOUS BURGUNDY FOG ─────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x420a16, 0.005);

    // ── 3. CAMERA SETUP ──────────────────────────────────────────────────────
    const aspect = width / height;
    const baseFov = aspect < 0.65 ? 58 : aspect < 1.0 ? 44 : 34;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

    const baseZ = aspect < 0.65 ? 20.5 : aspect < 1.0 ? 17.2 : 14.2;
    const baseY = aspect < 0.65 ? 2.45 : aspect < 1.0 ? 1.95 : 1.65;
    camera.position.set(0, baseY, baseZ);
    const initialLookY = aspect < 1.0 ? 3.05 : 2.85;
    camera.lookAt(0, initialLookY, 0);

    // Resource tracking for leak-free unmount
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    // ── 4. ENVIRONMENT MAP & PROCEDURAL PBR MAPS ─────────────────────────────
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const envTarget = createGalaStudioEnvironmentMap(renderer);
    scene.environment = envTarget.texture;

    const stoneTextures = createBurgundyStoneTextures(maxAnisotropy);
    const floorTextures = createBurgundyFloorTextures(maxAnisotropy);
    const carpetTextures = createRedCarpetTextures(maxAnisotropy);
    const silverTextures = createBrushedSilverTextures(maxAnisotropy);
    const bannerTextures = createBannerFabricTextures(maxAnisotropy);
    const ropeNormal = createVelvetRopeNormalMap();
    const softShadowTex = trackTex(createSoftRadialShadowTexture());

    trackTex(stoneTextures.diffuse);
    trackTex(floorTextures.diffuse);
    trackTex(carpetTextures.diffuse);
    trackTex(silverTextures.diffuse);
    trackTex(bannerTextures.diffuse);

    // ── 5. MATERIALS SPECIFICATION (PREMIUM ARCHITECTURAL REALISM) ───────────

    // 1. Façade wall (Deep architectural stone with satin finish & fine microtexture)
    const matFacadeWall = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: stoneTextures.diffuse,
        roughnessMap: stoneTextures.roughness,
        bumpMap: stoneTextures.bump,
        bumpScale: 0.0035,
        roughness: 0.46,
        metalness: 0.02,
        envMapIntensity: 0.85,
      }),
    );

    // 2. Grand portal surround & pilasters (Carved luxury stone with soft satin sheen)
    const matPortalStone = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        map: stoneTextures.diffuse,
        roughnessMap: stoneTextures.roughness,
        bumpMap: stoneTextures.bump,
        bumpScale: 0.003,
        roughness: 0.42,
        metalness: 0.02,
        clearcoat: 0.08,
        clearcoatRoughness: 0.35,
        envMapIntensity: 1.0,
      }),
    );

    // Step Horizontal Treads (Satin stone receiving direct illumination)
    const matStepTread = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        map: stoneTextures.diffuse,
        roughnessMap: stoneTextures.roughness,
        bumpMap: stoneTextures.bump,
        bumpScale: 0.0025,
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.12,
        clearcoatRoughness: 0.28,
        envMapIntensity: 1.05,
      }),
    );

    // Step Vertical Risers (In soft ambient shadow)
    const matStepRiser = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xbfa5ab),
        map: stoneTextures.diffuse,
        roughnessMap: stoneTextures.roughness,
        bumpMap: stoneTextures.bump,
        bumpScale: 0.003,
        roughness: 0.58,
        metalness: 0.02,
        envMapIntensity: 0.70,
      }),
    );

    // 3. Precision brushed stainless steel / satin silver (#d4d9e0)
    const matSilver = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: silverTextures.diffuse,
        roughnessMap: silverTextures.roughness,
        bumpMap: silverTextures.roughness,
        bumpScale: 0.002,
        roughness: 0.26,
        metalness: 0.95,
        envMapIntensity: 1.75,
      }),
    );

    // 4. Glass entrance doors & transoms (Smoked crystal glass with refined reflections)
    const matDoorGlass = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2a1217"),
        opacity: 0.40,
        transparent: true,
        roughness: 0.04,
        metalness: 0.06,
        reflectivity: 0.96,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 2.2,
      }),
    );

    // 5. Red carpet velvet (Deep royal gala crimson: #B81D35 with woven microtexture & cloth sheen)
    const matRedCarpet = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        map: carpetTextures.diffuse,
        roughnessMap: carpetTextures.roughness,
        bumpMap: carpetTextures.normal,
        bumpScale: 0.004,
        roughness: 0.92,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#A2152E"),
        sheenRoughness: 0.40,
        envMapIntensity: 0.10,
      }),
    );

    // 6. Plaza floor (Dark polished architectural stone with subtle slab joints)
    const matPlazaFloor = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        map: floorTextures.diffuse,
        roughnessMap: floorTextures.roughness,
        bumpMap: floorTextures.normal,
        bumpScale: 0.003,
        roughness: 0.32,
        metalness: 0.08,
        clearcoat: 0.22,
        clearcoatRoughness: 0.28,
        envMapIntensity: 1.15,
      }),
    );

    // 7. Side Banners backing (Matte coated textile)
    const matBannerBacking = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: bannerTextures.diffuse,
        roughnessMap: bannerTextures.roughness,
        bumpMap: bannerTextures.normal,
        bumpScale: 0.004,
        roughness: 0.82,
        metalness: 0.04,
        envMapIntensity: 0.65,
      }),
    );

    // 8. Stanchion velvet ropes (Royal burgundy velvet)
    const matRope = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#7A0E22"),
        normalMap: ropeNormal,
        roughness: 0.88,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#A2152E"),
        sheenRoughness: 0.35,
      }),
    );

    // 9. Side Pedestals (Premium burgundy stone body)
    const matPedestal = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: stoneTextures.diffuse,
        roughnessMap: stoneTextures.roughness,
        bumpMap: stoneTextures.bump,
        bumpScale: 0.003,
        roughness: 0.44,
        metalness: 0.02,
        envMapIntensity: 0.90,
      }),
    );

    // 10. Silver modern sculptures (Satin brushed sterling silver)
    const matSculpture = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        map: silverTextures.diffuse,
        roughnessMap: silverTextures.roughness,
        bumpMap: silverTextures.roughness,
        bumpScale: 0.004,
        roughness: 0.24,
        metalness: 0.95,
        envMapIntensity: 1.80,
      }),
    );

    // 11. Cocktail Table Tops (Dark polished burgundy stone)
    const matTableTop = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xffffff),
        map: floorTextures.diffuse,
        roughnessMap: floorTextures.roughness,
        bumpMap: floorTextures.normal,
        bumpScale: 0.005,
        roughness: 0.26,
        metalness: 0.08,
        clearcoat: 0.25,
        clearcoatRoughness: 0.20,
        envMapIntensity: 1.25,
      }),
    );

    // Dark red rose florets
    const matRoses = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#660A1A"),
        roughness: 0.75,
        metalness: 0.05,
      }),
    );

    // Sconce & candle warm frosted lenses
    const matFlame = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ffeed8"),
        emissive: new THREE.Color("#ffd2a0"),
        emissiveIntensity: 0.85,
        roughness: 0.60,
      }),
    );

    // ── 6. ARCHITECTURAL LIGHTING SETUP (PHYSICALLY CALIBRATED) ───────────────
    // Soft subtle wine ambient fill so shadowed areas retain their deep burgundy identity (Requirement 9 & 1)
    scene.add(new THREE.AmbientLight(0x320a12, 0.85));

    // Atmospheric hemisphere light: rich warm architectural burgundy sky + deep mahogany ground bounce (no white washout)
    scene.add(new THREE.HemisphereLight(0x7e2030, 0x140306, 0.60));

    // Soft wide frontal backdrop wash in warm wine-rose to naturally reveal the stone textures without white burnout
    const backdropWash = new THREE.DirectionalLight(0xd2828e, isMobile ? 0.22 : 0.40);
    backdropWash.position.set(0, 8.0, 16.0);
    scene.add(backdropWash);

    // Warm overhead key light grazing facade, steps and red carpet
    const keyLight = new THREE.DirectionalLight(0xfff4e6, isMobile ? 1.10 : 1.35);
    keyLight.position.set(5.5, 12.0, 9.0);
    if (!isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.bias = -0.00015;
      keyLight.shadow.normalBias = 0.02;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 40;
      keyLight.shadow.camera.left = -14;
      keyLight.shadow.camera.right = 14;
      keyLight.shadow.camera.top = 18;
      keyLight.shadow.camera.bottom = -4;
    }
    scene.add(keyLight);

    // Cool silver rim light catching beveled edges, arch trims, and stanchions
    const rimLight = new THREE.DirectionalLight(0xd8e0ee, 0.55);
    rimLight.position.set(-9.0, 8.0, 7.0);
    scene.add(rimLight);

    // Dedicated Banner Accent Spotlights (Requirement 7: crisp readability and fabric luster)
    const initialBannerX = aspect < 1.0 ? (aspect < 0.65 ? 3.75 : 4.40) : 5.45;
    const initialBannerScale = aspect < 1.0 ? (aspect < 0.65 ? 0.62 : 0.82) : 1.0;

    const leftBannerSpot = new THREE.SpotLight(0xfff6ee, 0.90, 9.0, Math.PI / 4, 0.6, 1.8);
    leftBannerSpot.position.set(-initialBannerX, 4.2 * initialBannerScale, 5.0);
    leftBannerSpot.target.position.set(-initialBannerX, 3.65 * initialBannerScale, 1.4);
    scene.add(leftBannerSpot);
    scene.add(leftBannerSpot.target);

    const rightBannerSpot = new THREE.SpotLight(0xfff6ee, 0.90, 9.0, Math.PI / 4, 0.6, 1.8);
    rightBannerSpot.position.set(initialBannerX, 4.2 * initialBannerScale, 5.0);
    rightBannerSpot.target.position.set(initialBannerX, 3.65 * initialBannerScale, 1.4);
    scene.add(rightBannerSpot);
    scene.add(rightBannerSpot.target);

    // Dedicated Flank Fill Lights (Requirement 8: illuminate pedestals and cocktail tables)
    const leftFlankLight = new THREE.SpotLight(0xfff0e4, 0.65, 10.0, Math.PI / 3, 0.7, 1.8);
    leftFlankLight.position.set(-6.0, 4.0, 6.5);
    leftFlankLight.target.position.set(-6.0, 1.2, 4.2);
    scene.add(leftFlankLight);
    scene.add(leftFlankLight.target);

    const rightFlankLight = new THREE.SpotLight(0xfff0e4, 0.65, 10.0, Math.PI / 3, 0.7, 1.8);
    rightFlankLight.position.set(6.0, 4.0, 6.5);
    rightFlankLight.target.position.set(6.0, 1.2, 4.2);
    scene.add(rightFlankLight);
    scene.add(rightFlankLight.target);

    // Symmetrical warm architectural spotlights grazing the portal pillars upwards
    const addPillarGrazingLight = (xPos: number) => {
      const spot = new THREE.SpotLight(0xffecd4, 1.15, 8.0, Math.PI / 4, 0.8, 2.0);
      spot.position.set(xPos, 0.5, 2.0);
      spot.target.position.set(xPos, 5.0, 1.4);
      scene.add(spot);
      scene.add(spot.target);
    };
    addPillarGrazingLight(-3.2);
    addPillarGrazingLight(3.2);

    // ── 7. BUILD THE NINE PARTS ───────────────────────────────────────────────
    const root = new THREE.Group();
    scene.add(root);

    const createBox = (
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      pos: [number, number, number],
      cast = false,
      recv = false,
    ): THREE.Mesh => {
      const g = trackGeom(new THREE.BoxGeometry(w, h, d));
      const m = new THREE.Mesh(g, mat);
      m.position.set(...pos);
      m.castShadow = cast;
      m.receiveShadow = recv;
      root.add(m);
      return m;
    };

    // SPEC DIMENSIONS:
    const OPENING_W = 4.2;
    const ARCH_R = OPENING_W / 2; // 2.1m
    const SPRING_Y = 0.48 + 3.3; // 3.78m
    const CROWN_Y = SPRING_Y + ARCH_R; // 5.88m

    /* ─────────────────────────────────────────────────────────────────────────
       PART 1: FAÇADE WALL
       38m wide, 16m high with arched doorway opening
       ───────────────────────────────────────────────────────────────────────── */
    const WALL_W = 38.0;
    const WALL_H = 16.0;
    const WALL_Z = 1.4;

    const facadeShape = new THREE.Shape();
    facadeShape.moveTo(-WALL_W / 2, 0);
    facadeShape.lineTo(-WALL_W / 2, WALL_H);
    facadeShape.lineTo(WALL_W / 2, WALL_H);
    facadeShape.lineTo(WALL_W / 2, 0);
    facadeShape.lineTo(-WALL_W / 2, 0);

    const wallOpeningHole = new THREE.Path();
    wallOpeningHole.moveTo(-ARCH_R, 0.48);
    wallOpeningHole.lineTo(-ARCH_R, SPRING_Y);
    wallOpeningHole.absarc(0, SPRING_Y, ARCH_R, Math.PI, 0, true);
    wallOpeningHole.lineTo(ARCH_R, 0.48);
    wallOpeningHole.lineTo(-ARCH_R, 0.48);
    facadeShape.holes.push(wallOpeningHole);

    const facadeGeom = trackGeom(
      new THREE.ExtrudeGeometry(facadeShape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.03,
        bevelSegments: 3,
        curveSegments: 48,
      }),
    );
    const facadeMesh = new THREE.Mesh(facadeGeom, matFacadeWall);
    facadeMesh.position.set(0, 0, WALL_Z - 0.3);
    facadeMesh.receiveShadow = true;
    root.add(facadeMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 2: THE GRAND PORTAL (SURROUND & ARCHED OPENING)
       ───────────────────────────────────────────────────────────────────────── */
    const SURROUND_BAND = 0.9;
    const SURROUND_OUTER_R = ARCH_R + SURROUND_BAND; // 3.0m
    const SURROUND_DEPTH = 0.6;

    const surroundShape = new THREE.Shape();
    surroundShape.moveTo(-SURROUND_OUTER_R, 0.48);
    surroundShape.lineTo(-SURROUND_OUTER_R, SPRING_Y);
    surroundShape.absarc(0, SPRING_Y, SURROUND_OUTER_R, Math.PI, 0, true);
    surroundShape.lineTo(SURROUND_OUTER_R, 0.48);
    surroundShape.lineTo(-SURROUND_OUTER_R, 0.48);

    const surroundHole = new THREE.Path();
    surroundHole.moveTo(-ARCH_R, 0.48);
    surroundHole.lineTo(-ARCH_R, SPRING_Y);
    surroundHole.absarc(0, SPRING_Y, ARCH_R, Math.PI, 0, true);
    surroundHole.lineTo(ARCH_R, 0.48);
    surroundHole.lineTo(-ARCH_R, 0.48);
    surroundShape.holes.push(surroundHole);

    const surroundGeom = trackGeom(
      new THREE.ExtrudeGeometry(surroundShape, {
        depth: SURROUND_DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 48,
      }),
    );
    const surroundMesh = new THREE.Mesh(surroundGeom, matPortalStone);
    surroundMesh.position.set(0, 0, WALL_Z);
    surroundMesh.castShadow = true;
    surroundMesh.receiveShadow = true;
    root.add(surroundMesh);

    // Deep Recessed Passage (1.4m deep reveals & underside from z = 1.4m to z = 0m)
    const PASSAGE_DEPTH = 1.4;
    const PASSAGE_Z_MID = WALL_Z - PASSAGE_DEPTH / 2; // z = 0.7m

    createBox(
      0.35,
      SPRING_Y - 0.48,
      PASSAGE_DEPTH,
      matPortalStone,
      [-ARCH_R - 0.175, 0.48 + (SPRING_Y - 0.48) / 2, PASSAGE_Z_MID],
      true,
      true,
    );

    createBox(
      0.35,
      SPRING_Y - 0.48,
      PASSAGE_DEPTH,
      matPortalStone,
      [ARCH_R + 0.175, 0.48 + (SPRING_Y - 0.48) / 2, PASSAGE_Z_MID],
      true,
      true,
    );

    const archSoffitGeom = trackGeom(
      new THREE.CylinderGeometry(
        ARCH_R,
        ARCH_R,
        PASSAGE_DEPTH,
        48,
        1,
        true,
        0,
        Math.PI,
      ),
    );
    const archSoffitMesh = new THREE.Mesh(archSoffitGeom, matPortalStone);
    archSoffitMesh.rotation.z = Math.PI / 2;
    archSoffitMesh.rotation.y = Math.PI / 2;
    archSoffitMesh.position.set(0, SPRING_Y, PASSAGE_Z_MID);
    archSoffitMesh.receiveShadow = true;
    root.add(archSoffitMesh);

    // Recessed Inner Frame (0.25m wide, set 0.5m deeper: z = 0.90m)
    const INNER_FRAME_BAND = 0.25;
    const innerFrameShape = new THREE.Shape();
    innerFrameShape.moveTo(-(ARCH_R - 0.01), 0.48);
    innerFrameShape.lineTo(-(ARCH_R - 0.01), SPRING_Y);
    innerFrameShape.absarc(0, SPRING_Y, ARCH_R - 0.01, Math.PI, 0, true);
    innerFrameShape.lineTo(ARCH_R - 0.01, 0.48);
    innerFrameShape.lineTo(-(ARCH_R - 0.01), 0.48);

    const innerR = ARCH_R - INNER_FRAME_BAND;
    const innerFrameHole = new THREE.Path();
    innerFrameHole.moveTo(-innerR, 0.48);
    innerFrameHole.lineTo(-innerR, SPRING_Y);
    innerFrameHole.absarc(0, SPRING_Y, innerR, Math.PI, 0, true);
    innerFrameHole.lineTo(innerR, 0.48);
    innerFrameHole.lineTo(-innerR, 0.48);
    innerFrameShape.holes.push(innerFrameHole);

    const innerFrameGeom = trackGeom(
      new THREE.ExtrudeGeometry(innerFrameShape, {
        depth: 0.15,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 36,
      }),
    );
    const innerFrameMesh = new THREE.Mesh(innerFrameGeom, matPortalStone);
    innerFrameMesh.position.set(0, 0, 0.9);
    innerFrameMesh.castShadow = true;
    innerFrameMesh.receiveShadow = true;
    root.add(innerFrameMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 3: BRUSHED SILVER REVEAL LINES
       ───────────────────────────────────────────────────────────────────────── */
    const createArchTrimCurve = (r: number, zPos: number): THREE.Mesh => {
      const curve = new THREE.CurvePath<THREE.Vector3>();
      curve.add(
        new THREE.LineCurve3(
          new THREE.Vector3(-r, 0.48, zPos),
          new THREE.Vector3(-r, SPRING_Y, zPos),
        ),
      );
      const pts = 32;
      for (let i = 0; i < pts; i++) {
        const theta1 = Math.PI - (i / pts) * Math.PI;
        const theta2 = Math.PI - ((i + 1) / pts) * Math.PI;
        curve.add(
          new THREE.LineCurve3(
            new THREE.Vector3(
              Math.cos(theta1) * r,
              SPRING_Y + Math.sin(theta1) * r,
              zPos,
            ),
            new THREE.Vector3(
              Math.cos(theta2) * r,
              SPRING_Y + Math.sin(theta2) * r,
              zPos,
            ),
          ),
        );
      }
      curve.add(
        new THREE.LineCurve3(
          new THREE.Vector3(r, SPRING_Y, zPos),
          new THREE.Vector3(r, 0.48, zPos),
        ),
      );

      const tubeGeom = trackGeom(
        new THREE.TubeGeometry(curve, 64, 0.02, 12, false),
      );
      const tubeMesh = new THREE.Mesh(tubeGeom, matSilver);
      tubeMesh.castShadow = true;
      root.add(tubeMesh);
      return tubeMesh;
    };

    createArchTrimCurve(ARCH_R + 0.01, 2.01);
    createArchTrimCurve(innerR, 1.06);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 4: MONUMENTAL ENTRANCE DOORS, SIDELIGHTS, TRANSOM & WARM FOYER
       - 2.4m wide double doors aligned with the red carpet width
       - Framed smoked crystal glass sidelights flanking the doors
       - Arched smoked glass transom (lunette) with silver radiating muntins
       - Grand burgundy stone corridor extending seamlessly into the venue
       ───────────────────────────────────────────────────────────────────────── */
    const DOOR_LEAF_W = 1.20; // 2 leaves = 2.40m, matching CARPET_W exactly
    const DOOR_LEAF_H = 3.20; // y: 0.48 to 3.68m
    const DOOR_FRAME_T = 0.045;
    const DOOR_THICK = 0.035;

    const createDoorAssembly = (side: -1 | 1): THREE.Group => {
      const doorPivot = new THREE.Group();
      doorPivot.position.set(side * DOOR_LEAF_W, 0.48, 0.0);
      doorPivot.rotation.y = 0; // Starts CLOSED

      const leaf = new THREE.Group();
      leaf.position.set(-side * (DOOR_LEAF_W / 2), DOOR_LEAF_H / 2, 0);

      // Smoked reflective crystal glass
      const glassG = trackGeom(
        new THREE.BoxGeometry(
          DOOR_LEAF_W - DOOR_FRAME_T * 2,
          DOOR_LEAF_H - DOOR_FRAME_T * 2,
          0.015,
        ),
      );
      const glassM = new THREE.Mesh(glassG, matDoorGlass);
      leaf.add(glassM);

      // Brushed silver frame
      const fMat = matSilver;
      const tfG = trackGeom(
        new THREE.BoxGeometry(DOOR_LEAF_W, DOOR_FRAME_T, DOOR_THICK),
      );
      const tfTop = new THREE.Mesh(tfG, fMat);
      tfTop.position.set(0, DOOR_LEAF_H / 2 - DOOR_FRAME_T / 2, 0);
      leaf.add(tfTop);

      const tfBot = new THREE.Mesh(tfG, fMat);
      tfBot.position.set(0, -DOOR_LEAF_H / 2 + DOOR_FRAME_T / 2, 0);
      leaf.add(tfBot);

      const vfG = trackGeom(
        new THREE.BoxGeometry(DOOR_FRAME_T, DOOR_LEAF_H, DOOR_THICK),
      );
      const vfLeft = new THREE.Mesh(vfG, fMat);
      vfLeft.position.set(-DOOR_LEAF_W / 2 + DOOR_FRAME_T / 2, 0, 0);
      leaf.add(vfLeft);

      const vfRight = new THREE.Mesh(vfG, fMat);
      vfRight.position.set(DOOR_LEAF_W / 2 - DOOR_FRAME_T / 2, 0, 0);
      leaf.add(vfRight);

      // Tall vertical brushed silver pull handle
      const handleG = trackGeom(
        new THREE.CylinderGeometry(0.016, 0.016, 1.25, 16),
      );
      const handleMesh = new THREE.Mesh(handleG, matSilver);
      const handleX = side * (DOOR_LEAF_W / 2 - DOOR_FRAME_T - 0.08);
      handleMesh.position.set(handleX, 0, DOOR_THICK / 2 + 0.04);
      leaf.add(handleMesh);

      [-0.48, 0.48].forEach((hy) => {
        const soG = trackGeom(
          new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12),
        );
        const soMesh = new THREE.Mesh(soG, matSilver);
        soMesh.rotation.x = Math.PI / 2;
        soMesh.position.set(handleX, hy, DOOR_THICK / 2 + 0.02);
        leaf.add(soMesh);
      });

      doorPivot.add(leaf);
      root.add(doorPivot);
      return doorPivot;
    };

    const leftDoorPivot = createDoorAssembly(-1);
    const rightDoorPivot = createDoorAssembly(1);

    // Flanking Sidelights (left: x = -2.1 to -1.2, right: x = 1.2 to 2.1)
    const SIDELIGHT_W = ARCH_R - DOOR_LEAF_W; // 0.90m
    [-1, 1].forEach((side) => {
      const slCenterX = side * (DOOR_LEAF_W + SIDELIGHT_W / 2);

      // Sidelight smoked glass pane
      const slGlassG = trackGeom(
        new THREE.BoxGeometry(SIDELIGHT_W - 0.06, DOOR_LEAF_H - 0.06, 0.015),
      );
      const slGlassM = new THREE.Mesh(slGlassG, matDoorGlass);
      slGlassM.position.set(slCenterX, 0.48 + DOOR_LEAF_H / 2, 0.0);
      root.add(slGlassM);

      // Sidelight brushed silver top and bottom trims
      const slTopG = trackGeom(new THREE.BoxGeometry(SIDELIGHT_W, DOOR_FRAME_T, DOOR_THICK));
      const slTop = new THREE.Mesh(slTopG, matSilver);
      slTop.position.set(slCenterX, 0.48 + DOOR_LEAF_H - DOOR_FRAME_T / 2, 0.0);
      root.add(slTop);

      const slBotG = trackGeom(new THREE.BoxGeometry(SIDELIGHT_W, DOOR_FRAME_T, DOOR_THICK));
      const slBot = new THREE.Mesh(slBotG, matSilver);
      slBot.position.set(slCenterX, 0.48 + DOOR_FRAME_T / 2, 0.0);
      root.add(slBot);

      // Vertical silver mullion
      const slMullionG = trackGeom(new THREE.BoxGeometry(0.025, DOOR_LEAF_H, DOOR_THICK));
      const slMullion = new THREE.Mesh(slMullionG, matSilver);
      slMullion.position.set(slCenterX, 0.48 + DOOR_LEAF_H / 2, 0.0);
      root.add(slMullion);
    });

    // Brushed silver transom lintel bar separating doors from arched lunette
    const TRANSOM_Y = 0.48 + DOOR_LEAF_H; // 3.68m
    createBox(OPENING_W, 0.05, DOOR_THICK + 0.02, matSilver, [0, TRANSOM_Y + 0.025, 0.0], true);

    // Arched Smoked Glass Transom (Lunette) filling the arch above y = 3.68m
    const transomShape = new THREE.Shape();
    transomShape.moveTo(-ARCH_R + 0.02, TRANSOM_Y + 0.05);
    transomShape.lineTo(-ARCH_R + 0.02, SPRING_Y);
    transomShape.absarc(0, SPRING_Y, ARCH_R - 0.02, Math.PI, 0, true);
    transomShape.lineTo(ARCH_R - 0.02, TRANSOM_Y + 0.05);
    transomShape.closePath();

    const transomGeom = trackGeom(
      new THREE.ExtrudeGeometry(transomShape, { depth: 0.015, bevelEnabled: false }),
    );
    const transomMesh = new THREE.Mesh(transomGeom, matDoorGlass);
    transomMesh.position.set(0, 0, -0.007);
    root.add(transomMesh);

    // Radial brushed silver muntin ribs in the arched transom
    [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].forEach((angle) => {
      const rx = Math.cos(angle) * (ARCH_R - 0.02);
      const ry = SPRING_Y + Math.sin(angle) * (ARCH_R - 0.02);
      const ribCurve = new THREE.LineCurve3(
        new THREE.Vector3(0, SPRING_Y, 0.0),
        new THREE.Vector3(rx, ry, 0.0),
      );
      const ribG = trackGeom(new THREE.TubeGeometry(ribCurve, 16, 0.012, 8, false));
      const ribM = new THREE.Mesh(ribG, matSilver);
      root.add(ribM);
    });

    // Brushed silver threshold strip
    createBox(OPENING_W + 0.1, 0.025, 0.12, matSilver, [0, 0.48 + 0.012, 0.0]);

    // Grand Foyer / Corridor continuation behind the doors
    const CORRIDOR_W = 4.6;
    const CORRIDOR_H = 6.4;
    const CORRIDOR_D = 12.0;
    const CORRIDOR_Z = -CORRIDOR_D / 2;

    createBox(0.2, CORRIDOR_H, CORRIDOR_D, matPortalStone, [-CORRIDOR_W / 2 - 0.1, 0.48 + CORRIDOR_H / 2, CORRIDOR_Z], false, true);
    createBox(0.2, CORRIDOR_H, CORRIDOR_D, matPortalStone, [CORRIDOR_W / 2 + 0.1, 0.48 + CORRIDOR_H / 2, CORRIDOR_Z], false, true);
    createBox(CORRIDOR_W + 0.4, 0.2, CORRIDOR_D, matPortalStone, [0, 0.48 + CORRIDOR_H + 0.1, CORRIDOR_Z], false, true);

    // Warm illuminated feature wall at corridor end in deep burgundy
    const corridorEndG = trackGeom(new THREE.PlaneGeometry(CORRIDOR_W, CORRIDOR_H));
    const corridorEndM = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2a060d"),
        roughness: 0.60,
      }),
    );
    const corridorEndMesh = new THREE.Mesh(corridorEndG, corridorEndM);
    corridorEndMesh.position.set(0, 0.48 + CORRIDOR_H / 2, -CORRIDOR_D);
    root.add(corridorEndMesh);

    // Warm inviting corridor light glowing subtly through the glass doors
    const corridorLight = new THREE.PointLight(0xffdcb4, 0.55, 14.0, 2.0);
    corridorLight.position.set(0, 3.4, -4.5);
    root.add(corridorLight);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 5: ARCHITECTURAL ENTRANCE STEPS
       - Distinct satin stone treads (horizontal) and ambient-shadowed risers (vertical)
       - Brushed silver nosing with realistic contact shadow beneath each edge
       ───────────────────────────────────────────────────────────────────────── */
    const STEP_W = 7.0;
    const STEP_TREAD = 0.45;
    const stepConfigs = [
      { z: 3.125, y: 0.08, h: 0.16 }, // Step 1
      { z: 2.675, y: 0.16, h: 0.32 }, // Step 2
      { z: 2.225, y: 0.24, h: 0.48 }, // Step 3
    ];

    stepConfigs.forEach((sc) => {
      // Step core body
      createBox(
        STEP_W,
        sc.h,
        STEP_TREAD,
        matPortalStone,
        [0, sc.y, sc.z],
        true,
        true,
      );

      // Horizontal stone tread overlay
      const treadG = trackGeom(new THREE.BoxGeometry(STEP_W + 0.02, 0.035, STEP_TREAD + 0.02));
      const treadM = new THREE.Mesh(treadG, matStepTread);
      treadM.position.set(0, sc.y + sc.h / 2 - 0.015, sc.z);
      treadM.receiveShadow = true;
      root.add(treadM);

      // Vertical stone riser overlay
      const riserG = trackGeom(new THREE.BoxGeometry(STEP_W + 0.02, sc.h - 0.02, 0.02));
      const riserM = new THREE.Mesh(riserG, matStepRiser);
      riserM.position.set(0, sc.y - 0.01, sc.z + STEP_TREAD / 2 + 0.01);
      riserM.receiveShadow = true;
      root.add(riserM);

      // Precision brushed silver nosing along step edge
      const nosingG = trackGeom(
        new THREE.BoxGeometry(STEP_W + 0.04, 0.018, 0.024),
      );
      const nosingM = new THREE.Mesh(nosingG, matSilver);
      nosingM.position.set(0, sc.y + sc.h / 2, sc.z + STEP_TREAD / 2 + 0.01);
      nosingM.castShadow = true;
      root.add(nosingM);

      // Contact shadow beneath nosing lip
      const nosingShadowG = trackGeom(new THREE.PlaneGeometry(STEP_W, 0.04));
      const nosingShadowM = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x050102,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      const nosingShadow = new THREE.Mesh(nosingShadowG, nosingShadowM);
      nosingShadow.position.set(0, sc.y + sc.h / 2 - 0.022, sc.z + STEP_TREAD / 2 + 0.021);
      root.add(nosingShadow);
    });

    // Elevated entrance threshold platform behind steps (z: 0 to 2.0)
    createBox(STEP_W, 0.48, 2.0, matPortalStone, [0, 0.24, 1.0], false, true);

    // Soft contact shadow plane beneath step 1 on the floor
    const stepShadowG = trackGeom(new THREE.PlaneGeometry(STEP_W + 2.5, 3.5));
    const stepShadowM = trackMat(
      new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    const stepShadow = new THREE.Mesh(stepShadowG, stepShadowM);
    stepShadow.rotation.x = -Math.PI / 2;
    stepShadow.position.set(0, 0.005, 3.9);
    root.add(stepShadow);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 6: THE RED CARPET (REAL LUXURY WOVEN FABRIC)
       - 2.4m wide, draped over the three steps into the foyer
       - Micro-weave normal map + cloth velvet sheen
       ───────────────────────────────────────────────────────────────────────── */
    const CARPET_W = 2.4;
    const CARPET_T = 0.015;

    const carpetPathPts: [number, number][] = [
      [18.0, 0.003],
      [3.35, 0.003],
      [3.35, 0.163],
      [2.9, 0.163],
      [2.9, 0.323],
      [2.45, 0.323],
      [2.45, 0.483],
      [-9.0, 0.483],
    ];

    const carpetShape = new THREE.Shape();
    carpetShape.moveTo(carpetPathPts[0][0], carpetPathPts[0][1] + CARPET_T);
    for (let i = 1; i < carpetPathPts.length; i++) {
      carpetShape.lineTo(carpetPathPts[i][0], carpetPathPts[i][1] + CARPET_T);
    }
    for (let i = carpetPathPts.length - 1; i >= 0; i--) {
      carpetShape.lineTo(carpetPathPts[i][0], carpetPathPts[i][1]);
    }
    carpetShape.closePath();

    const carpetGeom = trackGeom(
      new THREE.ExtrudeGeometry(carpetShape, {
        depth: CARPET_W,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 2,
      }),
    );
    carpetGeom.rotateY(-Math.PI / 2);
    carpetGeom.translate(CARPET_W / 2, 0, 0);

    const carpetMesh = new THREE.Mesh(carpetGeom, matRedCarpet);
    carpetMesh.receiveShadow = true;
    carpetMesh.castShadow = true;
    root.add(carpetMesh);

    // Subtle dark contact shadow strips along carpet sides where it meets the plaza floor
    [-CARPET_W / 2, CARPET_W / 2].forEach((cx) => {
      const edgeShadowG = trackGeom(new THREE.PlaneGeometry(0.12, 14.5));
      const edgeShadowM = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x050102,
          transparent: true,
          opacity: 0.60,
          depthWrite: false,
        }),
      );
      const edgeShadow = new THREE.Mesh(edgeShadowG, edgeShadowM);
      edgeShadow.rotation.x = -Math.PI / 2;
      edgeShadow.position.set(cx, 0.002, 10.6);
      root.add(edgeShadow);
    });

    /* ─────────────────────────────────────────────────────────────────────────
       PART 7: PLAZA FLOOR
       - Dark polished architectural stone
       - Large-format slab joints with soft, restrained reflections
       ───────────────────────────────────────────────────────────────────────── */
    const plazaFloorG = trackGeom(new THREE.PlaneGeometry(38, 24));
    const plazaFloorMesh = new THREE.Mesh(plazaFloorG, matPlazaFloor);
    plazaFloorMesh.rotation.x = -Math.PI / 2;
    plazaFloorMesh.position.set(0, 0, 12);
    plazaFloorMesh.receiveShadow = true;
    root.add(plazaFloorMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 8: FOUR SILVER STANCHIONS WITH RED VELVET ROPES
       ───────────────────────────────────────────────────────────────────────── */
    const POST_H = 1.0;
    const POST_R = 0.022;
    const BASE_R = 0.16;
    const BASE_H = 0.035;
    const TOP_BALL_R = 0.042;

    const stanchionX = CARPET_W / 2 + 0.25; // 1.45m from center
    const stanchionZ1 = 3.6;
    const stanchionZ2 = 5.2;

    const stanchionPositions: [number, number][] = [
      [-stanchionX, stanchionZ1],
      [-stanchionX, stanchionZ2],
      [stanchionX, stanchionZ1],
      [stanchionX, stanchionZ2],
    ];

    stanchionPositions.forEach(([sx, sz]) => {
      // Solid weighted stepped circular base
      const baseG = trackGeom(
        new THREE.CylinderGeometry(BASE_R * 0.75, BASE_R, BASE_H, 32),
      );
      const baseM = new THREE.Mesh(baseG, matSilver);
      baseM.position.set(sx, BASE_H / 2, sz);
      baseM.castShadow = true;
      baseM.receiveShadow = true;
      root.add(baseM);

      // Cylindrical brushed silver post
      const stemG = trackGeom(
        new THREE.CylinderGeometry(
          POST_R,
          POST_R,
          POST_H - BASE_H - TOP_BALL_R,
          24,
        ),
      );
      const stemM = new THREE.Mesh(stemG, matSilver);
      stemM.position.set(sx, BASE_H + (POST_H - BASE_H - TOP_BALL_R) / 2, sz);
      stemM.castShadow = true;
      root.add(stemM);

      // Sterling silver top ball
      const ballG = trackGeom(new THREE.SphereGeometry(TOP_BALL_R, 24, 24));
      const ballM = new THREE.Mesh(ballG, matSilver);
      ballM.position.set(sx, POST_H - TOP_BALL_R / 2, sz);
      ballM.castShadow = true;
      root.add(ballM);

      // Heavy grounded soft radial contact shadow
      const postShadowG = trackGeom(
        new THREE.PlaneGeometry(BASE_R * 2.8, BASE_R * 2.8),
      );
      const postShadowM = trackMat(
        new THREE.MeshBasicMaterial({
          map: softShadowTex,
          transparent: true,
          opacity: 0.80,
          depthWrite: false,
        }),
      );
      const postShadow = new THREE.Mesh(postShadowG, postShadowM);
      postShadow.rotation.x = -Math.PI / 2;
      postShadow.position.set(sx, 0.003, sz);
      root.add(postShadow);
    });

    const ropeRingY = POST_H - 0.08;
    const ropeSag = 0.22;

    stanchionPositions.forEach(([sx, sz]) => {
      // Brushed silver rope attachment collar ring
      const collarG = trackGeom(
        new THREE.CylinderGeometry(POST_R * 1.55, POST_R * 1.55, 0.035, 24),
      );
      const collarM = new THREE.Mesh(collarG, matSilver);
      collarM.position.set(sx, ropeRingY, sz);
      collarM.castShadow = true;
      root.add(collarM);
    });

    const leftRopeG = trackGeom(
      createSaggingRopeGeometry(
        new THREE.Vector3(-stanchionX, ropeRingY, stanchionZ1),
        new THREE.Vector3(-stanchionX, ropeRingY, stanchionZ2),
        ropeSag,
      ),
    );
    const leftRopeM = new THREE.Mesh(leftRopeG, matRope);
    leftRopeM.castShadow = true;
    root.add(leftRopeM);

    const rightRopeG = trackGeom(
      createSaggingRopeGeometry(
        new THREE.Vector3(stanchionX, ropeRingY, stanchionZ1),
        new THREE.Vector3(stanchionX, ropeRingY, stanchionZ2),
        ropeSag,
      ),
    );
    const rightRopeM = new THREE.Mesh(rightRopeG, matRope);
    rightRopeM.castShadow = true;
    root.add(rightRopeM);

    // Brushed silver end clasps on velvet ropes connecting to stanchion collar rings
    const addRopeClasp = (pos: THREE.Vector3) => {
      const claspG = trackGeom(new THREE.CylinderGeometry(0.040, 0.035, 0.065, 16));
      const claspM = new THREE.Mesh(claspG, matSilver);
      claspM.position.copy(pos);
      claspM.castShadow = true;
      root.add(claspM);
    };
    addRopeClasp(new THREE.Vector3(-stanchionX, ropeRingY - 0.015, stanchionZ1 + 0.05));
    addRopeClasp(new THREE.Vector3(-stanchionX, ropeRingY - 0.015, stanchionZ2 - 0.05));
    addRopeClasp(new THREE.Vector3(stanchionX, ropeRingY - 0.015, stanchionZ1 + 0.05));
    addRopeClasp(new THREE.Vector3(stanchionX, ropeRingY - 0.015, stanchionZ2 - 0.05));

    /* ─────────────────────────────────────────────────────────────────────────
       PART 9: ARCHITECTURAL WALL ENVIRONMENT & LUXURY DÉCOR
       ───────────────────────────────────────────────────────────────────────── */
    const architecturalEnvironmentGroup = new THREE.Group();
    root.add(architecturalEnvironmentGroup);

    // 1. Architectural Wall Sconces Flanking the Arch (Between arch and banners)
    const leftWallSconceGroup = new THREE.Group();
    const rightWallSconceGroup = new THREE.Group();
    architecturalEnvironmentGroup.add(leftWallSconceGroup);
    architecturalEnvironmentGroup.add(rightWallSconceGroup);

    const sconceGroups = [
      { group: leftWallSconceGroup, sign: -1 },
      { group: rightWallSconceGroup, sign: 1 },
    ];

    sconceGroups.forEach(({ group, sign }) => {
      // Sleek cubic wall sconce in brushed silver
      const sBoxG = trackGeom(new THREE.BoxGeometry(0.14, 0.20, 0.10));
      const sBoxM = new THREE.Mesh(sBoxG, matSilver);
      sBoxM.position.set(0, 2.65, WALL_Z + 0.05);
      group.add(sBoxM);

      // Top and bottom frosted lenses
      [-0.09, 0.09].forEach((ey) => {
        const emitG = trackGeom(new THREE.BoxGeometry(0.11, 0.02, 0.07));
        const emitM = new THREE.Mesh(emitG, matFlame);
        emitM.position.set(0, 2.65 + ey, WALL_Z + 0.05);
        group.add(emitM);
      });

      // Realistic vertical architectural light washes grazing the wall (directional spotlights)
      const sconceUp = new THREE.SpotLight(0xffedd8, isMobile ? 1.20 : 1.8, 5.0, Math.PI / 3.4, 0.85, 1.8);
      sconceUp.position.set(0, 2.75, WALL_Z + 0.06);
      sconceUp.target.position.set(0, 5.2, WALL_Z);
      group.add(sconceUp);
      group.add(sconceUp.target);

      const sconceDown = new THREE.SpotLight(0xffedd8, 1.8, 6.0, Math.PI / 3.0, 0.85, 1.8);
      sconceDown.position.set(0, 2.55, WALL_Z + 0.06);
      sconceDown.target.position.set(0, 0.4, WALL_Z);
      group.add(sconceDown);
      group.add(sconceDown.target);

      const initialSconceX = aspect < 1.0 ? 3.02 : 3.85;
      group.position.set(sign * initialSconceX, 0, 0);
    });

    // 2. Vertical Architectural Pilasters & Sconces on Outer Burgundy Walls
    const outerPilasterX = [-7.8, 7.8];
    const PILASTER_W = 0.44;
    const PILASTER_H = 15.0;
    const PILASTER_D = 0.16;

    outerPilasterX.forEach((px) => {
      // Pilaster body in solid burgundy stone
      const pMesh = createBox(
        PILASTER_W,
        PILASTER_H,
        PILASTER_D,
        matPortalStone,
        [px, PILASTER_H / 2, WALL_Z + PILASTER_D / 2],
        true,
        true,
      );
      architecturalEnvironmentGroup.add(pMesh);

      // Brushed silver vertical reveal lines on each edge
      [-1, 1].forEach((edge) => {
        const trimG = trackGeom(new THREE.BoxGeometry(0.016, PILASTER_H, 0.02));
        const trimM = new THREE.Mesh(trimG, matSilver);
        trimM.position.set(
          px + edge * (PILASTER_W / 2 - 0.008),
          PILASTER_H / 2,
          WALL_Z + PILASTER_D + 0.01,
        );
        architecturalEnvironmentGroup.add(trimM);
      });

      // Sleek cubic wall sconce
      const sconceBodyG = trackGeom(new THREE.BoxGeometry(0.16, 0.22, 0.11));
      const sconceBodyM = new THREE.Mesh(sconceBodyG, matSilver);
      sconceBodyM.position.set(px, 2.9, WALL_Z + PILASTER_D + 0.06);
      architecturalEnvironmentGroup.add(sconceBodyM);

      // Top and bottom frosted lenses
      [-0.10, 0.10].forEach((ey) => {
        const emitG = trackGeom(new THREE.BoxGeometry(0.12, 0.02, 0.08));
        const emitM = new THREE.Mesh(emitG, matFlame);
        emitM.position.set(px, 2.9 + ey, WALL_Z + PILASTER_D + 0.06);
        architecturalEnvironmentGroup.add(emitM);
      });

      // Upward & downward grazing spotlights
      const sconceUp = new THREE.SpotLight(0xffedd8, 1.8, 6.0, Math.PI / 3.0, 0.85, 1.8);
      sconceUp.position.set(px, 3.02, WALL_Z + PILASTER_D + 0.07);
      sconceUp.target.position.set(px, 5.5, WALL_Z + PILASTER_D);
      architecturalEnvironmentGroup.add(sconceUp);
      architecturalEnvironmentGroup.add(sconceUp.target);

      const sconceDown = new THREE.SpotLight(0xffedd8, 1.8, 6.0, Math.PI / 3.0, 0.85, 1.8);
      sconceDown.position.set(px, 2.78, WALL_Z + PILASTER_D + 0.07);
      sconceDown.target.position.set(px, 0.5, WALL_Z + PILASTER_D);
      architecturalEnvironmentGroup.add(sconceDown);
      architecturalEnvironmentGroup.add(sconceDown.target);
    });

    // 3. Symmetrical Luxury Fabric Hanging Banners (Left: VIC / Right: GALA)
    const BANNER_Y = 3.65;
    const bw = 1.15; // half-width = 2.3m wide banner
    const bhTop = 2.05;
    const bhBot = -1.25;
    const bhTip = -1.85;

    const leftBannerTex = getLeftBannerTexture();
    const rightBannerTex = getRightBannerTexture();

    const leftBannerGroup = new THREE.Group();
    const rightBannerGroup = new THREE.Group();
    architecturalEnvironmentGroup.add(leftBannerGroup);
    architecturalEnvironmentGroup.add(rightBannerGroup);

    const bannerItems = [
      {
        group: leftBannerGroup,
        sign: -1,
        tex: leftBannerTex,
        phase: 0.0,
      },
      {
        group: rightBannerGroup,
        sign: 1,
        tex: rightBannerTex,
        phase: 2.1,
      },
    ];

    const activeBannerClothList: { geom: THREE.BufferGeometry; phase: number }[] = [];

    bannerItems.forEach(({ group, sign, tex, phase }) => {
      // A. Natural soft contact drop shadow between fabric banner and the burgundy stone wall
      const bShadowG = trackGeom(
        new THREE.PlaneGeometry(bw * 2.24, (bhTop - bhTip) * 1.04),
      );
      const bShadowM = trackMat(
        new THREE.MeshBasicMaterial({
          map: softShadowTex,
          transparent: true,
          opacity: 0.48,
          depthWrite: false,
        }),
      );
      const bShadow = new THREE.Mesh(bShadowG, bShadowM);
      bShadow.position.set(0, -0.06, 0.005);
      group.add(bShadow);

      // B. Subdivided Luxury Fabric Cloth Mesh with Natural Draping Curvature
      const clothGeom = trackGeom(
        createBannerFabricGeometry(bw, bhTop, bhBot, bhTip, 24, 36),
      );
      activeBannerClothList.push({ geom: clothGeom, phase });

      const clothMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: tex,
          normalMap: bannerTextures.normal,
          normalScale: new THREE.Vector2(0.35, 0.35),
          roughnessMap: bannerTextures.roughness,
          roughness: 0.52,
          metalness: 0.35,
          side: THREE.DoubleSide,
          shadowSide: THREE.DoubleSide,
          envMapIntensity: 1.05,
        }),
      );

      const clothMesh = new THREE.Mesh(clothGeom, clothMat);
      clothMesh.position.set(0, 0, 0.04);
      clothMesh.castShadow = true;
      clothMesh.receiveShadow = true;
      group.add(clothMesh);

      // C. Sleek Horizontal Brushed Silver Hanging Rail at Top
      const railRadius = 0.016;
      const railLength = bw * 2 + 0.22;
      const railG = trackGeom(
        new THREE.CylinderGeometry(railRadius, railRadius, railLength, 24),
      );
      const railM = new THREE.Mesh(railG, matSilver);
      railM.rotation.z = Math.PI / 2;
      railM.position.set(0, bhTop + 0.035, 0.055);
      railM.castShadow = true;
      group.add(railM);

      // Spherical finials on rail ends
      [-railLength / 2, railLength / 2].forEach((offset) => {
        const finialG = trackGeom(new THREE.SphereGeometry(0.032, 16, 16));
        const finialM = new THREE.Mesh(finialG, matSilver);
        finialM.position.set(offset, bhTop + 0.035, 0.055);
        finialM.castShadow = true;
        group.add(finialM);
      });

      // Wall standoff mounting brackets attaching rail to burgundy stone wall
      [-bw + 0.22, bw - 0.22].forEach((bracketX) => {
        const standoffG = trackGeom(
          new THREE.CylinderGeometry(0.012, 0.012, 0.075, 16),
        );
        const standoffM = new THREE.Mesh(standoffG, matSilver);
        standoffM.rotation.x = Math.PI / 2;
        standoffM.position.set(bracketX, bhTop + 0.035, 0.018);
        group.add(standoffM);

        // Wall escutcheon plate
        const escG = trackGeom(
          new THREE.CylinderGeometry(0.034, 0.034, 0.010, 16),
        );
        const escM = new THREE.Mesh(escG, matSilver);
        escM.rotation.x = Math.PI / 2;
        escM.position.set(bracketX, bhTop + 0.035, -0.015);
        group.add(escM);
      });

      // Discreet brushed silver attachment clasp rings along upper banner edge
      const clipCount = 8;
      for (let k = 0; k < clipCount; k++) {
        const cx = -bw + 0.12 + (k / (clipCount - 1)) * (bw * 2 - 0.24);
        const clipG = trackGeom(
          new THREE.CylinderGeometry(0.005, 0.005, 0.040, 12),
        );
        const clipM = new THREE.Mesh(clipG, matSilver);
        clipM.position.set(cx, bhTop + 0.018, 0.055);
        group.add(clipM);
      }

      // Initial responsive positioning & scaling
      const isMobileAspect = aspect < 1.0;
      const initialBannerX = isMobileAspect
        ? aspect < 0.65
          ? 3.90
          : 4.40
        : 5.45;
      const initialBannerScale = isMobileAspect
        ? aspect < 0.65
          ? 0.62
          : 0.82
        : 1.0;

      group.position.set(sign * initialBannerX, BANNER_Y, WALL_Z + 0.02);
      group.scale.setScalar(initialBannerScale);
    });

    // 4. Luxury Event Decorations (Pedestals in Burgundy Stone & VIP Cocktail Tables)
    const sideDecorationsGroup = new THREE.Group();
    sideDecorationsGroup.visible = !isMobile && aspect >= 1.0;
    architecturalEnvironmentGroup.add(sideDecorationsGroup);

    // A. Architectural Pedestals in Burgundy Stone with Brushed Silver Plinth/Cap & Sculptures
    const PED_W = 0.42;
    const PED_H = 1.15;
    const pedestalPositions: { x: number; z: number; mirror: boolean }[] = [
      { x: -6.2, z: 4.2, mirror: true },
      { x: 6.2, z: 4.2, mirror: false },
    ];

    pedestalPositions.forEach(({ x: px, z: pz, mirror }) => {
      // Body in premium burgundy stone (Requirement 8)
      const pedG = trackGeom(new THREE.BoxGeometry(PED_W, PED_H, PED_W));
      const pedM = new THREE.Mesh(pedG, matPedestal);
      pedM.position.set(px, PED_H / 2 + 0.02, pz);
      pedM.castShadow = true;
      pedM.receiveShadow = true;
      sideDecorationsGroup.add(pedM);

      // Brushed silver base plinth & top cap
      const basePlinthG = trackGeom(new THREE.BoxGeometry(PED_W + 0.04, 0.025, PED_W + 0.04));
      const basePlinthM = new THREE.Mesh(basePlinthG, matSilver);
      basePlinthM.position.set(px, 0.0125, pz);
      basePlinthM.castShadow = true;
      sideDecorationsGroup.add(basePlinthM);

      const topCapG = trackGeom(new THREE.BoxGeometry(PED_W + 0.04, 0.025, PED_W + 0.04));
      const topCapM = new THREE.Mesh(topCapG, matSilver);
      topCapM.position.set(px, PED_H + 0.02 + 0.0125, pz);
      topCapM.castShadow = true;
      sideDecorationsGroup.add(topCapM);

      // Satin silver modern ribbon knot sculpture atop pedestal (symmetrical on left & right)
      const scG = trackGeom(new THREE.TorusKnotGeometry(0.16, 0.042, 80, 20, 2, 3));
      const scM = new THREE.Mesh(scG, matSculpture);
      scM.position.set(px, PED_H + 0.045 + 0.22, pz);
      scM.rotation.set(0.3, mirror ? -0.5 : 0.5, mirror ? -0.1 : 0.1);
      scM.castShadow = true;
      sideDecorationsGroup.add(scM);

      // Grounding contact shadow beneath pedestal
      const pedShadowG = trackGeom(new THREE.PlaneGeometry(PED_W * 2.8, PED_W * 2.8));
      const pedShadowM = trackMat(
        new THREE.MeshBasicMaterial({
          map: softShadowTex,
          transparent: true,
          opacity: 0.80,
          depthWrite: false,
        }),
      );
      const pedShadow = new THREE.Mesh(pedShadowG, pedShadowM);
      pedShadow.rotation.x = -Math.PI / 2;
      pedShadow.position.set(px, 0.003, pz);
      sideDecorationsGroup.add(pedShadow);
    });

    // B. VIP Cocktail Tables with Polished Stone Top, Roses, and Candles
    const tablePositions: [number, number][] = [
      [-4.5, 5.3],
      [4.5, 5.3],
    ];

    const TABLE_BASE_R = 0.26;
    const TABLE_BASE_H = 0.025;
    const TABLE_STEM_R = 0.022;
    const TABLE_H = 1.05;
    const TABLE_TOP_R = 0.36;
    const TABLE_TOP_T = 0.028;

    tablePositions.forEach(([tx, tz]) => {
      // Circular weighted brushed silver base
      const baseG = trackGeom(new THREE.CylinderGeometry(TABLE_BASE_R * 0.9, TABLE_BASE_R, TABLE_BASE_H, 24));
      const baseM = new THREE.Mesh(baseG, matSilver);
      baseM.position.set(tx, TABLE_BASE_H / 2, tz);
      baseM.castShadow = true;
      sideDecorationsGroup.add(baseM);

      // Vertical brushed silver stem
      const stemH = TABLE_H - TABLE_BASE_H - TABLE_TOP_T;
      const stemG = trackGeom(new THREE.CylinderGeometry(TABLE_STEM_R, TABLE_STEM_R, stemH, 16));
      const stemM = new THREE.Mesh(stemG, matSilver);
      stemM.position.set(tx, TABLE_BASE_H + stemH / 2, tz);
      stemM.castShadow = true;
      sideDecorationsGroup.add(stemM);

      // Dark polished burgundy stone tabletop with brushed silver rim
      const topG = trackGeom(new THREE.CylinderGeometry(TABLE_TOP_R, TABLE_TOP_R, TABLE_TOP_T, 32));
      const topM = new THREE.Mesh(topG, matTableTop);
      topM.position.set(tx, TABLE_H - TABLE_TOP_T / 2, tz);
      topM.castShadow = true;
      sideDecorationsGroup.add(topM);

      const rimG = trackGeom(new THREE.CylinderGeometry(TABLE_TOP_R + 0.003, TABLE_TOP_R + 0.003, 0.012, 32));
      const rimM = new THREE.Mesh(rimG, matSilver);
      rimM.position.set(tx, TABLE_H - TABLE_TOP_T / 2, tz);
      sideDecorationsGroup.add(rimM);

      // Clear crystal glass vase
      const vaseG = trackGeom(new THREE.CylinderGeometry(0.065, 0.055, 0.24, 16));
      const vaseMesh = new THREE.Mesh(vaseG, matDoorGlass);
      vaseMesh.position.set(tx, TABLE_H + 0.12, tz);
      sideDecorationsGroup.add(vaseMesh);

      // Bouquet of dark crimson roses
      const roseGroup = new THREE.Group();
      roseGroup.position.set(tx, TABLE_H + 0.24, tz);

      const roseBudG = trackGeom(new THREE.DodecahedronGeometry(0.045, 0));
      const rosePositions: [number, number, number][] = [
        [0, 0.05, 0],
        [-0.04, 0.02, 0.03],
        [0.04, 0.02, 0.03],
        [-0.03, 0.01, -0.04],
        [0.03, 0.01, -0.04],
      ];
      rosePositions.forEach(([rx, ry, rz]) => {
        const rMesh = new THREE.Mesh(roseBudG, matRoses);
        rMesh.position.set(rx, ry, rz);
        rMesh.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, 0);
        roseGroup.add(rMesh);
      });
      sideDecorationsGroup.add(roseGroup);

      // Votive candle with frosted glow
      const votiveCupG = trackGeom(new THREE.CylinderGeometry(0.026, 0.024, 0.038, 12));
      const votiveCup = new THREE.Mesh(votiveCupG, matDoorGlass);
      votiveCup.position.set(tx + 0.12, TABLE_H + 0.019, tz + 0.06);
      sideDecorationsGroup.add(votiveCup);

      const flameDotG = trackGeom(new THREE.SphereGeometry(0.012, 8, 8));
      const flameDot = new THREE.Mesh(flameDotG, matFlame);
      flameDot.position.set(tx + 0.12, TABLE_H + 0.038, tz + 0.06);
      sideDecorationsGroup.add(flameDot);

      const candleLight = new THREE.PointLight(0xffeed4, 0.45, 2.5, 2.0);
      candleLight.position.set(tx + 0.12, TABLE_H + 0.06, tz + 0.06);
      sideDecorationsGroup.add(candleLight);

      // Grounding contact shadow beneath table
      const shadowG = trackGeom(new THREE.PlaneGeometry(TABLE_BASE_R * 3.4, TABLE_BASE_R * 3.4));
      const shadowM = trackMat(
        new THREE.MeshBasicMaterial({
          map: softShadowTex,
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        }),
      );
      const tableShadow = new THREE.Mesh(shadowG, shadowM);
      tableShadow.rotation.x = -Math.PI / 2;
      tableShadow.position.set(tx, 0.003, tz);
      sideDecorationsGroup.add(tableShadow);
    });

    // ── 8. MOUSE PARALLAX & RESIZE HANDLING ───────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const onMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    if (!isMobile) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("mouseleave", onMouseLeave, { passive: true });
    }

    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      isMobile = width < 768;

      const newAspect = width / height;
      camera.aspect = newAspect;
      camera.fov = newAspect < 0.65 ? 58 : newAspect < 1.0 ? 44 : 34;
      camera.updateProjectionMatrix();

      if (sideDecorationsGroup) {
        sideDecorationsGroup.visible = !isMobile && newAspect >= 1.0;
      }
      if (architecturalEnvironmentGroup) {
        architecturalEnvironmentGroup.visible = true;
      }

      const isMobileAspect = newAspect < 1.0;
      const responsiveBannerX = isMobileAspect
        ? newAspect < 0.65
          ? 3.90
          : 4.40
        : 5.45;
      const responsiveBannerScale = isMobileAspect
        ? newAspect < 0.65
          ? 0.62
          : 0.82
        : 1.0;

      if (leftBannerGroup && rightBannerGroup) {
        leftBannerGroup.position.set(-responsiveBannerX, BANNER_Y, WALL_Z + 0.02);
        leftBannerGroup.scale.setScalar(responsiveBannerScale);
        rightBannerGroup.position.set(responsiveBannerX, BANNER_Y, WALL_Z + 0.02);
        rightBannerGroup.scale.setScalar(responsiveBannerScale);
      }

      if (leftBannerSpot && rightBannerSpot) {
        leftBannerSpot.position.set(-responsiveBannerX, 4.0, 5.0);
        leftBannerSpot.target.position.set(-responsiveBannerX, BANNER_Y, WALL_Z);
        rightBannerSpot.position.set(responsiveBannerX, 4.0, 5.0);
        rightBannerSpot.target.position.set(responsiveBannerX, BANNER_Y, WALL_Z);
      }

      if (leftWallSconceGroup && rightWallSconceGroup) {
        const sconceX = isMobileAspect ? 3.02 : 3.85;
        leftWallSconceGroup.position.set(-sconceX, 0, 0);
        rightWallSconceGroup.position.set(sconceX, 0, 0);
      }

      if (isMobile) {
        mouseX = 0;
        mouseY = 0;
        currentParallaxX = 0;
        currentParallaxY = 0;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6),
      );
    };
    window.addEventListener("resize", handleResize);

    // ── 9. VISIBILITY OPTIMIZATION ─────────────────────────────────────────────
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 },
    );
    observer.observe(mount);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── 10. SCROLL-DRIVEN CAMERA TRAJECTORY & DYNAMIC DOORS ANIMATION ─────────
    let animId: number;
    let lastTime = performance.now();

    const activeBaseZ = aspect < 0.65 ? 20.5 : aspect < 1.0 ? 17.2 : 14.2;
    const activeBaseY = aspect < 0.65 ? 2.45 : aspect < 1.0 ? 1.95 : 1.65;
    let camZ = activeBaseZ;
    let camY = activeBaseY;

    const computeTrajectory = (p: number, bZ: number, bY: number) => {
      const eased = Math.pow(p, 1.15);
      const targetZ = bZ - eased * (bZ + 7.5);
      const stepLift = Math.sin(Math.min(1.0, p / 0.60) * Math.PI * 0.5) * 0.48;
      const targetY = bY + stepLift - p * 0.15;
      return { targetZ, targetY };
    };

    let hasRenderedFirstFrame = false;
    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      if (!isVisible && hasRenderedFirstFrame) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      hasRenderedFirstFrame = true;

      if (!isMobile) {
        currentParallaxX += (mouseX - currentParallaxX) * 0.05;
        currentParallaxY += (mouseY - currentParallaxY) * 0.05;
      } else {
        currentParallaxX += (0 - currentParallaxX) * 0.1;
        currentParallaxY += (0 - currentParallaxY) * 0.1;
      }

      // Safe, zero-latency scroll progress read
      let rawP = 0;
      if (
        scrollProgressRef &&
        typeof scrollProgressRef.current === "number" &&
        !isNaN(scrollProgressRef.current)
      ) {
        rawP = scrollProgressRef.current;
      } else if (
        typeof scrollRef.current === "number" &&
        !isNaN(scrollRef.current)
      ) {
        rawP = scrollRef.current;
      } else if (typeof scrollProgress === "number" && !isNaN(scrollProgress)) {
        rawP = scrollProgress;
      }
      const p = Math.max(0, Math.min(1.0, rawP));

      const curAspect = width / height;
      const curBaseZ = curAspect < 0.65 ? 20.5 : curAspect < 1.0 ? 17.2 : 14.2;
      const curBaseY = curAspect < 0.65 ? 2.45 : curAspect < 1.0 ? 1.95 : 1.65;

      const { targetZ, targetY } = computeTrajectory(p, curBaseZ, curBaseY);

      // Frame-rate independent responsive tracking tightly synchronized with GSAP scrub
      const lerpFactor = Math.min(1.0, delta * 24);
      camZ += (targetZ - camZ) * lerpFactor;
      camY += (targetY - camY) * lerpFactor;

      // Damping mouse parallax as the camera approaches doorway to guarantee center alignment (x = 0)
      const parallaxFade = Math.max(0, 1.0 - p * 2.2);
      camera.position.x = currentParallaxX * 0.15 * parallaxFade;
      camera.position.y = camY + currentParallaxY * 0.10 * parallaxFade;
      camera.position.z = camZ;

      const lookZ = Math.min(0, camZ - 8.0);
      const baseLookY = curAspect < 1.0 ? 3.05 : 2.85;
      const lookY = baseLookY + currentParallaxY * 0.06 * parallaxFade - p * 0.35;
      camera.lookAt(currentParallaxX * 0.04 * parallaxFade, lookY, lookZ);

      // Dynamic door swinging inward as user scrolls toward entrance threshold (opens smoothly between p: 0.16 -> 0.52)
      const doorT = Math.max(0, Math.min(1.0, (p - 0.16) / 0.36));
      const doorSmooth = doorT * doorT * (3 - 2 * doorT);
      const targetDoorAngle = doorSmooth * Math.PI * 0.46;
      leftDoorPivot.rotation.y = -targetDoorAngle;
      rightDoorPivot.rotation.y = targetDoorAngle;

      // Warm interior atmosphere bloom as visitor passes through the doorway
      if (corridorLight) {
        corridorLight.intensity = 0.55 + p * 0.65;
      }

      // Extremely subtle, slow procedural fabric breathing in still gala hall indoor air (Requirement 5)
      if (
        typeof window !== "undefined" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        const clothT = currentTime * 0.00085; // Slow, continuous ~7.4s cycle
        for (let bIdx = 0; bIdx < activeBannerClothList.length; bIdx++) {
          const { geom, phase } = activeBannerClothList[bIdx];
          const basePos = geom.userData.basePositions as Float32Array;
          const posAttr = geom.attributes.position;
          const arr = posAttr.array as Float32Array;
          const count = posAttr.count;
          const bhTopVal = geom.userData.bhTop as number;
          const bhTipVal = geom.userData.bhTip as number;
          const bwVal = geom.userData.bw as number;
          const spanY = bhTopVal - bhTipVal;

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const x0 = basePos[i3];
            const y0 = basePos[i3 + 1];
            const z0 = basePos[i3 + 2];

            // Normalized v: 1.0 at top rail (y0 = bhTop), 0.0 at bottom tip (y0 = bhTip)
            const v = Math.max(0, Math.min(1.0, (y0 - bhTipVal) / spanY));
            const u = Math.max(0, Math.min(1.0, x0 / (bwVal * 2) + 0.5));

            // Strictly zero motion at the top rail! Smooth non-linear factor
            const swayFactor = Math.pow(1.0 - v, 1.4);

            // Subtle indoor air breathing:
            // 1. Slow lateral sway (< 0.8 cm at bottom)
            const dx = Math.sin(clothT + phase + v * 1.4) * 0.008 * swayFactor;

            // 2. Gentle wave traveling down the fabric (< 1.5 cm)
            const wave1 =
              Math.sin(clothT * 1.15 + phase + (1.0 - v) * 2.8 + u * 1.8) * 0.011;
            const wave2 =
              Math.cos(clothT * 0.75 + phase + u * 3.2 + (1.0 - v) * 1.5) * 0.005;
            const dz = (wave1 + wave2) * swayFactor;

            // 3. Imperceptible vertical breath
            const dy = -Math.abs(Math.sin(clothT + phase)) * 0.0018 * swayFactor;

            arr[i3] = x0 + dx;
            arr[i3 + 1] = y0 + dy;
            arr[i3 + 2] = z0 + dz;
          }

          posAttr.needsUpdate = true;
          geom.computeVertexNormals();
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    if (onLoaded) {
      onLoaded();
    }

    // ── 11. CLEANUP ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", handleResize);
      if (!isMobile) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseleave", onMouseLeave);
      }

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());

      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [onLoaded, scrollProgressRef]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
