import * as THREE from "three";

/**
 * Photorealistic Procedural PBR Texture Generator for Engineers' Gala
 * Calibrated for physical architectural visualization:
 * 1. Burgundy Architectural Stone (Diffuse, Roughness, Normal, Bump)
 * 2. Dark Polished Stone Floor (Diffuse, Roughness, Normal)
 * 3. Luxury Woven Red Carpet Velvet (Diffuse, Roughness, Normal)
 * 4. Brushed Stainless / Satin Silver (Diffuse, Roughness, Normal)
 * 5. Coated Textile Banner Fabric (Diffuse, Roughness, Normal)
 * 6. Braided Velvet Rope Normal Map
 * 7. Soft Radial & Linear Contact Shadows
 * 8. Studio Dusk PBR Environment Cube Map
 */

export interface BurgundyStoneTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

export interface FloorTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
}

export interface CarpetTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
}

export interface SilverTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
}

export interface BannerFabricTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROCEDURAL NOISE HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fY * fY * (3.0 - 2.0 * fY);

  const a = pseudoNoise(iX, iY);
  const b = pseudoNoise(iX + 1, iY);
  const c = pseudoNoise(iX, iY + 1);
  const d = pseudoNoise(iX + 1, iY + 1);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return val;
}

/**
 * Generate a tangent-space normal map from a height array using Sobel filter
 */
