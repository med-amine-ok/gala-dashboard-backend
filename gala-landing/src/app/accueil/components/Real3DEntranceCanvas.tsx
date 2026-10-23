"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Real3DEntranceCanvasProps {
  scrollProgress?: number;
  scrollProgressRef?: React.RefObject<number | null> | React.MutableRefObject<number>;
  onLoaded?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PBR PROCEDURAL TEXTURES (Module-Level Singleton Cache for Instant Hero Load)
   ───────────────────────────────────────────────────────────────────────────── */

let cachedVelvetTexture: THREE.CanvasTexture | null = null;
let cachedStoneTexture: THREE.CanvasTexture | null = null;
let cachedShadowTexture: THREE.CanvasTexture | null = null;
let cachedEnvTexture: THREE.CanvasTexture | null = null;

/**
 * Procedural Red Carpet Velvet Texture
 * - Rich crimson-burgundy base (#5e0a1b)
 * - Micro-fibrous velvet noise for realistic fabric pile
 * - Thin darker border stripe (relative to 2.4m width)
 * - Ultra-fast Uint32Array pixel generation (executes in <2ms)
 */
function getVelvetCarpetTexture(): THREE.CanvasTexture {
  if (cachedVelvetTexture) return cachedVelvetTexture;

  const width = 512;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#5e0a1b";
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const buf32 = new Uint32Array(imgData.data.buffer);
  const borderPixels = Math.round(width * 0.022);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const subtleWoven = Math.sin((y / height) * Math.PI * 96) * 3;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const isBorder = x < borderPixels || x > width - borderPixels;
      const noise = (Math.random() - 0.5) * 12;

      let r: number, g: number, b: number;
      if (isBorder) {
        // Darker border line (#32050e)
        r = Math.max(0, Math.min(255, 50 + noise * 0.4));
        g = Math.max(0, Math.min(255, 5  + noise * 0.2));
        b = Math.max(0, Math.min(255, 14 + noise * 0.3));
      } else {
        // Velvet crimson-burgundy (#5e0a1b)
        r = Math.max(0, Math.min(255, 94 + noise + subtleWoven));
        g = Math.max(0, Math.min(255, 10 + noise * 0.3));
        b = Math.max(0, Math.min(255, 27 + noise * 0.4));
      }

      buf32[idx] = (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedVelvetTexture = texture;
  return texture;
}

/**
 * Large-format Stone Slab Joint & Roughness Map
 * Hardware-accelerated 2D canvas drawing (executes in <1ms)
 */
function getStoneSlabMap(): THREE.CanvasTexture {
  if (cachedStoneTexture) return cachedStoneTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#262626";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "#5a5a5a";
  ctx.lineWidth = 2;
  const slabW = size / 4;
  const slabH = size / 2;

  for (let x = 0; x <= size; x += slabW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += slabH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  cachedStoneTexture = texture;
  return texture;
}

/**
 * Soft Radial Contact Shadow Texture
 */
function getSoftShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTexture) return cachedShadowTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.04,
    size / 2, size / 2, size * 0.5
  );
  gradient.addColorStop(0, "rgba(4, 1, 2, 0.95)");
  gradient.addColorStop(0.35, "rgba(4, 1, 2, 0.65)");
  gradient.addColorStop(0.75, "rgba(4, 1, 2, 0.18)");
  gradient.addColorStop(1, "rgba(4, 1, 2, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  cachedShadowTexture = texture;
  return texture;
}

let cachedCubeTarget: THREE.WebGLCubeRenderTarget | null = null;

/**
 * Gala Dusk Environment Map
 * Deep burgundy/dusk ambient (#2D070D) with cool silver side highlights.
 * Native WebGLCubeRenderTarget ensures 100% compliant Three.js PBR reflections.
 */
function getGalaDuskCubeMap(renderer: THREE.WebGLRenderer): THREE.WebGLCubeRenderTarget {
  if (cachedCubeTarget) return cachedCubeTarget;

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x5E121E);

  const addPanel = (
    w: number, h: number,
    color: number,
    pos: [number, number, number],
    rotY = 0, rotX = 0
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    mesh.position.set(...pos);
    mesh.rotation.y = rotY;
    mesh.rotation.x = rotX;
    envScene.add(mesh);
    return mesh;
  };

  const panels = [
    addPanel(24, 24, 0x8B1E2D, [0, 22, 0], 0, Math.PI / 2),
    addPanel(10, 24, 0xd0d8e2, [-18, 8, 0], Math.PI / 2),
    addPanel(10, 24, 0xd0d8e2, [ 18, 8, 0], -Math.PI / 2),
    addPanel(16, 12, 0x661422, [0, 6, -20]),
  ];

  const target = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cubeCam = new THREE.CubeCamera(0.1, 100, target);
  cubeCam.update(renderer, envScene);

  panels.forEach((p) => {
    p.geometry.dispose();
    (p.material as THREE.Material).dispose();
  });

  cachedCubeTarget = target;
  return target;
}

