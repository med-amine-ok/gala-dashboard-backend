"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface LuxuryHotelEntrance3DProps {
  scrollProgress: number;
  onLoaded?: () => void;
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

export default function LuxuryHotelEntrance3D({
  scrollProgress,
  onLoaded,
}: LuxuryHotelEntrance3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);

  // Sync scroll progress via ref for jitter-free 60fps render loop
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect WebGL capability
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

    // 1. Scene & Atmosphere Fog (Imperial Burgundy / Dusk Black Cherry)
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x180306, 0.020);

    // 2. Camera Setup (Architectural perspective framing the grand entrance)
    const aspect = width / height;
    const baseFov = aspect < 1.0 ? Math.min(64, 46 + (1 - aspect) * 26) : 40;
    const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 140);

    const baseZ = aspect < 1.0 ? 19.5 : 16.5;
    const baseY = aspect < 1.0 ? 4.9 : 4.6;
    camera.position.set(0, baseY, baseZ);
    camera.lookAt(0, 5.0, 0);

    // 3. Renderer Setup with PBR Clearcoat & ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Track geometries and materials for clean disposal
    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];

    const trackGeom = <T extends THREE.BufferGeometry>(geom: T): T => {
      geometriesToDispose.push(geom);
      return geom;
    };
    const trackMat = <T extends THREE.Material>(mat: T): T => {
      materialsToDispose.push(mat);
      return mat;
    };

    // =========================================================================
    // 4. LUXURY HOTEL PBR MATERIALS
    // =========================================================================

    // A) Imperial Burgundy Polished Stone Cladding with Clearcoat Sheen
    const stoneFacadeMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x360812,
        roughness: 0.22,
        metalness: 0.18,
        clearcoat: 0.55,
        clearcoatRoughness: 0.14,
      })
    );

    // B) Recessed Shadow Stone & Slab Joints
    const stoneShadowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1d0308,
        roughness: 0.40,
        metalness: 0.12,
      })
    );

    // C) Brushed Champagne Metal Trim (Canopy Fascia, Plinths, Capitals, Reveal Strips)
    const champagneMetalMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xebdcc7,
        roughness: 0.18,
        metalness: 0.92,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
      })
    );

    // D) Mirror-Polished Sterling Silver for 3D Gala Stars
    const sterlingSilverMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xf8f8fa,
        roughness: 0.05,
        metalness: 0.98,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
      })
    );

    // E) Dark Obsidian Burgundy Marble Ground Floor
    const marbleFloorMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x140206,
        roughness: 0.10,
        metalness: 0.38,
        clearcoat: 0.70,
        clearcoatRoughness: 0.08,
      })
    );

    // F) Royal Burgundy Velvet Runner Carpet
    const carpetMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x440811,
        roughness: 0.85,
        metalness: 0.04,
      })
    );

    // G) Architectural Glass Doors with Slim Champagne Frames
    const glassDoorMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xecf4fa,
        transparent: true,
        opacity: 0.44,
        roughness: 0.03,
        metalness: 0.20,
        clearcoat: 0.95,
        clearcoatRoughness: 0.04,
      })
    );

    // H) Warm LED Canopy Soffit Linear Glow
    const canopyGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfff3de,
      })
    );

    // I) Wall Sconce Light Source Glow
    const sconceGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xfff6e6,
      })
    );

    // J) Deep Lobby Interior Warm Sanctuary Glow Aperture
    const lobbyGlowMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffe6c8,
        transparent: true,
        opacity: 0.92,
      })
    );

    // =========================================================================
    // 5. ARCHITECTURAL LIGHTING RIG
    // =========================================================================

    // Ambient light (Deep Imperial Wine)
    const ambientLight = new THREE.AmbientLight(0x380913, 0.75);
    scene.add(ambientLight);

    // Grazing Champagne Key Light
    const keyLight = new THREE.DirectionalLight(0xfff6eb, 3.2);
    keyLight.position.set(9.0, 16.0, 12.0);
    if (!isMobile) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    // Front Silver Specular Fill Light (Highlights 3D stars & champagne capitals)
    const frontStarLight = new THREE.DirectionalLight(0xfff8fa, 1.6);
    frontStarLight.position.set(0, 8.0, 14.0);
    scene.add(frontStarLight);

    // Cool Burgundy Architectural Rim Light
    const rimLight = new THREE.DirectionalLight(0xa51f33, 2.2);
    rimLight.position.set(-10.5, 9.0, 6.0);
    scene.add(rimLight);

    // Porte-Cochère Under-Canopy Warm Downlight
    const canopyDownlight = new THREE.PointLight(0xffecd2, 4.2, 16, 1.2);
    canopyDownlight.position.set(0, 8.8, 3.2);
    scene.add(canopyDownlight);

    // Warm Interior Lobby Chandelier Spill Light
    const lobbySpillLight = new THREE.PointLight(0xffdfb0, 5.0, 26, 1.2);
    lobbySpillLight.position.set(0, 6.2, -4.0);
    scene.add(lobbySpillLight);

    // Front threshold graze light
    const thresholdLight = new THREE.PointLight(0xffedd6, 1.8, 8, 1.5);
    thresholdLight.position.set(0, 1.8, 2.8);
    scene.add(thresholdLight);

    // =========================================================================
    // 6. ARCHITECTURAL HIERARCHY
    // =========================================================================
    const entranceRoot = new THREE.Group();
    scene.add(entranceRoot);

    // -------------------------------------------------------------------------
    // 6a. GRAND FACADE CLADDING & SLAB JOINTS
    // -------------------------------------------------------------------------
    const facadeWidth = 32.0;
    const facadeHeight = 18.0;
    const portalWidth = 8.4;
    const portalSpringY = 5.2;
    const portalRadius = portalWidth / 2; // 4.2

    // Main Facade Wall with Portal Opening Hole
    const facadeShape = new THREE.Shape();
    facadeShape.moveTo(-facadeWidth / 2, 0.6);
    facadeShape.lineTo(-facadeWidth / 2, facadeHeight);
    facadeShape.lineTo(facadeWidth / 2, facadeHeight);
    facadeShape.lineTo(facadeWidth / 2, 0.6);
    facadeShape.lineTo(-facadeWidth / 2, 0.6);

    // Grand arched hotel entrance opening hole
    const portalHole = new THREE.Path();
    portalHole.moveTo(-portalRadius, 0.6);
    portalHole.lineTo(-portalRadius, portalSpringY);
    portalHole.absarc(0, portalSpringY, portalRadius, Math.PI, 0, true);
    portalHole.lineTo(portalRadius, 0.6);
    portalHole.lineTo(-portalRadius, 0.6);
    facadeShape.holes.push(portalHole);

    const facadeGeom = trackGeom(
      new THREE.ExtrudeGeometry(facadeShape, {
        depth: 1.6,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.10,
        bevelSegments: 4,
        curveSegments: 48,
      })
    );
    facadeGeom.computeVertexNormals();
    const facadeMesh = new THREE.Mesh(facadeGeom, stoneFacadeMat);
    facadeMesh.castShadow = true;
    facadeMesh.receiveShadow = true;
    facadeMesh.position.set(0, 0, 0);
    entranceRoot.add(facadeMesh);

    // Visible Stone Slab Joint Lines
    for (let y = 2.4; y < facadeHeight; y += 2.2) {
      const jointGeom = trackGeom(new THREE.BoxGeometry(facadeWidth + 0.2, 0.03, 0.05));
      const jointMesh = new THREE.Mesh(jointGeom, stoneShadowMat);
      jointMesh.position.set(0, y, 1.61);
      entranceRoot.add(jointMesh);
    }

    // Arch opening perimeter champagne reveal trim
    const archTrimShape = new THREE.CurvePath<THREE.Vector3>();
    archTrimShape.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-portalRadius, 0.6, 1.62),
        new THREE.Vector3(-portalRadius, portalSpringY, 1.62)
      )
    );
    const archPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 36; i++) {
      const theta = Math.PI - (i / 36) * Math.PI;
      archPts.push(
        new THREE.Vector3(
          Math.cos(theta) * portalRadius,
          portalSpringY + Math.sin(theta) * portalRadius,
          1.62
        )
      );
    }
    for (let i = 0; i < archPts.length - 1; i++) {
      archTrimShape.add(new THREE.LineCurve3(archPts[i], archPts[i + 1]));
    }
    archTrimShape.add(
      new THREE.LineCurve3(
        new THREE.Vector3(portalRadius, portalSpringY, 1.62),
        new THREE.Vector3(portalRadius, 0.6, 1.62)
      )
    );
    const archTrimGeom = trackGeom(new THREE.TubeGeometry(archTrimShape, 64, 0.05, 8, false));
    const archTrimMesh = new THREE.Mesh(archTrimGeom, champagneMetalMat);
    entranceRoot.add(archTrimMesh);

    // -------------------------------------------------------------------------
    // 6b. MONUMENTAL FLANKING PILASTERS & COLUMNS
    // -------------------------------------------------------------------------
    const columnX = portalRadius + 1.45; // ~5.65
    const colWidth = 1.6;
    const colHeight = 9.4;
    const colDepth = 1.4;

    const createPilaster = (xPos: number) => {
      const colGroup = new THREE.Group();
      colGroup.position.set(xPos, 0.6, 1.0);

      // Main Pilaster Shaft
      const shaftGeom = trackGeom(new THREE.BoxGeometry(colWidth, colHeight, colDepth));
      const shaftMesh = new THREE.Mesh(shaftGeom, stoneFacadeMat);
      shaftMesh.position.set(0, colHeight / 2, 0);
      shaftMesh.castShadow = true;
      colGroup.add(shaftMesh);

      // Fluted Vertical Inset Channels (3 modern flutes)
      for (let i = -1; i <= 1; i++) {
        const fluteGeom = trackGeom(new THREE.BoxGeometry(0.22, colHeight - 1.6, 0.08));
        const fluteMesh = new THREE.Mesh(fluteGeom, stoneShadowMat);
        fluteMesh.position.set(i * 0.44, colHeight / 2, colDepth / 2 + 0.02);
        colGroup.add(fluteMesh);
      }

      // Champagne Metal Plinth Base
      const baseGeom = trackGeom(new THREE.BoxGeometry(colWidth + 0.16, 0.36, colDepth + 0.16));
      const baseMesh = new THREE.Mesh(baseGeom, champagneMetalMat);
      baseMesh.position.set(0, 0.18, 0);
      colGroup.add(baseMesh);

      // Champagne Metal Capital Band
      const capGeom = trackGeom(new THREE.BoxGeometry(colWidth + 0.20, 0.32, colDepth + 0.20));
      const capMesh = new THREE.Mesh(capGeom, champagneMetalMat);
      capMesh.position.set(0, colHeight - 0.16, 0);
      colGroup.add(capMesh);

      // Architectural Up/Down Wall Sconce
      const sconceGeom = trackGeom(new THREE.BoxGeometry(0.20, 0.55, 0.15));
      const sconceMesh = new THREE.Mesh(sconceGeom, champagneMetalMat);
      sconceMesh.position.set(0, 4.8, colDepth / 2 + 0.10);
      colGroup.add(sconceMesh);

      const sconceGlowTop = new THREE.Mesh(
        trackGeom(new THREE.BoxGeometry(0.15, 0.05, 0.10)),
        sconceGlowMat
      );
      sconceGlowTop.position.set(0, 5.05, colDepth / 2 + 0.10);
      colGroup.add(sconceGlowTop);

      const sconceGlowBot = new THREE.Mesh(
        trackGeom(new THREE.BoxGeometry(0.15, 0.05, 0.10)),
        sconceGlowMat
      );
      sconceGlowBot.position.set(0, 4.55, colDepth / 2 + 0.10);
      colGroup.add(sconceGlowBot);

      return colGroup;
    };

    const leftCol = createPilaster(-columnX);
    const rightCol = createPilaster(columnX);
    entranceRoot.add(leftCol);
    entranceRoot.add(rightCol);

    // -------------------------------------------------------------------------
    // 6c. PROJECTING PORTE-COCHÈRE CANOPY (Positioned Above Grand Arch)
    // -------------------------------------------------------------------------
    const canopyWidth = 12.0;
    const canopyDepth = 4.2;
    const canopyHeight = 0.65;
    const canopyY = 9.8;
    const canopyZ = 1.6 + canopyDepth / 2;

    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, canopyY, canopyZ);

    // Main Canopy Stone Structure
    const canopyMainGeom = trackGeom(
      new THREE.BoxGeometry(canopyWidth, canopyHeight, canopyDepth)
    );
    const canopyMainMesh = new THREE.Mesh(canopyMainGeom, stoneFacadeMat);
    canopyMainMesh.castShadow = true;
    canopyGroup.add(canopyMainMesh);

    // Champagne Metal Perimeter Fascia Trim
    const fasciaGeom = trackGeom(
      new THREE.BoxGeometry(canopyWidth + 0.16, canopyHeight + 0.08, canopyDepth + 0.16)
    );
    const fasciaMesh = new THREE.Mesh(fasciaGeom, champagneMetalMat);
    fasciaMesh.scale.set(1.002, 1.002, 1.002);
    canopyGroup.add(fasciaMesh);

    // Recessed Underside Soffit with Warm Linear LED Channel
    const soffitGlowGeom = trackGeom(
      new THREE.BoxGeometry(canopyWidth - 1.0, 0.05, canopyDepth - 1.0)
    );
    const soffitGlowMesh = new THREE.Mesh(soffitGlowGeom, canopyGlowMat);
    soffitGlowMesh.position.set(0, -canopyHeight / 2 - 0.02, 0);
    canopyGroup.add(soffitGlowMesh);

    // Cantilever Support Tie-Rods in Champagne Metal
    const tieRodGeom = trackGeom(new THREE.CylinderGeometry(0.045, 0.045, 4.2, 12));
    const leftTieRod = new THREE.Mesh(tieRodGeom, champagneMetalMat);
    leftTieRod.position.set(-canopyWidth * 0.42, 1.8, -0.8);
    leftTieRod.rotation.x = 0.58;
    leftTieRod.rotation.z = -0.16;
    canopyGroup.add(leftTieRod);

    const rightTieRod = new THREE.Mesh(tieRodGeom, champagneMetalMat);
    rightTieRod.position.set(canopyWidth * 0.42, 1.8, -0.8);
    rightTieRod.rotation.x = 0.58;
    rightTieRod.rotation.z = 0.16;
    canopyGroup.add(rightTieRod);

    entranceRoot.add(canopyGroup);

    // -------------------------------------------------------------------------
    // 6d. GLASS ENTRANCE DOORS & CHAMPAGNE ARCHITRAVE
    // -------------------------------------------------------------------------
    const doorArchitraveGeom = trackGeom(
      new THREE.BoxGeometry(portalWidth + 0.35, 0.30, 0.7)
    );
    const doorArchitrave = new THREE.Mesh(doorArchitraveGeom, champagneMetalMat);
    doorArchitrave.position.set(0, 5.3, 1.5);
    entranceRoot.add(doorArchitrave);

    // Left Glass Door (Slightly open inward at -25 deg)
    const doorWidth = portalWidth / 2 - 0.2;
    const doorHeight = 4.6;
    const doorGeom = trackGeom(new THREE.BoxGeometry(doorWidth, doorHeight, 0.08));

    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-portalWidth / 2 + 0.1, 0.6, 1.3);
    leftDoorPivot.rotation.y = -0.44;

    const leftDoorMesh = new THREE.Mesh(doorGeom, glassDoorMat);
    leftDoorMesh.position.set(doorWidth / 2, doorHeight / 2, 0);
    leftDoorPivot.add(leftDoorMesh);

    // Slim Champagne Door Frame
    const frameGeom = trackGeom(new THREE.BoxGeometry(doorWidth + 0.05, doorHeight + 0.05, 0.10));
    const leftFrame = new THREE.Mesh(frameGeom, champagneMetalMat);
    leftFrame.position.set(doorWidth / 2, doorHeight / 2, 0);
    leftFrame.scale.set(0.96, 0.96, 0.9);
    leftDoorPivot.add(leftFrame);

    // Horizontal Champagne Crash Bar Handle
    const handleGeom = trackGeom(new THREE.CylinderGeometry(0.025, 0.025, doorWidth * 0.72, 8));
    const leftHandle = new THREE.Mesh(handleGeom, champagneMetalMat);
    leftHandle.rotation.z = Math.PI / 2;
    leftHandle.position.set(doorWidth / 2, 2.2, 0.10);
    leftDoorPivot.add(leftHandle);

    entranceRoot.add(leftDoorPivot);

    // Right Glass Door (Open inward at +25 deg)
    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(portalWidth / 2 - 0.1, 0.6, 1.3);
    rightDoorPivot.rotation.y = 0.44;

    const rightDoorMesh = new THREE.Mesh(doorGeom, glassDoorMat);
    rightDoorMesh.position.set(-doorWidth / 2, doorHeight / 2, 0);
    rightDoorPivot.add(rightDoorMesh);

    const rightFrame = new THREE.Mesh(frameGeom, champagneMetalMat);
    rightFrame.position.set(-doorWidth / 2, doorHeight / 2, 0);
    rightFrame.scale.set(0.96, 0.96, 0.9);
    rightDoorPivot.add(rightFrame);

    const rightHandle = new THREE.Mesh(handleGeom, champagneMetalMat);
    rightHandle.rotation.z = Math.PI / 2;
    rightHandle.position.set(-doorWidth / 2, 2.2, 0.10);
    rightDoorPivot.add(rightHandle);

    entranceRoot.add(rightDoorPivot);

    // -------------------------------------------------------------------------
    // 6e. WIDE APPROACH STEPS & POLISHED THRESHOLD
    // -------------------------------------------------------------------------
    const createStep = (w: number, d: number, h: number, y: number, z: number) => {
      const stepMesh = new THREE.Mesh(
        trackGeom(new THREE.BoxGeometry(w, h, d)),
        stoneFacadeMat
      );
      stepMesh.position.set(0, y, z);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;

      // Champagne Front Nosing Strip
      const nosing = new THREE.Mesh(
        trackGeom(new THREE.BoxGeometry(w + 0.05, 0.04, 0.04)),
        champagneMetalMat
      );
      nosing.position.set(0, y + h / 2, z + d / 2 + 0.02);
      entranceRoot.add(nosing);

      return stepMesh;
    };

    // 3 Broad Classical Steps
    entranceRoot.add(createStep(16.5, 2.6, 0.22, 0.11, 4.8));
    entranceRoot.add(createStep(14.8, 2.2, 0.22, 0.33, 3.6));
    entranceRoot.add(createStep(13.2, 2.4, 0.22, 0.55, 2.4));

    // Ground Courtyard / Driveway Floor
    const groundGeom = trackGeom(new THREE.PlaneGeometry(65, 45));
    const groundMesh = new THREE.Mesh(groundGeom, marbleFloorMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, 20);
    groundMesh.receiveShadow = true;
    entranceRoot.add(groundMesh);

    // Royal Burgundy Velvet Runner Carpet Leading In
    const carpetGeom = trackGeom(new THREE.PlaneGeometry(4.2, 8.5));
    const carpetMesh = new THREE.Mesh(carpetGeom, carpetMat);
    carpetMesh.rotation.x = -Math.PI / 2;
    carpetMesh.position.set(0, 0.58, 2.6);
    entranceRoot.add(carpetMesh);

    // Brass Stanchion Posts Flanking Carpet
    for (let i = 0; i < 3; i++) {
      const zPos = 1.8 + i * 1.6;
      const createStanchion = (xPos: number) => {
        const postGeom = trackGeom(new THREE.CylinderGeometry(0.045, 0.055, 1.0, 12));
        const post = new THREE.Mesh(postGeom, champagneMetalMat);
        post.position.set(xPos, 1.05, zPos);
        const topBall = new THREE.Mesh(
          trackGeom(new THREE.SphereGeometry(0.08, 12, 12)),
          champagneMetalMat
        );
        topBall.position.set(0, 0.52, 0);
        post.add(topBall);
        return post;
      };
      entranceRoot.add(createStanchion(-2.4));
      entranceRoot.add(createStanchion(2.4));
    }

    // -------------------------------------------------------------------------
    // 6f. INVITING WARM HOTEL LOBBY DEPTH
    // -------------------------------------------------------------------------
    const lobbyGroup = new THREE.Group();
    lobbyGroup.position.set(0, 0.6, 0);

    // Lobby Polished Floor
    const lobbyFloorGeom = trackGeom(new THREE.PlaneGeometry(20, 22));
    const lobbyFloor = new THREE.Mesh(lobbyFloorGeom, marbleFloorMat);
    lobbyFloor.rotation.x = -Math.PI / 2;
    lobbyFloor.position.set(0, 0, -9);
    lobbyGroup.add(lobbyFloor);

    // Sculptural Concentric Chandelier Rings
    const createChandelierRing = (radius: number, y: number, z: number) => {
      const ringGeom = trackGeom(new THREE.TorusGeometry(radius, 0.045, 8, 40));
      const ring = new THREE.Mesh(ringGeom, champagneMetalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y, z);

      const glowRing = new THREE.Mesh(
        trackGeom(new THREE.TorusGeometry(radius, 0.028, 8, 40)),
        canopyGlowMat
      );
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.set(0, y - 0.02, z);
      lobbyGroup.add(glowRing);

      return ring;
    };
    lobbyGroup.add(createChandelierRing(1.8, 6.8, -4.2));
    lobbyGroup.add(createChandelierRing(1.2, 6.2, -4.2));
    lobbyGroup.add(createChandelierRing(0.6, 5.6, -4.2));

    // Vertical Backlit Champagne Light Fins in Lobby Rear
    for (let x = -5.6; x <= 5.6; x += 1.4) {
      const finGeom = trackGeom(new THREE.BoxGeometry(0.14, 7.2, 0.28));
      const finMesh = new THREE.Mesh(finGeom, champagneMetalMat);
      finMesh.position.set(x, 3.6, -11.0);
      lobbyGroup.add(finMesh);
    }

    // Lobby Warm Luminous Backing Aperture
    const lobbyBackGeom = trackGeom(new THREE.PlaneGeometry(16, 10));
    const lobbyBackMesh = new THREE.Mesh(lobbyBackGeom, lobbyGlowMat);
    lobbyBackMesh.position.set(0, 5.0, -12.0);
    lobbyGroup.add(lobbyBackMesh);

    entranceRoot.add(lobbyGroup);

    // -------------------------------------------------------------------------
    // 6g. AUTHENTIC 3D GALA SILVER STARS (Floating & Oscillating)
    // -------------------------------------------------------------------------
    const starOffset = isMobile ? 5.2 : 7.2;
    const starY = 6.0;
    const starZ = 3.6;

    const leftPrimaryStar = create3DStarMesh(0.58, sterlingSilverMat);
    leftPrimaryStar.position.set(-starOffset, starY, starZ);
    entranceRoot.add(leftPrimaryStar);

    const leftSecondaryStar = create3DStarMesh(0.30, sterlingSilverMat);
    leftSecondaryStar.position.set(-starOffset - 0.9, starY + 1.0, starZ - 0.4);
    entranceRoot.add(leftSecondaryStar);

    const rightPrimaryStar = create3DStarMesh(0.58, sterlingSilverMat);
    rightPrimaryStar.position.set(starOffset, starY, starZ);
    entranceRoot.add(rightPrimaryStar);

    const rightSecondaryStar = create3DStarMesh(0.30, sterlingSilverMat);
    rightSecondaryStar.position.set(starOffset + 0.9, starY + 1.0, starZ - 0.4);
    entranceRoot.add(rightSecondaryStar);

    // -------------------------------------------------------------------------
    // 6h. FLOATING ATMOSPHERIC EMBERS (threejs-animation pattern)
    // -------------------------------------------------------------------------
    const particleCount = isMobile ? 35 : 75;
    const particleGeom = trackGeom(new THREE.BufferGeometry());
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 22;
      particlePositions[i + 1] = Math.random() * 9 + 0.6;
      particlePositions[i + 2] = (Math.random() - 0.5) * 18 + 4;
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = trackMat(
      new THREE.PointsMaterial({
        color: 0xf2e8d8,
        size: isMobile ? 0.040 : 0.060,
        transparent: true,
        opacity: 0.60,
        blending: THREE.AdditiveBlending,
      })
    );
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // =========================================================================
    // 7. DESKTOP MOUSE PARALLAX WITH SMOOTH DAMPING
    // =========================================================================
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

    // =========================================================================
    // 8. RESIZE HANDLER (Dynamic FOV & Camera Distance)
    // =========================================================================
    const handleResize = () => {
      if (!mount) return;
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      isMobile = width < 768;

      const newAspect = width / height;
      camera.aspect = newAspect;
      camera.fov =
        newAspect < 1.0 ? Math.min(64, 46 + (1 - newAspect) * 26) : 40;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75)
      );
    };

    window.addEventListener("resize", handleResize);

    // =========================================================================
    // 9. ANIMATION & CAMERA FLIGHT THROUGH HOTEL ENTRANCE
    // =========================================================================
    let animId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    let currentCameraZ = baseZ;
    let currentCameraY = baseY;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      elapsed += delta;

      // A) Subtle procedural oscillation on stars (threejs-animation pattern)
      const starFloat = Math.sin(elapsed * 1.5) * 0.08;
      const starTilt = Math.sin(elapsed * 0.85) * 0.04;

      leftPrimaryStar.position.y = starY + starFloat;
      leftPrimaryStar.rotation.z = starTilt;
      leftSecondaryStar.position.y = starY + 1.0 + Math.sin(elapsed * 1.5 + 1.2) * 0.06;

      rightPrimaryStar.position.y = starY + starFloat;
      rightPrimaryStar.rotation.z = -starTilt;
      rightSecondaryStar.position.y = starY + 1.0 + Math.sin(elapsed * 1.5 + 1.2) * 0.06;

      // B) Gentle particle system float
      particleSystem.rotation.y = elapsed * 0.012;

      // C) Damped mouse parallax
      if (!isMobile) {
        currentParallaxX += (mouseX - currentParallaxX) * 0.06;
        currentParallaxY += (mouseY - currentParallaxY) * 0.06;
      }

      // D) PHYSICAL CAMERA FLIGHT THROUGH THE LUXURY HOTEL ENTRANCE
      // Progress: 0.0 (Establishing view) -> 1.0 (Inside the warm lobby)
      const p = Math.max(0, Math.min(1.0, scrollRef.current));

      // Accelerating curve toward the glass doors
      const easedP = Math.pow(p, 1.26);

      // Trajectory Z:
      // At p = 0.0: z = baseZ (~16.5)
      // At p = 0.5: z = ~6.8 (passing under the cantilevered canopy)
      // At p = 0.8: z = ~1.4 (crossing the threshold through the glass doors)
      // At p = 1.0: z = -4.5 (inside the illuminated lobby)
      const targetZ = baseZ - easedP * (baseZ + 4.5);

      // Trajectory Y:
      // Subtle natural eye-level curve rising up the stone steps
      const targetY = baseY + Math.sin(p * Math.PI * 0.85) * 0.32 - p * 0.45;

      currentCameraZ += (targetZ - currentCameraZ) * 0.12;
      currentCameraY += (targetY - currentCameraY) * 0.12;

      camera.position.x = currentParallaxX * 0.35;
      camera.position.y = currentCameraY + currentParallaxY * 0.20;
      camera.position.z = currentCameraZ;

      // Camera focal look-at target advances deep into the lobby
      const lookZ = Math.min(0, currentCameraZ - 8.5);
      const lookY = 4.8 + currentParallaxY * 0.12;
      camera.lookAt(currentParallaxX * 0.08, lookY, lookZ);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    if (onLoaded) {
      onLoaded();
    }

    // =========================================================================
    // 10. CLEANUP ON UNMOUNT
    // =========================================================================
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);

      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
      leftPrimaryStar.geometry.dispose();
      leftSecondaryStar.geometry.dispose();
      rightPrimaryStar.geometry.dispose();
      rightSecondaryStar.geometry.dispose();

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
