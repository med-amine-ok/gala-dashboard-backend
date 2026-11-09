import * as THREE from "three";
import type { StageContext, StageHandle } from "../gala/Stage3D";
import { optimisedImage } from "../gala/Stage3D";
import { createLetter, PASS_ASPECT } from "../gala/Letter";
import * as T from "./hotelTextures";
import { columnSkin, farewell, inlayBand, lanternGlass, marbleFloor, piercedMetal, sealedCard, type FarewellWords, type SealedWords } from "./hotelDecor";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { REGISTRATION_OPENS } from "../../../lib/event";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

/*
 * The hotel after the portal, after the Hôtel El Djazaïr (formerly Saint
 * George, Algiers): one connected building the camera walks through as you
 * scroll. The reception (the manifesto engraved beside the arch) → the salon
 * of frames (every edition on the wall, an engraved plaque under each) → the
 * ballroom (the letter on its table; its pass comes to you) → the Salon des
 * Ambassadeurs (the club). Its reds and golds are the Gala's plum and silver.
 *
 * Built for the web: canvas textures, no real-time shadows, lamps as emissive
 * glows, instancing for repeated pieces, and the same scene on phones with a
 * wider lens and panels laid out for a narrow screen.
 */

export type FrameItem = {
  src?: string;
  eyebrow: string;
  title: string;
  story?: string;
  stats?: { value: string; label: string }[];
  yearCard?: string;
};

export type HotelWords = {
  manifesto: { label: string; headline: string; body?: string; quote?: string };
  invitation: {
    label: string;
    price: string;
    inclusions: string[];
    when?: string;
    /** While registration is closed: the letter stays sealed, a clock counts down */
    sealed?: SealedWords & { opensAt: number };
  };
  club: {
    label: string;
    lead?: string;
    headline?: string;
    stats: { value: string; label: string }[];
    pillars: { title: string; desc: string }[];
  };
  venue?: string;
  farewell: FarewellWords;
};

/** The layout and the timeline (scroll units) shared with the page */
export function hotelPlan(frameCount: number, sealed = false) {
  const FRAME_GAP = 4.6;
  const SALON_Z0 = -22;
  const firstFrameZ = SALON_Z0 - 4;
  const lastFrameZ = firstFrameZ - (frameCount - 1) * FRAME_GAP;
  const BALL_Z0 = lastFrameZ - 5;
  const BALL_LEN = 30;
  const TABLE_Z = BALL_Z0 - 21;
  const CLUB_Z0 = BALL_Z0 - BALL_LEN - 3;
  const CLUB_LEN = 16;

  const panelLeft = 1.7;
  const panelRight = 2.8;
  const receptionEnd = 3.6;
  const frameU = (i: number) => receptionEnd + 0.7 + i * 0.85;
  const salonEnd = frameU(frameCount - 1) + 0.5;
  const ballroomIn = salonEnd + 1.1;
  const letterStart = ballroomIn + 0.7;
  // Sealed (registration closed): you stand by the sealed letter and its clock;
  // the opening, the pass and its return take no time at all
  const letterEnd = letterStart + (sealed ? 0.6 : 2.2); // the letter has opened, the pass is out
  const passHeld = letterEnd + (sealed ? 0 : 0.8); // the pass has come to you
  const invitationEnd = passHeld + (sealed ? 0.8 : 0.9);
  const passBack = invitationEnd + (sealed ? 0 : 0.7); // the pass has gone back into its envelope
  const letterClosed = passBack + (sealed ? 0 : 0.6); // and the envelope has closed
  const clubIn = letterClosed + 1.3;
  const clubLeft = clubIn + 0.9;
  const clubRight = clubLeft + 1.0;
  const farewell = clubRight + 1.4; // turned to the farewell wall
  const total = farewell + 0.6;
  return {
    FRAME_GAP,
    SALON_Z0,
    firstFrameZ,
    lastFrameZ,
    BALL_Z0,
    BALL_LEN,
    TABLE_Z,
    CLUB_Z0,
    CLUB_LEN,
    panelLeft,
    panelRight,
    receptionEnd,
    frameU,
    salonEnd,
    ballroomIn,
    letterStart,
    letterEnd,
    passHeld,
    invitationEnd,
    passBack,
    letterClosed,
    clubIn,
    clubLeft,
    clubRight,
    farewell,
    total,
  };
}

type Key = { u: number; pos: THREE.Vector3; look: THREE.Vector3 };
type Arch = { x: number; w: number; h: number };

/* ─── Architecture helpers ─────────────────────────────────────────────── */

function horseshoe(path: THREE.Path | THREE.Shape, cx: number, w: number, h: number) {
  const r = w * 0.56;
  const cy = h - r;
  const dy = Math.sqrt(r * r - (w / 2) * (w / 2));
  const alpha = Math.asin(dy / r);
  path.moveTo(cx - w / 2, 0);
  path.lineTo(cx - w / 2, cy - dy);
  path.absarc(cx, cy, r, Math.PI + alpha, -alpha, true);
  path.lineTo(cx + w / 2, 0);
}

/** A wall (its own XY plane, extruded toward +Z) with horseshoe-arch openings */
function arcadeWall(length: number, height: number, arches: Arch[], depth = 0.45) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.lineTo(length, 0);
  sh.lineTo(length, height);
  sh.lineTo(0, height);
  sh.closePath();
  for (const a of arches) {
    const hole = new THREE.Path();
    horseshoe(hole, a.x, a.w, a.h);
    hole.closePath();
    sh.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 18 });
}

/** The moulded trim around an arch: a band following the opening to the floor */
function archTrim(a: Arch, band = 0.16) {
  const outer = new THREE.Shape();
  horseshoe(outer, a.x, a.w + band * 2, a.h + band);
  outer.closePath();
  const inner = new THREE.Path();
  horseshoe(inner, a.x, a.w, a.h);
  inner.closePath();
  outer.holes.push(inner);
  return new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false, curveSegments: 18 });
}

/** The stretches of a wall not taken by its arches */
function solidSpans(length: number, arches: Arch[], margin = 0.2) {
  const spans: [number, number][] = [];
  let at = 0;
  for (const a of [...arches].sort((p, q) => p.x - q.x)) {
    const from = a.x - a.w / 2 - margin;
    if (from > at + 0.05) spans.push([at, from]);
    at = a.x + a.w / 2 + margin;
  }
  if (length > at + 0.05) spans.push([at, length]);
  return spans;
}

