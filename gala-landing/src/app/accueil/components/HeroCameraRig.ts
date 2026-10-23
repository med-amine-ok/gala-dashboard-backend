import * as THREE from "three";

export interface CameraRigOptions {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  isMobile: boolean;
  onParallaxUpdate?: (mouseX: number, mouseY: number, delta: number) => void;
}

export interface CameraRigInstance {
  update: (delta: number) => void;
  setScrollProgress: (progress: number) => void;
  getScrollProgress: () => number;
  destroy: () => void;
}

/**
 * Manages the full-screen cinematic camera journey:
 * Phase A: Outside the entrance (z = 6.8) — monumental view of facade, stars, and inner colonnade
 * Phase B: Smooth approach toward the portal (z = 6.8 -> 1.5)
 * Phase C: Crossing the threshold into the interior colonnade (z = 1.5 -> -4.0)
 * Phase D: Arriving deep inside the illuminated sanctuary hall (z = -8.4)
 */
export function setupCameraRig({
  camera,
  domElement,
  isMobile,
  onParallaxUpdate,
}: CameraRigOptions): CameraRigInstance {
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  };

  const getCameraSpecs = () => {
    const w = domElement.clientWidth || window.innerWidth;
    const h = domElement.clientHeight || window.innerHeight;
    const aspect = w / h;

    if (aspect < 0.55) {
      // Narrow phone portrait (320px - 430px)
      return { baseZ: 10.2, baseY: 0.15, travel: 24.7 };
    } else if (aspect < 0.85) {
      // Tablet portrait (768x1024)
      return { baseZ: 8.4, baseY: 0.18, travel: 22.9 };
    } else if (aspect < 1.2) {
      // Square / small laptop
      return { baseZ: 7.4, baseY: 0.2, travel: 21.9 };
    } else {
      // Desktop widescreen (16:9, etc.)
      return { baseZ: 6.8, baseY: 0.2, travel: 21.3 };
    }
  };

  const initialSpecs = getCameraSpecs();
  let scrollProgress = 0;
  let currentZ = initialSpecs.baseZ;
  let currentY = initialSpecs.baseY;

  const onPointerMove = (e: MouseEvent) => {
    if (isMobile) return;
    const rect = domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.targetX = Math.max(-1, Math.min(1, x));
    mouse.targetY = Math.max(-1, Math.min(1, y));
  };

  const onPointerLeave = () => {
    mouse.targetX = 0;
    mouse.targetY = 0;
  };

  if (!isMobile) {
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave, { passive: true });
  }

  const update = (delta: number) => {
    // Damped pointer parallax
    const lerpFactor = Math.min(1, delta * 3.5);
    mouse.x += (mouse.targetX - mouse.x) * lerpFactor;
    mouse.y += (mouse.targetY - mouse.y) * lerpFactor;

    if (onParallaxUpdate && !isMobile) {
      onParallaxUpdate(mouse.x, mouse.y, delta);
    }

    // ==========================================
    // PHYSICAL 3D CAMERA JOURNEY THROUGH THE ENTRANCE
    // Derived dynamically from viewport dimensions
    // ==========================================
    const specs = getCameraSpecs();
    const easedProgress = Math.pow(scrollProgress, 1.05);
    const targetZ = specs.baseZ - easedProgress * specs.travel;
    const targetY = specs.baseY + Math.sin(scrollProgress * Math.PI) * 0.12;

    // Smoothly interpolate camera forward travel
    currentZ += (targetZ - currentZ) * Math.min(1, delta * 6.5);
    currentY += (targetY - currentY) * Math.min(1, delta * 6.5);

    // Subtle pointer parallax displacement on camera itself (restrained, desktop only)
    const cameraParallaxX = mouse.x * (isMobile ? 0 : 0.1);
    const cameraParallaxY = mouse.y * (isMobile ? 0 : 0.06);

    camera.position.x = cameraParallaxX;
    camera.position.y = currentY + cameraParallaxY;
    camera.position.z = currentZ;

    // Focal point: looking forward through the central axis of the colonnade towards sanctuary
    const focalZ = currentZ - 8.0;
    const focalX = -mouse.x * 0.04;
    const focalY = 0.35 - mouse.y * 0.03;

    camera.lookAt(focalX, focalY, focalZ);
    camera.rotation.z = -mouse.x * 0.005;
  };

  const setScrollProgress = (progress: number) => {
    scrollProgress = Math.max(0, Math.min(1.0, progress));
  };

  const getScrollProgress = () => scrollProgress;

  const destroy = () => {
    if (!isMobile) {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseleave", onPointerLeave);
    }
  };

  return {
    update,
    setScrollProgress,
    getScrollProgress,
    destroy,
  };
}
