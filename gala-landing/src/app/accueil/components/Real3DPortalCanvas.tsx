"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Real3DPortalCanvasProps {
  scrollProgress: number;
}

/**
 * Creates the authentic 4-pointed flaring Gala Silver Star in true 3D
 * using curved hypocycloid arcs matching the brand identity.
 */
function create3DStarMesh(radius: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  const R = radius;
  const c = R * 0.09;

  shape.moveTo(0, R);
  shape.quadraticCurveTo(c, c, R, 0);
  shape.quadraticCurveTo(c, -c, 0, -R);
  shape.quadraticCurveTo(-c, -c, -R, 0);
  shape.quadraticCurveTo(-c, c, 0, R);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: R * 0.22,
    bevelEnabled: true,
    bevelThickness: R * 0.16,
    bevelSize: R * 0.08,
    bevelSegments: 4,
  });
  geom.computeVertexNormals();
  geom.center();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Creates the 3D brushed sterling silver perimeter trim running along the arch opening
 */
function createArchSilverTrim(
  radius: number,
  springY: number,
  material: THREE.Material
): THREE.Mesh {
  const curvePath = new THREE.CurvePath<THREE.Vector3>();

  // Left vertical leg
  curvePath.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(-radius, springY, 0)
    )
  );

  // Semicircular arch crown
  const segments = 48;
  const arcPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = Math.PI - (i / segments) * Math.PI;
    arcPoints.push(
      new THREE.Vector3(
        Math.cos(theta) * radius,
        springY + Math.sin(theta) * radius,
        0
      )
    );
  }
  for (let i = 0; i < arcPoints.length - 1; i++) {
    curvePath.add(new THREE.LineCurve3(arcPoints[i], arcPoints[i + 1]));
  }

  // Right vertical leg
  curvePath.add(
    new THREE.LineCurve3(
      new THREE.Vector3(radius, springY, 0),
      new THREE.Vector3(radius, 0, 0)
    )
  );

  const tubeGeom = new THREE.TubeGeometry(curvePath, 72, 0.042, 8, false);
  return new THREE.Mesh(tubeGeom, material);
}

