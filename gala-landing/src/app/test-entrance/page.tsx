"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Creates smooth beveled box geometry with rounded edges
 */
function createBeveledBoxGeometry(
  width: number,
  height: number,
  depth: number,
  bevelRadius: number = 0.04,
  segments: number = 3,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(
    bevelRadius,
    Math.max(0.001, w * 0.9),
    Math.max(0.001, h * 0.9),
  );

  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const extrudeDepth = Math.max(0.01, depth - r * 2);
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: extrudeDepth,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: segments,
    curveSegments: 8,
  });
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates soft contact shadow map
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.48,
  );
  grad.addColorStop(0, "rgba(0, 0, 0, 0.85)");
  grad.addColorStop(0.35, "rgba(0, 0, 0, 0.50)");
  grad.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Generates an HDR Dusk Studio Environment Map
 */
function createDuskEnvironmentMap(
  renderer: THREE.WebGLRenderer,
): THREE.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x2d070d);

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(32, 32),
    new THREE.MeshBasicMaterial({ color: 0xf0f2f5, side: THREE.DoubleSide }),
  );
  topLight.position.set(0, 16, 0);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  const leftSoft = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 24),
    new THREE.MeshBasicMaterial({ color: 0xd5d7db, side: THREE.DoubleSide }),
  );
  leftSoft.position.set(-14, 8, 0);
  leftSoft.rotation.y = Math.PI / 2;
  envScene.add(leftSoft);

  const rightSoft = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 24),
    new THREE.MeshBasicMaterial({ color: 0xd5d7db, side: THREE.DoubleSide }),
  );
  rightSoft.position.set(14, 8, 0);
  rightSoft.rotation.y = -Math.PI / 2;
  envScene.add(rightSoft);

  const interiorSoft = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff6ea, side: THREE.DoubleSide }),
  );
  interiorSoft.position.set(0, 4, -16);
  envScene.add(interiorSoft);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
  cubeCamera.update(renderer, envScene);

  topLight.geometry.dispose();
  (topLight.material as THREE.Material).dispose();
  leftSoft.geometry.dispose();
  (leftSoft.material as THREE.Material).dispose();
  rightSoft.geometry.dispose();
  (rightSoft.material as THREE.Material).dispose();
  interiorSoft.geometry.dispose();
  (interiorSoft.material as THREE.Material).dispose();

  return cubeRenderTarget;
}

