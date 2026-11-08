"use client";

import * as THREE from "three";
import type { StageContext } from "./Stage3D";

/*
 * The invitation letter, in 3D: in the spirit of the Hogwarts letter, heavy
 * aged ivory parchment, hand-addressed in plum ink, a deckled pointed flap and
 * a poured plum wax seal pressed with the club's mark, a silver-starred liner,
 * and the admission pass inside.
 */

export const PASS_ASPECT = 2.85; // the ticket artwork is 1044 × 368

/* Paper ---------------------------------------------------------------------- */

type Edge = [number, number, number, number]; // x1, y1, x2, y2 in canvas pixels

/**
 * Aged ivory parchment: tea-stain mottling, fibres, fine tooth, edges browned
 * with handling. `edges` are the cut edges of this piece of paper, which age
 * darker than its middle.
 */
function parchmentCanvas(w: number, h: number, edges: Edge[]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ecdfc2";
  g.fillRect(0, 0, w, h);
  // Mottling: large soft blotches, warmer and cooler
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 40 + Math.random() * 260;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const warm = Math.random() < 0.7;
    grad.addColorStop(0, warm ? `rgba(176,128,70,${0.05 + Math.random() * 0.07})` : `rgba(255,250,236,${0.12 + Math.random() * 0.1})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Fibres
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const a = Math.random() * Math.PI;
    const l = 5 + Math.random() * 16;
    g.globalAlpha = 0.05 + Math.random() * 0.08;
    g.strokeStyle = Math.random() < 0.6 ? "#8a6a44" : "#fffaf0";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.globalAlpha = 1;
  // Fine tooth
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // Handled edges: a soft brown along every cut edge
  g.lineCap = "round";
  for (const [x1, y1, x2, y2] of edges) {
    for (const [lw, a] of [
      [70, 0.07],
      [30, 0.1],
      [8, 0.16],
    ]) {
      g.strokeStyle = `rgba(120,78,38,${a})`;
      g.lineWidth = lw;
      g.filter = "blur(6px)";
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
  g.filter = "none";
  return c;
}

/** Grey noise for the paper's relief (bump map) */
function toothCanvas(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.filter = "blur(0.6px)";
  g.drawImage(c, 0, 0);
  return c;
}

/** The lining: a silver damask of small four-pointed stars on deep plum */
function liningCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a0828";
  g.fillRect(0, 0, 256, 256);
  const star = (x: number, y: number, r: number, a: number) => {
    g.globalAlpha = a;
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.22, y - r * 0.22);
    g.lineTo(x + r, y);
    g.lineTo(x + r * 0.22, y + r * 0.22);
    g.lineTo(x, y + r);
    g.lineTo(x - r * 0.22, y + r * 0.22);
    g.lineTo(x - r, y);
    g.lineTo(x - r * 0.22, y - r * 0.22);
    g.closePath();
    g.fill();
  };
  g.fillStyle = "#dfe3ea";
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      star(32 + x * 64, 32 + y * 64, 12, 0.5);
      star(x * 64, y * 64, 4.5, 0.3);
    }
  g.globalAlpha = 1;
  return c;
}

const fontVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** The front: hand-addressed in plum ink, a silver hairline border */
function addressCanvas(w: number, h: number, venue: string | undefined, onReady: () => void) {
  const base = parchmentCanvas(w, h, [
    [0, 0, w, 0],
    [w, 0, w, h],
    [w, h, 0, h],
    [0, h, 0, 0],
  ]);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const script = fontVar("--font-script", "cursive");
  const serif = fontVar("--font-cinzel", "serif");
  const draw = () => {
    g.drawImage(base, 0, 0);
    // A fine double rule in silver foil
    g.strokeStyle = "rgba(150,156,168,0.85)";
    g.lineWidth = 3;
    g.strokeRect(w * 0.04, h * 0.06, w * 0.92, h * 0.88);
    g.lineWidth = 1.2;
    g.strokeRect(w * 0.052, h * 0.078, w * 0.896, h * 0.844);
    // Ink: slightly uneven, as from a nib
    const ink = (text: string, font: string, x: number, y: number, align: CanvasTextAlign = "left") => {
      g.font = font;
      g.textAlign = align;
      g.textBaseline = "alphabetic";
      g.fillStyle = "rgba(74,10,50,0.92)";
      g.fillText(text, x, y);
      g.globalAlpha = 0.25;
      g.fillText(text, x + 0.8, y + 0.6);
      g.globalAlpha = 1;
    };
    ink("To our Honoured Guest", `${h * 0.13}px ${script}`, w * 0.5, h * 0.42, "center");
    g.fillStyle = "rgba(74,10,50,0.7)";
    g.fillRect(w * 0.3, h * 0.47, w * 0.4, 1.5);
    ink("The Engineers' Gala", `${h * 0.085}px ${script}`, w * 0.5, h * 0.6, "center");
    if (venue) ink(venue, `${h * 0.068}px ${script}`, w * 0.5, h * 0.72, "center");
    ink("BY INVITATION", `600 ${h * 0.03}px ${serif}`, w * 0.5, h * 0.86, "center");
  };
  draw();
  document.fonts.load(`40px ${script}`).then(() => {
    draw();
    onReady();
  });
  return c;
}

/* The seal ------------------------------------------------------------------- */

/**
 * The stamp's impression as relief (light = raised): a recessed face inside
 * the poured rim, the club's mark and name standing up from it. `tint` draws
 * the colour pass instead: plum wax with its relief dusted in silver.
 */
function stampCanvas(tint: boolean, onReady: () => void) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const serif = fontVar("--font-cinzel", "serif");
  const raised = tint ? "#c9ced8" : "#ffffff";
  const draw = (mark?: HTMLImageElement) => {
    g.clearRect(0, 0, S, S);
    g.fillStyle = tint ? "#5a0c3a" : "#b4b4b4";
    g.fillRect(0, 0, S, S);
    // The pressed face sits lower than the rim
    g.fillStyle = tint ? "#4c0931" : "#6a6a6a";
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = raised;
    g.lineWidth = S * 0.012;
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.33, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.22, 0, Math.PI * 2);
    g.stroke();
    const text = "✦ VISION & INNOVATION CLUB ✦ ENP ";
    g.fillStyle = raised;
    g.font = `700 ${S * 0.05}px ${serif}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const R = S * 0.275;
    for (let i = 0; i < text.length; i++) {
      const a = (i / text.length) * Math.PI * 2 - Math.PI / 2;
      g.save();
      g.translate(S / 2 + Math.cos(a) * R, S / 2 + Math.sin(a) * R);
      g.rotate(a + Math.PI / 2);
      g.fillText(text[i], 0, 0);
      g.restore();
    }
    if (mark) {
      // The mark as a silhouette, raised in relief
      const h = S * 0.26;
      const w = (h * mark.naturalWidth) / mark.naturalHeight;
      const m = document.createElement("canvas");
      m.width = Math.ceil(w);
      m.height = Math.ceil(h);
      const mg = m.getContext("2d")!;
      mg.drawImage(mark, 0, 0, w, h);
      mg.globalCompositeOperation = "source-in";
      mg.fillStyle = raised;
      mg.fillRect(0, 0, w, h);
      g.drawImage(m, S / 2 - w / 2, S / 2 - h / 2);
    }
    if (!tint) {
      // Soften the relief a touch so it reads as pressed wax
      const copy = document.createElement("canvas");
      copy.width = copy.height = S;
      copy.getContext("2d")!.drawImage(c, 0, 0);
      g.filter = "blur(2px)";
      g.drawImage(copy, 0, 0);
      g.filter = "none";
    }
  };
  draw();
  const img = new window.Image();
  img.onload = () => {
    draw(img);
    onReady();
  };
  img.src = "/images/vic-icon.png";
  return c;
}

