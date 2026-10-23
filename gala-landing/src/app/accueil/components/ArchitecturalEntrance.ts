import * as THREE from "three";
import {
  createDarkArchitecturalStoneTextures,
  createDarkMarbleFloorTextures,
  StoneTextureSet,
  FloorTextureSet,
} from "./TextureGenerator";

export interface ArchitecturalMaterials {
  stoneMaterial: THREE.MeshStandardMaterial;
  flutedStoneMaterial: THREE.MeshStandardMaterial;
  metalMaterial: THREE.MeshStandardMaterial;
  starMaterial: THREE.MeshStandardMaterial;
  darkFloorMaterial: THREE.MeshStandardMaterial;
  lanternGlowMaterial: THREE.MeshBasicMaterial;
  sanctuaryLightMaterial: THREE.MeshBasicMaterial;
}

/**
 * Creates luxury PBR materials for the Clean, Minimalist Dark Black & Silver architectural aesthetic:
 * - Matte dark graphite architectural stone (#17191D)
 * - Dark metallic panels (#20242B / #34383F)
 * - Precision brushed silver structural trims (#BFC3C9)
 * - Mirror-polished sterling silver stars (#E4E7EB)
 * - Polished obsidian floor (#08090B) with satin sheen
 * - Minimalist linear silver light channels (#F0F4FA)
 */
export function createArchitecturalMaterials(): ArchitecturalMaterials {
  const stoneTextures: StoneTextureSet = createDarkArchitecturalStoneTextures();
  const floorTextures: FloorTextureSet = createDarkMarbleFloorTextures();

  // Ultra-clean matte dark graphite architectural stone (#17191D)
  const stoneMaterial = new THREE.MeshStandardMaterial({
    map: stoneTextures.diffuse,
    roughnessMap: stoneTextures.roughness,
    bumpMap: stoneTextures.bump,
    bumpScale: 0.008,
    color: 0x17191d,
    roughness: 0.55,
    metalness: 0.12,
    envMapIntensity: 0.9,
  });

  // Dark graphite satin metallic panel (#20242B / #34383F)
  const flutedStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x20242b,
    roughness: 0.32,
    metalness: 0.72,
    envMapIntensity: 1.25,
  });

  // Precision brushed silver structural trim (#BFC3C9)
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfc3c9,
    roughness: 0.20,
    metalness: 0.92,
    envMapIntensity: 1.85,
  });

  // Brilliant polished sterling silver for authentic star ornaments (#E4E7EB)
  const starMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4e7eb,
    roughness: 0.08,
    metalness: 0.96,
    envMapIntensity: 2.2,
  });

  // Polished obsidian black granite floor with pristine satin reflection (#08090B)
  const darkFloorMaterial = new THREE.MeshStandardMaterial({
    map: floorTextures.diffuse,
    roughnessMap: floorTextures.roughness,
    color: 0x08090b,
    roughness: 0.12,
    metalness: 0.35,
    envMapIntensity: 1.45,
  });

  // Minimalist recessed linear architectural light channels (crisp silver-white #F0F4FA)
  const lanternGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xf0f4fa,
  });

  // Distant sanctuary aperture (radiant silver atmosphere #DDE2EA)
  const sanctuaryLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xdde2ea,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  return {
    stoneMaterial,
    flutedStoneMaterial,
    metalMaterial,
    starMaterial,
    darkFloorMaterial,
    lanternGlowMaterial,
    sanctuaryLightMaterial,
  };
}

/**
 * Creates the authentic 4-pointed flaring star ornament from the Engineers' Gala identity.
 * Uses curved hypocycloid arcs matching the brand logo.
 */
export function createAuthenticGalaStarMesh(
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const shape = new THREE.Shape();
  const R = radius;
  const c = R * 0.09;

  shape.moveTo(0, R);
  shape.quadraticCurveTo(c, c, R, 0);
  shape.quadraticCurveTo(c, -c, 0, -R);
  shape.quadraticCurveTo(-c, -c, -R, 0);
  shape.quadraticCurveTo(-c, c, 0, R);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: R * 0.18,
    bevelEnabled: true,
    bevelThickness: R * 0.15,
    bevelSize: R * 0.08,
    bevelSegments: 4,
  });
  geom.computeVertexNormals();
  geom.translate(0, 0, -(R * 0.18) / 2);

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  return mesh;
}

