import * as THREE from "three";

/*
 * Surfaces of the hotel, drawn once on small canvases (no per-pixel loops, so
 * they cost a few milliseconds): after the Hôtel El Djazaïr (formerly Saint
 * George, Algiers), an Arab-Ottoman palace: ivory stucco, zellige dados,
 * marble floors, carved cedar ceilings, velvet carpets and drapes. Its reds and
 * golds become the Gala's plum and silver.
 */

export const PALETTE = {
  ivory: "#efe7dc",
  ivoryShade: "#d9cbbd",
  plum: "#4a0c32",
  plumDeep: "#2a0619",
  plumLight: "#7a1a52",
  silver: "#d6dbe2",
  silverDeep: "#9aa1ab",
  cedar: "#3b1a14",
};

export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

export function tex(c: HTMLCanvasElement, repeat: [number, number] = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

/** Deterministic pseudo-random, so the textures are the same on every visit */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Warm ivory stucco with a tone-on-tone carved lattice of eight-pointed stars,
 * like the plasterwork of the hotel's salons: present, never loud.
 */
export function stucco(repeat: [number, number]) {
  const [c, g] = canvas(512, 512);
  const r = rng(7);
  g.fillStyle = "#e9dccb";
  g.fillRect(0, 0, 512, 512);
  // The carved lattice: light catches the upper edges, shadow the lower
  const n = 4;
  const s = 512 / n;
  const star = (cx: number, cy: number, rad: number) => {
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.strokeRect(-rad, -rad, rad * 2, rad * 2);
      g.restore();
    }
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * s + s / 2;
      const cy = y * s + s / 2;
      g.lineWidth = 3;
      g.strokeStyle = "rgba(150,120,98,0.22)";
      star(cx + 1, cy + 1.5, s * 0.3);
      g.strokeStyle = "rgba(255,250,242,0.55)";
      star(cx, cy, s * 0.3);
      g.lineWidth = 2;
      g.strokeStyle = "rgba(150,120,98,0.16)";
      g.beginPath();
      g.arc(cx + 1, cy + 1, s * 0.11, 0, Math.PI * 2);
      g.stroke();
    }
  // Little painted inlays: a coloured star in the heart of each carved one,
  // and a dot where the lattice meets, in the zellige's colours
  const inlays = ["#7a1a52", "#3f5a8a", "#b5577f", "#4f7d70", "#9a6a2e", "#c9ced8"];
  const solidStar = (cx: number, cy: number, rad: number) => {
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillRect(-rad, -rad, rad * 2, rad * 2);
      g.restore();
    }
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * s + s / 2;
      const cy = y * s + s / 2;
      g.fillStyle = "rgba(120,90,70,0.25)";
      solidStar(cx + 1, cy + 1.5, s * 0.075);
      g.globalAlpha = 0.6;
      g.fillStyle = inlays[(x + y * 3) % inlays.length];
      solidStar(cx, cy, s * 0.07);
      g.globalAlpha = 1;
      g.fillStyle = "rgba(255,250,242,0.7)";
      g.beginPath();
      g.arc(cx, cy, s * 0.022, 0, Math.PI * 2);
      g.fill();
      // A dot where four stars meet
      g.globalAlpha = 0.3;
      g.fillStyle = inlays[(x * 2 + y + 3) % inlays.length];
      g.beginPath();
      g.arc(x * s, y * s, s * 0.035, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    }
  // Trowel sweeps and grain
  for (let i = 0; i < 40; i++) {
    g.save();
    g.translate(r() * 512, r() * 512);
    g.rotate(r() * Math.PI);
    const grad = g.createLinearGradient(-80, 0, 80, 0);
    const tone = r() < 0.5 ? "255,250,242" : "190,170,150";
    grad.addColorStop(0, `rgba(${tone},0)`);
    grad.addColorStop(0.5, `rgba(${tone},0.07)`);
    grad.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = grad;
    g.fillRect(-80, -14, 160, 28);
    g.restore();
  }
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(120,96,80,0.05)" : "rgba(255,255,255,0.06)";
    g.fillRect(r() * 512, r() * 512, 1, 1);
  }
  return tex(c, repeat);
}