/** The poured outline: a circle, not quite round, as wax spreads */
function waxRadius(theta: number, R: number) {
  return R * (1 + 0.045 * Math.sin(3 * theta + 1.3) + 0.03 * Math.sin(7 * theta + 0.4) + 0.018 * Math.sin(13 * theta + 2.1));
}

/** One half of the broken seal: the poured edge on one side, a jagged break on the other */
function sealHalf(R: number, upper: boolean, breakLine: [number, number][]) {
  const sh = new THREE.Shape();
  const steps = 48;
  const from = upper ? 0 : Math.PI;
  sh.moveTo(Math.cos(from) * waxRadius(from, R), 0);
  for (let i = 1; i <= steps; i++) {
    const a = from + (i / steps) * Math.PI;
    const r = waxRadius(a, R);
    sh.lineTo(Math.cos(a) * r, i === steps ? 0 : Math.sin(a) * r);
  }
  // Back across the break (the break line runs right to left)
  const line = upper ? [...breakLine].reverse() : breakLine;
  for (const [x, y] of line) sh.lineTo(x, y);
  sh.closePath();
  return new THREE.ExtrudeGeometry(sh, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 6,
    curveSegments: 4,
  });
}

/* The letter ----------------------------------------------------------------- */

export type LetterHandle = {
  /** The letter, lying flat on its table (local y up), 5 × 3.3 units */
  root: THREE.Group;
  /** p: 0 address up → turned over → seal broken → flap open → pass out and lifted */
  update: (p: number, t: number, dt: number, pointer: { x: number; y: number }) => void;
  /** Turn the lifted pass over */
  turn: () => void;
  /** How far the flap has opened at p (0–1), for framing */
  flapAt: (p: number) => number;
  /** The pass itself (to hand it to a larger presentation) */
  pass: THREE.Object3D;
};

