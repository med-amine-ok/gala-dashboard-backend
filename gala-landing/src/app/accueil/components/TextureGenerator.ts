import * as THREE from "three";

/**
 * Procedural Texture Generator for Dark Black & Silver Architectural Materials:
 * 1. Matte Black Architectural Stone (Dark Graphite #17191D with micro-mineral texture)
 * 2. Polished Obsidian / Black Granite Floor (with subtle silver micro-veins & satin specular sheen)
 * 3. Brushed Silver Structural Panels (#BFC3C9 anisotropic micro-grain)
 * 4. Architectural Studio Environment Map (near-black #08090B room with silver softboxes)
 */

export interface StoneTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}

export interface FloorTextureSet {
  diffuse: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
}

/**
 * Simple 2D value noise for natural mineral variation
 */
function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const iX = Math.floor(x);
  const iY = Math.floor(y);
  const fX = x - iX;
  const fY = y - iY;

  // Cubic Hermite curve
  const u = fX * fX * (3.0 - 2.0 * fX);
  const v = fY * fY * (3.0 - 2.0 * fY);

  const a = pseudoNoise(iX, iY);
  const b = pseudoNoise(iX + 1, iY);
  const c = pseudoNoise(iX, iY + 1);
  const d = pseudoNoise(iX + 1, iY + 1);

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function fbm(x: number, y: number, octaves = 5): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.1;
    amp *= 0.52;
  }
  return val;
}

/**
 * Creates Dark Graphite Architectural Stone textures (#17191D)
 * Completely eliminates all burgundy/red tones in favor of sophisticated dark stone
 */
