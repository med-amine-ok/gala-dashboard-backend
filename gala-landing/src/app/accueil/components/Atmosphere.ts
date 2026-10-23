import * as THREE from "three";

export interface AtmosphereInstance {
  group: THREE.Group;
  update: (elapsed: number, delta: number) => void;
  dispose: () => void;
}

/**
 * Creates the cinematic atmosphere with pure sterling silver & platinum aesthetic:
 * 1. Cool silver crystalline atmospheric dust motes
 * 2. Soft, subtle ambient back-glow that NEVER obscures foreground typography
 */
export function createAtmosphere(isMobile: boolean): AtmosphereInstance {
  const group = new THREE.Group();
  group.name = "Atmosphere";

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];
  const texturesToDispose: THREE.Texture[] = [];

  // ==========================================
  // 1. SOFT BACKGROUND AMBIENT RADIAL MIST
  // ==========================================
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
    gradient.addColorStop(0, "rgba(228, 231, 235, 0.22)"); // Soft cool silver glow
    gradient.addColorStop(0.35, "rgba(191, 195, 201, 0.08)"); // Brushed silver aura
    gradient.addColorStop(0.7, "rgba(23, 25, 29, 0.03)"); // Dark graphite falloff
    gradient.addColorStop(1, "rgba(8, 9, 11, 0)"); // Deep black
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
  }

  const glowTexture = new THREE.CanvasTexture(canvas);
  texturesToDispose.push(glowTexture);

  // Far background soft silver mist (placed behind the colonnade at z = -12.0)
  const bgHaloGeom = new THREE.PlaneGeometry(36, 36);
  geometriesToDispose.push(bgHaloGeom);
  const bgHaloMat = new THREE.MeshBasicMaterial({
    map: glowTexture,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  materialsToDispose.push(bgHaloMat);

  const bgHaloMesh = new THREE.Mesh(bgHaloGeom, bgHaloMat);
  bgHaloMesh.position.set(0, 1.8, -12.0);
  group.add(bgHaloMesh);

  // ==========================================
  // 2. REFINED STERLING SILVER DUST MOTES (Particles)
  // ==========================================
  const count = isMobile ? 80 : 180;
  const positions = new Float32Array(count * 3);
  const driftSpeeds = new Float32Array(count);
  const driftPhases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 20.0; // Wide full-screen spread
    positions[i3 + 1] = -3.5 + Math.random() * 10.0;
    positions[i3 + 2] = -11.0 + Math.random() * 16.0;
    driftSpeeds[i] = 0.2 + Math.random() * 0.45;
    driftPhases[i] = Math.random() * Math.PI * 2;
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometriesToDispose.push(particleGeom);

  // Pristine silver circular particle texture
  const pCanvas = document.createElement("canvas");
  pCanvas.width = 64;
  pCanvas.height = 64;
  const pCtx = pCanvas.getContext("2d");
  if (pCtx) {
    const pGrad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    pGrad.addColorStop(0, "rgba(255, 255, 255, 1)"); // Diamond silver core
    pGrad.addColorStop(0.35, "rgba(222, 232, 250, 0.85)"); // Silver halo
    pGrad.addColorStop(0.7, "rgba(180, 195, 225, 0.25)");
    pGrad.addColorStop(1, "rgba(180, 195, 225, 0)");
    pCtx.fillStyle = pGrad;
    pCtx.beginPath();
    pCtx.arc(32, 32, 32, 0, Math.PI * 2);
    pCtx.fill();
  }
  const particleTexture = new THREE.CanvasTexture(pCanvas);
  texturesToDispose.push(particleTexture);

  const particleMat = new THREE.PointsMaterial({
    size: isMobile ? 0.09 : 0.13,
    map: particleTexture,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0xeaf0fc,
  });
  materialsToDispose.push(particleMat);

  const particleSystem = new THREE.Points(particleGeom, particleMat);
  group.add(particleSystem);

  const update = (elapsed: number, delta: number) => {
    const pulse = Math.sin(elapsed * 0.6) * 0.05 + 0.95;
    bgHaloMesh.scale.set(pulse, pulse, 1);

    const posAttr = particleGeom.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const speed = driftSpeeds[i];
      const phase = driftPhases[i];

      array[i3 + 1] += delta * speed * 0.28;
      array[i3] += Math.sin(elapsed * 0.45 + phase) * delta * 0.08;

      if (array[i3 + 1] > 7.0) {
        array[i3 + 1] = -3.5;
        array[i3] = (Math.random() - 0.5) * 20.0;
      }
    }
    posAttr.needsUpdate = true;
  };

  const dispose = () => {
    geometriesToDispose.forEach((g) => g.dispose());
    materialsToDispose.forEach((m) => m.dispose());
    texturesToDispose.forEach((t) => t.dispose());
  };

  return {
    group,
    update,
    dispose,
  };
}