export default function Real3DPortalCanvas({
  scrollProgress,
}: Real3DPortalCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);

  // Sync scroll progress via ref for smooth 60fps render loop
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect WebGL
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) return;
    } catch {
      return;
    }

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;
    let isMobile = width < 768;

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x180306, 0.024);

    // 2. Camera Setup (dynamic FOV for flawless framing on desktop and mobile)
    const aspect = width / height;
    const baseFov = aspect < 1.0 ? Math.min(68, 48 + (1 - aspect) * 28) : 45;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

    const baseZ = aspect < 1.0 ? 15.5 : 12.8;
    const baseY = aspect < 1.0 ? 4.1 : 4.4;
    camera.position.set(0, baseY, baseZ);
    camera.lookAt(0, 4.6, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // 4. Luxury PBR Materials
    // A) Imperial Burgundy Polished Stone Facade
    const burgundyStoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x32070f,
      roughness: 0.28,
      metalness: 0.18,
    });

    // B) Recessed Shadow Stone
    const recessedStoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x20040a,
      roughness: 0.38,
      metalness: 0.22,
    });

    // C) Mirror-Brushed Sterling Silver Trim & Stars
    const sterlingSilverMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      roughness: 0.09,
      metalness: 0.95,
    });

    // D) Dark Obsidian Wine Marble Floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x140206,
      roughness: 0.14,
      metalness: 0.38,
    });

    // E) Illuminated Sanctuary Portal Glow Material
    const sanctuaryLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xf5ebd9,
      transparent: true,
      opacity: 0.85,
    });

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x350812, 0.65);
    scene.add(ambientLight);

    // Champagne Key Light
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 2.4);
    keyLight.position.set(6.5, 11.0, 8.5);
    if (!isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    // Cool Silver Rim Light highlighting architectural bevels
    const rimLight = new THREE.DirectionalLight(0xe4e7eb, 1.8);
    rimLight.position.set(-8.0, 7.5, 4.0);
    scene.add(rimLight);

    // Sanctuary Interior Warm Portal Glow
    const portalGlow = new THREE.PointLight(0xf2e8d8, 3.2, 22, 1.5);
    portalGlow.position.set(0, 4.8, -2.8);
    scene.add(portalGlow);

    // 6. BUILD THE MONUMENTAL 3D ARCHITECTURAL ENTRANCE
    const entranceGroup = new THREE.Group();
    scene.add(entranceGroup);

    // Arch Dimensions (Classical Roman Triumphal Proportions)
    const outerWidth = 16.8;
    const outerHeight = 13.5;
    const archRadius = 3.2; // Opening width = 6.4
    const archSpringY = 4.2; // Semicircle crown reaches y = 7.4

    // 6a. Main Monumental Stone Arch (Extruded shape with arch cutout)
    const facadeShape = new THREE.Shape();
    facadeShape.moveTo(-outerWidth / 2, 0);
    facadeShape.lineTo(-outerWidth / 2, outerHeight);
    facadeShape.lineTo(outerWidth / 2, outerHeight);
    facadeShape.lineTo(outerWidth / 2, 0);
    facadeShape.lineTo(-outerWidth / 2, 0);

    const archHole = new THREE.Path();
    archHole.moveTo(-archRadius, 0);
    archHole.lineTo(-archRadius, archSpringY);
    archHole.absarc(0, archSpringY, archRadius, Math.PI, 0, true);
    archHole.lineTo(archRadius, 0);
    archHole.lineTo(-archRadius, 0);
    facadeShape.holes.push(archHole);

    const mainArchGeom = new THREE.ExtrudeGeometry(facadeShape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.09,
      bevelSegments: 4,
      curveSegments: 40,
    });
    mainArchGeom.computeVertexNormals();
    const mainArchMesh = new THREE.Mesh(mainArchGeom, burgundyStoneMaterial);
    mainArchMesh.castShadow = true;
    mainArchMesh.receiveShadow = true;
    mainArchMesh.position.set(0, 0, 0);
    entranceGroup.add(mainArchMesh);

    // 6b. Recessed Inner Arch (Creates visible physical wall thickness)
    const innerRadius = 2.85;
    const innerSpringY = 3.9;
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-outerWidth * 0.45, 0);
    innerShape.lineTo(-outerWidth * 0.45, outerHeight * 0.9);
    innerShape.lineTo(outerWidth * 0.45, outerHeight * 0.9);
    innerShape.lineTo(outerWidth * 0.45, 0);
    innerShape.lineTo(-outerWidth * 0.45, 0);

    const innerHole = new THREE.Path();
    innerHole.moveTo(-innerRadius, 0);
    innerHole.lineTo(-innerRadius, innerSpringY);
    innerHole.absarc(0, innerSpringY, innerRadius, Math.PI, 0, true);
    innerHole.lineTo(innerRadius, 0);
    innerHole.lineTo(-innerRadius, 0);
    innerShape.holes.push(innerHole);

    const innerArchGeom = new THREE.ExtrudeGeometry(innerShape, {
      depth: 1.8,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.06,
      bevelSegments: 3,
      curveSegments: 36,
    });
    innerArchGeom.computeVertexNormals();
    const innerArchMesh = new THREE.Mesh(innerArchGeom, recessedStoneMaterial);
    innerArchMesh.position.set(0, 0, -1.8);
    entranceGroup.add(innerArchMesh);

    // 6c. Brushed Sterling Silver Edge Trim (Follows main arch opening contour)
    const silverTrim = createArchSilverTrim(
      archRadius,
      archSpringY,
      sterlingSilverMaterial
    );
    silverTrim.position.set(0, 0, 2.22);
    entranceGroup.add(silverTrim);

    // 6d. Polished Marble Floor & Threshold Steps
    const floorGeom = new THREE.PlaneGeometry(60, 50);
    const floorMesh = new THREE.Mesh(floorGeom, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Raised Threshold Step
    const stepGeom = new THREE.BoxGeometry(10.5, 0.18, 2.6);
    const stepMesh = new THREE.Mesh(stepGeom, burgundyStoneMaterial);
    stepMesh.position.set(0, 0.09, 1.3);
    entranceGroup.add(stepMesh);

    // Front Silver Nosing Inlay
    const stepNosingGeom = new THREE.BoxGeometry(10.5, 0.04, 0.05);
    const stepNosing = new THREE.Mesh(stepNosingGeom, sterlingSilverMaterial);
    stepNosing.position.set(0, 0.18, 2.6);
    entranceGroup.add(stepNosing);

    // 6e. Authentic 3D Sterling Silver Stars (Flanking the Portal)
    const starOffset = isMobile ? 3.8 : 5.4;
    const starY = 4.8;
    const starZ = 2.4;

    const leftPrimaryStar = create3DStarMesh(0.55, sterlingSilverMaterial);
    leftPrimaryStar.position.set(-starOffset, starY, starZ);
    entranceGroup.add(leftPrimaryStar);

    const leftSecondaryStar = create3DStarMesh(0.28, sterlingSilverMaterial);
    leftSecondaryStar.position.set(-starOffset - 0.7, starY + 0.8, starZ - 0.3);
    entranceGroup.add(leftSecondaryStar);

    const rightPrimaryStar = create3DStarMesh(0.55, sterlingSilverMaterial);
    rightPrimaryStar.position.set(starOffset, starY, starZ);
    entranceGroup.add(rightPrimaryStar);

    const rightSecondaryStar = create3DStarMesh(0.28, sterlingSilverMaterial);
    rightSecondaryStar.position.set(starOffset + 0.7, starY + 0.8, starZ - 0.3);
    entranceGroup.add(rightSecondaryStar);

    // 6f. Illuminated Sanctuary Backing Aperture
    const sanctuaryGeom = new THREE.PlaneGeometry(12, 12);
    const sanctuaryMesh = new THREE.Mesh(sanctuaryGeom, sanctuaryLightMaterial);
    sanctuaryMesh.position.set(0, 4.6, -3.8);
    entranceGroup.add(sanctuaryMesh);

    // 6g. Subtle Floating Atmospheric Dust Particles (threejs-animation pattern)
    const particleCount = isMobile ? 35 : 70;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = Math.random() * 9 + 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 14 + 2;
    }
    particleGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0xf2e8d8,
      size: isMobile ? 0.04 : 0.06,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 7. Mouse Parallax State (Desktop only)
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

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave, { passive: true });

    // 8. Resize Handler
    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      isMobile = width < 768;

      const newAspect = width / height;
      camera.aspect = newAspect;
      camera.fov =
        newAspect < 1.0 ? Math.min(68, 48 + (1 - newAspect) * 28) : 45;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75)
      );
    };

    window.addEventListener("resize", handleResize);

    // 9. Procedural Animation & Scrubbed Camera Flight Loop
    let animId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    let cameraZ = baseZ;
    let cameraY = baseY;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      elapsed += delta;

      // A) Procedural Star Oscillation (from threejs-animation skill)
      const starFloat = Math.sin(elapsed * 1.6) * 0.08;
      const starTilt = Math.sin(elapsed * 0.9) * 0.05;

      leftPrimaryStar.position.y = starY + starFloat;
      leftPrimaryStar.rotation.z = starTilt;
      leftSecondaryStar.position.y = starY + 0.8 + Math.sin(elapsed * 1.6 + 1) * 0.05;

      rightPrimaryStar.position.y = starY + starFloat;
      rightPrimaryStar.rotation.z = -starTilt;
      rightSecondaryStar.position.y = starY + 0.8 + Math.sin(elapsed * 1.6 + 1) * 0.05;

      // B) Gentle Atmospheric Dust Float
      particleSystem.rotation.y = elapsed * 0.015;

      // C) Damped Desktop Mouse Parallax
      if (!isMobile) {
        currentParallaxX += (mouseX - currentParallaxX) * 0.06;
        currentParallaxY += (mouseY - currentParallaxY) * 0.06;
      }

      // D) Physical Camera Flight Through the 3D Portal
      const p = Math.max(0, Math.min(1.0, scrollRef.current));
      // Easing curve: accelerating forward through the entrance
      const easedP = Math.pow(p, 1.25);
      // At p = 0: z = baseZ (~12.8)
      // At p = 1: z = -2.4 (smoothly inside the illuminated sanctuary)
      const targetZ = baseZ - easedP * (baseZ + 2.4);
      const targetY = baseY + Math.sin(p * Math.PI) * 0.25;

      cameraZ += (targetZ - cameraZ) * 0.12;
      cameraY += (targetY - cameraY) * 0.12;

      camera.position.x = currentParallaxX * 0.35;
      camera.position.y = cameraY + currentParallaxY * 0.22;
      camera.position.z = cameraZ;

      // Look toward the center of the sanctuary portal
      const lookZ = Math.min(0, cameraZ - 8.0);
      camera.lookAt(currentParallaxX * 0.1, 4.6, lookZ);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 10. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);

      mainArchGeom.dispose();
      innerArchGeom.dispose();
      floorGeom.dispose();
      stepGeom.dispose();
      stepNosingGeom.dispose();
      silverTrim.geometry.dispose();
      leftPrimaryStar.geometry.dispose();
      leftSecondaryStar.geometry.dispose();
      rightPrimaryStar.geometry.dispose();
      rightSecondaryStar.geometry.dispose();
      sanctuaryGeom.dispose();
      particleGeom.dispose();

      burgundyStoneMaterial.dispose();
      recessedStoneMaterial.dispose();
      sterlingSilverMaterial.dispose();
      floorMaterial.dispose();
      sanctuaryLightMaterial.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