export interface ArchitecturalEntranceInstance {
  group: THREE.Group;
  foregroundStars: THREE.Group;
  exteriorFacade: THREE.Group;
  interiorColonnade: THREE.Group;
  sanctuaryAperture?: THREE.Mesh;
  corridorLights: THREE.PointLight[];
  updateParallax: (mouseX: number, mouseY: number, delta: number) => void;
  dispose: () => void;
}

/**
 * Constructs the CLEAN, MINIMALIST, MONUMENTAL ARCHITECTURAL ENTRANCE:
 * 1. Monolithic rectilinear graphite stone pylons and grand lintel
 * 2. Precision brushed silver perimeter inlays and sharp structural reveals
 * 3. Continuous obsidian floor with central silver runner line extending to vanishing point
 * 4. Minimalist rhythmic portal fins along the passage with recessed linear ceiling light channels
 * 5. Authentic floating 4-pointed silver stars framing the portal
 * 6. Clean, open passage leading into the illuminated sanctuary
 */
export function createArchitecturalEntrance(
  materials: ArchitecturalMaterials,
  isMobile = false
): ArchitecturalEntranceInstance {
  const group = new THREE.Group();
  group.name = "ArchitecturalEntrance";

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const corridorLights: THREE.PointLight[] = [];

  // SPATIAL GROUPS
  const foregroundStars = new THREE.Group();
  foregroundStars.name = "ForegroundStars";
  group.add(foregroundStars);

  const exteriorFacade = new THREE.Group();
  exteriorFacade.name = "ExteriorFacade";
  group.add(exteriorFacade);

  const interiorColonnade = new THREE.Group();
  interiorColonnade.name = "InteriorColonnade";
  group.add(interiorColonnade);

  // ==========================================
  // 1. FOREGROUND: AUTHENTIC 4-POINT SILVER STARS
  // Clean, floating, perfectly framed
  // ==========================================
  const starsList: THREE.Mesh[] = [];
  const starOffset = isMobile ? 2.5 : 3.5;
  const starScale = isMobile ? 0.8 : 1.0;

  // Left Primary Star
  const leftStar1 = createAuthenticGalaStarMesh(0.50 * starScale, materials.starMaterial);
  leftStar1.position.set(-starOffset, 0.45, 1.2);
  foregroundStars.add(leftStar1);
  starsList.push(leftStar1);
  geometriesToDispose.push(leftStar1.geometry);

  // Left Secondary Star
  const leftStar2 = createAuthenticGalaStarMesh(0.26 * starScale, materials.starMaterial);
  leftStar2.position.set(-starOffset - 0.55, 0.95, 1.0);
  foregroundStars.add(leftStar2);
  starsList.push(leftStar2);
  geometriesToDispose.push(leftStar2.geometry);

  // Right Primary Star
  const rightStar1 = createAuthenticGalaStarMesh(0.50 * starScale, materials.starMaterial);
  rightStar1.position.set(starOffset, 0.45, 1.2);
  foregroundStars.add(rightStar1);
  starsList.push(rightStar1);
  geometriesToDispose.push(rightStar1.geometry);

  // Right Secondary Star
  const rightStar2 = createAuthenticGalaStarMesh(0.26 * starScale, materials.starMaterial);
  rightStar2.position.set(starOffset + 0.55, 0.95, 1.0);
  foregroundStars.add(rightStar2);
  starsList.push(rightStar2);
  geometriesToDispose.push(rightStar2.geometry);

  // ==========================================
  // 2. MONUMENTAL MINIMALIST PORTAL FRAME (z = 0)
  // Pure, sculptural, monolithic architecture
  // Opening: width 5.4, height 4.4 (from y = -1.6 to y = 2.8)
  // ==========================================
  const pylonWidth = 2.4;
  const pylonHeight = 7.6;
  const pylonDepth = 2.0;
  const pylonX = 3.9; // Left at -3.9, Right at +3.9. Opening from -2.7 to +2.7 (width: 5.4)

  const pylonGeom = new THREE.BoxGeometry(pylonWidth, pylonHeight, pylonDepth);
  geometriesToDispose.push(pylonGeom);

  // Left Monolithic Pylon
  const leftPylon = new THREE.Mesh(pylonGeom, materials.stoneMaterial);
  leftPylon.position.set(-pylonX, 1.6, 0);
  leftPylon.castShadow = true;
  leftPylon.receiveShadow = true;
  exteriorFacade.add(leftPylon);

  // Right Monolithic Pylon
  const rightPylon = new THREE.Mesh(pylonGeom, materials.stoneMaterial);
  rightPylon.position.set(pylonX, 1.6, 0);
  rightPylon.castShadow = true;
  rightPylon.receiveShadow = true;
  exteriorFacade.add(rightPylon);

  // Monolithic Horizontal Lintel Beam (Spanning smoothly across the top)
  const lintelWidth = 10.2;
  const lintelHeight = 2.2;
  const lintelGeom = new THREE.BoxGeometry(lintelWidth, lintelHeight, pylonDepth);
  geometriesToDispose.push(lintelGeom);

  const lintel = new THREE.Mesh(lintelGeom, materials.stoneMaterial);
  lintel.position.set(0, 4.3, 0);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  exteriorFacade.add(lintel);

  // ==========================================
  // 3. PRECISION BRUSHED SILVER INNER REVEALS
  // Razor-sharp metallic edges catching raking light
  // ==========================================
  const trimThickness = 0.08;
  const innerRevealDepth = pylonDepth + 0.05;

  // Vertical Left Silver Trim
  const vTrimGeom = new THREE.BoxGeometry(trimThickness, 4.4, innerRevealDepth);
  geometriesToDispose.push(vTrimGeom);

  const leftTrim = new THREE.Mesh(vTrimGeom, materials.metalMaterial);
  leftTrim.position.set(-2.7 - trimThickness / 2, 0.6, 0);
  exteriorFacade.add(leftTrim);

  // Vertical Right Silver Trim
  const rightTrim = new THREE.Mesh(vTrimGeom, materials.metalMaterial);
  rightTrim.position.set(2.7 + trimThickness / 2, 0.6, 0);
  exteriorFacade.add(rightTrim);

  // Top Horizontal Silver Trim under Lintel
  const hTrimGeom = new THREE.BoxGeometry(5.4 + trimThickness * 2, trimThickness, innerRevealDepth);
  geometriesToDispose.push(hTrimGeom);

  const topTrim = new THREE.Mesh(hTrimGeom, materials.metalMaterial);
  topTrim.position.set(0, 2.8 + trimThickness / 2, 0);
  exteriorFacade.add(topTrim);

  // Minimalist Recessed Linear Light Slit under the lintel (#F0F4FA)
  const lightSlitGeom = new THREE.BoxGeometry(5.2, 0.02, 0.06);
  geometriesToDispose.push(lightSlitGeom);

  const lightSlit = new THREE.Mesh(lightSlitGeom, materials.lanternGlowMaterial);
  lightSlit.position.set(0, 2.76, 0.2);
  exteriorFacade.add(lightSlit);

  // Soft portal threshold down-light
  const portalDownLight = new THREE.PointLight(0xe4e7eb, 1.8, 8, 1.6);
  portalDownLight.position.set(0, 2.6, 0.2);
  exteriorFacade.add(portalDownLight);
  corridorLights.push(portalDownLight);

  // ==========================================
  // 4. CLEAN ARCHITECTURAL SIDE WINGS
  // Clean backdrop panels filling the screen edges
  // ==========================================
  const wingWidth = 14.0;
  const wingHeight = 8.5;
  const wingGeom = new THREE.BoxGeometry(wingWidth, wingHeight, 1.0);
  geometriesToDispose.push(wingGeom);

  const leftWing = new THREE.Mesh(wingGeom, materials.stoneMaterial);
  leftWing.position.set(-11.5, 1.8, -0.4);
  leftWing.receiveShadow = true;
  exteriorFacade.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, materials.stoneMaterial);
  rightWing.position.set(11.5, 1.8, -0.4);
  rightWing.receiveShadow = true;
  exteriorFacade.add(rightWing);

  // Sleek Brushed Silver Horizontal Accent Reveal across wings
  const wingRevealGeom = new THREE.BoxGeometry(wingWidth, 0.04, 1.04);
  geometriesToDispose.push(wingRevealGeom);

  const leftWingReveal = new THREE.Mesh(wingRevealGeom, materials.metalMaterial);
  leftWingReveal.position.set(-11.5, 2.8, -0.4);
  exteriorFacade.add(leftWingReveal);

  const rightWingReveal = new THREE.Mesh(wingRevealGeom, materials.metalMaterial);
  rightWingReveal.position.set(11.5, 2.8, -0.4);
  exteriorFacade.add(rightWingReveal);

  // ==========================================
  // 5. CONTINUOUS POLISHED OBSIDIAN FLOOR & CENTRAL RUNNER
  // Extends from z = +5.0 to z = -20.0
  // Floor surface at y = -1.6
  // ==========================================
  const floorDepth = 32.0;
  const floorWidth = 18.0;
  const floorGeom = new THREE.BoxGeometry(floorWidth, 0.3, floorDepth);
  geometriesToDispose.push(floorGeom);

  const floorMesh = new THREE.Mesh(floorGeom, materials.darkFloorMaterial);
  floorMesh.position.set(0, -1.75, -8.0);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Central Hairline Brushed Silver Inlay Runner
  const runnerGeom = new THREE.BoxGeometry(0.06, 0.015, floorDepth);
  geometriesToDispose.push(runnerGeom);

  const runnerMesh = new THREE.Mesh(runnerGeom, materials.metalMaterial);
  runnerMesh.position.set(0, -1.59, -8.0);
  group.add(runnerMesh);

  // ==========================================
  // 6. MINIMALIST RHYTHMIC PORTAL PASSAGE (z = -3.5 to -14.0)
  // Clean, sleek vertical blades and transverse beams
  // Passing smoothly around the camera during scroll
  // ==========================================
  const portalStations = [-3.5, -7.0, -10.5, -14.0];
  const finWidth = 0.35;
  const finHeight = 5.0;
  const finDepth = 0.45;

  const finGeom = new THREE.BoxGeometry(finWidth, finHeight, finDepth);
  geometriesToDispose.push(finGeom);

  const finTrimGeom = new THREE.BoxGeometry(0.04, finHeight, finDepth + 0.02);
  geometriesToDispose.push(finTrimGeom);

  const finBeamGeom = new THREE.BoxGeometry(5.85, 0.35, finDepth);
  geometriesToDispose.push(finBeamGeom);

  const finBeamTrimGeom = new THREE.BoxGeometry(5.85, 0.03, finDepth + 0.02);
  geometriesToDispose.push(finBeamTrimGeom);

  const ceilingSlitGeom = new THREE.BoxGeometry(5.0, 0.02, 0.05);
  geometriesToDispose.push(ceilingSlitGeom);

  portalStations.forEach((zPos) => {
    // Left vertical blade
    const finL = new THREE.Mesh(finGeom, materials.stoneMaterial);
    finL.position.set(-2.75, 0.8, zPos);
    finL.castShadow = true;
    finL.receiveShadow = true;
    interiorColonnade.add(finL);

    // Left silver inner edge
    const finTrimL = new THREE.Mesh(finTrimGeom, materials.metalMaterial);
    finTrimL.position.set(-2.55, 0.8, zPos);
    interiorColonnade.add(finTrimL);

    // Right vertical blade
    const finR = new THREE.Mesh(finGeom, materials.stoneMaterial);
    finR.position.set(2.75, 0.8, zPos);
    finR.castShadow = true;
    finR.receiveShadow = true;
    interiorColonnade.add(finR);

    // Right silver inner edge
    const finTrimR = new THREE.Mesh(finTrimGeom, materials.metalMaterial);
    finTrimR.position.set(2.55, 0.8, zPos);
    interiorColonnade.add(finTrimR);

    // Overhead transverse beam
    const beam = new THREE.Mesh(finBeamGeom, materials.stoneMaterial);
    beam.position.set(0, 3.1, zPos);
    interiorColonnade.add(beam);

    // Overhead silver beam trim
    const beamTrim = new THREE.Mesh(finBeamTrimGeom, materials.metalMaterial);
    beamTrim.position.set(0, 2.92, zPos);
    interiorColonnade.add(beamTrim);

    // Recessed linear light slit in ceiling
    const slit = new THREE.Mesh(ceilingSlitGeom, materials.lanternGlowMaterial);
    slit.position.set(0, 2.9, zPos);
    interiorColonnade.add(slit);

    // Dedicated soft silver corridor light
    const pLight = new THREE.PointLight(0xe4e7eb, 1.3, 11, 1.8);
    pLight.position.set(0, 1.8, zPos);
    interiorColonnade.add(pLight);
    corridorLights.push(pLight);
  });

  // Clean side corridor enclosure walls (x: ±3.0)
  const wallGeom = new THREE.BoxGeometry(0.3, 5.2, 14.0);
  geometriesToDispose.push(wallGeom);

  const leftWall = new THREE.Mesh(wallGeom, materials.stoneMaterial);
  leftWall.position.set(-3.05, 0.8, -8.5);
  leftWall.receiveShadow = true;
  interiorColonnade.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeom, materials.stoneMaterial);
  rightWall.position.set(3.05, 0.8, -8.5);
  rightWall.receiveShadow = true;
  interiorColonnade.add(rightWall);

  // Clean flat ceiling
  const ceilingGeom = new THREE.BoxGeometry(6.4, 0.3, 14.0);
  geometriesToDispose.push(ceilingGeom);

  const ceiling = new THREE.Mesh(ceilingGeom, materials.stoneMaterial);
  ceiling.position.set(0, 3.35, -8.5);
  interiorColonnade.add(ceiling);

  // ==========================================
  // 7. DISTANT SANCTUARY APERTURE (z = -14.2)
  // Radiant minimal portal framing the vanishing point
  // ==========================================
  const sanctFrameGeom = new THREE.BoxGeometry(5.4, 4.4, 0.15);
  geometriesToDispose.push(sanctFrameGeom);

  const sanctSilverFrame = new THREE.Mesh(sanctFrameGeom, materials.metalMaterial);
  sanctSilverFrame.position.set(0, 0.6, -14.2);
  interiorColonnade.add(sanctSilverFrame);

  // Distant silver sanctuary light shining forward
  const sanctuaryLight = new THREE.PointLight(0xe4e7eb, 3.0, 24, 1.4);
  sanctuaryLight.position.set(0, 1.6, -14.5);
  interiorColonnade.add(sanctuaryLight);
  corridorLights.push(sanctuaryLight);

  // ==========================================
  // LAYERED PARALLAX UPDATE METHOD
  // ==========================================
  let currentElapsed = 0;

  const updateParallax = (mouseX: number, mouseY: number, delta: number) => {
    currentElapsed += delta;

    // Foreground stars: responsive subtle parallax
    foregroundStars.position.x = mouseX * 0.12;
    foregroundStars.position.y = mouseY * 0.08;

    // Exterior Façade: slight grounded displacement
    exteriorFacade.position.x = mouseX * 0.04;
    exteriorFacade.position.y = mouseY * 0.02;

    // Interior Passage: counter-depth motion
    interiorColonnade.position.x = -mouseX * 0.02;
    interiorColonnade.position.y = -mouseY * 0.015;

    // Subtle star rotation & metallic sheen
    starsList.forEach((star, idx) => {
      star.rotation.z += delta * (0.06 + (idx % 2) * 0.02);
      star.rotation.y = Math.sin(currentElapsed * 0.45 + idx * 1.5) * 0.12;
    });
  };

  const dispose = () => {
    geometriesToDispose.forEach((g) => g.dispose());
  };

  return {
    group,
    foregroundStars,
    exteriorFacade,
    interiorColonnade,
    corridorLights,
    updateParallax,
    dispose,
  };
}