/**
 * The carved plaster frieze (gebs) that runs below the ceiling: an interlaced
 * band of arches and stars between two silver fillets.
 */
export function frieze(repeat: [number, number]) {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = "#e6d6c2";
  g.fillRect(0, 0, 1024, 256);
  // Silver fillets
  g.fillStyle = "#c9ced8";
  g.fillRect(0, 10, 1024, 8);
  g.fillRect(0, 238, 1024, 8);
  g.fillStyle = "rgba(90,22,64,0.9)";
  g.fillRect(0, 22, 1024, 6);
  g.fillRect(0, 228, 1024, 6);
  // Little arches
  const n = 8;
  const w = 1024 / n;
  for (let i = 0; i < n; i++) {
    const x = i * w;
    g.lineWidth = 6;
    g.strokeStyle = "rgba(140,110,90,0.55)";
    g.beginPath();
    g.moveTo(x + 14, 210);
    g.lineTo(x + 14, 120);
    g.arc(x + w / 2, 120, w / 2 - 14, Math.PI, 0);
    g.lineTo(x + w - 14, 210);
    g.stroke();
    g.strokeStyle = "rgba(255,250,242,0.8)";
    g.lineWidth = 3;
    g.stroke();
    // A star in each arch
    const cx = x + w / 2;
    const cy = 140;
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillStyle = "rgba(122,26,82,0.55)";
      g.fillRect(-22, -22, 44, 44);
      g.restore();
    }
    g.fillStyle = "#d6dbe2";
    g.beginPath();
    g.arc(cx, cy, 8, 0, Math.PI * 2);
    g.fill();
    // Interlace between arches
    g.strokeStyle = "rgba(140,110,90,0.45)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x, 60);
    g.quadraticCurveTo(x + w / 2, 30, x + w, 60);
    g.moveTo(x, 40);
    g.quadraticCurveTo(x + w / 2, 70, x + w, 40);
    g.stroke();
  }
  return tex(c, repeat);
}

/** Zellige: eight-pointed stars in plum, ivory and silver */
export function zellige(repeat: [number, number]) {
  const [c, g] = canvas(512, 512);
  const n = 4;
  const s = 512 / n;
  g.fillStyle = PALETTE.plumDeep;
  g.fillRect(0, 0, 512, 512);
  const star = (cx: number, cy: number, rOut: number, fill: string) => {
    g.fillStyle = fill;
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillRect(-rOut, -rOut, rOut * 2, rOut * 2);
      g.restore();
    }
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * s + s / 2;
      const cy = y * s + s / 2;
      star(cx, cy, s * 0.36, PALETTE.ivory);
      star(cx, cy, s * 0.3, PALETTE.plum);
      star(cx, cy, s * 0.14, PALETTE.silver);
      // Small crosses between the stars
      g.fillStyle = PALETTE.silverDeep;
      g.save();
      g.translate(x * s, y * s);
      g.rotate(Math.PI / 4);
      g.fillRect(-s * 0.08, -s * 0.08, s * 0.16, s * 0.16);
      g.restore();
    }
  // Grout and glaze
  g.strokeStyle = "rgba(10,2,6,0.5)";
  g.lineWidth = 2;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(i * s, 0);
    g.lineTo(i * s, 512);
    g.moveTo(0, i * s);
    g.lineTo(512, i * s);
    g.stroke();
  }
  const glaze = g.createLinearGradient(0, 0, 512, 512);
  glaze.addColorStop(0, "rgba(255,255,255,0.08)");
  glaze.addColorStop(0.5, "rgba(255,255,255,0)");
  glaze.addColorStop(1, "rgba(255,255,255,0.06)");
  g.fillStyle = glaze;
  g.fillRect(0, 0, 512, 512);
  return tex(c, repeat);
}