/**
 * The invitation letter as an object: aged parchment, deckled flap, poured
 * plum wax seal, silver-starred liner and the pass inside. Used by the
 * Invitation section and placed on the ballroom table in the hotel.
 */
export function createLetter(opts: {
  texture: (url: string) => Promise<THREE.Texture>;
  venue?: string;
  shadows?: boolean;
}): LetterHandle {
  const EW = 5; // envelope
  const EH = 3.3;
  const top = EH / 2;
  const TW = 4.3; // ticket
  const TH = TW / PASS_ASPECT;
  const ss = THREE.MathUtils.smoothstep;
  const lerp = THREE.MathUtils.lerp;
  const PX = 400; // canvas pixels per unit
  const cw = EW * PX;
  const ch = EH * PX;
  // Envelope units → canvas pixels (canvas y runs downward)
  const toC = (x: number, y: number): [number, number] => [(x + EW / 2) * PX, (top - y) * PX];
  const edge = (a: [number, number], b: [number, number]): Edge => [...toC(...a), ...toC(...b)];

  // Materials -----------------------------------------------------------------
  const tooth = new THREE.CanvasTexture(toothCanvas());
  tooth.wrapS = tooth.wrapT = THREE.RepeatWrapping;
  tooth.repeat.set(1.6, 1.6);
  const paperMat = (c: HTMLCanvasElement, repeat: [number, number], offset: [number, number]) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(...repeat);
    t.offset.set(...offset);
    return new THREE.MeshStandardMaterial({ map: t, bumpMap: tooth, bumpScale: 0.9, roughness: 0.88 });
  };

  // Folds of the pocket (envelope coordinates)
  const vY = top - EH * 0.46;
  const bY = top - EH * 0.53;
  const pocketPaper = paperMat(
    parchmentCanvas(cw, ch, [
      edge([-EW / 2, top], [0.06, vY]),
      edge([EW / 2, top], [-0.06, vY]),
      edge([-EW / 2, -top], [0, bY]),
      edge([EW / 2, -top], [0, bY]),
      edge([-EW / 2, top], [-EW / 2, -top]),
      edge([EW / 2, top], [EW / 2, -top]),
      edge([-EW / 2, -top], [EW / 2, -top]),
    ]),
    [1 / EW, 1 / EH],
    [0.5, 0.5],
  );
  // The flap, in its hinge's coordinates (y from 0 down to -EH/2)
  const fc = toC(0, 0);
  const flapPaper = paperMat(
    parchmentCanvas(cw, ch / 2, [
      [0, 0, fc[0], ch / 2],
      [cw, 0, fc[0], ch / 2],
      [0, 0, cw, 0],
    ]),
    [1 / EW, 2 / EH],
    [0.5, 1],
  );
  const frontC = addressCanvas(cw, ch, opts.venue, () => {
    (front.material as THREE.MeshStandardMaterial).map!.needsUpdate = true;
  });
  const frontMat = paperMat(frontC, [1, 1], [0, 0]);

  const liningTex = new THREE.CanvasTexture(liningCanvas());
  liningTex.colorSpace = THREE.SRGBColorSpace;
  liningTex.wrapS = liningTex.wrapT = THREE.RepeatWrapping;
  liningTex.repeat.set(0.9, 0.9);
  const lining = new THREE.MeshStandardMaterial({ map: liningTex, roughness: 0.5, metalness: 0.2 });
  const liningBack = lining.clone();
  liningBack.side = THREE.BackSide;

  // Wax: deep plum, glossy, its relief dusted with silver
  const stampTint = stampCanvas(true, () => (waxFace.map!.needsUpdate = true));
  const stampRelief = stampCanvas(false, () => (waxFace.bumpMap!.needsUpdate = true));
  const R = 0.46;
  const waxTex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    // Cap UVs are shape coordinates: map [-1.1R, 1.1R] to the stamp
    t.repeat.set(1 / (2.2 * R), 1 / (2.2 * R));
    t.offset.set(0.5, 0.5);
    return t;
  };
  const waxFace = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: waxTex(stampTint, true),
    bumpMap: waxTex(stampRelief, false),
    bumpScale: 4,
    roughness: 0.34,
    clearcoat: 0.7,
    clearcoatRoughness: 0.28,
  });
  const waxSide = new THREE.MeshPhysicalMaterial({ color: 0x4f0a33, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 });

  const shadowed = <T extends THREE.Object3D>(m: T) => {
    m.castShadow = !!opts.shadows;
    m.receiveShadow = !!opts.shadows;
    return m;
  };
  /** A polygon whose free edges are slightly deckled (torn, not cut) */
  const shape = (pts: [number, number][], deckle: boolean[] = []) => {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (deckle[i]) {
        const n = 60;
        for (let k = 1; k < n; k++) {
          const t = k / n;
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const len = Math.hypot(dx, dy);
          const j = (Math.random() - 0.5) * 0.022;
          sh.lineTo(a[0] + dx * t + (-dy / len) * j, a[1] + dy * t + (dx / len) * j);
        }
      }
      if (i < pts.length - 1) sh.lineTo(b[0], b[1]);
    }
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  };

  // The letter, lying on the table. `flipper` turns it over. -------------------
  const flipper = new THREE.Group();
  const env = new THREE.Group();
  env.rotation.x = -Math.PI / 2;
  flipper.add(env);

  // Inside of the back, lined; the outside is the addressed front
  env.add(shadowed(new THREE.Mesh(new THREE.PlaneGeometry(EW, EH), lining)));
  const front = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(EW, EH), frontMat));
  front.position.z = -0.006;
  front.rotation.y = Math.PI;
  env.add(front);

  // Pocket folds, each rising a hair toward its free edge as paper does
  const fold = (geo: THREE.BufferGeometry, pivot: [number, number, number], rot: [number, number]) => {
    const g = new THREE.Group();
    g.position.set(...pivot);
    g.rotation.set(rot[0], rot[1], 0);
    const m = shadowed(new THREE.Mesh(geo, pocketPaper));
    m.position.set(-pivot[0], -pivot[1], 0);
    g.add(m);
    env.add(g);
  };
  fold(shape([[-EW / 2, top], [0.06, vY], [0.06, -top], [-EW / 2, -top]], [true]), [-EW / 2, 0, 0.034], [0, -0.016]);
  fold(shape([[EW / 2, top], [-0.06, vY], [-0.06, -top], [EW / 2, -top]], [true]), [EW / 2, 0, 0.04], [0, 0.016]);
  fold(shape([[-EW / 2, -top], [0, bY], [EW / 2, -top]], [true, true]), [0, -top, 0.09], [0.02, 0]);

  // The pointed flap, hinged on the top edge, its two long edges deckled
  const hinge = new THREE.Group();
  hinge.position.set(0, top, 0.1);
  env.add(hinge);
  const flapGeo = shape([[-EW / 2, 0], [EW / 2, 0], [0, -EH * 0.5]], [false, true, true]);
  hinge.add(shadowed(new THREE.Mesh(flapGeo, flapPaper)));
  const flapIn = new THREE.Mesh(flapGeo, liningBack);
  flapIn.receiveShadow = true;
  hinge.add(flapIn);

  // The seal, poured over the flap's point; it breaks along a jagged line
  const breakLine: [number, number][] = [];
  for (let i = 1; i < 10; i++) {
    const x = R * 0.98 - (i / 10) * R * 1.96;
    breakLine.push([x, (Math.random() - 0.5) * 0.07]);
  }
  const sealUpper = shadowed(new THREE.Mesh(sealHalf(R, true, breakLine), [waxFace, waxSide]));
  sealUpper.position.set(0, -EH / 2, 0.05);
  hinge.add(sealUpper);
  const sealLower = shadowed(new THREE.Mesh(sealHalf(R, false, breakLine), [waxFace, waxSide]));
  env.add(sealLower);

  // The pass --------------------------------------------------------------------
  const cardStock = () => new THREE.MeshPhysicalMaterial({ color: 0xf1ebe6, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35 });
  const passFront = cardStock();
  const passBack = cardStock();
  const passEdge = cardStock();
  const ticketPivot = new THREE.Group();
  env.add(ticketPivot);
  ticketPivot.add(shadowed(new THREE.Mesh(new THREE.BoxGeometry(TW, TH, 0.014), [passEdge, passEdge, passEdge, passEdge, passFront, passBack])));
  const show = (m: THREE.MeshPhysicalMaterial) => (t: THREE.Texture) => {
    m.map = t;
    m.color.set(0xffffff);
    m.needsUpdate = true;
  };
  opts.texture("/tickets-01.svg").then(show(passFront));
  opts.texture("/back-ticket.jpg").then(show(passBack));

  let turned = 0;
  let rotY = 0;
  const flapAt = (p: number) => ss(p, 0.36, 0.6);
  return {
    root: flipper,
    pass: ticketPivot,
    flapAt,
    turn() {
      turned += 1;
    },
    update(p: number, t: number, dt: number, pointer: { x: number; y: number }) {
      // 0. Turned over: the letter lifts, rolls onto its back and lands
      const flip = ss(p, 0.06, 0.24);
      flipper.rotation.z = (1 - flip) * Math.PI;
      flipper.position.y = Math.sin(flip * Math.PI) * 1.6;
      flipper.rotation.x = Math.sin(flip * Math.PI) * -0.12;

      // 1. The seal breaks: its lower half settles and turns a touch
      const crack = ss(p, 0.3, 0.37);
      sealLower.position.set(crack * 0.03, -crack * 0.05, 0.215);
      sealLower.rotation.z = crack * 0.08;

      // 2. The flap swings up and over, to lie open on the table
      const f = flapAt(p);
      hinge.rotation.x = lerp(-0.035, -Math.PI, f);
      hinge.position.z = lerp(0.1, -0.002, f);
      sealUpper.visible = f < 0.72;

      // 3. The pass slides out with a little friction, then lifts toward you
      const out = ss(p, 0.6, 0.82);
      const lift = ss(p, 0.8, 0.9);
      const tilt = p > 0.9 ? 1 : 0;
      rotY = THREE.MathUtils.damp(rotY, turned * Math.PI, 5, dt);
      ticketPivot.position.set(
        0,
        lerp(-0.3, top + 0.45, out) + lift * 0.25,
        0.022 + lift * (0.9 + Math.sin(t * 0.9) * 0.04) + Math.abs(Math.sin(rotY)) * 0.5,
      );
      ticketPivot.rotation.set(lift * 0.42 + tilt * pointer.y * -0.18, rotY + tilt * pointer.x * 0.3, lerp(0, -0.025, out));
    },
  };
}