/**
 * Creates a sagging catenary / bezier curve for velvet ropes between two 3D points
 */
function createSaggingRopeGeometry(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  sag: number,
  radius = 0.022
): THREE.TubeGeometry {
  const mid = new THREE.Vector3()
    .addVectors(p1, p2)
    .multiplyScalar(0.5);
  mid.y -= sag;

  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  return new THREE.TubeGeometry(curve, 32, radius, 12, false);
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

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

    // ── 1. RENDERER (Clean Direct Instantiation with Fallback) ────────────────
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";

    mount.appendChild(renderer.domElement);

    // ── 2. SCENE & WARM LUMINOUS BURGUNDY FOG (#4E0E1A) ──────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x4E0E1A, 0.007);

    // ── 3. CAMERA SETUP & RESPONSIVE FRAMING ──────────────────────────────────
    const aspect = width / height;
    const baseFov = aspect < 1.0 ? 46 : 34;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

    const baseZ = aspect < 1.0 ? 17.5 : 14.2;
    const baseY = aspect < 1.0 ? 1.85 : 1.65;
    camera.position.set(0, baseY, baseZ);
    camera.lookAt(0, 2.85, 0);

    // Resource tracking
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => { geometries.push(g); return g; };
    const trackMat = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };
    const trackTex = <T extends THREE.Texture>(t: T): T => { textures.push(t); return t; };

    // ── 4. ENVIRONMENT MAP & TEXTURES (Ultra-Fast Module Singletons) ──────────
    const envTarget = getGalaDuskCubeMap(renderer);
    scene.environment = envTarget.texture;

    const carpetTex = trackTex(getVelvetCarpetTexture());
    const stoneSlabTex = trackTex(getStoneSlabMap());
    const softShadowTex = trackTex(getSoftShadowTexture());

    // ── 5. MATERIALS SPECIFICATION (EXACT PALETTE: BURGUNDY, SILVER, IVORY) ───

    // Part 1: Façade wall (Warm illuminated burgundy marble: #4D101C)
    const matFacadeWall = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#4D101C"),
        roughness: 0.32,
        roughnessMap: stoneSlabTex,
        metalness: 0.04,
        clearcoat: 0.45,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.75,
      })
    );

    // Part 2: Grand portal surround & Steps (Rich wine: #5B1120)
    const matPortalStone = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#5B1120"),
        roughness: 0.22,
        metalness: 0.05,
        clearcoat: 0.70,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.10,
      })
    );

    // Part 3: Brushed silver reveal line, door frames, handles, stanchions (#d6dadf)
    const matSilver = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d6dadf"),
        roughness: 0.22,
        metalness: 0.96,
        envMapIntensity: 1.95,
      })
    );

    // Part 4: Glass entrance doors (High-performance crystal glass)
    const matDoorGlass = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#dbe5ee"),
        opacity: 0.35,
        transparent: true,
        roughness: 0.05,
        reflectivity: 0.92,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.9,
      })
    );

    // Part 6: Red carpet velvet (Deep royal crimson-burgundy: #6B0D20 with sheen)
    const matRedCarpet = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#6B0D20"),
        map: carpetTex,
        roughness: 0.86,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#AA1832"),
        sheenRoughness: 0.40,
        envMapIntensity: 0.25,
      })
    );

    // Part 7: Plaza floor (Warm polished burgundy stone: #3E0B16)
    const matPlazaFloor = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#3E0B16"),
        roughness: 0.38,
        metalness: 0.05,
        envMapIntensity: 0.45,
      })
    );

    // Part 8: Background after the doors (MATCHES LUMINOUS WINE TONE: #4A0C16)
    const matLobbyBg = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#4A0C16"),
      })
    );

    // Lobby interior walls & ceiling (Warm wine: #4A0C16)
    const matLobbyWall = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#4A0C16"),
        roughness: 0.55,
        metalness: 0.02,
        envMapIntensity: 0.25,
      })
    );

    // Subdued architectural silver/ivory guide lines in lobby
    const matLightStrip = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#958B82"),
        roughness: 0.35,
        metalness: 0.6,
      })
    );

    // Part 9: Velvet stanchion ropes (Royal burgundy: #620E1C with rich sheen)
    const matRope = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#620E1C"),
        roughness: 0.82,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#95152A"),
        sheenRoughness: 0.35,
      })
    );

    // ── 6. ARCHITECTURAL LIGHTING SETUP ───────────────────────────────────────
    // Warm rich wine ambient fill (illuminates shadows with glowing atmosphere)
    scene.add(new THREE.AmbientLight(0x6A1422, 1.45));

    // Atmospheric hemisphere light: champagne ivory sky + deep maroon bounce
    scene.add(new THREE.HemisphereLight(0xfff3e8, 0x5B0F1A, 0.95));

    // Warm overhead key light grazing facade and steps
    const keyLight = new THREE.DirectionalLight(0xfff6ec, 2.05);
    keyLight.position.set(5.5, 12.0, 9.0);
    if (!isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0003;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 40;
      keyLight.shadow.camera.left = -12;
      keyLight.shadow.camera.right = 12;
      keyLight.shadow.camera.top = 16;
      keyLight.shadow.camera.bottom = -4;
    }
    scene.add(keyLight);

    // Soft wide frontal backdrop wash to gently light the entire facade width
    const backdropWash = new THREE.DirectionalLight(0x8B1E2D, 1.15);
    backdropWash.position.set(0, 8.0, 16.0);
    scene.add(backdropWash);

    // Faint cool silver rim light catching beveled edges and stanchions
    const rimLight = new THREE.DirectionalLight(0xd8e0ec, 0.75);
    rimLight.position.set(-8.0, 7.0, 6.0);
    scene.add(rimLight);

    // Soft warm threshold wash: illuminates the red carpet on the steps
    const doorwayGlow = new THREE.PointLight(0xffeed8, 2.2, 12, 1.5);
    doorwayGlow.position.set(0, 2.8, 1.2);
    scene.add(doorwayGlow);

    // Symmetrical warm architectural uplights grazing the portal pillars
    const leftWallWash = new THREE.PointLight(0xffebd2, 1.6, 9.0, 1.6);
    leftWallWash.position.set(-3.6, 1.8, 3.2);
    scene.add(leftWallWash);

    const rightWallWash = new THREE.PointLight(0xffebd2, 1.6, 9.0, 1.6);
    rightWallWash.position.set(3.6, 1.8, 3.2);
    scene.add(rightWallWash);

    // ── 7. BUILD THE NINE PARTS ───────────────────────────────────────────────
    const root = new THREE.Group();
    scene.add(root);

    const createBox = (
      w: number, h: number, d: number,
      mat: THREE.Material,
      pos: [number, number, number],
      cast = false, recv = false
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
    const SPRING_Y = 0.48 + 3.3;  // 3.78m
    const CROWN_Y = SPRING_Y + ARCH_R; // 5.88m

    /* ─────────────────────────────────────────────────────────────────────────
       PART 1: FAÇADE WALL
       38m wide, 16m high. Extends beyond camera frame on every side.
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
        depth: 0.30,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.03,
        bevelSegments: 3,
        curveSegments: 48,
      })
    );
    const facadeMesh = new THREE.Mesh(facadeGeom, matFacadeWall);
    facadeMesh.position.set(0, 0, WALL_Z - 0.30);
    facadeMesh.receiveShadow = true;
    root.add(facadeMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 2: THE GRAND PORTAL (SURROUND & ARCHED OPENING)
       - Band 0.9m wide around opening
       - Projecting 0.6m out from wall
       - Recessed passage 1.4m deep before doors
       - Recessed inner frame (0.25m wide, set 0.5m deeper)
       ───────────────────────────────────────────────────────────────────────── */
    const SURROUND_BAND = 0.90;
    const SURROUND_OUTER_R = ARCH_R + SURROUND_BAND; // 3.0m
    const SURROUND_DEPTH = 0.60;

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
      })
    );
    const surroundMesh = new THREE.Mesh(surroundGeom, matPortalStone);
    surroundMesh.position.set(0, 0, WALL_Z);
    surroundMesh.castShadow = true;
    surroundMesh.receiveShadow = true;
    root.add(surroundMesh);

    // Deep Recessed Passage (1.4m deep reveals & underside from z = 1.4m to z = 0m)
    const PASSAGE_DEPTH = 1.40;
    const PASSAGE_Z_MID = WALL_Z - PASSAGE_DEPTH / 2; // z = 0.7m

    createBox(
      0.35, SPRING_Y - 0.48, PASSAGE_DEPTH,
      matPortalStone,
      [-ARCH_R - 0.175, 0.48 + (SPRING_Y - 0.48) / 2, PASSAGE_Z_MID],
      true, true
    );

    createBox(
      0.35, SPRING_Y - 0.48, PASSAGE_DEPTH,
      matPortalStone,
      [ ARCH_R + 0.175, 0.48 + (SPRING_Y - 0.48) / 2, PASSAGE_Z_MID],
      true, true
    );

    const archSoffitGeom = trackGeom(
      new THREE.CylinderGeometry(
        ARCH_R, ARCH_R, PASSAGE_DEPTH,
        48, 1, true, 0, Math.PI
      )
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
      })
    );
    const innerFrameMesh = new THREE.Mesh(innerFrameGeom, matPortalStone);
    innerFrameMesh.position.set(0, 0, 0.90);
    innerFrameMesh.castShadow = true;
    root.add(innerFrameMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 3: SILVER REVEAL LINE
       ───────────────────────────────────────────────────────────────────────── */
    const createArchTrimCurve = (r: number, zPos: number): THREE.Mesh => {
      const curve = new THREE.CurvePath<THREE.Vector3>();
      curve.add(new THREE.LineCurve3(
        new THREE.Vector3(-r, 0.48, zPos),
        new THREE.Vector3(-r, SPRING_Y, zPos)
      ));
      const pts = 32;
      for (let i = 0; i < pts; i++) {
        const theta1 = Math.PI - (i / pts) * Math.PI;
        const theta2 = Math.PI - ((i + 1) / pts) * Math.PI;
        curve.add(new THREE.LineCurve3(
          new THREE.Vector3(Math.cos(theta1) * r, SPRING_Y + Math.sin(theta1) * r, zPos),
          new THREE.Vector3(Math.cos(theta2) * r, SPRING_Y + Math.sin(theta2) * r, zPos)
        ));
      }
      curve.add(new THREE.LineCurve3(
        new THREE.Vector3(r, SPRING_Y, zPos),
        new THREE.Vector3(r, 0.48, zPos)
      ));

      const tubeGeom = trackGeom(new THREE.TubeGeometry(curve, 64, 0.020, 8, false));
      const tubeMesh = new THREE.Mesh(tubeGeom, matSilver);
      root.add(tubeMesh);
      return tubeMesh;
    };

    createArchTrimCurve(ARCH_R + 0.01, 2.01);
    createArchTrimCurve(innerR, 1.06);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 4: DYNAMIC GLASS ENTRANCE DOORS
       - Pair of tall glass doors (each leaf 1.05m wide, 3.2m high)
       - Swings open dynamically inward as visitor reaches the doors
       - Closed at initial view, fully open when passing through
       ───────────────────────────────────────────────────────────────────────── */
    const DOOR_LEAF_W = 1.05;
    const DOOR_LEAF_H = 3.20;
    const DOOR_FRAME_T = 0.05;
    const DOOR_THICK = 0.035;

    const createDoorAssembly = (side: -1 | 1): THREE.Group => {
      // Pivot at outer hinge
      const doorPivot = new THREE.Group();
      doorPivot.position.set(side * DOOR_LEAF_W, 0.48, 0.0);
      doorPivot.rotation.y = 0; // Starts CLOSED

      const leaf = new THREE.Group();
      // Center of leaf between hinge and middle meeting point
      leaf.position.set(-side * (DOOR_LEAF_W / 2), DOOR_LEAF_H / 2, 0);

      // Glass pane
      const glassG = trackGeom(new THREE.BoxGeometry(
        DOOR_LEAF_W - DOOR_FRAME_T * 2,
        DOOR_LEAF_H - DOOR_FRAME_T * 2,
        0.015
      ));
      const glassM = new THREE.Mesh(glassG, matDoorGlass);
      leaf.add(glassM);

      // Brushed silver frame
      const fMat = matSilver;
      const tfG = trackGeom(new THREE.BoxGeometry(DOOR_LEAF_W, DOOR_FRAME_T, DOOR_THICK));
      const tfTop = new THREE.Mesh(tfG, fMat);
      tfTop.position.set(0, DOOR_LEAF_H / 2 - DOOR_FRAME_T / 2, 0);
      leaf.add(tfTop);

      const tfBot = new THREE.Mesh(tfG, fMat);
      tfBot.position.set(0, -DOOR_LEAF_H / 2 + DOOR_FRAME_T / 2, 0);
      leaf.add(tfBot);

      const vfG = trackGeom(new THREE.BoxGeometry(DOOR_FRAME_T, DOOR_LEAF_H, DOOR_THICK));
      const vfLeft = new THREE.Mesh(vfG, fMat);
      vfLeft.position.set(-DOOR_LEAF_W / 2 + DOOR_FRAME_T / 2, 0, 0);
      leaf.add(vfLeft);

      const vfRight = new THREE.Mesh(vfG, fMat);
      vfRight.position.set(DOOR_LEAF_W / 2 - DOOR_FRAME_T / 2, 0, 0);
      leaf.add(vfRight);

      // Vertical pull handle near meeting edge
      const handleG = trackGeom(new THREE.CylinderGeometry(0.016, 0.016, 1.2, 16));
      const handleMesh = new THREE.Mesh(handleG, matSilver);
      const handleX = side * (DOOR_LEAF_W / 2 - DOOR_FRAME_T - 0.08);
      handleMesh.position.set(handleX, 0, DOOR_THICK / 2 + 0.04);
      leaf.add(handleMesh);

      [-0.45, 0.45].forEach((hy) => {
        const soG = trackGeom(new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12));
        const soMesh = new THREE.Mesh(soG, matSilver);
        soMesh.rotation.x = Math.PI / 2;
        soMesh.position.set(handleX, hy, DOOR_THICK / 2 + 0.02);
        leaf.add(soMesh);
      });

      doorPivot.add(leaf);
      root.add(doorPivot);
      return doorPivot;
    };

    // Store references to the two dynamic door pivots
    const leftDoorPivot = createDoorAssembly(-1);
    const rightDoorPivot = createDoorAssembly(1);

    // Silver threshold strip
    createBox(
      OPENING_W + 0.1, 0.025, 0.12,
      matSilver,
      [0, 0.48 + 0.012, 0.0]
    );

    /* ─────────────────────────────────────────────────────────────────────────
       PART 5: STEPS
       - Three wide steps: 0.16m rise x 0.45m tread, 7m wide
       ───────────────────────────────────────────────────────────────────────── */
    const STEP_W = 7.0;
    const STEP_TREAD = 0.45;
    const stepConfigs = [
      { z: 3.125, y: 0.08, h: 0.16 }, // Step 1
      { z: 2.675, y: 0.16, h: 0.32 }, // Step 2
      { z: 2.225, y: 0.24, h: 0.48 }, // Step 3
    ];

    stepConfigs.forEach((sc) => {
      createBox(
        STEP_W, sc.h, STEP_TREAD,
        matPortalStone,
        [0, sc.y, sc.z],
        true, true
      );

      const nosingG = trackGeom(new THREE.BoxGeometry(STEP_W + 0.02, 0.020, 0.022));
      const nosingM = new THREE.Mesh(nosingG, matSilver);
      nosingM.position.set(0, sc.y + sc.h / 2, sc.z + STEP_TREAD / 2);
      root.add(nosingM);
    });

    createBox(
      STEP_W, 0.48, 2.0,
      matPortalStone,
      [0, 0.24, 1.0],
      false, true
    );

    const stepShadowG = trackGeom(new THREE.PlaneGeometry(STEP_W + 3, 4));
    const stepShadowM = trackMat(new THREE.MeshBasicMaterial({
      map: softShadowTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    }));
    const stepShadow = new THREE.Mesh(stepShadowG, stepShadowM);
    stepShadow.rotation.x = -Math.PI / 2;
    stepShadow.position.set(0, 0.005, 3.8);
    root.add(stepShadow);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 6: THE RED CARPET (TAPIS ROUGE)
       - 2.4m wide
       - Draped over the three steps into the lobby for ~8m
       ───────────────────────────────────────────────────────────────────────── */
    const CARPET_W = 2.4;
    const CARPET_T = 0.015;

    const carpetPathPts: [number, number][] = [
      [18.0, 0.002],
      [3.35, 0.002],
      [3.35, 0.162],
      [2.90, 0.162],
      [2.90, 0.322],
      [2.45, 0.322],
      [2.45, 0.482],
      [0.00, 0.482],
      [-8.0, 0.482],
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
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
      })
    );
    carpetGeom.rotateY(-Math.PI / 2);
    carpetGeom.translate(CARPET_W / 2, 0, 0);

    const carpetMesh = new THREE.Mesh(carpetGeom, matRedCarpet);
    carpetMesh.receiveShadow = true;
    root.add(carpetMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 7: PLAZA FLOOR
       Wide, dark, polished stone floor (#120205)
       ───────────────────────────────────────────────────────────────────────── */
    const plazaFloorG = trackGeom(new THREE.PlaneGeometry(38, 24));
    const plazaFloorMesh = new THREE.Mesh(plazaFloorG, matPlazaFloor);
    plazaFloorMesh.rotation.x = -Math.PI / 2;
    plazaFloorMesh.position.set(0, 0, 12);
    plazaFloorMesh.receiveShadow = true;
    root.add(plazaFloorMesh);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 8: LOBBY & BACKGROUND AFTER THE DOORS
       - Matches the exact website background color: #140206
       - Dissolves seamlessly into the next chapter
       ───────────────────────────────────────────────────────────────────────── */
    const LOBBY_W = 8.0;
    const LOBBY_H = 6.0;
    const LOBBY_D = 10.0;
    const LOBBY_Z_MID = -LOBBY_D / 2; // z = -5.0m
    const LOBBY_FLOOR_Y = 0.48;

    // Lobby floor
    const lobbyFloorG = trackGeom(new THREE.PlaneGeometry(LOBBY_W, LOBBY_D));
    const lobbyFloorM = new THREE.Mesh(lobbyFloorG, matPlazaFloor);
    lobbyFloorM.rotation.x = -Math.PI / 2;
    lobbyFloorM.position.set(0, LOBBY_FLOOR_Y + 0.001, LOBBY_Z_MID);
    lobbyFloorM.receiveShadow = true;
    root.add(lobbyFloorM);

    // Left wall
    createBox(
      0.3, LOBBY_H, LOBBY_D,
      matLobbyWall,
      [-LOBBY_W / 2 - 0.15, LOBBY_FLOOR_Y + LOBBY_H / 2, LOBBY_Z_MID]
    );

    // Right wall
    createBox(
      0.3, LOBBY_H, LOBBY_D,
      matLobbyWall,
      [ LOBBY_W / 2 + 0.15, LOBBY_FLOOR_Y + LOBBY_H / 2, LOBBY_Z_MID]
    );

    // Ceiling
    createBox(
      LOBBY_W + 0.6, 0.3, LOBBY_D,
      matLobbyWall,
      [0, LOBBY_FLOOR_Y + LOBBY_H + 0.15, LOBBY_Z_MID]
    );

    // Back wall: SAME AS BACKGROUND COLOR (#140206)
    const backWallG = trackGeom(new THREE.PlaneGeometry(LOBBY_W, LOBBY_H));
    const backWallMesh = new THREE.Mesh(backWallG, matLobbyBg);
    backWallMesh.position.set(0, LOBBY_FLOOR_Y + LOBBY_H / 2, -LOBBY_D);
    root.add(backWallMesh);

    // Subdued architectural vertical guide lines
    [-3.5, -7.0].forEach((zPos) => {
      [-1, 1].forEach((side) => {
        const stripG = trackGeom(new THREE.BoxGeometry(0.02, 3.8, 0.04));
        const stripM = new THREE.Mesh(stripG, matLightStrip);
        stripM.position.set(side * (LOBBY_W / 2 - 0.01), LOBBY_FLOOR_Y + 2.4, zPos);
        root.add(stripM);
      });
    });

    /* ─────────────────────────────────────────────────────────────────────────
       PART 9: FOUR SILVER STANCHIONS WITH BURGUNDY ROPES
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
      [ stanchionX, stanchionZ1],
      [ stanchionX, stanchionZ2],
    ];

    stanchionPositions.forEach(([sx, sz]) => {
      const baseG = trackGeom(new THREE.CylinderGeometry(BASE_R * 0.7, BASE_R, BASE_H, 24));
      const baseM = new THREE.Mesh(baseG, matSilver);
      baseM.position.set(sx, BASE_H / 2, sz);
      baseM.castShadow = true;
      root.add(baseM);

      const stemG = trackGeom(new THREE.CylinderGeometry(POST_R, POST_R, POST_H - BASE_H - TOP_BALL_R, 16));
      const stemM = new THREE.Mesh(stemG, matSilver);
      stemM.position.set(sx, BASE_H + (POST_H - BASE_H - TOP_BALL_R) / 2, sz);
      stemM.castShadow = true;
      root.add(stemM);

      const ballG = trackGeom(new THREE.SphereGeometry(TOP_BALL_R, 16, 16));
      const ballM = new THREE.Mesh(ballG, matSilver);
      ballM.position.set(sx, POST_H - TOP_BALL_R / 2, sz);
      ballM.castShadow = true;
      root.add(ballM);

      const postShadowG = trackGeom(new THREE.PlaneGeometry(BASE_R * 2.8, BASE_R * 2.8));
      const postShadowM = trackMat(new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: 0.70,
        depthWrite: false,
      }));
      const postShadow = new THREE.Mesh(postShadowG, postShadowM);
      postShadow.rotation.x = -Math.PI / 2;
      postShadow.position.set(sx, 0.003, sz);
      root.add(postShadow);
    });

    const ropeRingY = POST_H - 0.08;
    const ropeSag = 0.22;

    const leftRopeG = trackGeom(
      createSaggingRopeGeometry(
        new THREE.Vector3(-stanchionX, ropeRingY, stanchionZ1),
        new THREE.Vector3(-stanchionX, ropeRingY, stanchionZ2),
        ropeSag
      )
    );
    const leftRopeM = new THREE.Mesh(leftRopeG, matRope);
    leftRopeM.castShadow = true;
    root.add(leftRopeM);

    const rightRopeG = trackGeom(
      createSaggingRopeGeometry(
        new THREE.Vector3(stanchionX, ropeRingY, stanchionZ1),
        new THREE.Vector3(stanchionX, ropeRingY, stanchionZ2),
        ropeSag
      )
    );
    const rightRopeM = new THREE.Mesh(rightRopeG, matRope);
    rightRopeM.castShadow = true;
    root.add(rightRopeM);

    /* ─────────────────────────────────────────────────────────────────────────
       PART 10: ELEGANT SILVER EVENT DECORATIONS (Symmetrical Gala Flanks)
       - Placed outside the central red carpet path (|x| >= 4.0m)
       - Minimalist VIP cocktail tables: brushed-silver base & dark burgundy top
       - Symmetrical architectural silver pedestals with geometric gala accents
       - Minimal warm-white architectural accent lighting
       - Realistic proportions and grounded contact shadows on the plaza floor
       - Hidden on mobile to keep narrow viewports clean and uncluttered
       ───────────────────────────────────────────────────────────────────────── */
    const sideDecorationsGroup = new THREE.Group();
    sideDecorationsGroup.visible = !isMobile && aspect >= 1.0;
    root.add(sideDecorationsGroup);

    // 1. VIP Cocktail Tables (Left: x = -4.2m, z = 5.6m | Right: x = +4.2m, z = 5.6m)
    const tablePositions: [number, number][] = [
      [-4.2, 5.6],
      [ 4.2, 5.6],
    ];

    const TABLE_BASE_R = 0.25;
    const TABLE_BASE_H = 0.022;
    const TABLE_STEM_R = 0.022;
    const TABLE_H = 1.05;
    const TABLE_TOP_R = 0.38;
    const TABLE_TOP_T = 0.028;

    tablePositions.forEach(([tx, tz]) => {
      // Brushed silver circular weighted base
      const baseG = trackGeom(new THREE.CylinderGeometry(TABLE_BASE_R * 0.9, TABLE_BASE_R, TABLE_BASE_H, 24));
      const baseM = new THREE.Mesh(baseG, matSilver);
      baseM.position.set(tx, TABLE_BASE_H / 2, tz);
      baseM.castShadow = true;
      sideDecorationsGroup.add(baseM);

      // Brushed silver slim vertical stem
      const stemH = TABLE_H - TABLE_BASE_H - TABLE_TOP_T;
      const stemG = trackGeom(new THREE.CylinderGeometry(TABLE_STEM_R, TABLE_STEM_R, stemH, 16));
      const stemM = new THREE.Mesh(stemG, matSilver);
      stemM.position.set(tx, TABLE_BASE_H + stemH / 2, tz);
      stemM.castShadow = true;
      sideDecorationsGroup.add(stemM);

      // Brushed silver collar accent below top
      const collarG = trackGeom(new THREE.CylinderGeometry(0.045, 0.035, 0.025, 16));
      const collarM = new THREE.Mesh(collarG, matSilver);
      collarM.position.set(tx, TABLE_BASE_H + stemH - 0.015, tz);
      sideDecorationsGroup.add(collarM);

      // Refined dark burgundy circular tabletop
      const topG = trackGeom(new THREE.CylinderGeometry(TABLE_TOP_R, TABLE_TOP_R, TABLE_TOP_T, 32));
      const topM = new THREE.Mesh(topG, matPortalStone);
      topM.position.set(tx, TABLE_H - TABLE_TOP_T / 2, tz);
      topM.castShadow = true;
      sideDecorationsGroup.add(topM);

      // Thin brushed silver edge rim around tabletop
      const rimG = trackGeom(new THREE.CylinderGeometry(TABLE_TOP_R + 0.003, TABLE_TOP_R + 0.003, 0.012, 32));
      const rimM = new THREE.Mesh(rimG, matSilver);
      rimM.position.set(tx, TABLE_H - TABLE_TOP_T / 2, tz);
      sideDecorationsGroup.add(rimM);

      // Contact shadow beneath table
      const shadowG = trackGeom(new THREE.PlaneGeometry(TABLE_BASE_R * 3.4, TABLE_BASE_R * 3.4));
      const shadowM = trackMat(new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }));
      const tableShadow = new THREE.Mesh(shadowG, shadowM);
      tableShadow.rotation.x = -Math.PI / 2;
      tableShadow.position.set(tx, 0.003, tz);
      sideDecorationsGroup.add(tableShadow);
    });

    // 2. Symmetrical Architectural Silver Pedestals (Left: x = -5.2m, z = 3.8m | Right: x = +5.2m, z = 3.8m)
    const pedestalPositions: [number, number][] = [
      [-5.2, 3.8],
      [ 5.2, 3.8],
    ];

    const PED_W = 0.36;
    const PED_H = 1.12;

    pedestalPositions.forEach(([px, pz]) => {
      // Pedestal body in rich dark burgundy stone
      const pedG = trackGeom(new THREE.BoxGeometry(PED_W, PED_H, PED_W));
      const pedM = new THREE.Mesh(pedG, matPortalStone);
      pedM.position.set(px, PED_H / 2 + 0.02, pz);
      pedM.castShadow = true;
      pedM.receiveShadow = true;
      sideDecorationsGroup.add(pedM);

      // Brushed silver base plinth
      const basePlinthG = trackGeom(new THREE.BoxGeometry(PED_W + 0.04, 0.025, PED_W + 0.04));
      const basePlinthM = new THREE.Mesh(basePlinthG, matSilver);
      basePlinthM.position.set(px, 0.0125, pz);
      sideDecorationsGroup.add(basePlinthM);

      // Brushed silver top cap
      const topCapG = trackGeom(new THREE.BoxGeometry(PED_W + 0.04, 0.025, PED_W + 0.04));
      const topCapM = new THREE.Mesh(topCapG, matSilver);
      topCapM.position.set(px, PED_H + 0.02 + 0.0125, pz);
      sideDecorationsGroup.add(topCapM);

      // Vertical silver corner reveals
      [-1, 1].forEach((cx) => {
        [-1, 1].forEach((cz) => {
          const cornerG = trackGeom(new THREE.BoxGeometry(0.015, PED_H, 0.015));
          const cornerM = new THREE.Mesh(cornerG, matSilver);
          cornerM.position.set(px + cx * (PED_W / 2 - 0.005), PED_H / 2 + 0.02, pz + cz * (PED_W / 2 - 0.005));
          sideDecorationsGroup.add(cornerM);
        });
      });

      // Minimalist silver gala sculpture / faceted geometric accent atop pedestal
      const prismG = trackGeom(new THREE.OctahedronGeometry(0.11, 0));
      const prismM = new THREE.Mesh(prismG, matSilver);
      prismM.position.set(px, PED_H + 0.045 + 0.11, pz);
      prismM.rotation.y = Math.PI / 4;
      prismM.castShadow = true;
      sideDecorationsGroup.add(prismM);

      // Contact shadow beneath pedestal
      const pedShadowG = trackGeom(new THREE.PlaneGeometry(PED_W * 2.8, PED_W * 2.8));
      const pedShadowM = trackMat(new THREE.MeshBasicMaterial({
        map: softShadowTex,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }));
      const pedShadow = new THREE.Mesh(pedShadowG, pedShadowM);
      pedShadow.rotation.x = -Math.PI / 2;
      pedShadow.position.set(px, 0.003, pz);
      sideDecorationsGroup.add(pedShadow);
    });

    // 3. Warm Architectural Lighting for Side Decorations
    const leftSideLight = new THREE.PointLight(0xffeedd, 1.35, 9.0, 1.6);
    leftSideLight.position.set(-4.2, 2.6, 5.4);
    sideDecorationsGroup.add(leftSideLight);

    const rightSideLight = new THREE.PointLight(0xffeedd, 1.35, 9.0, 1.6);
    rightSideLight.position.set(4.2, 2.6, 5.4);
    sideDecorationsGroup.add(rightSideLight);

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
      camera.fov = newAspect < 1.0 ? 46 : 34;
      camera.updateProjectionMatrix();

      if (sideDecorationsGroup) {
        sideDecorationsGroup.visible = !isMobile && newAspect >= 1.0;
      }

      if (isMobile) {
        mouseX = 0;
        mouseY = 0;
        currentParallaxX = 0;
        currentParallaxY = 0;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6));
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
      { threshold: 0.05 }
    );
    observer.observe(mount);

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── 10. SCROLL-DRIVEN CAMERA TRAJECTORY & DYNAMIC DOORS ANIMATION ─────────
    let animId: number;
    let lastTime = performance.now();

    const activeBaseZ = aspect < 1.0 ? 17.5 : 14.2;
    const activeBaseY = aspect < 1.0 ? 1.85 : 1.65;
    let camZ = activeBaseZ;
    let camY = activeBaseY;
    let currentDoorAngle = 0.0;

    const computeTrajectory = (p: number, bZ: number, bY: number) => {
      const eased = Math.pow(p, 1.15);
      const targetZ = bZ - eased * (bZ + 7.5);
      const stepLift = Math.sin(Math.min(1.0, p / 0.65) * Math.PI * 0.5) * 0.48;
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

      // Safe, zero-latency scroll progress read (ref or state, strictly protected against NaN)
      let rawP = 0;
      if (
        scrollProgressRef &&
        typeof scrollProgressRef.current === "number" &&
        !isNaN(scrollProgressRef.current)
      ) {
        rawP = scrollProgressRef.current;
      } else if (typeof scrollRef.current === "number" && !isNaN(scrollRef.current)) {
        rawP = scrollRef.current;
      } else if (typeof scrollProgress === "number" && !isNaN(scrollProgress)) {
        rawP = scrollProgress;
      }
      const p = Math.max(0, Math.min(1.0, rawP));

      const curAspect = width / height;
      const curBaseZ = curAspect < 1.0 ? 17.5 : 14.2;
      const curBaseY = curAspect < 1.0 ? 1.85 : 1.65;

      const { targetZ, targetY } = computeTrajectory(p, curBaseZ, curBaseY);

      camZ += (targetZ - camZ) * 0.10;
      camY += (targetY - camY) * 0.10;

      camera.position.x = currentParallaxX * 0.25;
      camera.position.y = camY + currentParallaxY * 0.12;
      camera.position.z = camZ;

      const lookZ = Math.min(0, camZ - 8.0);
      const lookY = 2.85 + currentParallaxY * 0.08 - p * 0.4;
      camera.lookAt(currentParallaxX * 0.06, lookY, lookZ);

      // ── DYNAMIC DOOR OPENING ON SCROLL REACH ────────────────────────────────
      // p <= 0.22: doors are closed (0 rad)
      // p: 0.22 -> 0.54 (as camera walks steps towards the doorway):
      // doors smoothly swing wide open inward (up to ~78 degrees / 1.36 rad)
      // p >= 0.54: doors stay wide open as camera enters the lobby
      const doorT = Math.max(0, Math.min(1.0, (p - 0.22) / 0.32));
      const doorSmooth = doorT * doorT * (3 - 2 * doorT); // Smoothstep curve
      const targetDoorAngle = doorSmooth * (Math.PI * 0.43); // ~78 degrees open

      currentDoorAngle += (targetDoorAngle - currentDoorAngle) * 0.12;
      leftDoorPivot.rotation.y = -currentDoorAngle;
      rightDoorPivot.rotation.y = currentDoorAngle;

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