/** Marble floor: large ivory slabs with plum cabochons and soft veins */
export function marble(repeat: [number, number]) {
  const [c, g] = canvas(1024, 1024);
  const r = rng(11);
  g.fillStyle = "#e7ddd0";
  g.fillRect(0, 0, 1024, 1024);
  // Veins
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(150,128,118,${0.08 + r() * 0.12})`;
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    let x = r() * 1024;
    let y = r() * 1024;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      const nx = x + (r() - 0.3) * 260;
      const ny = y + (r() - 0.5) * 200;
      g.quadraticCurveTo(x + (r() - 0.5) * 160, y + (r() - 0.5) * 160, nx, ny);
      x = nx;
      y = ny;
    }
    g.stroke();
  }
  // Slab joints and plum cabochons at the corners
  g.strokeStyle = "rgba(90,60,60,0.35)";
  g.lineWidth = 2;
  for (let i = 0; i <= 2; i++) {
    g.beginPath();
    g.moveTo(i * 512, 0);
    g.lineTo(i * 512, 1024);
    g.moveTo(0, i * 512);
    g.lineTo(1024, i * 512);
    g.stroke();
  }
  for (const [x, y] of [
    [0, 0],
    [512, 0],
    [1024, 0],
    [0, 512],
    [512, 512],
    [1024, 512],
    [0, 1024],
    [512, 1024],
    [1024, 1024],
  ]) {
    g.save();
    g.translate(x, y);
    g.rotate(Math.PI / 4);
    g.fillStyle = PALETTE.plum;
    g.fillRect(-46, -46, 92, 92);
    g.strokeStyle = PALETTE.silver;
    g.lineWidth = 3;
    g.strokeRect(-38, -38, 76, 76);
    g.restore();
  }
  return tex(c, repeat);
}

/** A velvet runner: plum field, silver borders, a medallion repeat */
export function carpet(repeat: [number, number]) {
  const [c, g] = canvas(512, 1024);
  const r = rng(5);
  g.fillStyle = "#5a0f3c";
  g.fillRect(0, 0, 512, 1024);
  // Pile
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,160,210,0.05)";
    g.fillRect(r() * 512, r() * 1024, 1, 2);
  }
  // Borders
  g.fillStyle = PALETTE.plumDeep;
  g.fillRect(0, 0, 54, 1024);
  g.fillRect(458, 0, 54, 1024);
  g.strokeStyle = PALETTE.silver;
  g.lineWidth = 4;
  for (const x of [60, 452]) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 1024);
    g.stroke();
  }
  g.lineWidth = 1.5;
  for (const x of [24, 488]) {
    g.beginPath();
    g.setLineDash([10, 10]);
    g.moveTo(x, 0);
    g.lineTo(x, 1024);
    g.stroke();
  }
  g.setLineDash([]);
  // Medallions
  for (let i = 0; i < 2; i++) {
    const cy = 256 + i * 512;
    g.save();
    g.translate(256, cy);
    g.rotate(Math.PI / 4);
    g.strokeStyle = "rgba(214,219,226,0.65)";
    g.lineWidth = 3;
    g.strokeRect(-110, -110, 220, 220);
    g.fillStyle = "rgba(42,6,25,0.6)";
    g.fillRect(-70, -70, 140, 140);
    g.restore();
    g.fillStyle = "rgba(214,219,226,0.7)";
    g.beginPath();
    g.arc(256, cy, 22, 0, Math.PI * 2);
    g.fill();
  }
  return tex(c, repeat);
}

/** Carved and painted cedar ceiling: a lattice of eight-pointed stars */
export function cedar(repeat: [number, number]) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = PALETTE.cedar;
  g.fillRect(0, 0, 512, 512);
  const n = 4;
  const s = 512 / n;
  g.lineWidth = 5;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const cx = x * s + s / 2;
      const cy = y * s + s / 2;
      for (const rot of [0, Math.PI / 4]) {
        g.save();
        g.translate(cx, cy);
        g.rotate(rot);
        g.fillStyle = "#4e1f2e";
        g.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
        g.strokeStyle = "rgba(214,219,226,0.55)";
        g.strokeRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
        g.restore();
      }
      g.fillStyle = "rgba(122,26,82,0.9)";
      g.beginPath();
      g.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
      g.fill();
    }
  return tex(c, repeat);
}

/** Velvet drapery: plum, with the vertical light of its folds */
export function drape(repeat: [number, number]) {
  const [c, g] = canvas(256, 512);
  const grad = g.createLinearGradient(0, 0, 256, 0);
  for (let i = 0; i <= 8; i++) {
    grad.addColorStop(i / 8, i % 2 ? "#5e1040" : "#2c0619");
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  const shade = g.createLinearGradient(0, 0, 0, 512);
  shade.addColorStop(0, "rgba(0,0,0,0.35)");
  shade.addColorStop(0.3, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.25)");
  g.fillStyle = shade;
  g.fillRect(0, 0, 256, 512);
  return tex(c, repeat);
}

/** Terracotta garden path */
export function terracotta(repeat: [number, number]) {
  const [c, g] = canvas(512, 512);
  const r = rng(3);
  g.fillStyle = "#8c4a36";
  g.fillRect(0, 0, 512, 512);
  const s = 64;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const l = 0.85 + r() * 0.3;
      g.fillStyle = `rgb(${Math.round(150 * l)},${Math.round(78 * l)},${Math.round(58 * l)})`;
      g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
    }
  return tex(c, repeat);
}

/** A palm frond (alpha) */
export function frond() {
  const [c, g] = canvas(256, 512);
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = "#2f4a2c";
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(128, 512);
  g.quadraticCurveTo(140, 250, 128, 0);
  g.stroke();
  for (let i = 0; i < 34; i++) {
    const y = 500 - i * 14;
    const len = 110 * Math.sin((i / 34) * Math.PI) + 10;
    for (const side of [-1, 1]) {
      g.strokeStyle = i % 2 ? "#3c6237" : "#2d5230";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(128, y);
      g.quadraticCurveTo(128 + side * len * 0.6, y - 10, 128 + side * len, y + 26);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The night above the garden: deep plum, a few stars */
export function night() {
  const [c, g] = canvas(1024, 512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#0d0108");
  grad.addColorStop(0.6, "#2a0619");
  grad.addColorStop(1, "#5a1640");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  const r = rng(9);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(232,236,242,${0.3 + r() * 0.7})`;
    const s = r() < 0.9 ? 1 : 2;
    g.fillRect(r() * 1024, r() * 300, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A soft round glow for lamps and lanterns (additive sprite) */
export function glow(color = "255,226,200") {
  const [c, g] = canvas(128, 128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${color},1)`);
  grad.addColorStop(0.25, `rgba(${color},0.45)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* Inks: cream on plum velvet, or graphite on the silver satin banners of the
   entrance (the hero), with plum accents */
export type PanelTheme = "velvet" | "banner";
const INKS = {
  velvet: {
    eyebrow: "#c9ced8",
    title: "#f6f1e8",
    body: "rgba(246,241,232,0.86)",
    quote: "#e3e6ec",
    rule: "rgba(214,219,226,0.6)",
    stat: "#eef0f4",
    statLabel: "rgba(214,219,226,0.75)",
    bullet: "#d6dbe2",
    list: "rgba(246,241,232,0.88)",
    muted: "rgba(246,241,232,0.6)",
    link: "rgba(246,241,232,0.94)",
    plain: "rgba(246,241,232,0.68)",
    underline: "rgba(214,219,226,0.4)",
    line: "rgba(214,219,226,0.25)",
    btnFill: "rgba(122,26,82,0.6)",
    btnLine: "#d6dbe2",
    btnText: "#f6f1e8",
    glow: "",
  },
  banner: {
    eyebrow: "#c9ced8",
    title: "#f6f1e8",
    body: "rgba(246,241,232,0.88)",
    quote: "#e6e9ef",
    rule: "rgba(214,219,226,0.6)",
    stat: "#eef0f4",
    statLabel: "rgba(214,219,226,0.78)",
    bullet: "#d6dbe2",
    list: "rgba(246,241,232,0.9)",
    muted: "rgba(246,241,232,0.62)",
    link: "rgba(246,241,232,0.95)",
    plain: "rgba(246,241,232,0.7)",
    underline: "rgba(214,219,226,0.45)",
    line: "rgba(214,219,226,0.28)",
    btnFill: "rgba(122,26,82,0.75)",
    btnLine: "#d6dbe2",
    btnText: "#f6f1e8",
    glow: "rgba(10,0,6,0.6)",
  },
};
export type Ink = (typeof INKS)["velvet"];
export const inkFor = (t: PanelTheme): Ink => INKS[t];
/** The engraved look of the banner's letters: a fine white highlight under each */
export const engrave = (g: CanvasRenderingContext2D, ink: Ink) => {
  g.shadowColor = ink.glow || "transparent";
  g.shadowBlur = ink.glow ? 3 : 0;
  g.shadowOffsetY = ink.glow ? 1 : 0;
};

/** The pointed hem's extra height, as a share of the banner's body */
export const BANNER_TIP = 0.2;

/**
 * The silver satin banner of the entrance: brushed weave, a stitched border
 * following the pointed hem, transparent outside the cloth's outline. `bodyH`
 * is the rectangular part; the canvas runs on to the point.
 */
export function drawBannerBackground(g: CanvasRenderingContext2D, w: number, h: number, bodyH: number, emblem = true) {
  g.clearRect(0, 0, w, h);
  const cx = w / 2;
  const yTip = h - 4;
  // The cloth's outline
  g.save();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(w, 0);
  g.lineTo(w, bodyH);
  g.lineTo(cx, yTip);
  g.lineTo(0, bodyH);
  g.closePath();
  g.clip();
  // Plum satin, in the Gala's colours
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#5a1040");
  bg.addColorStop(0.55, "#420b2e");
  bg.addColorStop(1, "#2c0620");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const sheen = g.createRadialGradient(w * 0.32, h * 0.18, 10, w * 0.32, h * 0.18, w * 0.8);
  sheen.addColorStop(0, "rgba(211,55,145,0.2)");
  sheen.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, w, h);
  // Satin weave
  g.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  g.fillStyle = "rgba(0,0,0,0.05)";
  for (let y = 1; y < h; y += 3) g.fillRect(0, y, w, 1);
  g.fillStyle = "rgba(255,255,255,0.025)";
  for (let x = 0; x < w; x += 3) g.fillRect(x, 0, 1, h);
  g.restore();
  // Stitched borders in titanium and pewter thread
  const m = 46;
  const stitch = (inset: number, colour: string, width: number, dash: [number, number], lift: number) => {
    g.strokeStyle = colour;
    g.lineWidth = width;
    g.setLineDash(dash);
    g.beginPath();
    g.moveTo(inset, inset);
    g.lineTo(w - inset, inset);
    g.lineTo(w - inset, bodyH - lift);
    g.lineTo(cx, yTip - inset - lift * 2);
    g.lineTo(inset, bodyH - lift);
    g.closePath();
    g.stroke();
  };
  stitch(m, "rgba(214,219,226,0.8)", 2.5, [7, 4], 0);
  stitch(m + 12, "rgba(214,219,226,0.4)", 1.5, [5, 3], 4);
  g.setLineDash([]);
  if (emblem) bannerStar(g, cx, 112, 0.9, "#dfe3ea", "rgba(10,0,6,0.7)");
}

/** The Gala's diamond star with its two companions (as on the entrance banners) */
export function bannerStar(g: CanvasRenderingContext2D, cx: number, cy: number, scale: number, fill = "#101620", glow = "rgba(255,255,255,0.95)") {
  g.save();
  g.fillStyle = fill;
  g.shadowColor = glow;
  g.shadowBlur = 4;
  g.shadowOffsetY = 1;
  const star = (x0: number, rO: number, rI: number) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? rO : rI;
      if (i === 0) g.moveTo(x0 + Math.cos(a) * r, cy + Math.sin(a) * r);
      else g.lineTo(x0 + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  };
  star(cx, 44 * scale, 9.5 * scale);
  star(cx - 68 * scale, 16 * scale, 4 * scale);
  star(cx + 68 * scale, 16 * scale, 4 * scale);
  g.restore();
}

export const fontVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Wrap text to a width; returns the lines */
export function wrap(g: CanvasRenderingContext2D, text: string, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > width && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The engraved plaque under a frame: chapter and year, the edition's name, its
 * story and figures, in silver on a polished plum plate.
 */
export function plaque(opts: {
  eyebrow: string;
  title: string;
  story?: string;
  stats?: { value: string; label: string }[];
}) {
  const W = 1200;
  const H = 640;
  const [c, g] = canvas(W, H);
  const serif = fontVar("--font-cinzel", "serif");
  const italic = fontVar("--font-cormorant", "serif");
  const sans = fontVar("--font-plus-jakarta", "sans-serif");
  // The plate
  const plate = g.createLinearGradient(0, 0, 0, H);
  plate.addColorStop(0, "#3a0a28");
  plate.addColorStop(1, "#22041a");
  g.fillStyle = plate;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(214,219,226,0.85)";
  g.lineWidth = 6;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.strokeStyle = "rgba(214,219,226,0.35)";
  g.lineWidth = 2;
  g.strokeRect(30, 30, W - 60, H - 60);
  // The words
  g.textAlign = "center";
  g.fillStyle = "#c9ced8";
  g.font = `600 30px ${serif}`;
  g.fillText(opts.eyebrow.toUpperCase().split("").join(" "), W / 2, 96);
  g.fillStyle = "#f4efe6";
  g.font = `italic 500 64px ${italic}`;
  g.fillText(opts.title, W / 2, 180);
  let y = 250;
  if (opts.story) {
    g.fillStyle = "rgba(244,239,230,0.82)";
    g.font = `400 30px ${sans}`;
    const lines = wrap(g, opts.story, W - 180).slice(0, 5);
    for (const l of lines) {
      g.fillText(l, W / 2, y);
      y += 44;
    }
  }
  if (opts.stats?.length) {
    const stats = opts.stats.slice(0, 3);
    const colW = (W - 200) / stats.length;
    stats.forEach((st, i) => {
      const x = 100 + colW * i + colW / 2;
      g.fillStyle = "#e8ecf2";
      g.font = `600 52px ${serif}`;
      g.fillText(st.value, x, H - 108);
      g.fillStyle = "rgba(214,219,226,0.7)";
      g.font = `600 20px ${sans}`;
      g.fillText(st.label.toUpperCase(), x, H - 70);
    });
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * An engraved panel for the words of a room: plum velvet in a silver border,
 * the text set in the Gala's faces. Lines are laid out top to bottom.
 */
export type PanelLine =
  | { kind: "eyebrow"; text: string }
  | { kind: "title"; text: string; size?: number }
  | { kind: "body"; text: string; size?: number }
  | { kind: "quote"; text: string }
  | { kind: "rule" }
  | { kind: "stats"; items: { value: string; label: string }[] }
  | { kind: "list"; items: string[] }
  | { kind: "space"; h: number };

export function panel(lines: PanelLine[], w = 1600, h = 1000, align: CanvasTextAlign = "center", theme: PanelTheme = "velvet") {
  const ink = inkFor(theme);
  // Lay out once to measure, then draw centred in the panel (below the banner's star)
  const contentH = layoutPanel(null, lines, w, h, align, 0, ink);
  const banner = theme === "banner";
  const top = banner ? Math.max(230, (h - contentH) / 2 + 90) : Math.max(110, (h - contentH) / 2 + 40);
  const [c, g] = canvas(w, banner ? Math.round(h * (1 + BANNER_TIP)) : h);
  if (banner) drawBannerBackground(g, w, c.height, h);
  else drawPanelBackground(g, w, h);
  layoutPanel(g, lines, w, h, align, top, ink);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function drawPanelBackground(g: CanvasRenderingContext2D, w: number, h: number) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#3c0a29");
  bg.addColorStop(1, "#240417");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  // Velvet sheen
  const sheen = g.createRadialGradient(w * 0.3, h * 0.2, 10, w * 0.3, h * 0.2, w * 0.8);
  sheen.addColorStop(0, "rgba(211,55,145,0.18)");
  sheen.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(214,219,226,0.9)";
  g.lineWidth = 8;
  g.strokeRect(18, 18, w - 36, h - 36);
  g.strokeStyle = "rgba(214,219,226,0.35)";
  g.lineWidth = 2;
  g.strokeRect(40, 40, w - 80, h - 80);
}

/** Lays the lines out from `top` (and draws them when given a context); returns the height used */
function layoutPanel(target: CanvasRenderingContext2D | null, lines: PanelLine[], w: number, h: number, align: CanvasTextAlign, top: number, ink: Ink) {
  void h;
  const g = target || canvas(8, 8)[1];
  engrave(g, ink);
  const serif = fontVar("--font-cinzel", "serif");
  const italic = fontVar("--font-cormorant", "serif");
  const sans = fontVar("--font-plus-jakarta", "sans-serif");
  const pad = 120;
  const x = align === "center" ? w / 2 : pad;
  const maxW = w - pad * 2;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  let y = top;
  for (const l of lines) {
    if (l.kind === "eyebrow") {
      g.fillStyle = ink.eyebrow;
      g.font = `600 34px ${serif}`;
      g.fillText(l.text.toUpperCase().split("").join(" "), x, y);
      y += 80;
    } else if (l.kind === "title") {
      const size = l.size || 96;
      g.fillStyle = ink.title;
      g.font = `400 ${size}px ${serif}`;
      for (const t of l.text.split("\n")) {
        for (const ln of wrap(g, t, maxW)) {
          g.fillText(ln, x, y);
          y += size * 1.12;
        }
      }
      y += 20;
    } else if (l.kind === "body") {
      const size = l.size || 40;
      g.fillStyle = ink.body;
      g.font = `400 ${size}px ${sans}`;
      for (const ln of wrap(g, l.text, maxW)) {
        g.fillText(ln, x, y);
        y += size * 1.45;
      }
      y += 16;
    } else if (l.kind === "quote") {
      g.fillStyle = ink.quote;
      g.font = `italic 500 54px ${italic}`;
      for (const ln of wrap(g, l.text, maxW)) {
        g.fillText(ln, x, y);
        y += 64;
      }
      y += 16;
    } else if (l.kind === "rule") {
      g.fillStyle = ink.rule;
      g.fillRect(align === "center" ? w / 2 - 120 : pad, y - 20, 240, 3);
      y += 40;
    } else if (l.kind === "stats") {
      const items = l.items.slice(0, 3);
      const colW = maxW / items.length;
      items.forEach((st, i) => {
        const cx = pad + colW * i + colW / 2;
        g.textAlign = "center";
        g.fillStyle = ink.stat;
        g.font = `600 92px ${serif}`;
        g.fillText(st.value, cx, y + 70);
        g.fillStyle = ink.statLabel;
        g.font = `600 26px ${sans}`;
        g.fillText(st.label.toUpperCase(), cx, y + 120);
      });
      g.textAlign = align;
      y += 170;
    } else if (l.kind === "list") {
      g.font = `400 36px ${sans}`;
      for (const it of l.items) {
        const lines = wrap(g, it, maxW - 60);
        g.fillStyle = ink.bullet;
        g.fillText("✦", align === "center" ? x - maxW / 2 + 20 : x, y);
        g.fillStyle = ink.list;
        g.textAlign = "left";
        for (const ln of lines) {
          g.fillText(ln, (align === "center" ? x - maxW / 2 : x) + 60, y);
          y += 50;
        }
        g.textAlign = align;
        y += 10;
      }
    } else if (l.kind === "space") {
      y += l.h;
    }
  }
  return y - top;
}