function plane(w: number, h: number, mat: THREE.Material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/* ─── The scene ────────────────────────────────────────────────────────── */

export function buildHotel(
  ctx: StageContext,
  frames: FrameItem[],
  words: HotelWords,
  progress: { current: number },
): StageHandle & { letterSettled: () => boolean } {
  const { scene, camera, renderer, isMobile } = ctx;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
  renderer.toneMappingExposure = 1.05;
  scene.environmentIntensity = 0.45;
  const sealed = words.invitation.sealed;
  const plan = hotelPlan(frames.length, !!sealed);
  const { SALON_Z0, firstFrameZ, lastFrameZ, BALL_Z0, BALL_LEN, TABLE_Z, CLUB_Z0, CLUB_LEN, FRAME_GAP } = plan;

  // A warm dusk in the far rooms instead of a black void
  // Evening in the hotel: warm darkness, the far rooms fading into it
  scene.background = new THREE.Color(0x120609);
  scene.fog = new THREE.Fog(0x120609, 16, 52);

  // Materials ------------------------------------------------------------------
  const stuccoMat = new THREE.MeshLambertMaterial({ map: T.stucco([0.5, 0.5]), color: 0xd2c6ba });
  const zelligeTex = T.zellige([1, 1]);
  const friezeTex = T.frieze([1, 1]);
  // Polished marble, as in the hotel: real veining slab by slab, recessed
  // joints, inlaid stars, and a clear polish that mirrors the room's lights
  const floor = marbleFloor(isMobile ? 768 : 1024);
  const marbleMat: THREE.MeshStandardMaterial = isMobile
    ? new THREE.MeshStandardMaterial({
        map: floor.map,
        normalMap: floor.normalMap,
        roughnessMap: floor.roughnessMap,
        roughness: 1,
        metalness: 0,
        envMapIntensity: 2.2,
      })
    : new THREE.MeshPhysicalMaterial({
        map: floor.map,
        normalMap: floor.normalMap,
        roughnessMap: floor.roughnessMap,
        roughness: 1,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 2.2,
        // A true reflection lies just beneath (desktop): the polish lets it through
        transparent: true,
        opacity: 0.84,
      });
  const MARBLE_MODULE = 2.4;
  const bandTex = inlayBand();
  const carpetMat = new THREE.MeshLambertMaterial({ map: T.carpet([1, 1]) });
  const cedarMat = new THREE.MeshLambertMaterial({ map: T.cedar([1, 1]) });
  const drapeMat = new THREE.MeshLambertMaterial({ map: T.drape([1, 1]) });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: 0.25 });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xf2e9dc });
  const columnMat = new THREE.MeshLambertMaterial({ color: 0xf2ebe2 });
  // Polished silver that still reads in a dim room (urns, lanterns)
  const brightSilverMat = new THREE.MeshStandardMaterial({ color: 0xeef0f4, metalness: 0.45, roughness: 0.32 });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x3b1a14 });
  const glowTex = T.glow();
  const coveMat = new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false, fog: false });
  const washMat = new THREE.MeshBasicMaterial({
    map: (() => {
      const c = document.createElement("canvas");
      c.width = 4;
      c.height = 256;
      const g = c.getContext("2d")!;
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, "rgba(255,210,160,0.5)");
      grad.addColorStop(0.25, "rgba(255,190,130,0.22)");
      grad.addColorStop(1, "rgba(255,180,120,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const repeated = (t: THREE.Texture, rx: number, ry: number) => {
    const c = t.clone();
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    return c;
  };

  /** Lights set into the ceilings, on a grid (filled by room()) */
  const ceilSpots: THREE.Vector3[] = [];

  /** Floor and ceiling for a rectangular room */
  const room = (
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    h: number,
    floorMat: THREE.MeshLambertMaterial | THREE.MeshStandardMaterial,
    rep: number,
  ) => {
    const w = x1 - x0;
    const d = z0 - z1;
    const fm = floorMat.clone();
    fm.map = repeated(floorMat.map!, w / rep, d / rep);
    if (floorMat === marbleMat) {
      const m = fm as THREE.MeshStandardMaterial;
      m.normalMap = repeated(marbleMat.normalMap!, w / rep, d / rep);
      m.roughnessMap = repeated(marbleMat.roughnessMap!, w / rep, d / rep);
      // The inlaid border running near both long walls
      if (w >= 8) {
        const len = d - 1.6;
        const bm = new THREE.MeshStandardMaterial({ map: repeated(bandTex, len / MARBLE_MODULE, 1), roughness: 0.14, metalness: 0, envMapIntensity: 1.4 });
        for (const bx of [x0 + 1.05, x1 - 1.05]) {
          const band = plane(len, 0.34, bm);
          band.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
          band.position.set(bx, 0.004, (z0 + z1) / 2);
          scene.add(band);
        }
      }
    }
    const floor = plane(w, d, fm);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    scene.add(floor);
    const cm = cedarMat.clone();
    cm.map = repeated(cedarMat.map!, w / 3, d / 3);
    const ceil = plane(w, d, cm);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set((x0 + x1) / 2, h, (z0 + z1) / 2);
    scene.add(ceil);
    // Downlights in the cedar, every ~2.6 m, kept off the walls
    const nx = Math.max(1, Math.round((w - 2) / 2.6));
    const nz = Math.max(1, Math.round((d - 1) / 2.6));
    for (let i = 0; i < nx; i++)
      for (let k = 0; k < nz; k++)
        ceilSpots.push(new THREE.Vector3(x0 + 1 + ((i + 0.5) * (w - 2)) / nx, h - 0.01, z0 - 0.5 - ((k + 0.5) * (d - 1)) / nz));
  };

  /**
   * Dress one face of a wall: zellige dado between the openings, a silver
   * molding over it, the carved frieze under the ceiling, and a moulded trim
   * around every arch. `place` maps a distance along the wall to the world;
   * `rotY` turns a plane to face into the room.
   */
  const dress = (len: number, h: number, arches: Arch[], place: (along: number) => THREE.Vector3, rotY: number) => {
    for (const [a0, a1] of solidSpans(len, arches)) {
      const w = a1 - a0;
      const zm = new THREE.MeshStandardMaterial({ map: repeated(zelligeTex, w / 1.1, 1), roughness: 0.25 });
      const dado = plane(w, 1.1, zm);
      dado.position.copy(place((a0 + a1) / 2)).setY(0.55);
      dado.rotation.y = rotY;
      scene.add(dado);
      const mold = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.07), silverMat);
      mold.position.copy(place((a0 + a1) / 2)).setY(1.13);
      mold.rotation.y = rotY;
      scene.add(mold);
    }
    // The cove: a warm line of light under the ceiling and its wash down the wall
    const cove = plane(len, 0.05, coveMat);
    cove.position.copy(place(len / 2)).setY(h - 0.12);
    cove.rotation.y = rotY;
    scene.add(cove);
    const wash = plane(len, 2.4, washMat);
    wash.position.copy(place(len / 2)).add(new THREE.Vector3(Math.sin(rotY) * 0.01, 0, Math.cos(rotY) * 0.01)).setY(h - 1.3);
    wash.rotation.y = rotY;
    scene.add(wash);
    const fm = new THREE.MeshLambertMaterial({ map: repeated(friezeTex, len / 2.8, 1) });
    const fr = plane(len, 0.7, fm);
    fr.position.copy(place(len / 2)).setY(h - 0.65);
    fr.rotation.y = rotY;
    scene.add(fr);
    for (const a of arches) {
      const trim = new THREE.Mesh(archTrim({ x: 0, w: a.w, h: a.h }), trimMat);
      trim.position.copy(place(a.x)).setY(0);
      trim.rotation.y = rotY;
      scene.add(trim);
    }
  };

  /** A side wall along z (from z0 toward z1) at x, its arches backed by drapery */
  const sideWall = (x: number, z0: number, z1: number, h: number, arches: Arch[]) => {
    const len = z0 - z1;
    const wall = new THREE.Mesh(arcadeWall(len, h, arches), stuccoMat);
    wall.rotation.y = Math.PI / 2;
    wall.position.set(x - 0.225, 0, z0);
    scene.add(wall);
    const inward = x < 0 ? 1 : -1;
    const face = x + inward * 0.235;
    dress(len, h, arches, (along) => new THREE.Vector3(face, 0, z0 - along), inward * (Math.PI / 2));
    for (const a of arches) {
      const d = plane(a.w + 0.4, a.h, drapeMat);
      d.rotation.y = inward * (Math.PI / 2);
      d.position.set(x - inward * 0.6, a.h / 2, z0 - a.x);
      scene.add(d);
    }
  };

  /** An end wall across x at z (dressed on the face you walk toward) */
  const endWall = (x0: number, x1: number, z: number, h: number, arch?: { w: number; h: number }) => {
    const len = x1 - x0;
    const arches = arch ? [{ x: len / 2, ...arch }] : [];
    const wall = new THREE.Mesh(arcadeWall(len, h, arches), stuccoMat);
    wall.position.set(x0, 0, z - 0.225);
    scene.add(wall);
    dress(len, h, arches, (along) => new THREE.Vector3(x0 + along, 0, z + 0.235), 0);
  };

  // Repeated pieces, instanced -------------------------------------------------
  const columnSpots: { x: number; z: number; h: number }[] = [];
  const lanternSpots: THREE.Vector3[] = [];
  /** Silver urns of flowers standing on the floor */
  const urnSpots: THREE.Vector3[] = [];
  const glows: THREE.Sprite[] = [];
  const addGlow = (p: THREE.Vector3, size: number, opacity: number) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, color: 0xffe2c8, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    s.position.copy(p);
    s.scale.setScalar(size);
    s.userData.base = opacity;
    scene.add(s);
    glows.push(s);
  };
  const arches = (len: number, count: number, w: number, h: number): Arch[] =>
    Array.from({ length: count }, (_, i) => ({ x: (len / count) * (i + 0.5), w, h }));

  /**
   * A banner of words, as hung at the entrance: silver satin draped from a
   * silver rail (ball finials, wall brackets, clasps), a pointed hem below.
   * `w` × `h` is the cloth's body, centred on `at`; the point hangs below it.
   */
  const bannerMat = (tex: THREE.Texture) =>
    new THREE.MeshStandardMaterial({
      map: tex,
      // Lit from within a little, so it reads in the evening rooms
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: 0.38,
      roughness: 0.5,
      metalness: 0.25,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });
  const bannerPanel = (tex: THREE.Texture, w: number, h: number, at: THREE.Vector3, rotY: number) => {
    const g = new THREE.Group();
    g.position.copy(at);
    g.rotation.y = rotY;
    const total = h * (1 + T.BANNER_TIP);
    const geo = new THREE.PlaneGeometry(w, total, 24, 30);
    // Drape: a gentle sag and soft vertical pleats
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / w + 0.5;
      const v = pos.getY(i) / total + 0.5;
      const z =
        Math.sin(v * Math.PI) * 0.03 +
        Math.sin(u * Math.PI * 6) * 0.014 * Math.sin(v * Math.PI * 0.9 + 0.1) +
        Math.cos(u * Math.PI * 2) * 0.008 * (1 - v * 0.4);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    const cloth = new THREE.Mesh(geo, bannerMat(tex));
    // The body's top sits at h/2 above the centre; the point hangs below
    cloth.position.set(0, h / 2 - total / 2, 0.06);
    g.add(cloth);
    // The rail, its finials, brackets and clasps
    const railY = h / 2 + 0.04;
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, w + 0.3, 16), brightSilverMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, railY, 0.08);
    g.add(rail);
    for (const x of [-(w + 0.3) / 2, (w + 0.3) / 2]) {
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), brightSilverMat);
      fin.position.set(x, railY, 0.08);
      g.add(fin);
    }
    for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 10), brightSilverMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(x, railY, 0.03);
      g.add(arm);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), brightSilverMat);
      plate.rotation.x = Math.PI / 2;
      plate.position.set(x, railY, -0.015);
      g.add(plate);
    }
    const clips = Math.max(6, Math.round(w * 2.2));
    for (let k = 0; k < clips; k++) {
      const clip = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.05, 8), brightSilverMat);
      clip.position.set(-w / 2 + 0.12 + (k / (clips - 1)) * (w - 0.24), h / 2 + 0.015, 0.075);
      g.add(clip);
    }
    // A soft shadow on the wall behind the cloth
    const shadow = plane(w * 1.08, total * 1.04, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.45, depthWrite: false }));
    shadow.position.set(0.0, h / 2 - total / 2 - 0.05, 0.012);
    g.add(shadow);
    scene.add(g);
    return g;
  };
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d")!;
    const grad = x.createRadialGradient(64, 64, 20, 64, 64, 64);
    grad.addColorStop(0, "rgba(10,2,6,0.8)");
    grad.addColorStop(1, "rgba(10,2,6,0)");
    x.fillStyle = grad;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  // Panels are laid out for the screen: wide on desktop, tall on phones
  const PANEL = isMobile ? { w: 3.0, h: 3.6, cw: 1200, ch: 1440 } : { w: 4.2, h: 2.6, cw: 1600, ch: 990 };

  /* 1. RECEPTION (z 0 → -22) ------------------------------------------------- */
  const RW = 7;
  const RH = 7;
  room(-RW, RW, 0, SALON_Z0, RH, marbleMat, MARBLE_MODULE);
  const recArches = arches(22, 4, 2.6, 4.6);
  sideWall(-RW, 0, SALON_Z0, RH, recArches);
  sideWall(RW, 0, SALON_Z0, RH, recArches);
  for (const a of recArches) {
    for (const x of [-RW + 0.5, RW - 0.5]) {
      columnSpots.push({ x, z: -a.x - 1.55, h: 3.2 });
      columnSpots.push({ x, z: -a.x + 1.55, h: 3.2 });
    }
  }
  endWall(-RW, RW, SALON_Z0, RH, { w: 3.2, h: 5 });
  const runnerMat = carpetMat.clone();
  runnerMat.map = repeated(carpetMat.map!, 1, 14 / 4.8);
  const runner = plane(2.4, 14, runnerMat);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.01, -7);
  scene.add(runner);
  // The reception desk: cedar, a zellige front, a silver top
  const desk = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.05, 0.9), woodMat);
  body.position.y = 0.525;
  const front = plane(3.8, 0.8, new THREE.MeshStandardMaterial({ map: repeated(zelligeTex, 3.8 / 0.8, 1), roughness: 0.25 }));
  front.position.set(0, 0.55, 0.455);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.06, 1.0), silverMat);
  deskTop.position.y = 1.08;
  desk.add(body, front, deskTop);
  desk.position.set(0, 0, -14);
  scene.add(desk);
  // The Gala's mark above the arch
  const logo = plane(2.6, 2.6 * (215 / 631), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, opacity: 0 }));
  logo.position.set(0, 5.55, SALON_Z0 + 0.3);
  scene.add(logo);
  ctx.texture("/GALA-silver.png").then((t) => {
    const mm = logo.material as THREE.MeshBasicMaterial;
    mm.map = t;
    mm.opacity = 1;
    mm.needsUpdate = true;
  });
  // The manifesto, engraved on two panels either side of the arch
  const m = words.manifesto;
  const PANEL_X = 4.3;
  const PANEL_Y = isMobile ? 3.2 : 3.0;
  bannerPanel(
    T.panel(
      [
        { kind: "eyebrow", text: `II · ${m.label}` },
        { kind: "space", h: 20 },
        { kind: "title", text: m.headline, size: 104 },
      ],
      PANEL.cw,
      PANEL.ch,
      "center",
      "banner",
    ),
    PANEL.w,
    PANEL.h,
    new THREE.Vector3(-PANEL_X, PANEL_Y, SALON_Z0 + 0.3),
    0,
  );
  bannerPanel(
    T.panel(
      [
        ...(m.body ? [{ kind: "body" as const, text: m.body, size: isMobile ? 50 : 42 }] : []),
        { kind: "rule" },
        ...(m.quote ? [{ kind: "quote" as const, text: m.quote }] : []),
      ],
      PANEL.cw,
      PANEL.ch,
      "center",
      "banner",
    ),
    PANEL.w,
    PANEL.h,
    new THREE.Vector3(PANEL_X, PANEL_Y, SALON_Z0 + 0.3),
    0,
  );
  lanternSpots.push(
    new THREE.Vector3(-4.5, 5.2, -5),
    new THREE.Vector3(4.5, 5.2, -5),
    new THREE.Vector3(-4.5, 5.2, -12),
    new THREE.Vector3(4.5, 5.2, -12),
  );
  chandelier(new THREE.Vector3(0, 5.2, -8));
  urnSpots.push(
    new THREE.Vector3(-2.6, 0, -14),
    new THREE.Vector3(2.6, 0, -14),
    new THREE.Vector3(-2.1, 0, SALON_Z0 + 0.8),
    new THREE.Vector3(2.1, 0, SALON_Z0 + 0.8),
  );

  /* 2. THE SALON OF FRAMES ------------------------------------------------------ */
  const SW = 3;
  const SH = 5;
  const salonEndZ = lastFrameZ - 3;
  room(-SW, SW, SALON_Z0, salonEndZ, SH, marbleMat, MARBLE_MODULE);
  sideWall(-SW, SALON_Z0, salonEndZ, SH, []);
  const winCount = Math.max(2, Math.round((SALON_Z0 - salonEndZ) / FRAME_GAP));
  sideWall(SW, SALON_Z0, salonEndZ, SH, arches(SALON_Z0 - salonEndZ, winCount, 1.6, 3.4));
  const srMat = carpetMat.clone();
  srMat.map = repeated(carpetMat.map!, 1, (SALON_Z0 - salonEndZ) / 3.2);
  const salonRunner = plane(1.6, SALON_Z0 - salonEndZ, srMat);
  salonRunner.rotation.x = -Math.PI / 2;
  salonRunner.position.set(0.6, 0.01, (SALON_Z0 + salonEndZ) / 2);
  scene.add(salonRunner);

  const FW = isMobile ? 1.35 : 1.5;
  const FH = FW / 1.5;
  const FY = 2.5;
  const frameZ = (i: number) => firstFrameZ - i * FRAME_GAP;
  frames.forEach((f, i) => {
    const z = frameZ(i);
    const g = new THREE.Group();
    g.position.set(-SW + 0.26, FY, z);
    g.rotation.y = Math.PI / 2;
    const mount = plane(FW + 0.22, FH + 0.22, new THREE.MeshLambertMaterial({ color: 0x1a0410 }));
    mount.position.z = 0.02;
    const photo = new THREE.MeshBasicMaterial({ color: 0x1a0410, toneMapped: false });
    const pic = plane(FW, FH, photo);
    pic.position.z = 0.03;
    g.add(mount, pic);
    const bar = 0.07;
    const fw = FW + 0.22;
    const fh = FH + 0.22;
    for (const [w, h, px, py] of [
      [fw + bar * 2, bar, 0, fh / 2 + bar / 2],
      [fw + bar * 2, bar, 0, -fh / 2 - bar / 2],
      [bar, fh, fw / 2 + bar / 2, 0],
      [bar, fh, -fw / 2 - bar / 2, 0],
    ] as const) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), silverMat);
      b.position.set(px, py, 0.04);
      g.add(b);
    }
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.12), silverMat);
    lamp.position.set(0, fh / 2 + 0.28, 0.14);
    g.add(lamp);
    const pool = plane(
      fw * 1.7,
      fh * 1.6,
      new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffd9b8, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    pool.position.set(0, 0.15, 0.005);
    g.add(pool);
    const PW = 1.5;
    const pl = plane(PW, PW * (640 / 1200), new THREE.MeshBasicMaterial({ map: T.plaque(f), toneMapped: false }));
    pl.position.set(0, -FH / 2 - 0.62, 0.03);
    g.add(pl);
    scene.add(g);
    const load = f.src ? ctx.texture(optimisedImage(f.src, isMobile ? 1080 : 1200)) : Promise.resolve(yearCard(f.yearCard || f.eyebrow));
    load.then((t) => {
      const img = t.image as { width: number; height: number };
      const ia = img.width / img.height;
      const fa = FW / FH;
      if (ia > fa) {
        t.repeat.set(fa / ia, 1);
        t.offset.set((1 - fa / ia) / 2, 0);
      } else {
        t.repeat.set(1, ia / fa);
        t.offset.set(0, (1 - ia / fa) / 2);
      }
      photo.map = t;
      photo.color.set(0xffffff);
      photo.needsUpdate = true;
    });
    if (i % 2 === 0) lanternSpots.push(new THREE.Vector3(0.6, 4.0, z - FRAME_GAP / 2));
  });
  endWall(-SW, SW, salonEndZ, SH, { w: 2.6, h: 3.8 });

  /* 3. THE BALLROOM -------------------------------------------------------------- */
  const BW = 8;
  const BH = 8;
  const ballEnd = BALL_Z0 - BALL_LEN;
  room(-SW, SW, salonEndZ, BALL_Z0, SH, marbleMat, MARBLE_MODULE);
  sideWall(-SW, salonEndZ, BALL_Z0, SH, []);
  sideWall(SW, salonEndZ, BALL_Z0, SH, []);
  room(-BW, BW, BALL_Z0, ballEnd, BH, carpetMat, 4);
  const ballArches = arches(BALL_LEN, 6, 3, 5.2);
  sideWall(-BW, BALL_Z0, ballEnd, BH, ballArches);
  sideWall(BW, BALL_Z0, ballEnd, BH, ballArches);
  for (const a of ballArches) {
    for (const x of [-BW + 0.5, BW - 0.5]) columnSpots.push({ x, z: BALL_Z0 - a.x - 1.75, h: 3.6 });
  }
  endWall(-BW, BW, BALL_Z0, BH, { w: 2.6, h: 3.8 });
  endWall(-BW, BW, ballEnd, BH, { w: 2.8, h: 4.2 });
  const chandeliers = [BALL_Z0 - 7, BALL_Z0 - 15, BALL_Z0 - 23].map((z) => chandelier(new THREE.Vector3(0, 6.1, z)));
  // The table, its cloth, a velvet mat ringed in silver, and the letter
  const TABLE_H = 0.78;
  const table = new THREE.Group();
  const cloth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.25, TABLE_H, 48, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xf1ebe2, side: THREE.DoubleSide }),
  );
  cloth.position.y = TABLE_H / 2;
  const topCloth = new THREE.Mesh(new THREE.CircleGeometry(1.15, 48), new THREE.MeshLambertMaterial({ color: 0xf6f1ea }));
  topCloth.rotation.x = -Math.PI / 2;
  topCloth.position.y = TABLE_H;
  const velvet = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshLambertMaterial({ color: 0x3a0828 }));
  velvet.rotation.x = -Math.PI / 2;
  velvet.position.y = TABLE_H + 0.004;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.012, 8, 64), silverMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = TABLE_H + 0.01;
  table.add(cloth, topCloth, velvet, rim);
  table.position.set(0, 0, TABLE_Z);
  scene.add(table);
  const letter = createLetter({ texture: ctx.texture, venue: words.venue });
  const LETTER_SCALE = 0.13;
  const letterHolder = new THREE.Group();
  letterHolder.scale.setScalar(LETTER_SCALE);
  letterHolder.position.set(0, TABLE_H + 0.03, TABLE_Z);
  letterHolder.add(letter.root);
  scene.add(letterHolder);
  // The invitation's terms, on a place card standing behind the letter
  const inv = words.invitation;
  const clock = sealed ? sealedCard(sealed, sealed.opensAt) : null;
  let clockSecond = -1;
  if (sealed) {
    // A soft light breathing on the wax seal
    addGlow(new THREE.Vector3(0, TABLE_H + 0.06, TABLE_Z + 0.02), 0.7, 0.35);
  }
  const card = plane(
    sealed ? 0.74 : 0.64,
    sealed ? 0.5 : 0.43,
    new THREE.MeshBasicMaterial({
      map: clock ? clock.texture : T.panel(
        [
          { kind: "eyebrow", text: inv.label },
          { kind: "title", text: inv.price, size: 120 },
          { kind: "rule" },
          { kind: "list", items: inv.inclusions.slice(0, 4) },
          ...(inv.when ? [{ kind: "quote" as const, text: inv.when }] : []),
        ],
        1600,
        1080,
      ),
      toneMapped: false,
    }),
  );
  card.position.set(0, TABLE_H + (sealed ? 0.2 : 0.17), TABLE_Z - 0.47);
  card.rotation.x = -0.54;
  scene.add(card);

  // The pass that comes to you: the same card, drawn true to its colours
  const TW = 4.3;
  const TH = TW / PASS_ASPECT;
  const passFront = new THREE.MeshBasicMaterial({ color: 0xf1ebe6, toneMapped: false });
  const passBack = new THREE.MeshBasicMaterial({ color: 0xf1ebe6, toneMapped: false });
  const passEdge = new THREE.MeshBasicMaterial({ color: 0xd6dbe2, toneMapped: false });
  const heroPass = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, 0.02), [passEdge, passEdge, passEdge, passEdge, passFront, passBack]);
  heroPass.visible = false;
  scene.add(heroPass);
  ctx.texture("/tickets-01.svg").then((t) => {
    t.anisotropy = 16;
    passFront.map = t;
    passFront.color.set(0xffffff);
    passFront.needsUpdate = true;
  });
  ctx.texture("/back-ticket.jpg").then((t) => {
    t.anisotropy = 16;
    passBack.map = t;
    passBack.color.set(0xffffff);
    passBack.needsUpdate = true;
  });

  /* 4. THE SALON DES AMBASSADEURS (the club) --------------------------------------- */
  const CW = 6;
  const CH = 6.5;
  const clubEnd = CLUB_Z0 - CLUB_LEN;
  room(-SW, SW, ballEnd, CLUB_Z0, SH, marbleMat, MARBLE_MODULE);
  sideWall(-SW, ballEnd, CLUB_Z0, SH, []);
  sideWall(SW, ballEnd, CLUB_Z0, SH, []);
  room(-CW, CW, CLUB_Z0, clubEnd, CH, marbleMat, MARBLE_MODULE);
  sideWall(-CW, CLUB_Z0, clubEnd, CH, []);
  sideWall(CW, CLUB_Z0, clubEnd, CH, []);
  endWall(-CW, CW, CLUB_Z0, CH, { w: 2.8, h: 4.2 });
  endWall(-CW, CW, clubEnd, CH);
  const crMat = carpetMat.clone();
  crMat.map = repeated(carpetMat.map!, 1, CLUB_LEN / 4.8);
  const clubRunner = plane(2.4, CLUB_LEN, crMat);
  clubRunner.rotation.x = -Math.PI / 2;
  clubRunner.position.set(0, 0.01, CLUB_Z0 - CLUB_LEN / 2);
  scene.add(clubRunner);
  chandelier(new THREE.Vector3(0, 5.0, CLUB_Z0 - CLUB_LEN / 2));
  const clubMid = CLUB_Z0 - CLUB_LEN / 2 - 1;
  // The statement banner's body centre; the view below is aimed at the whole cloth
  const CLUB_BANNER_Y = 3.0;
  const c = words.club;
  // The club's belief, on the far wall
  bannerPanel(
    T.panel(
      [
        { kind: "eyebrow", text: `VI · ${c.label}` },
        ...(c.lead ? [{ kind: "quote" as const, text: c.lead.replace(/\n/g, " ") }] : []),
        { kind: "rule" },
        ...(c.stats.length ? [{ kind: "stats" as const, items: c.stats }] : []),
      ],
      PANEL.cw,
      PANEL.ch,
      "center",
      "banner",
    ),
    PANEL.w,
    PANEL.h,
    new THREE.Vector3(0, CLUB_BANNER_Y, clubEnd + 0.3),
    0,
  );
  // Its principles on the left wall
  bannerPanel(
    T.panel(
      [
        { kind: "eyebrow", text: c.headline || "The story behind the night" },
        { kind: "space", h: 10 },
        ...c.pillars.slice(0, 3).flatMap((p, i) => [
          { kind: "title" as const, text: `${String(i + 1).padStart(2, "0")} · ${p.title}`, size: isMobile ? 66 : 62 },
          { kind: "body" as const, text: p.desc, size: isMobile ? 42 : 38 },
        ]),
      ],
      PANEL.cw,
      PANEL.ch,
      "left",
      "banner",
    ),
    PANEL.w,
    PANEL.h,
    new THREE.Vector3(-CW + 0.3, 2.9, clubMid),
    Math.PI / 2,
  );
  lanternSpots.push(new THREE.Vector3(-3.5, 5.0, CLUB_Z0 - 4), new THREE.Vector3(3.5, 5.0, CLUB_Z0 - 4));
  // The farewell: the page's last words, under a draped arch on the right wall
  const FW_ = isMobile ? { w: 2.8, h: 4.2, y: 2.95, arch: 4.4 } : { w: 4.8, h: 3.0, y: 2.6, arch: 5.6 };
  const fwArch = { x: 0, w: FW_.arch, h: 5.4 };
  const fwDrape = new THREE.Mesh(
    (() => {
      const sh = new THREE.Shape();
      horseshoe(sh, 0, fwArch.w, fwArch.h);
      sh.closePath();
      return new THREE.ShapeGeometry(sh, 18);
    })(),
    drapeMat,
  );
  fwDrape.position.set(CW - 0.25, 0, clubMid);
  fwDrape.rotation.y = -Math.PI / 2;
  scene.add(fwDrape);
  const fwTrim = new THREE.Mesh(archTrim(fwArch, 0.22), trimMat);
  fwTrim.position.set(CW - 0.24, 0, clubMid);
  fwTrim.rotation.y = -Math.PI / 2;
  scene.add(fwTrim);
  const farewellBoard = farewell(words.farewell, isMobile, "banner");
  const countdown = () => {
    const ms = REGISTRATION_OPENS.getTime() - Date.now();
    return ms <= 0 ? null : { d: Math.floor(ms / 86_400_000), h: Math.floor(ms / 3_600_000) % 24, m: Math.floor(ms / 60_000) % 60 };
  };
  farewellBoard.draw(countdown());
  const fwPanel = bannerPanel(farewellBoard.texture, FW_.w, FW_.h, new THREE.Vector3(CW - 0.32, FW_.y, clubMid), -Math.PI / 2);
  const fwFace = fwPanel.children[0] as THREE.Mesh;
  lanternSpots.push(new THREE.Vector3(CW - 0.9, 4.3, clubMid - fwArch.w / 2 - 0.9), new THREE.Vector3(CW - 0.9, 4.3, clubMid + fwArch.w / 2 + 0.9));
  urnSpots.push(
    new THREE.Vector3(CW - 0.7, 0, clubMid - fwArch.w / 2 - 0.55),
    new THREE.Vector3(CW - 0.7, 0, clubMid + fwArch.w / 2 + 0.55),
  );

  /* Instanced columns, lanterns and flowers --------------------------------------- */
  const m4 = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const v1 = new THREE.Vector3(1, 1, 1);
  const BLOOMS = [0xb5577f, 0x7a1a52, 0xf6efe6, 0xd48aa6, 0x9c2f6b, 0xf2d6df].map((c) => new THREE.Color(c));
  const LEAF = new THREE.Color(0x5d7a52);
  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  // Columns: a carved base, a fluted shaft with its flowering vine, a carved
  // capital under a square abacus, a silver ring at the neck and a garland
  const colSkin = new THREE.MeshLambertMaterial({ map: columnSkin() });
  const shafts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.18, 1, 20, 1, true), colSkin, columnSpots.length);
  const capGeo = mergeGeometries([
    new THREE.LatheGeometry(
      [
        [0.16, 0],
        [0.19, 0.05],
        [0.23, 0.13],
        [0.28, 0.22],
        [0.31, 0.29],
        [0.31, 0.32],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      20,
    ),
    new THREE.BoxGeometry(0.74, 0.1, 0.74).translate(0, 0.37, 0),
  ]);
  const baseGeo = mergeGeometries([
    new THREE.BoxGeometry(0.6, 0.12, 0.6).translate(0, 0.06, 0),
    new THREE.LatheGeometry(
      [
        [0.28, 0.12],
        [0.28, 0.17],
        [0.24, 0.21],
        [0.21, 0.26],
        [0.19, 0.32],
        [0.18, 0.36],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      20,
    ),
  ]);
  const capitals = new THREE.InstancedMesh(capGeo, columnMat, columnSpots.length);
  const bases = new THREE.InstancedMesh(baseGeo, columnMat, columnSpots.length);
  const neckRings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.175, 0.022, 6, 24).rotateX(Math.PI / 2), silverMat, columnSpots.length * 2);
  const PER = 14;
  const garland = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.045, 0), flowerMat, columnSpots.length * PER);
  const garlandLeaves = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 6, 4).scale(1.6, 0.35, 0.8), flowerMat, columnSpots.length * PER);
  const tmpP = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  columnSpots.forEach((col, i) => {
    m4.compose(tmpP.set(col.x, col.h / 2, col.z), q0, new THREE.Vector3(1, col.h, 1));
    shafts.setMatrixAt(i, m4);
    m4.makeTranslation(col.x, col.h - 0.33, col.z);
    capitals.setMatrixAt(i, m4);
    m4.makeTranslation(col.x, 0, col.z);
    bases.setMatrixAt(i, m4);
    m4.makeTranslation(col.x, col.h - 0.36, col.z);
    neckRings.setMatrixAt(i * 2, m4);
    m4.makeTranslation(col.x, 0.4, col.z);
    neckRings.setMatrixAt(i * 2 + 1, m4);
    // The garland: blossoms swagged around the neck, a leaf behind each
    for (let k = 0; k < PER; k++) {
      const a = (k / PER) * Math.PI * 2;
      const sag = 0.06 * Math.abs(Math.sin(a * 2));
      const r = 0.2;
      const y = col.h - 0.5 - sag;
      m4.compose(tmpP.set(col.x + Math.cos(a) * r, y, col.z + Math.sin(a) * r), tmpQ.setFromEuler(tmpE.set(a, a * 1.7, 0)), v1);
      garland.setMatrixAt(i * PER + k, m4);
      garland.setColorAt(i * PER + k, BLOOMS[(k + i) % BLOOMS.length]);
      m4.compose(
        tmpP.set(col.x + Math.cos(a + 0.2) * (r - 0.01), y - 0.03, col.z + Math.sin(a + 0.2) * (r - 0.01)),
        tmpQ.setFromEuler(tmpE.set(0, -a, 0.5)),
        v1,
      );
      garlandLeaves.setMatrixAt(i * PER + k, m4);
      garlandLeaves.setColorAt(i * PER + k, LEAF);
    }
  });
  scene.add(shafts, capitals, bases, neckRings, garland, garlandLeaves);

  // Urns of flowers: a silver urn, a dome of blossoms and leaves
  const urnGeo = new THREE.LatheGeometry(
    [
      [0.0, 0],
      [0.14, 0],
      [0.15, 0.04],
      [0.08, 0.1],
      [0.07, 0.18],
      [0.16, 0.3],
      [0.22, 0.45],
      [0.2, 0.6],
      [0.15, 0.68],
      [0.19, 0.74],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    18,
  );
  const urns = new THREE.InstancedMesh(urnGeo, brightSilverMat, Math.max(1, urnSpots.length));
  const BOUQ = 34;
  const bouquet = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 1), flowerMat, Math.max(1, urnSpots.length * BOUQ));
  const bouquetLeaves = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 4).scale(1.8, 0.3, 0.7), flowerMat, Math.max(1, urnSpots.length * BOUQ));
  const fr = (() => {
    let s0 = 91;
    return () => ((s0 = (s0 * 16807) % 2147483647) - 1) / 2147483646;
  })();
  urnSpots.forEach((p, i) => {
    m4.compose(tmpP.copy(p), q0, new THREE.Vector3(1.4, 1.4, 1.4));
    urns.setMatrixAt(i, m4);
    for (let k = 0; k < BOUQ; k++) {
      // Points on a dome above the urn's mouth
      const a = fr() * Math.PI * 2;
      const el = Math.acos(fr() * 0.85);
      const r = 0.34;
      const x = Math.sin(el) * Math.cos(a) * r;
      const z = Math.sin(el) * Math.sin(a) * r;
      const y = 1.08 + Math.cos(el) * r * 0.9;
      m4.compose(tmpP.set(p.x + x, p.y + y, p.z + z), tmpQ.setFromEuler(tmpE.set(fr() * 3, fr() * 3, fr() * 3)), v1.set(1, 1, 1).multiplyScalar(0.8 + fr() * 0.5));
      bouquet.setMatrixAt(i * BOUQ + k, m4);
      bouquet.setColorAt(i * BOUQ + k, BLOOMS[Math.floor(fr() * BLOOMS.length)]);
      m4.compose(
        tmpP.set(p.x + x * 1.25, p.y + y - 0.08, p.z + z * 1.25),
        tmpQ.setFromEuler(tmpE.set(0, -a, Math.PI / 2 - el + 0.4)),
        v1.set(1, 1, 1),
      );
      bouquetLeaves.setMatrixAt(i * BOUQ + k, m4);
      bouquetLeaves.setColorAt(i * BOUQ + k, LEAF);
    }
  });
  v1.set(1, 1, 1);
  urns.count = urnSpots.length;
  bouquet.count = bouquetLeaves.count = urnSpots.length * BOUQ;
  scene.add(urns, bouquet, bouquetLeaves);

  // Lanterns, after the Moroccan ones: a chain, a domed cap with its finial,
  // a pierced silver body, coloured glass lit from within, a pointed foot
  const LS = 1.25;
  const metalParts = mergeGeometries([
    new THREE.SphereGeometry(0.19, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.25, 0),
    new THREE.ConeGeometry(0.035, 0.2, 8).translate(0, 0.53, 0),
    new THREE.SphereGeometry(0.035, 8, 6).translate(0, 0.65, 0),
    new THREE.CylinderGeometry(0.19, 0.19, 0.03, 8).translate(0, 0.25, 0),
    new THREE.CylinderGeometry(0.19, 0.19, 0.03, 8).translate(0, -0.25, 0),
    new THREE.ConeGeometry(0.18, 0.22, 8).rotateX(Math.PI).translate(0, -0.37, 0),
    new THREE.SphereGeometry(0.03, 8, 6).translate(0, -0.5, 0),
    new THREE.CylinderGeometry(0.008, 0.008, 3, 4).translate(0, 2.15, 0),
  ]);
  const lanternMetal = new THREE.InstancedMesh(metalParts, brightSilverMat, lanternSpots.length);
  const lanternBody = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.5, 8, 1, true),
    new THREE.MeshStandardMaterial({ map: piercedMetal(), alphaTest: 0.5, side: THREE.DoubleSide, metalness: 0.45, roughness: 0.35, color: 0xeef0f4 }),
    lanternSpots.length,
  );
  const lanternLight = new THREE.InstancedMesh(
    mergeGeometries([new THREE.CylinderGeometry(0.15, 0.15, 0.46, 8, 1, true), new THREE.SphereGeometry(0.06, 8, 6)]),
    new THREE.MeshBasicMaterial({ map: lanternGlass(), side: THREE.DoubleSide, toneMapped: false }),
    lanternSpots.length,
  );
  const lanternScale = new THREE.Vector3(LS, LS, LS);
  lanternSpots.forEach((p, i) => {
    m4.compose(p, q0, lanternScale);
    lanternMetal.setMatrixAt(i, m4);
    lanternBody.setMatrixAt(i, m4);
    lanternLight.setMatrixAt(i, m4);
    addGlow(p, 2.4, 0.8);
  });
  scene.add(lanternMetal, lanternBody, lanternLight);

  /* Ceiling downlights: a bright eye, its halo on the cedar, a pool on the floor ---- */
  {
    const n = ceilSpots.length;
    const down = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    const up = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    const eyes = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.075, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff1da, toneMapped: false, fog: false }),
      n,
    );
    const rims = new THREE.InstancedMesh(new THREE.RingGeometry(0.075, 0.11, 20), silverMat, n);
    const halos = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffcf9a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
      n,
    );
    const pools = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffb46e, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
      n,
    );
    const mm = new THREE.Matrix4();
    const one = new THREE.Vector3(1, 1, 1);
    ceilSpots.forEach((p, i) => {
      mm.compose(p, down, one);
      eyes.setMatrixAt(i, mm);
      mm.compose(p.clone().setY(p.y + 0.002), down, one);
      rims.setMatrixAt(i, mm);
      mm.compose(p.clone().setY(p.y - 0.01), down, one);
      halos.setMatrixAt(i, mm);
      mm.compose(new THREE.Vector3(p.x, 0.02, p.z), up, one);
      pools.setMatrixAt(i, mm);
    });
    rims.material = silverMat.clone();
    (rims.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    scene.add(eyes, rims, halos, pools);
  }

  /* Light ------------------------------------------------------------------------ */
  // Evening light: a low warm fill; the lamps do the rest
  scene.add(new THREE.HemisphereLight(0xffe0c2, 0x12030a, 0.24));
  const walkLight = new THREE.PointLight(0xffc58c, isMobile ? 11 : 15, 11, 1.8);
  scene.add(walkLight);
  const roomLights = [new THREE.PointLight(0xffbb78, 30, 20, 1.7), new THREE.PointLight(0xffbb78, 36, 24, 1.7), new THREE.PointLight(0xffbb78, 28, 18, 1.7)];
  roomLights[0].position.set(0, 5, -9);
  roomLights[1].position.set(0, 6, BALL_Z0 - 15);
  roomLights[2].position.set(0, 4.5, CLUB_Z0 - CLUB_LEN / 2);
  scene.add(...roomLights);

  /* The mirror in the polish (desktop): the hotel reflected in its marble ------------ */
  // One low-resolution mirror under every marble floor; the carpets, being
  // opaque and above it, hide it where they lie
  const mirror = isMobile
    ? null
    : new Reflector(new THREE.PlaneGeometry(24, -clubEnd + 8), {
        textureWidth: Math.round(window.innerWidth * 0.45),
        textureHeight: Math.round(window.innerHeight * 0.45),
        clipBias: 0.003,
        color: 0x8a8076,
        multisample: 0,
      });
  if (mirror) {
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, -0.003, (clubEnd - 4) / 2 + 2);
    scene.add(mirror);
  }

  /* What the polish reflects: the hotel itself ---------------------------------------- */
  // Captured once (a few renders, while the browser is idle): the lit reception
  // seen from its middle, blurred a touch, becomes every surface's reflection
  // The lamps are captured at their real brightness (several times white), so
  // the polish mirrors them as bright points, as polished marble does
  const lamps: { m: THREE.MeshBasicMaterial; c: THREE.Color }[] = [];
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
    if (m && !Array.isArray(m) && m.isMeshBasicMaterial && m.toneMapped === false && !m.map && !lamps.some((l) => l.m === m)) {
      lamps.push({ m, c: m.color.clone() });
      m.color.multiplyScalar(9);
    }
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const hotelEnv = pmrem.fromScene(scene, 0.015, 0.1, 50, { size: isMobile ? 128 : 256, position: new THREE.Vector3(0, 2.0, -9) });
  pmrem.dispose();
  for (const l of lamps) l.m.color.copy(l.c);
  scene.environment = hotelEnv.texture;
  scene.environmentIntensity = 0.6;

  /* The walk ---------------------------------------------------------------------- */
  const keys: Key[] = [];
  const key = (u: number, pos: [number, number, number], look: [number, number, number]) =>
    keys.push({ u, pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look) });
  const EYE = 1.62;
  // Reception: in through the portal, to the manifesto either side of the arch
  const panelStand = SALON_Z0 + (isMobile ? 5.6 : 5.4);
  key(0, [0, EYE, 1.5], [0, 2.0, -10]);
  key(0.9, [0, EYE, -6], [0, 2.4, -16]);
  key(plan.panelLeft, [-PANEL_X, EYE, panelStand], [-PANEL_X, PANEL_Y, SALON_Z0]);
  key(plan.panelRight, [PANEL_X, EYE, panelStand], [PANEL_X, PANEL_Y, SALON_Z0]);
  key(plan.receptionEnd, [0.4, EYE, SALON_Z0 + 1.6], [0, 1.9, SALON_Z0 - 8]);
  // The salon: square to each frame
  const stand = isMobile ? 0.9 : -0.2;
  frames.forEach((_, i) => {
    const z = frameZ(i);
    key(plan.frameU(i), [stand, EYE + 0.15, z], [-SW, FY - 0.45, z]);
  });
  key(plan.salonEnd, [0.6, EYE, lastFrameZ - 2.2], [0, 1.9, lastFrameZ - 12]);
  key(plan.ballroomIn, [0, EYE + 0.2, BALL_Z0 - 6], [0, 2.6, TABLE_Z - 6]);
  const LETTER_VIEW: [number, number, number] = [0, TABLE_H + 0.78, TABLE_Z + 0.5];
  const LETTER_LOOK: [number, number, number] = [0, TABLE_H + 0.1, TABLE_Z - 0.2];
  key(plan.letterStart, LETTER_VIEW, LETTER_LOOK);
  // Held over the table while the pass goes back and the envelope closes
  key(plan.letterClosed, LETTER_VIEW, LETTER_LOOK);
  key(plan.letterClosed + 0.6, [0, EYE, TABLE_Z - 3], [0, 2.4, ballEnd - 4]);
  // The Salon des Ambassadeurs
  key(plan.clubIn, [0, EYE, CLUB_Z0 - 3], [0, 3.0, clubEnd]);
  key(plan.clubLeft, [isMobile ? -0.9 : -2.2, EYE, clubMid], [-CW, 2.9, clubMid]);
  // Square to the statement banner, its cloth (body and point) in the middle of the view
  const clubLook = CLUB_BANNER_Y - (PANEL.h * T.BANNER_TIP) / 2 - 0.05;
  key(plan.clubRight, [0, EYE, clubEnd + (isMobile ? 6.3 : 4.9)], [0, clubLook, clubEnd]);
  key(plan.clubRight + 0.4, [0, EYE, clubEnd + (isMobile ? 6.1 : 4.7)], [0, clubLook, clubEnd]);
  // And last, the farewell wall
  const fwStand: [number, number, number] = [isMobile ? 0.1 : 1.5, EYE, clubMid];
  const fwLook: [number, number, number] = [CW, FW_.y, clubMid];
  key(plan.farewell, fwStand, fwLook);
  key(plan.total, fwStand, fwLook);

  const ss = (x: number) => x * x * (3 - 2 * x);
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const sample = (u: number) => {
    let i = 0;
    while (i < keys.length - 2 && u > keys[i + 1].u) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const x = THREE.MathUtils.clamp((u - a.u) / Math.max(1e-4, b.u - a.u), 0, 1);
    // The first step already moves (it carries on the portal's walk in), then eases
    const t = i === 0 ? 1 - (1 - x) * (1 - x) : ss(x);
    pos.lerpVectors(a.pos, b.pos, t);
    look.lerpVectors(a.look, b.look, t);
  };

  let u = 0;
  let portrait = false;
  let turned = 0;
  let rotY = 0;
  const lookNow = new THREE.Vector3();
  const passStart = new THREE.Vector3();
  const passStartQ = new THREE.Quaternion();
  const passEnd = new THREE.Vector3();
  const passEndQ = new THREE.Quaternion();
  const flipQ = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const fwd = new THREE.Vector3();
  let lastDraw = 0;
  const ray = new THREE.Raycaster();
  /** The farewell's link under a point of the screen (NDC), if any */
  const farewellAt = (ndc: { x: number; y: number }) => {
    if (u < plan.farewell - 0.5) return null;
    ray.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
    const hit = ray.intersectObject(fwFace, false)[0];
    if (!hit?.uv) return null;
    const x = hit.uv.x;
    const y = 1 - hit.uv.y;
    return farewellBoard.regions().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? null;
  };
  const follow = (href: string) => {
    if (href === "#top") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (href.startsWith("#")) document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    else if (/^https?:/.test(href)) window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;
  };
  const settledNow = () => !sealed && u > plan.passHeld - 0.15 && u < plan.invitationEnd + 0.05;

  return {
    letterSettled: settledNow,
    update(dt: number, t: number) {
      u = THREE.MathUtils.damp(u, progress.current * plan.total, 4, dt);
      sample(u);
      camera.position.set(pos.x + ctx.pointer.x * 0.1, pos.y + Math.sin(t * 0.6) * 0.01 + ctx.pointer.y * 0.05, pos.z);
      lookNow.copy(look);
      lookNow.x += ctx.pointer.x * 0.25;
      lookNow.y += ctx.pointer.y * 0.15;
      camera.lookAt(lookNow);
      camera.updateMatrixWorld();
      walkLight.position.set(camera.position.x, 3.2, camera.position.z - 2.5);

      // The letter opens as you stand over it, and closes again once its pass is back
      const opened = THREE.MathUtils.clamp((u - plan.letterStart) / (plan.letterEnd - plan.letterStart), 0, 1);
      const closed = THREE.MathUtils.clamp((u - plan.passBack) / (plan.letterClosed - plan.passBack), 0, 1);
      const lp = sealed ? 0 : opened * (1 - closed);
      // The clock ticks every second
      if (clock) {
        const sec = Math.floor(Date.now() / 1000);
        if (sec !== clockSecond) {
          clockSecond = sec;
          clock.draw();
        }
      }
      letter.update(lp, t, dt, { x: 0, y: 0 });

      // Then its pass comes to you: to the middle of the screen, large, true to its colours
      const fly = THREE.MathUtils.clamp((u - plan.letterEnd) / (plan.passHeld - plan.letterEnd), 0, 1);
      // ...and as you scroll on, it goes back to where it came from
      const back = THREE.MathUtils.clamp((u - plan.invitationEnd) / (plan.passBack - plan.invitationEnd), 0, 1);
      const show = !sealed && fly > 0 && back < 1;
      heroPass.visible = show;
      letter.pass.visible = !show;
      if (show) {
        letter.pass.updateWorldMatrix(true, false);
        letter.pass.getWorldPosition(passStart);
        letter.pass.getWorldQuaternion(passStartQ);
        const D = 0.62;
        camera.getWorldDirection(fwd);
        passEnd.copy(camera.position).addScaledVector(fwd, D);
        const vh = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const vw = vh * camera.aspect;
        const scaleEnd = Math.min((vw * (portrait ? 0.9 : 0.62)) / TW, (vh * 0.55) / TH);
        // Turned face up again before it goes home
        rotY = THREE.MathUtils.damp(rotY, (back > 0 ? turned - (turned % 2) : turned) * Math.PI, 5, dt);
        flipQ.setFromAxisAngle(yAxis, rotY + (settledNow() ? ctx.pointer.x * 0.25 : 0));
        passEndQ.copy(camera.quaternion).multiply(flipQ);
        const e = ss(fly) * (1 - ss(back));
        heroPass.position.lerpVectors(passStart, passEnd, e);
        heroPass.quaternion.slerpQuaternions(passStartQ, passEndQ, e);
        heroPass.scale.setScalar(THREE.MathUtils.lerp(LETTER_SCALE, scaleEnd, e));
        heroPass.position.y += Math.sin(t * 0.9) * 0.004 * e;
      }

      // The farewell's countdown, repainted every half minute
      if (t - lastDraw > 30) {
        lastDraw = t;
        farewellBoard.draw(countdown());
      }

      const flick = 0.92 + Math.sin(t * 7.3) * 0.03 + Math.sin(t * 13.1) * 0.02;
      for (const gl of glows) (gl.material as THREE.SpriteMaterial).opacity = gl.userData.base * flick;
      chandeliers.forEach((ch, i) => (ch.rotation.y = t * 0.03 + i));
    },
    resize(w: number, h: number) {
      portrait = w / h < 0.85;
      camera.fov = portrait ? 66 : 52;
      camera.near = 0.03;
      // Nothing past the fog is visible, so nothing past it is drawn
      camera.far = 54;
      camera.updateProjectionMatrix();
    },
    dispose() {
      hotelEnv.dispose();
      mirror?.dispose();
    },
    onClick(ndc) {
      const link = ndc && farewellAt(ndc);
      if (link) follow(link.href);
      else if (settledNow()) turned += 1;
    },
    hover(ndc) {
      return !!farewellAt(ndc) || settledNow();
    },
  };

  /* Local builders ---------------------------------------------------------------- */

  function chandelier(at: THREE.Vector3) {
    const g = new THREE.Group();
    g.position.copy(at);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), silverMat);
    stem.position.y = 0.9;
    g.add(stem);
    for (const [r, y] of [
      [0.9, 0],
      [0.55, 0.4],
    ] as const) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 6, 40), silverMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      g.add(ring);
    }
    const count = isMobile ? 28 : 48;
    const crystals = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.05, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.02, emissive: 0x3a2a24 }),
      count,
    );
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0dc, toneMapped: false }), 12);
    const mm = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const outer = i < count * 0.6;
      const a = (i / (outer ? count * 0.6 : count * 0.4)) * Math.PI * 2;
      const r = outer ? 0.9 : 0.55;
      mm.compose(
        new THREE.Vector3(Math.cos(a) * r, (outer ? -0.18 : 0.22) - (i % 3) * 0.05, Math.sin(a) * r),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 2.2, 1),
      );
      crystals.setMatrixAt(i, mm);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mm.makeTranslation(Math.cos(a) * 0.9, 0.08, Math.sin(a) * 0.9);
      bulbs.setMatrixAt(i, mm);
    }
    g.add(crystals, bulbs);
    scene.add(g);
    addGlow(at.clone(), isMobile ? 5 : 6.2, 0.75);
    return g;
  }

  function yearCard(year: string) {
    const cv = document.createElement("canvas");
    cv.width = 1200;
    cv.height = 800;
    const g = cv.getContext("2d")!;
    const bg = g.createRadialGradient(600, 380, 40, 600, 400, 760);
    bg.addColorStop(0, "#4a0c32");
    bg.addColorStop(1, "#1a020f");
    g.fillStyle = bg;
    g.fillRect(0, 0, 1200, 800);
    const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-cinzel").trim() || "serif";
    const silver = g.createLinearGradient(0, 260, 0, 520);
    silver.addColorStop(0, "#ffffff");
    silver.addColorStop(0.5, "#c9ced8");
    silver.addColorStop(1, "#8d94a0");
    g.fillStyle = silver;
    g.font = `600 260px ${serif}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(year, 600, 380);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }
}