export function createDarkArchitecturalStoneTextures(): StoneTextureSet {
  const size = 512;

  // 1. Diffuse / Albedo Canvas
  const dCanvas = document.createElement("canvas");
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext("2d")!;
  const dImg = dCtx.createImageData(size, size);

  // 2. Roughness Canvas
  const rCanvas = document.createElement("canvas");
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext("2d")!;
  const rImg = rCtx.createImageData(size, size);

  // 3. Bump Canvas
  const bCanvas = document.createElement("canvas");
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext("2d")!;
  const bImg = bCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      // Subtle geological grain & micro-mineral layers
      const n1 = fbm(u * 3.5, v * 3.5, 4);
      const n2 = fbm(u * 7.0 + n1 * 0.5, v * 7.0 - n1 * 0.5, 3);
      const grain = n1 * 0.7 + n2 * 0.3;

      // Rare, delicate brushed silver-quartz micro-veining
      const ridge = Math.abs(fbm(u * 3.2 - v * 1.5, v * 3.2 + u * 1.5, 4) - 0.5) * 2.0;
      const vein = Math.pow(Math.max(0, 1.0 - ridge * 2.4), 22) * 0.55;

      // Dark graphite architectural stone: #141619 to #212429
      const baseVal = 22 + grain * 10;
      const baseR = baseVal - 1;
      const baseG = baseVal;
      const baseB = baseVal + 3;

      // Brushed silver micro-inclusion tone: #98A0AC
      const veinR = 152;
      const veinG = 160;
      const veinB = 172;

      const finalR = Math.min(255, Math.floor(baseR * (1 - vein) + veinR * vein));
      const finalG = Math.min(255, Math.floor(baseG * (1 - vein) + veinG * vein));
      const finalB = Math.min(255, Math.floor(baseB * (1 - vein) + veinB * vein));

      const idx = (y * size + x) * 4;
      dImg.data[idx] = finalR;
      dImg.data[idx + 1] = finalG;
      dImg.data[idx + 2] = finalB;
      dImg.data[idx + 3] = 255;

      // Roughness: Matte architectural stone ~0.62, veins slightly smoother ~0.42
      const roughVal = Math.floor((0.62 - vein * 0.2 + grain * 0.08) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;

      // Bump: Fine stone masonry relief
      const bumpVal = Math.floor((0.5 + (grain - 0.5) * 0.14 + (vein - 0.2) * 0.1) * 255);
      bImg.data[idx] = bumpVal;
      bImg.data[idx + 1] = bumpVal;
      bImg.data[idx + 2] = bumpVal;
      bImg.data[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;

  const bump = new THREE.CanvasTexture(bCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;

  return { diffuse, roughness, bump };
}

// Backward compatibility alias
export const createImperialBurgundyMarbleTextures = createDarkArchitecturalStoneTextures;
export type MarbleTextureSet = StoneTextureSet;

/**
 * Creates polished black obsidian / dark granite floor textures (#08090B to #101216)
 * with satin specular sheen and rare hairline silver veins
 */
export function createDarkMarbleFloorTextures(): FloorTextureSet {
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

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      const c1 = fbm(u * 2.2, v * 2.2, 3);
      // Delicate hairline silver-calcite fracture
      const ridge = Math.abs(fbm(u * 2.8 + v * 1.4 + c1 * 0.3, v * 2.8 - u * 1.4, 4) - 0.5) * 2.0;
      const vein = Math.pow(Math.max(0, 1.0 - ridge * 2.8), 28);

      // Deep near-black obsidian floor (#08090B to #101216)
      const baseR = Math.floor(8 + c1 * 7);
      const baseG = Math.floor(9 + c1 * 7);
      const baseB = Math.floor(11 + c1 * 9);

      // Crisp brushed silver hairline vein (#BFC3C9)
      const finalR = Math.floor(baseR * (1 - vein * 0.75) + 191 * vein * 0.75);
      const finalG = Math.floor(baseG * (1 - vein * 0.75) + 195 * vein * 0.75);
      const finalB = Math.floor(baseB * (1 - vein * 0.75) + 201 * vein * 0.75);

      const idx = (y * size + x) * 4;
      dImg.data[idx] = finalR;
      dImg.data[idx + 1] = finalG;
      dImg.data[idx + 2] = finalB;
      dImg.data[idx + 3] = 255;

      // Satin polished floor sheen: ~0.16 roughness, veins ~0.22
      const roughVal = Math.floor((0.16 + vein * 0.08 + c1 * 0.04) * 255);
      rImg.data[idx] = roughVal;
      rImg.data[idx + 1] = roughVal;
      rImg.data[idx + 2] = roughVal;
      rImg.data[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const diffuse = new THREE.CanvasTexture(dCanvas);
  diffuse.wrapS = THREE.RepeatWrapping;
  diffuse.wrapT = THREE.RepeatWrapping;

  const roughness = new THREE.CanvasTexture(rCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;

  return { diffuse, roughness };
}

/**
 * Generates an Architectural Studio Environment Map (CubeRenderTarget)
 * Calibrated specifically for Dark Black & Silver Luxury Aesthetic:
 * - Near-black background #08090B
 * - Crisp overhead silver softbox #E4E7EB
 * - Brushed silver side strip reflections #BFC3C9
 */
export function createArchitecturalEnvironmentMap(
  renderer: THREE.WebGLRenderer
): THREE.WebGLRenderTarget {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08090b); // Near-black environment

  // Overhead softbox panel (bright silver light #E4E7EB)
  const ceilingLightGeom = new THREE.PlaneGeometry(18, 18);
  const ceilingLightMat = new THREE.MeshBasicMaterial({
    color: 0xe4e7eb,
    side: THREE.DoubleSide,
  });
  const ceilingLight = new THREE.Mesh(ceilingLightGeom, ceilingLightMat);
  ceilingLight.position.set(0, 10, 0);
  ceilingLight.rotation.x = Math.PI / 2;
  scene.add(ceilingLight);

  // Left side softbox strip (brushed silver #BFC3C9)
  const softboxGeom = new THREE.PlaneGeometry(6, 16);
  const softboxMat = new THREE.MeshBasicMaterial({
    color: 0xbfc3c9,
    side: THREE.DoubleSide,
  });
  const leftSoftbox = new THREE.Mesh(softboxGeom, softboxMat);
  leftSoftbox.position.set(-11, 3, 0);
  leftSoftbox.rotation.y = Math.PI / 2;
  scene.add(leftSoftbox);

  // Right side softbox strip (brushed silver #BFC3C9)
  const rightSoftbox = new THREE.Mesh(softboxGeom, softboxMat);
  rightSoftbox.position.set(11, 3, 0);
  rightSoftbox.rotation.y = -Math.PI / 2;
  scene.add(rightSoftbox);

  // Distant architectural gateway glow (pure silver accent #E4E7EB)
  const doorGlowGeom = new THREE.PlaneGeometry(8, 14);
  const doorGlowMat = new THREE.MeshBasicMaterial({
    color: 0xdde2ea,
    side: THREE.DoubleSide,
  });
  const doorGlow = new THREE.Mesh(doorGlowGeom, doorGlowMat);
  doorGlow.position.set(0, 2, -14);
  scene.add(doorGlow);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
  cubeCamera.update(renderer, scene);

  // Clean up temporary scene
  ceilingLightGeom.dispose();
  ceilingLightMat.dispose();
  softboxGeom.dispose();
  softboxMat.dispose();
  doorGlowGeom.dispose();
  doorGlowMat.dispose();

  return cubeRenderTarget;
}
