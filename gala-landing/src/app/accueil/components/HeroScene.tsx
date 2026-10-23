"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  createArchitecturalEntrance,
  createArchitecturalMaterials,
  ArchitecturalEntranceInstance,
} from "./ArchitecturalEntrance";
import { createAtmosphere } from "./Atmosphere";
import { setupCameraRig, CameraRigInstance } from "./HeroCameraRig";
import { createArchitecturalEnvironmentMap } from "./TextureGenerator";

interface HeroSceneProps {
  scrollProgress?: number;
  onLoaded?: () => void;
}

export default function HeroScene({ scrollProgress, onLoaded }: HeroSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const cameraRigRef = useRef<CameraRigInstance | null>(null);

  // Sync scroll progress from parent whenever prop changes
  useEffect(() => {
    if (cameraRigRef.current && scrollProgress !== undefined) {
      cameraRigRef.current.setScrollProgress(scrollProgress);
    }
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Support Detection
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) {
        setWebGLSupported(false);
        return;
      }
    } catch {
      setWebGLSupported(false);
      return;
    }

    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 2. Scene Setup - Near-black #08090B atmosphere
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090b, 0.022);

    // 3. Camera Setup - Dynamically framed for both desktop widescreen and mobile portrait
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;
    const fov = aspect < 1.0 ? Math.min(72, 48 + (1 - aspect) * 36) : 46;
    const camera = new THREE.PerspectiveCamera(
      fov,
      aspect,
      0.1,
      140
    );

    // 4. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4b. Studio Environment Map for PBR reflections
    const envRenderTarget = createArchitecturalEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    // 5. Lighting Setup (Dark Graphite Ambient, Crisp Silver Key & Rims)
    const ambientLight = new THREE.AmbientLight(0x17191d, 0.42);
    scene.add(ambientLight);

    // Exterior crisp silver key light (#E4E7EB)
    const keyLight = new THREE.DirectionalLight(0xe4e7eb, 2.2);
    keyLight.position.set(6.5, 9.0, 7.5);
    if (!isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    // Exterior brushed silver rim light (#BFC3C9) defining the architectural edges
    const rimLight = new THREE.DirectionalLight(0xbfc3c9, 1.75);
    rimLight.position.set(-8.0, 5.5, -4.5);
    scene.add(rimLight);

    // Dedicated silver star rim lights
    const starLightL = new THREE.DirectionalLight(0xe4e7eb, 1.8);
    starLightL.position.set(-6, 3, 4);
    scene.add(starLightL);

    const starLightR = new THREE.DirectionalLight(0xe4e7eb, 1.8);
    starLightR.position.set(6, 3, 4);
    scene.add(starLightR);

    // Ground fill light (dark metallic #20242B)
    const groundFillLight = new THREE.DirectionalLight(0x20242b, 0.5);
    groundFillLight.position.set(0, -6, 5);
    scene.add(groundFillLight);

    // 6. Complete Full-Screen Architectural Entrance with Interior Colonnade
    const materials = createArchitecturalMaterials();
    const entrance: ArchitecturalEntranceInstance =
      createArchitecturalEntrance(materials, isMobile);
    scene.add(entrance.group);

    // 7. Sterling Silver Atmosphere & Floating Particles
    const atmosphere = createAtmosphere(isMobile);
    scene.add(atmosphere.group);

    // 8. Camera Rig with Layered Parallax Callback
    const cameraRig: CameraRigInstance = setupCameraRig({
      camera,
      domElement: container,
      isMobile: isMobile || prefersReducedMotion,
      onParallaxUpdate: entrance.updateParallax,
    });
    cameraRigRef.current = cameraRig;

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      const newAspect = newWidth / newHeight;
      camera.aspect = newAspect;
      camera.fov = newAspect < 1.0 ? Math.min(72, 48 + (1 - newAspect) * 36) : 46;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, newWidth < 768 ? 1.25 : 1.75)
      );
    };

    window.addEventListener("resize", handleResize);

    // 10. Fallback scroll sync if scrollProgress prop is omitted
    const handleScroll = () => {
      if (scrollProgress === undefined) {
        const scrollY = window.scrollY;
        const heroHeight = window.innerHeight;
        const progress = Math.min(1, Math.max(0, scrollY / (heroHeight * 1.5)));
        cameraRig.setScrollProgress(progress);
      }
    };

    if (scrollProgress === undefined) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }

    // 11. Visibility / Intersection Optimization
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 12. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      elapsed += delta;

      // Update camera physical forward trajectory
      cameraRig.update(delta);

      // Animate atmospheric particles
      atmosphere.update(elapsed, delta);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    setIsReady(true);
    if (onLoaded) {
      onLoaded();
    }

    // 13. Resource Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      if (scrollProgress === undefined) {
        window.removeEventListener("scroll", handleScroll);
      }

      cameraRig.destroy();
      cameraRigRef.current = null;
      entrance.dispose();
      atmosphere.dispose();

      // Dispose materials & environment map
      envRenderTarget.dispose();
      materials.stoneMaterial.dispose();
      materials.metalMaterial.dispose();
      materials.starMaterial.dispose();
      materials.darkFloorMaterial.dispose();
      materials.lanternGlowMaterial.dispose();
      materials.sanctuaryLightMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onLoaded]);

  // Static luxury silver fallback if WebGL is unsupported
  if (!webGLSupported) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-dark)] via-[#360810]/40 to-[var(--color-dark)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(192,192,192,0.18)_0%,transparent_75%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full border border-[var(--color-silver)]/20 opacity-40 blur-sm" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 z-0 ${
        isReady ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    />
  );
}
