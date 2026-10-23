"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Real3DEntranceCanvasProps {
  scrollProgress: number;
  onLoaded?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PBR PROCEDURAL TEXTURES (HTML5 Canvas Generators)
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Procedural Red Carpet Velvet Texture
 * - Rich crimson-burgundy base (#5e0a1b)
 * - Micro-fibrous velvet noise for realistic fabric pile
 * - Thin darker border stripe (0.04m wide relative to 2.4m width => ~1.8% each side)
 * - Longitudinal weave subtle modulation
 */
function createVelvetCarpetTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#5e0a1b";
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const borderPixels = Math.round(width * 0.022); // ~0.04m border

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isBorder = x < borderPixels || x > width - borderPixels;

      // Fine velvet pile micro-noise
      const noise = (Math.random() - 0.5) * 12;
      const subtleWoven = Math.sin((y / height) * Math.PI * 96) * 3;

      if (isBorder) {
        // Darker border line (#32050e)
        data[idx]     = Math.max(0, Math.min(255, 50 + noise * 0.4));
        data[idx + 1] = Math.max(0, Math.min(255, 5  + noise * 0.2));
        data[idx + 2] = Math.max(0, Math.min(255, 14 + noise * 0.3));
      } else {
        // Velvet crimson-burgundy (#5e0a1b)
        data[idx]     = Math.max(0, Math.min(255, 94 + noise + subtleWoven));
        data[idx + 1] = Math.max(0, Math.min(255, 10 + noise * 0.3));
        data[idx + 2] = Math.max(0, Math.min(255, 27 + noise * 0.4));
      }
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 14);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Large-format Stone Slab Joint & Roughness Map
 * Slabs ~1.2m x 2.4m with thin dark joints
 */
function createStoneSlabMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#222222";
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  const slabW = size / 4;
  const slabH = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const sx = x % slabW;
      const sy = y % slabH;
      const isJoint = sx <= 1 || sx >= slabW - 1 || sy <= 1 || sy >= slabH - 1;

      const slabVariation = (Math.random() - 0.5) * 6;
      const baseRoughness = 48 + slabVariation;
      const val = isJoint ? 110 : baseRoughness;

      data[idx] = data[idx + 1] = data[idx + 2] = Math.min(255, Math.max(0, val));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  return texture;
}

/**
 * Soft Radial Contact Shadow Texture
 */
function createSoftShadowTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.05,
    size / 2, size / 2, size * 0.5
  );
  gradient.addColorStop(0, "rgba(4, 1, 2, 0.95)");
  gradient.addColorStop(0.35, "rgba(4, 1, 2, 0.65)");
  gradient.addColorStop(0.75, "rgba(4, 1, 2, 0.18)");
  gradient.addColorStop(1, "rgba(4, 1, 2, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Gala Dusk Environment Map
 * Deep burgundy/dusk ambient with cool silver side highlights (NO white ceiling glare)
 */
function createGalaDuskEnvMap(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x120205);

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
    addPanel(20, 20, 0x3d271e, [0, 20, 0], 0, Math.PI / 2),
    addPanel(8, 24, 0xb0b8c4, [-18, 8, 0], Math.PI / 2),
    addPanel(8, 24, 0xb0b8c4, [ 18, 8, 0], -Math.PI / 2),
    addPanel(12, 10, 0x24060c, [0, 4, -20]),
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
  onLoaded,
}: Real3DEntranceCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // WebGL capability check
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) return;
    } catch {
      return;
    }

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;
    let isMobile = width < 768;

    // ── 1. SCENE & BRAND OXBLOOD FOG (#140206) ────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x140206, 0.012);

    // ── 2. CAMERA SETUP & RESPONSIVE FRAMING ──────────────────────────────────
    const aspect = width / height;
    const baseFov = aspect < 1.0 ? 46 : 34;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

    const baseZ = aspect < 1.0 ? 17.5 : 14.2;
    const baseY = aspect < 1.0 ? 1.85 : 1.65;
    camera.position.set(0, baseY, baseZ);
    camera.lookAt(0, 2.85, 0);

    // ── 3. RENDERER ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.10;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Resource tracking
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => { geometries.push(g); return g; };
    const trackMat = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };
    const trackTex = <T extends THREE.Texture>(t: T): T => { textures.push(t); return t; };

    // ── 4. ENVIRONMENT MAP & TEXTURES ─────────────────────────────────────────
    const envTarget = createGalaDuskEnvMap(renderer);
    scene.environment = envTarget.texture;

    const carpetTex = trackTex(createVelvetCarpetTexture());
    const stoneSlabTex = trackTex(createStoneSlabMap());
    const softShadowTex = trackTex(createSoftShadowTexture());

    // ── 5. MATERIALS SPECIFICATION (EXACT PALETTE: BURGUNDY, SILVER, IVORY) ───

    // Part 1: Façade wall (Deep burgundy polished stone: #28070f)
    const matFacadeWall = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#28070f"),
        roughness: 0.36,
        roughnessMap: stoneSlabTex,
        metalness: 0.04,
        clearcoat: 0.40,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.50,
      })
    );

    // Part 2: Grand portal surround & Steps (Deep wine: #420b18)
    const matPortalStone = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#420b18"),
        roughness: 0.24,
        metalness: 0.05,
        clearcoat: 0.65,
        clearcoatRoughness: 0.18,
        envMapIntensity: 0.90,
      })
    );

    // Part 3: Brushed silver reveal line, door frames, handles, stanchions (#d6dadf)
    const matSilver = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d6dadf"),
        roughness: 0.24,
        metalness: 0.96,
        envMapIntensity: 1.85,
      })
    );

    // Part 4: Glass entrance doors (Lightly tinted, reflective)
    const matDoorGlass = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#dbe5ee"),
        transmission: 0.88,
        opacity: 0.45,
        transparent: true,
        roughness: 0.06,
        ior: 1.52,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.6,
      })
    );

    // Part 6: Red carpet velvet (Deep crimson-burgundy: #5e0a1b with sheen)
    const matRedCarpet = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#5e0a1b"),
        map: carpetTex,
        roughness: 0.88,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#901228"),
        sheenRoughness: 0.45,
        envMapIntensity: 0.20,
      })
    );

    // Part 7: Plaza floor (Dark obsidian burgundy stone: #120205, matte satin)
    const matPlazaFloor = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#120205"),
        roughness: 0.45,
        metalness: 0.06,
        envMapIntensity: 0.15,
      })
    );

    // Part 8: Background after the doors (MATCHES WEBSITE BACKGROUND COLOR: #140206)
    // Seamlessly blends into the site background with zero contrast shock
    const matLobbyBg = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#140206"),
      })
    );

    // Lobby interior walls & ceiling (Same deep oxblood background color: #140206)
    const matLobbyWall = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#140206"),
        roughness: 0.65,
        metalness: 0.02,
        envMapIntensity: 0.1,
      })
    );

    // Subdued architectural silver/ivory guide lines in lobby
    const matLightStrip = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#827870"),
        roughness: 0.4,
        metalness: 0.5,
      })
    );

    // Part 9: Velvet stanchion ropes (Deep burgundy: #520915 with sheen)
    const matRope = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#520915"),
        roughness: 0.84,
        metalness: 0.0,
        sheen: 1.0,
        sheenColor: new THREE.Color("#7e1024"),
        sheenRoughness: 0.4,
      })
    );

    // ── 6. ARCHITECTURAL LIGHTING SETUP ───────────────────────────────────────
    // Low ambient fill in deep burgundy (preserves rich dark shadows)
    scene.add(new THREE.AmbientLight(0x28040a, 0.85));

    // Warm overhead key light grazing facade and steps
    const keyLight = new THREE.DirectionalLight(0xfff6ec, 1.65);
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

    // Faint cool silver rim light catching beveled edges and stanchions
    const rimLight = new THREE.DirectionalLight(0xd0d8e2, 0.55);
    rimLight.position.set(-8.0, 7.0, 6.0);
    scene.add(rimLight);

    // Soft warm threshold wash: illuminates the red carpet on the steps
    const doorwayGlow = new THREE.PointLight(0xffedd6, 1.8, 10, 1.6);
    doorwayGlow.position.set(0, 2.5, 1.0);
    scene.add(doorwayGlow);

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

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isMobile) {
        currentParallaxX += (mouseX - currentParallaxX) * 0.05;
        currentParallaxY += (mouseY - currentParallaxY) * 0.05;
      } else {
        currentParallaxX += (0 - currentParallaxX) * 0.1;
        currentParallaxY += (0 - currentParallaxY) * 0.1;
      }

      const p = Math.max(0, Math.min(1.0, scrollRef.current));
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

      envTarget.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());

      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [onLoaded]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