export default function TestEntrancePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<"procedural" | "imported">(
    "procedural",
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x140206, 0.005);

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 140);
    camera.position.set(0, 3.8, 12.8);
    camera.lookAt(0, 3.8, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 3.8, 0);
    controls.maxPolarAngle = Math.PI / 2 + 0.05;

    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
      geometriesToDispose.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materialsToDispose.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      texturesToDispose.push(t);
      return t;
    };

    const envRenderTarget = createDuskEnvironmentMap(renderer);
    scene.environment = envRenderTarget.texture;

    const contactShadowTexture = trackTex(createContactShadowTexture());

    const matBurgundyStone = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#52111f"),
        roughness: 0.24,
        metalness: 0.04,
        clearcoat: 0.72,
        clearcoatRoughness: 0.12,
        reflectivity: 0.85,
        envMapIntensity: 0.95,
      }),
    );

    const matSilverAccent = trackMat(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e0e3e8"),
        roughness: 0.15,
        metalness: 0.96,
        envMapIntensity: 2.0,
      }),
    );

    const matFloor = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#18040b"),
        roughness: 0.08,
        metalness: 0.16,
        clearcoat: 0.95,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.35,
      }),
    );

    const matWarmGlow = trackMat(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#fff8ee"),
      }),
    );

    const ambientLight = new THREE.AmbientLight(0x4a101d, 1.25);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf4f7fc, 2.8);
    keyLight.position.set(6.5, 9.5, 8.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9c5ce, 1.6);
    fillLight.position.set(-7.5, 6.0, 5.0);
    scene.add(fillLight);

    const thresholdLight = new THREE.PointLight(0xffecd8, 2.4, 14, 1.5);
    thresholdLight.position.set(0, 1.8, 3.5);
    scene.add(thresholdLight);

    const interiorGlow = new THREE.PointLight(0xfff6ea, 4.8, 26, 1.3);
    interiorGlow.position.set(0, 4.0, -12.5);
    scene.add(interiorGlow);

    const entranceGroup = new THREE.Group();
    scene.add(entranceGroup);

    const archRadius = 2.7;
    const archSpringY = 4.7;

    const wallW = 140.0;
    const wallH = 45.0;

    const facadeShape = new THREE.Shape();
    facadeShape.moveTo(-wallW / 2, 0);
    facadeShape.lineTo(-wallW / 2, wallH);
    facadeShape.lineTo(wallW / 2, wallH);
    facadeShape.lineTo(wallW / 2, 0);
    facadeShape.lineTo(-wallW / 2, 0);

    const archHole = new THREE.Path();
    archHole.moveTo(-archRadius, 0);
    archHole.lineTo(-archRadius, archSpringY);
    archHole.absarc(0, archSpringY, archRadius, Math.PI, 0, true);
    archHole.lineTo(archRadius, 0);
    archHole.lineTo(-archRadius, 0);
    facadeShape.holes.push(archHole);

    const facadeGeom = trackGeom(
      new THREE.ExtrudeGeometry(facadeShape, {
        depth: 2.4,
        bevelEnabled: true,
        bevelThickness: 0.12,
        bevelSize: 0.08,
        bevelSegments: 5,
        curveSegments: 64,
      }),
    );
    facadeGeom.computeVertexNormals();

    const facadeMesh = new THREE.Mesh(facadeGeom, matBurgundyStone);
    facadeMesh.position.set(0, 0, 0);
    facadeMesh.castShadow = true;
    facadeMesh.receiveShadow = true;
    entranceGroup.add(facadeMesh);

    const curvePath = new THREE.CurvePath<THREE.Vector3>();
    curvePath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-archRadius, 0, 2.41),
        new THREE.Vector3(-archRadius, archSpringY, 2.41),
      ),
    );
    const arcPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const theta = Math.PI - (i / 48) * Math.PI;
      arcPts.push(
        new THREE.Vector3(
          Math.cos(theta) * archRadius,
          archSpringY + Math.sin(theta) * archRadius,
          2.41,
        ),
      );
    }
    for (let i = 0; i < arcPts.length - 1; i++) {
      curvePath.add(new THREE.LineCurve3(arcPts[i], arcPts[i + 1]));
    }
    curvePath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(archRadius, archSpringY, 2.41),
        new THREE.Vector3(archRadius, 0, 2.41),
      ),
    );
    const silverTrimGeom = trackGeom(
      new THREE.TubeGeometry(curvePath, 64, 0.045, 12, false),
    );
    const silverTrimMesh = new THREE.Mesh(silverTrimGeom, matSilverAccent);
    entranceGroup.add(silverTrimMesh);

    const friezeRevealGeom = trackGeom(new THREE.BoxGeometry(10.8, 0.05, 0.03));
    const friezeRevealMesh = new THREE.Mesh(friezeRevealGeom, matSilverAccent);
    friezeRevealMesh.position.set(0, archSpringY + archRadius + 0.65, 2.42);
    entranceGroup.add(friezeRevealMesh);

    const passageDepth = 16.0;

    const leftPassageGeom = trackGeom(
      createBeveledBoxGeometry(0.5, 8.0, passageDepth, 0.03, 3),
    );
    const leftPassage = new THREE.Mesh(leftPassageGeom, matBurgundyStone);
    leftPassage.position.set(-archRadius - 0.25, 4.0, -passageDepth / 2);
    leftPassage.receiveShadow = true;
    entranceGroup.add(leftPassage);

    const leftWallRevealGeom = trackGeom(
      new THREE.BoxGeometry(0.52, 0.035, passageDepth),
    );
    const leftWallReveal = new THREE.Mesh(leftWallRevealGeom, matSilverAccent);
    leftWallReveal.position.set(-archRadius - 0.25, 3.6, -passageDepth / 2);
    entranceGroup.add(leftWallReveal);

    const rightPassage = new THREE.Mesh(leftPassageGeom, matBurgundyStone);
    rightPassage.position.set(archRadius + 0.25, 4.0, -passageDepth / 2);
    rightPassage.receiveShadow = true;
    entranceGroup.add(rightPassage);

    const rightWallReveal = new THREE.Mesh(leftWallRevealGeom, matSilverAccent);
    rightWallReveal.position.set(archRadius + 0.25, 3.6, -passageDepth / 2);
    entranceGroup.add(rightWallReveal);

    const passageCeilingGeom = trackGeom(
      createBeveledBoxGeometry(
        archRadius * 2 + 1.0,
        0.4,
        passageDepth,
        0.03,
        3,
      ),
    );
    const passageCeiling = new THREE.Mesh(passageCeilingGeom, matBurgundyStone);
    passageCeiling.position.set(
      0,
      archSpringY + archRadius + 0.2,
      -passageDepth / 2,
    );
    entranceGroup.add(passageCeiling);

    const lightStripGeom = trackGeom(
      new THREE.BoxGeometry(0.06, 0.02, passageDepth - 1.0),
    );
    const lightStrip = new THREE.Mesh(lightStripGeom, matWarmGlow);
    lightStrip.position.set(
      0,
      archSpringY + archRadius - 0.01,
      -passageDepth / 2,
    );
    entranceGroup.add(lightStrip);

    const sanctBackdropGeom = trackGeom(new THREE.PlaneGeometry(16, 12));
    const sanctBackdropMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfff6ea,
        transparent: true,
        opacity: 0.92,
      }),
    );
    const sanctBackdrop = new THREE.Mesh(sanctBackdropGeom, sanctBackdropMat);
    sanctBackdrop.position.set(0, 4.2, -passageDepth - 0.1);
    entranceGroup.add(sanctBackdrop);

    [
      { w: 20.0, d: 2.0, h: 0.16, y: 0.08, z: 5.4 },
      { w: 16.5, d: 1.8, h: 0.16, y: 0.24, z: 3.6 },
      { w: 13.5, d: 1.6, h: 0.16, y: 0.4, z: 2.0 },
    ].forEach((step) => {
      const stepGeom = trackGeom(
        createBeveledBoxGeometry(step.w, step.h, step.d, 0.025, 3),
      );
      const stepMesh = new THREE.Mesh(stepGeom, matBurgundyStone);
      stepMesh.position.set(0, step.y, step.z);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      entranceGroup.add(stepMesh);

      const nosingGeom = trackGeom(
        new THREE.BoxGeometry(step.w + 0.02, 0.025, 0.025),
      );
      const nosingMesh = new THREE.Mesh(nosingGeom, matSilverAccent);
      nosingMesh.position.set(0, step.y + step.h / 2, step.z + step.d / 2);
      entranceGroup.add(nosingMesh);
    });

    const shadowPlaneGeom = trackGeom(new THREE.PlaneGeometry(28, 14));
    const shadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, 0.01, 3.8);
    entranceGroup.add(shadowPlane);

    const floorGeom = trackGeom(new THREE.PlaneGeometry(160, 80));
    const floorMesh = new THREE.Mesh(floorGeom, matFloor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 8);
    floorMesh.receiveShadow = true;
    entranceGroup.add(floorMesh);

    const passageFloorGeom = trackGeom(
      new THREE.PlaneGeometry(24, passageDepth + 6),
    );
    const passageFloorMesh = new THREE.Mesh(passageFloorGeom, matFloor);
    passageFloorMesh.rotation.x = -Math.PI / 2;
    passageFloorMesh.position.set(0, 0.41, -passageDepth / 2);
    entranceGroup.add(passageFloorMesh);

    const runnerGeom = trackGeom(new THREE.BoxGeometry(0.1, 0.008, 34.0));
    const runnerMesh = new THREE.Mesh(runnerGeom, matSilverAccent);
    runnerMesh.position.set(0, 0.005, -4.0);
    entranceGroup.add(runnerMesh);

    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      envRenderTarget.dispose();
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      texturesToDispose.forEach((t) => t.dispose());
      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#140206] text-white overflow-hidden">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 z-50 bg-[#140206]/80 border border-[#c0c0c0]/30 backdrop-blur-md rounded-lg p-4 max-w-md shadow-2xl">
        <h1 className="text-sm font-semibold tracking-wider text-[#d5d7db] uppercase mb-1">
          Architectural Entrance 3D Inspector
        </h1>
        <p className="text-xs text-[#c0c0c0]/80 mb-2">
          Model: <span className="text-[#fff5ea] font-mono">{modelType}</span>
        </p>
        <p className="text-xs text-[#c0c0c0]/60 leading-relaxed font-sans">
          Rich Burgundy #52111F & Sterling Silver #E0E3E8 under architectural
          studio lighting.
        </p>
      </div>
    </div>
  );
}