/* The Invitation's own stage --------------------------------------------------- */

export function buildEnvelope(ctx: StageContext, progress: { current: number }, venue?: string) {
  const { scene, camera, renderer } = ctx;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const EW = 5;
  const EH = 3.3;
  const letter = createLetter({ texture: ctx.texture, venue, shadows: true });
  scene.add(letter.root);

  // The table: only its shadows show, on the velvet of the page
  const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.6 }));
  table.rotation.x = -Math.PI / 2;
  table.position.y = -0.01;
  table.receiveShadow = true;
  scene.add(table);

  // Light: a warm lamp low on the left, a rose fill, the room for the wax's gloss
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x2a0619, 0.6));
  const lamp = new THREE.DirectionalLight(0xffeedd, 2.2);
  lamp.position.set(-6.5, 6.5, 3.5);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.radius = 6;
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.02;
  Object.assign(lamp.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 22 });
  scene.add(lamp);
  const fill = new THREE.PointLight(0xd33791, 8, 0, 2);
  fill.position.set(4, 3, 3);
  scene.add(fill);
  scene.environmentIntensity = 0.55;

  // Camera: looking down at the table from the front ------------------------------
  // Seen almost straight on, as when the letter lies in front of you
  const ELEV = THREE.MathUtils.degToRad(84);
  const target = new THREE.Vector3(0, 0, -0.1);
  let dist = 10;
  let p = 0;
  return {
    update(dt: number, t: number) {
      p = THREE.MathUtils.damp(p, progress.current, 5, dt);
      letter.update(p, t, dt, ctx.pointer);
      // Camera, with a little parallax; it drifts to frame the opened flap
      target.z = THREE.MathUtils.lerp(-0.1, -0.85, letter.flapAt(p));
      camera.position.set(
        target.x + ctx.pointer.x * 0.4,
        target.y + Math.sin(ELEV) * dist,
        target.z + Math.cos(ELEV) * dist + ctx.pointer.y * -0.3,
      );
      camera.lookAt(target);
    },
    resize(w: number, h: number) {
      camera.fov = 30;
      camera.updateProjectionMatrix();
      const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
      const halfH = Math.atan(Math.tan(halfV) * (w / h));
      const fitW = (EW * 0.62) / Math.tan(halfH);
      // From the envelope's near edge to the tip of the opened flap
      const fitD = (3.7 * Math.sin(ELEV)) / Math.tan(halfV);
      void EH;
      dist = Math.max(fitW, fitD);
    },
    onClick() {
      if (progress.current > 0.9) letter.turn();
    },
  };
}