function createNormalMapFromHeights(
  heights: Float32Array,
  width: number,
  height: number,
  strength = 2.0
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const yPrev = (y > 0 ? y - 1 : height - 1) * width;
    const yCurr = y * width;
    const yNext = (y < height - 1 ? y + 1 : 0) * width;

    for (let x = 0; x < width; x++) {
      const xPrev = x > 0 ? x - 1 : width - 1;
      const xNext = x < width - 1 ? x + 1 : 0;

      // Sobel kernel filter
      const tl = heights[yPrev + xPrev];
      const t  = heights[yPrev + x];
      const tr = heights[yPrev + xNext];
      const l  = heights[yCurr + xPrev];
      const r  = heights[yCurr + xNext];
      const bl = heights[yNext + xPrev];
      const b  = heights[yNext + x];
      const br = heights[yNext + xNext];

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      const dz = 1.0 / strength;

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      const idx = (yCurr + x) * 4;
      data[idx] = Math.round(nx * 255);
      data[idx + 1] = Math.round(ny * 255);
      data[idx + 2] = Math.round(nz * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = true;
  return tex;
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. BURGUNDY ARCHITECTURAL STONE TEXTURE SET
   - Refined luxury architectural stone with delicate mineral grain & micro-porosity
   - Satin finish: visible subtle roughness variation without noisy pebbled bump
   - Palette: Deep rich gala burgundy stone (#440D17 to #541220)
   ───────────────────────────────────────────────────────────────────────────── */
export function createBurgundyStoneTextures(anisotropy = 4): BurgundyStoneTextureSet {
  const size = 1024;
  const dCanvas = document.createElement("canvas");
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(size, size);

  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);

  const bCanvas = document.createElement("canvas");
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext("2d")!;
  const bImg = bCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const yOffset = y * size;
    const v = y / size;

    for (let x = 0; x < size; x++) {
      const u = x / size;

      // Extremely fine architectural stone grain: smooth layered noise
      const n1 = fbm(u * 8.0, v * 8.0, 4);
      const n2 = fbm(u * 24.0, v * 24.0, 3);
      // Soft microscopic mineral pores
      const micro = (pseudoNoise(x * 2.2, y * 2.2) - 0.5) * 0.04;
      const grain = n1 * 0.70 + n2 * 0.25 + micro;

      // Subtle mineral tone shift (honed porphyry/limestone grain)
      const toneShift = (grain - 0.48) * 12;

      // PBR Albedo for Deep Gala Burgundy Stone: Base ~ [72, 14, 24] (Hex #480E18)
      const baseR = Math.max(54, Math.min(92, 72 + toneShift));
      const baseG = Math.max(8, Math.min(24, 14 + toneShift * 0.18));
      const baseB = Math.max(16, Math.min(36, 24 + toneShift * 0.26));

      const idx = (yOffset + x) * 4;
      dImg.data[idx] = Math.round(baseR);
      dImg.data[idx + 1] = Math.round(baseG);
      dImg.data[idx + 2] = Math.round(baseB);
      dImg.data[idx + 3] = 255;

      // Roughness: refined satin architectural finish ~0.44 to 0.54
      const roughVal = Math.round((0.46 + (grain - 0.48) * 0.08) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      // Delicate micro-height for bump mapping (very subtle surface relief)
      const hVal = (grain - 0.48) * 0.35 + 0.5;
      heights[yOffset + x] = hVal;

      const bVal = Math.round(Math.max(0, Math.min(255, hVal * 255)));
      bImg.data[idx] = bVal;
      bImg.data[idx + 1] = bVal;
      bImg.data[idx + 2] = bVal;
      bImg.data[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;
  diffuse.anisotropy = anisotropy;
  diffuse.repeat.set(6, 6);

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.anisotropy = anisotropy;
  roughness.repeat.set(6, 6);

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 6);

  const normal = createNormalMapFromHeights(heights, size, size, 1.2);
  normal.repeat.set(6, 6);
  normal.anisotropy = anisotropy;

  return { diffuse, roughness, normal, bump };
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. POLISHED BURGUNDY STONE FLOOR TEXTURE SET
   - Dark obsidian wine stone (#20060C to #2E0A12)
   - Large-format subtle architectural slab joints (2.4m x 1.2m)
   - Satin reflection with soft micro-imperfections
   ───────────────────────────────────────────────────────────────────────────── */
export function createBurgundyFloorTextures(anisotropy = 4): FloorTextureSet {
  const size = 1024;
  const dCanvas = document.createElement("canvas");
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(size, size);

  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  const slabW = size / 2; // 2 slabs wide
  const slabH = size / 4; // 4 slabs long

  for (let y = 0; y < size; y++) {
    const yOffset = y * size;
    const v = y / size;
    const slabRow = Math.floor(y / slabH);
    const distY = Math.min(y % slabH, slabH - (y % slabH));

    for (let x = 0; x < size; x++) {
      const u = x / size;
      const xShift = (slabRow % 2) * (slabW / 2);
      const shiftedX = (x + xShift) % size;
      const distX = Math.min(shiftedX % slabW, slabW - (shiftedX % slabW));

      const jointDist = Math.min(distX, distY);
      const isJoint = jointDist < 3;
      const jointDarken = isJoint ? Math.max(0.3, jointDist / 3.0) : 1.0;

      const n = fbm(u * 4.0, v * 4.0, 3) * 0.25;
      const micro = pseudoNoise(x * 1.5, y * 1.5) * 0.06;

      // Dark obsidian wine floor: #26080E
      const baseR = Math.max(18, Math.min(54, (38 + n * 20 + micro * 14) * jointDarken));
      const baseG = Math.max(4, Math.min(18, (8 + n * 4 + micro * 3) * jointDarken));
      const baseB = Math.max(6, Math.min(26, (14 + n * 8 + micro * 5) * jointDarken));

      const idx = (yOffset + x) * 4;
      dImg.data[idx] = Math.round(baseR);
      dImg.data[idx + 1] = Math.round(baseG);
      dImg.data[idx + 2] = Math.round(baseB);
      dImg.data[idx + 3] = 255;

      // Roughness: satin polish ~0.26 to 0.34
      const roughBase = isJoint ? 0.55 : 0.28 + n * 0.05;
      const roughVal = Math.round(roughBase * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      const hJoint = isJoint ? -(1.0 - jointDist / 3.0) * 0.3 : 0;
      heights[yOffset + x] = 0.5 + hJoint + (n - 0.12) * 0.08;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;
  diffuse.anisotropy = anisotropy;
  diffuse.repeat.set(6, 6);

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.anisotropy = anisotropy;
  roughness.repeat.set(6, 6);

  const normal = createNormalMapFromHeights(heights, size, size, 1.5);
  normal.repeat.set(6, 6);
  normal.anisotropy = anisotropy;

  return { diffuse, roughness, normal };
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. LUXURY WOVEN RED CARPET TEXTURE SET
   - Rich royal gala crimson velvet (#8E1424 to #A2182B)
   - Darker refined selvage edge borders (#4C0A12)
   - Fine microscopic woven yarn pattern & cloth pile relief
   ───────────────────────────────────────────────────────────────────────────── */
export function createRedCarpetTextures(anisotropy = 4): CarpetTextureSet {
  const width = 1024;
  const height = 1024;
  const dCanvas = document.createElement("canvas");
  dCanvas.width = width;
  dCanvas.height = height;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(width, height);

  const rCanvas = document.createElement("canvas");
  rCanvas.width = width;
  rCanvas.height = height;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(width, height);

  const heights = new Float32Array(width * height);
  const borderPixels = Math.round(width * 0.038); // 3.8% selvage trim

  for (let y = 0; y < height; y++) {
    const yOffset = y * width;
    const warpY = Math.sin((y / height) * Math.PI * 512) * 0.5 + 0.5;

    for (let x = 0; x < width; x++) {
      const weftX = Math.sin((x / width) * Math.PI * 512) * 0.5 + 0.5;
      const weave = (warpY * 0.5 + weftX * 0.5);
      const fiberNoise = (pseudoNoise(x * 4.2, y * 4.2) - 0.5) * 5;

      const isBorder = x < borderPixels || x > width - borderPixels;
      const isInnerPiping =
        (x >= borderPixels + 3 && x <= borderPixels + 7) ||
        (x >= width - borderPixels - 7 && x <= width - borderPixels - 3);

      let r: number, g: number, b: number;
      if (isBorder) {
        // Refined darker velvet selvage border (#4C0A12)
        r = 74 + fiberNoise * 0.25;
        g = 10 + fiberNoise * 0.08;
        b = 18 + fiberNoise * 0.12;
      } else if (isInnerPiping) {
        // Deep contrast accent thread line (#3A080E)
        r = 54 + fiberNoise * 0.2;
        g = 8 + fiberNoise * 0.06;
        b = 14 + fiberNoise * 0.1;
      } else {
        // Sumptuous Gala Crimson velvet pile (#9A1626 to #AC1A2C)
        r = 152 + fiberNoise + (weave - 0.5) * 10;
        g = 20 + fiberNoise * 0.15 + (weave - 0.5) * 2;
        b = 36 + fiberNoise * 0.25 + (weave - 0.5) * 2;
      }

      const idx = (yOffset + x) * 4;
      dImg.data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      dImg.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      dImg.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      dImg.data[idx + 3] = 255;

      // Roughness: very high matte velvet cloth ~0.90 to 0.96
      const roughVal = Math.round((0.92 + (1.0 - weave) * 0.04) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      // Microscopic pile relief
      heights[yOffset + x] = weave * 0.6 + (pseudoNoise(x * 3.0, y * 3.0) - 0.5) * 0.2 + 0.5;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.ClampToEdgeWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;
  diffuse.anisotropy = anisotropy;
  diffuse.repeat.set(1, 16);

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.anisotropy = anisotropy;
  roughness.repeat.set(1, 16);

  const normal = createNormalMapFromHeights(heights, width, height, 1.8);
  normal.wrapS = THREE.ClampToEdgeWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(1, 16);
  normal.anisotropy = anisotropy;

  return { diffuse, roughness, normal };
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. BRUSHED STAINLESS STEEL / SATIN SILVER TEXTURE SET
   - Fine directional brushed linear streaks
   - Roughness: 0.28 to 0.36
   ───────────────────────────────────────────────────────────────────────────── */
export function createBrushedSilverTextures(anisotropy = 4): SilverTextureSet {
  const size = 512;
  const dCanvas = document.createElement("canvas");
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(size, size);

  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const yOffset = y * size;
    const brushStreak = fbm((y / size) * 32.0, 0.5, 3) * 0.18;

    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      const fineNoise = (pseudoNoise(u * 128.0, v * 8.0) - 0.5) * 12;
      const val = 218 + fineNoise + brushStreak * 16;

      const idx = (yOffset + x) * 4;
      dImg.data[idx] = Math.max(0, Math.min(255, Math.round(val)));
      dImg.data[idx + 1] = Math.max(0, Math.min(255, Math.round(val * 1.01)));
      dImg.data[idx + 2] = Math.max(0, Math.min(255, Math.round(val * 1.03)));
      dImg.data[idx + 3] = 255;

      const roughVal = Math.round((0.28 + (fineNoise / 12) * 0.08) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      heights[yOffset + x] = 0.5 + (fineNoise / 12) * 0.22;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;
  diffuse.anisotropy = anisotropy;
  diffuse.repeat.set(2, 8);

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.anisotropy = anisotropy;
  roughness.repeat.set(2, 8);

  const normal = createNormalMapFromHeights(heights, size, size, 1.8);
  normal.repeat.set(2, 8);
  normal.anisotropy = anisotropy;

  return { diffuse, roughness, normal };
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. COATED TEXTILE BANNER FABRIC TEXTURE SET
   - Matte architectural banner cloth (#440C16)
   - Subtle fabric weave normal map
   ───────────────────────────────────────────────────────────────────────────── */
export function createBannerFabricTextures(anisotropy = 4): BannerFabricTextureSet {
  const size = 512;
  const dCanvas = document.createElement("canvas");
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(size, size);

  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const yOffset = y * size;
    const weaveY = Math.sin((y / size) * Math.PI * 128) * 0.5 + 0.5;

    for (let x = 0; x < size; x++) {
      const weaveX = Math.cos((x / size) * Math.PI * 128) * 0.5 + 0.5;
      const weave = weaveX * weaveY;
      const noise = (pseudoNoise(x * 2.0, y * 2.0) - 0.5) * 6;

      // Deep luxury wine textile: #440C16
      const r = 68 + noise * 0.4 + (weave - 0.5) * 6;
      const g = 12 + noise * 0.1 + (weave - 0.5) * 1.5;
      const b = 22 + noise * 0.15 + (weave - 0.5) * 2;

      const idx = (yOffset + x) * 4;
      dImg.data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      dImg.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      dImg.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      dImg.data[idx + 3] = 255;

      const roughVal = Math.round((0.82 + (1.0 - weave) * 0.06) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      heights[yOffset + x] = weave * 0.6 + 0.5;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  diffuse.colorSpace = THREE.SRGBColorSpace;
  diffuse.repeat.set(4, 6);

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(4, 6);

  const normal = createNormalMapFromHeights(heights, size, size, 2.2);
  normal.repeat.set(4, 6);

  return { diffuse, roughness, normal };
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. BRAIDED VELVET ROPE NORMAL MAP
   ───────────────────────────────────────────────────────────────────────────── */
export function createVelvetRopeNormalMap(): THREE.CanvasTexture {
  const width = 256;
  const height = 512;
  const heights = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const yOffset = y * width;
    const twist = (y / height) * Math.PI * 16;

    for (let x = 0; x < width; x++) {
      const u = (x / width) * Math.PI * 2;
      const strand = Math.sin(u * 3 + twist) * 0.5 + 0.5;
      const micro = pseudoNoise(x * 3.0, y * 3.0) * 0.2;
      heights[yOffset + x] = strand * 0.8 + micro;
    }
  }

  const normal = createNormalMapFromHeights(heights, width, height, 2.5);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(1, 8);
  return normal;
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. SOFT CONTACT SHADOW TEXTURE
   ───────────────────────────────────────────────────────────────────────────── */
export function createSoftRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.5
  );
  gradient.addColorStop(0, "rgba(5, 1, 2, 0.96)");
  gradient.addColorStop(0.3, "rgba(5, 1, 2, 0.72)");
  gradient.addColorStop(0.65, "rgba(5, 1, 2, 0.24)");
  gradient.addColorStop(0.88, "rgba(5, 1, 2, 0.06)");
  gradient.addColorStop(1, "rgba(5, 1, 2, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. GALA STUDIO DUSK PBR ENVIRONMENT CUBE MAP
   - Balanced deep burgundy (#480C18) ambient dome
   - Crisp overhead warm champagne softbox (#FFF2E4)
   - Brushed silver side rim strips (#D2DAE6)
   - Distant warm portal glow (#FFDEB8)
   ───────────────────────────────────────────────────────────────────────────── */
export function createGalaStudioEnvironmentMap(
  renderer: THREE.WebGLRenderer
): THREE.WebGLCubeRenderTarget {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x480c18);

  const addPanel = (
    w: number,
    h: number,
    color: number,
    pos: [number, number, number],
    rotY = 0,
    rotX = 0
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
    // Overhead subtle architectural warm wine-champagne diffuse softbox (removes glaring white hotspot)
    addPanel(14, 14, 0x6e1b28, [0, 18, 0], 0, Math.PI / 2),
    addPanel(6, 6, 0x963c4a, [0, 18, 0], 0, Math.PI / 2),
    // Cool silver left rim softbox
    addPanel(8, 22, 0xd0d8e4, [-16, 7, 0], Math.PI / 2),
    // Cool silver right rim softbox
    addPanel(8, 22, 0xd0d8e4, [16, 7, 0], -Math.PI / 2),
    // Warm deep burgundy backdrop fill
    addPanel(20, 14, 0x821528, [0, 6, -18]),
    // Distant warm sanctuary doorway glow
    addPanel(6, 12, 0xffe2c2, [0, 3, -12]),
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

// Backward compatibility aliases
export const createDarkArchitecturalStoneTextures = createBurgundyStoneTextures;
export const createDarkMarbleFloorTextures = createBurgundyFloorTextures;
export const createArchitecturalEnvironmentMap = createGalaStudioEnvironmentMap;
export type StoneTextureSet = BurgundyStoneTextureSet;
