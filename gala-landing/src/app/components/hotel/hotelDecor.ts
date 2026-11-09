import * as THREE from "three";
import { BANNER_TIP, canvas, drawBannerBackground, drawPanelBackground, engrave, fontVar, inkFor, rng, tex, wrap, type PanelTheme } from "./hotelTextures";

/*
 * The hotel's furnishings: the columns' skin (fluting, painted bands and a
 * flowering vine), the Moroccan lanterns' pierced metal and coloured glass,
 * and the farewell: the page's last words engraved on the club's last wall,
 * with the areas you can click.
 */

/**
 * The skin of a column shaft, wrapped around it: ivory fluting, a painted band
 * of plum and silver at the neck and the foot, and a vine climbing around it
 * with leaves and rose, plum and ivory blossoms.
 */
export function columnSkin() {
  const W = 256;
  const H = 1024;
  const [c, g] = canvas(W, H);
  const r = rng(23);
  g.fillStyle = "#efe6da";
  g.fillRect(0, 0, W, H);
  // Flutes: a soft shade in each groove
  const flutes = 12;
  for (let i = 0; i < flutes; i++) {
    const x = (i / flutes) * W;
    const grad = g.createLinearGradient(x, 0, x + W / flutes, 0);
    grad.addColorStop(0, "rgba(150,122,100,0.24)");
    grad.addColorStop(0.35, "rgba(255,252,246,0.28)");
    grad.addColorStop(0.7, "rgba(255,252,246,0.05)");
    grad.addColorStop(1, "rgba(150,122,100,0.24)");
    g.fillStyle = grad;
    g.fillRect(x, 0, W / flutes, H);
  }
  // Painted bands at the neck and the foot
  const band = (y: number) => {
    g.fillStyle = "#4a0c32";
    g.fillRect(0, y, W, 46);
    g.fillStyle = "#d6dbe2";
    g.fillRect(0, y - 6, W, 5);
    g.fillRect(0, y + 47, W, 5);
    for (let i = 0; i < 8; i++) {
      g.save();
      g.translate((i + 0.5) * (W / 8), y + 23);
      for (const rot of [0, Math.PI / 4]) {
        g.save();
        g.rotate(rot);
        g.fillStyle = i % 2 ? "#b5577f" : "#c9ced8";
        g.fillRect(-8, -8, 16, 16);
        g.restore();
      }
      g.restore();
    }
  };
  band(28);
  band(H - 78);
  // The vine: two stems winding around the shaft (drawn three times so it wraps)
  const wrapX = [-W, 0, W];
  const flower = (x: number, y: number, rad: number, col: string) => {
    for (const dx of wrapX) {
      g.fillStyle = col;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        g.beginPath();
        g.ellipse(x + dx + Math.cos(a) * rad * 0.7, y + Math.sin(a) * rad * 0.7, rad * 0.62, rad * 0.42, a, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#f4e3b8";
      g.beginPath();
      g.arc(x + dx, y, rad * 0.32, 0, Math.PI * 2);
      g.fill();
    }
  };
  const leaf = (x: number, y: number, a: number) => {
    for (const dx of wrapX) {
      g.save();
      g.translate(x + dx, y);
      g.rotate(a);
      g.fillStyle = "#5d7a52";
      g.beginPath();
      g.ellipse(9, 0, 10, 4.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  };
  const blooms = ["#b5577f", "#7a1a52", "#f6efe6", "#d48aa6"];
  const stemX = (y: number, phase: number) => W / 2 + Math.sin((y / (H - 200)) * Math.PI * 4 + phase) * W * 0.5;
  for (const phase of [0, Math.PI]) {
    g.strokeStyle = "#6b7f57";
    g.lineWidth = 3.5;
    for (const dx of wrapX) {
      g.beginPath();
      for (let y = 100; y <= H - 100; y += 4) {
        if (y === 100) g.moveTo(stemX(y, phase) + dx, y);
        else g.lineTo(stemX(y, phase) + dx, y);
      }
      g.stroke();
    }
    for (let y = 120; y < H - 110; y += 30) {
      const x = stemX(y, phase);
      leaf(x, y, (r() - 0.5) * 2.4 + (r() < 0.5 ? 0 : Math.PI));
      if (r() < 0.6) flower(x + (r() - 0.5) * 20, y + 10, 9 + r() * 5, blooms[Math.floor(r() * blooms.length)]);
    }
  }
  return tex(c, [1, 1]);
}

/** Pierced silver for the lanterns: eight facets with star cut-outs (alpha) */
export function piercedMetal() {
  const W = 512;
  const H = 256;
  const [c, g] = canvas(W, H);
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#e6e9ee");
  grad.addColorStop(0.5, "#a9aeb8");
  grad.addColorStop(1, "#d8dce3");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "destination-out";
  const cols = 8;
  const rows = 3;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const cx = (x + 0.5) * (W / cols);
      const cy = 20 + (y + 0.5) * ((H - 40) / rows);
      for (const rot of [0, Math.PI / 4]) {
        g.save();
        g.translate(cx, cy);
        g.rotate(rot);
        g.fillRect(-15, -15, 30, 30);
        g.restore();
      }
      if (y < rows - 1) {
        g.beginPath();
        g.arc(cx, cy + (H - 40) / rows / 2, 6, 0, Math.PI * 2);
        g.fill();
      }
    }
  g.globalCompositeOperation = "source-over";
  // The frame between the facets, and the rims
  g.fillStyle = "#cfd3da";
  for (let x = 0; x <= cols; x++) g.fillRect(x * (W / cols) - 4, 0, 8, H);
  g.fillRect(0, 0, W, 14);
  g.fillRect(0, H - 14, W, 14);
  return tex(c, [1, 1]);
}

/** The lanterns' coloured glass, lit from within */
export function lanternGlass() {
  const W = 512;
  const H = 128;
  const [c, g] = canvas(W, H);
  const panes = ["#ffcf94", "#ff9fb6", "#ffe2b0", "#e3a0ff", "#ffc98c", "#a8e0cc", "#ffdca8", "#ffaa98"];
  panes.forEach((col, i) => {
    const x = (i / panes.length) * W;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, col);
    grad.addColorStop(0.5, "#fff3df");
    grad.addColorStop(1, col);
    g.fillStyle = grad;
    g.fillRect(x, 0, W / panes.length, H);
  });
  return tex(c, [1, 1]);
}

/* The farewell -------------------------------------------------------------------- */

export type FarewellWords = {
  tagline?: string;
  title: [string, string];
  countdownLabels: [string, string, string];
  until: string;
  cta: string;
  columns: { title: string; items: { label: string; href?: string }[] }[];
  copyright: string;
  backToTop: string;
  credit: { label: string; href: string };
};

/** A clickable area of the farewell, in UV (0..1, v measured from the top) */
export type FarewellRegion = { x: number; y: number; w: number; h: number; href: string };

/**
 * The farewell engraved on velvet: the closing line, the time left and the
 * request, the directory, and the last line. Wide for desktop, tall for
 * phones. `draw` repaints it (the countdown changes every minute).
 */
export function farewell(words: FarewellWords, tall: boolean, theme: PanelTheme = "velvet") {
  const W = tall ? 1200 : 2000;
  const H = tall ? 1800 : 1240;
  const ink = inkFor(theme);
  const banner = theme === "banner";
  // On a banner the cloth runs on below the words to its point
  const CH = banner ? Math.round(H * (1 + BANNER_TIP)) : H;
  const [c, g] = canvas(W, CH);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  let regions: FarewellRegion[] = [];

  const draw = (left: { d: number; h: number; m: number } | null) => {
    const serif = fontVar("--font-cinzel", "serif");
    const italic = fontVar("--font-cormorant", "serif");
    const sans = fontVar("--font-plus-jakarta", "sans-serif");
    regions = [];
    const hit = (x: number, y: number, w: number, h: number, href?: string) => {
      if (href) regions.push({ x: x / W, y: y / CH, w: w / W, h: h / CH, href });
    };
    g.clearRect(0, 0, W, CH);
    if (banner) drawBannerBackground(g, W, CH, H, false);
    else drawPanelBackground(g, W, H);
    engrave(g, ink);
    const pad = tall ? 100 : 140;
    g.textBaseline = "alphabetic";
    g.textAlign = "left";

    // The closing line
    let y = tall ? 170 : 190;
    if (words.tagline) {
      g.fillStyle = ink.eyebrow;
      g.font = `600 ${tall ? 24 : 28}px ${serif}`;
      g.letterSpacing = tall ? "5px" : "7px";
      for (const ln of wrap(g, words.tagline.toUpperCase(), W - pad * 2)) {
        g.fillText(ln, pad, y);
        y += tall ? 40 : 44;
      }
      g.letterSpacing = "0px";
      y += 20;
    }
    const titleSize = tall ? 128 : 150;
    g.fillStyle = ink.title;
    g.font = `500 ${titleSize}px ${italic}`;
    y += titleSize * 0.8;
    g.fillText(words.title[0], pad, y);
    y += titleSize * 0.95;
    g.font = `italic 500 ${titleSize}px ${italic}`;
    g.fillText(words.title[1], pad, y);

    // The time left and the request: to the right on the wide wall, below on the tall one
    const cx = tall ? pad : W - pad - 640;
    let cy = tall ? y + 130 : 330;
    if (left) {
      let x = cx;
      [left.d, left.h, left.m].forEach((v, i) => {
        g.fillStyle = ink.stat;
        g.font = `600 ${tall ? 84 : 92}px ${serif}`;
        const num = String(v).padStart(2, "0");
        g.fillText(num, x, cy);
        x += g.measureText(num).width + 14;
        g.fillStyle = ink.statLabel;
        g.font = `600 ${tall ? 24 : 26}px ${sans}`;
        const lab = words.countdownLabels[i].toUpperCase();
        g.fillText(lab, x, cy);
        x += g.measureText(lab).width + 44;
      });
      g.fillStyle = ink.muted;
      g.font = `400 30px ${sans}`;
      g.fillText(words.until, cx, cy + 56);
      cy += 120;
    }
    // The request, as a silver-framed plaque
    g.font = `600 ${tall ? 30 : 32}px ${sans}`;
    const label = words.cta.toUpperCase();
    const bh = tall ? 104 : 100;
    const bw = Math.max(tall ? 560 : 540, g.measureText(label).width + label.length * 3 + bh + 110);
    g.fillStyle = ink.btnFill;
    g.fillRect(cx, cy, bw, bh);
    g.strokeStyle = ink.btnLine;
    g.lineWidth = 3;
    g.strokeRect(cx, cy, bw, bh);
    g.strokeRect(cx + bw - bh + 16, cy + 16, bh - 32, bh - 32);
    g.shadowColor = "transparent";
    g.fillStyle = ink.btnText;
    g.letterSpacing = "3px";
    g.fillText(label, cx + 44, cy + bh / 2 + 11);
    g.letterSpacing = "0px";
    g.font = `400 40px ${sans}`;
    g.textAlign = "center";
    g.fillText("→", cx + bw - bh / 2, cy + bh / 2 + 13);
    g.textAlign = "left";
    engrave(g, ink);
    hit(cx, cy, bw, bh, "/register");
    if (tall) y = cy + bh;

    // The directory: four columns on the wide wall, two by two on the tall one
    let top = tall ? y + 130 : 800;
    g.fillStyle = ink.line;
    g.fillRect(pad, top - 60, W - pad * 2, 2);
    const perRow = tall ? 2 : 4;
    const colW = (W - pad * 2) / perRow;
    const lineH = tall ? 50 : 46;
    let rowMax = 0;
    words.columns.forEach((col, i) => {
      if (i > 0 && i % perRow === 0) {
        top += rowMax + 30;
        rowMax = 0;
      }
      const x = pad + (i % perRow) * colW;
      let yy = top;
      g.fillStyle = ink.eyebrow;
      g.font = `600 24px ${sans}`;
      g.letterSpacing = "4px";
      g.fillText(col.title.toUpperCase(), x, yy);
      g.letterSpacing = "0px";
      yy += 54;
      for (const it of col.items) {
        g.font = `400 ${tall ? 30 : 30}px ${sans}`;
        g.fillStyle = it.href ? ink.link : ink.plain;
        const lines = wrap(g, it.label + (it.href && /^https?:/.test(it.href) ? " ↗" : ""), colW - 40);
        const y0 = yy;
        let wMax = 0;
        for (const ln of lines) {
          g.fillText(ln, x, yy);
          wMax = Math.max(wMax, g.measureText(ln).width);
          yy += lineH;
        }
        if (it.href) {
          g.fillStyle = ink.underline;
          g.fillRect(x, yy - lineH + 12, wMax, 2);
          hit(x - 12, y0 - lineH * 0.8, wMax + 24, yy - y0 + 12, it.href);
        }
        yy += 4;
      }
      rowMax = Math.max(rowMax, yy - top);
    });

    // The last line
    const by = H - (tall ? 240 : 100);
    g.fillStyle = ink.line;
    g.fillRect(pad, by - 60, W - pad * 2, 2);
    g.font = `400 24px ${sans}`;
    g.fillStyle = ink.muted;
    const items: { text: string; href?: string }[] = [
      { text: `© ${new Date().getFullYear()} ${words.copyright}` },
      { text: `${words.backToTop.toUpperCase()} ↑`, href: "#top" },
      { text: words.credit.label, href: words.credit.href },
    ];
    const aligns: CanvasTextAlign[] = tall ? ["center", "center", "center"] : ["left", "center", "right"];
    const xs = tall ? [W / 2, W / 2, W / 2] : [pad, W / 2, W - pad];
    let ly = by;
    items.forEach((it, i) => {
      const yy = tall ? ly : by;
      g.textAlign = aligns[i];
      const lines = tall ? wrap(g, it.text, W - pad * 2) : [it.text];
      lines.forEach((ln, k) => g.fillText(ln, xs[i], yy + k * 32));
      ly += lines.length * 32 + 22;
      const w = Math.max(...lines.map((ln) => g.measureText(ln).width));
      const x0 = aligns[i] === "left" ? xs[i] : aligns[i] === "center" ? xs[i] - w / 2 : xs[i] - w;
      hit(x0 - 12, yy - 36, w + 24, 50, it.href);
    });
    g.textAlign = "left";
    texture.needsUpdate = true;
  };

  return { texture, draw, regions: () => regions };
}

/* The sealed invitation: while registration is closed ---------------------------- */

export type SealedWords = {
  eyebrow: string;
  title: string;
  countdown: string;
  labels: [string, string, string, string];
  note?: string;
};

/**
 * The card that stands by the sealed letter until registration opens: a clock
 * counting down to the opening, to the second, in silver on plum velvet.
 */
export function sealedCard(words: SealedWords, opensAt: number) {
  const W = 1600;
  const H = 1080;
  const [c, g] = canvas(W, H);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const draw = () => {
    const serif = fontVar("--font-cinzel", "serif");
    const italic = fontVar("--font-cormorant", "serif");
    const sans = fontVar("--font-plus-jakarta", "sans-serif");
    drawPanelBackground(g, W, H);
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillStyle = "#c9ced8";
    g.font = `600 34px ${serif}`;
    g.letterSpacing = "8px";
    g.fillText(words.eyebrow.toUpperCase(), W / 2, 170);
    g.letterSpacing = "0px";
    g.fillStyle = "#f6f1e8";
    g.font = `italic 500 76px ${italic}`;
    const lines = wrap(g, words.title, W - 260);
    lines.forEach((ln, i) => g.fillText(ln, W / 2, 270 + i * 84));
    // The clock
    const ms = Math.max(0, opensAt - Date.now());
    const parts = [Math.floor(ms / 86_400_000), Math.floor(ms / 3_600_000) % 24, Math.floor(ms / 60_000) % 60, Math.floor(ms / 1000) % 60];
    const top = 270 + lines.length * 84 + 40;
    g.fillStyle = "rgba(214,219,226,0.7)";
    g.font = `600 26px ${sans}`;
    g.letterSpacing = "6px";
    g.fillText(words.countdown.toUpperCase(), W / 2, top + 10);
    g.letterSpacing = "0px";
    const colW = 300;
    const x0 = W / 2 - colW * 1.5;
    parts.forEach((v, i) => {
      const x = x0 + i * colW;
      // A silver-edged tile for each figure
      g.fillStyle = "rgba(20,2,12,0.55)";
      g.fillRect(x - 118, top + 50, 236, 230);
      g.strokeStyle = "rgba(214,219,226,0.7)";
      g.lineWidth = 3;
      g.strokeRect(x - 118, top + 50, 236, 230);
      g.fillStyle = "#eef0f4";
      g.font = `600 150px ${serif}`;
      g.fillText(String(v).padStart(2, "0"), x, top + 220);
      g.fillStyle = "rgba(214,219,226,0.8)";
      g.font = `600 26px ${sans}`;
      g.letterSpacing = "5px";
      g.fillText(words.labels[i].toUpperCase(), x, top + 330);
      g.letterSpacing = "0px";
      if (i < 3) {
        g.fillStyle = "rgba(214,219,226,0.6)";
        g.font = `600 90px ${serif}`;
        g.fillText(":", x + colW / 2, top + 195);
      }
    });
    if (words.note) {
      g.fillStyle = "rgba(246,241,232,0.65)";
      g.font = `400 34px ${sans}`;
      g.fillText(words.note, W / 2, H - 90);
    }
    texture.needsUpdate = true;
  };
  draw();
  return { texture, draw };
}

/* The floor: polished marble, as in the hotel ------------------------------------ */

/** Smooth value noise on a hashed lattice, summed over octaves (0..1) */
function makeFbm(seed: number) {
  const hash = (x: number, y: number) => {
    let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x: number, y: number, oct = 4) => {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let i = 0; i < oct; i++) {
      sum += noise(x * f, y * f) * amp;
      f *= 2.03;
      amp *= 0.5;
    }
    return sum / (1 - Math.pow(0.5, oct));
  };
}

/**
 * Polished cream marble laid in 80 cm slabs, three by three (a 2.4 m module):
 * every slab cut from a different part of the block (its own veins, its own
 * cloud and tone), fine recessed joints, and an inlaid star of black
 * marble ringed in plum at the module's corners. Returns the colour, the relief
 * (joints) and the polish (roughness: glossy slabs, matt joints).
 */
export function marbleFloor(px = 1024) {
  // Three 80 cm slabs a side (a 2.4 m module)
  const N = 3;
  const slab = px / N;
  const [c, g] = canvas(px, px);
  const img = g.createImageData(px, px);
  const d = img.data;
  const rough = new Uint8ClampedArray(px * px);
  const r = rng(31);
  const fbm = makeFbm(7);
  const fine = makeFbm(19);
  // Each slab: its veins' direction, rhythm and offset, and its tone
  const slabs = Array.from({ length: N * N }, () => ({
    a: (r() - 0.5) * 1.4 + (r() < 0.5 ? 0 : Math.PI / 2),
    f: 9 + r() * 7,
    o: r() * 100,
    warp: 4 + r() * 4,
    tone: (r() - 0.5) * 10,
    ox: r() * 50,
    oy: r() * 50,
  }));
  const joint = Math.max(1, Math.round(px / 512));
  for (let y = 0; y < px; y++) {
    const sy = Math.floor(y / slab);
    const ly = (y % slab) / slab;
    for (let x = 0; x < px; x++) {
      const sx = Math.floor(x / slab);
      const lx = (x % slab) / slab;
      const s = slabs[sy * N + sx];
      const nx = lx * 3 + s.ox;
      const ny = ly * 3 + s.oy;
      const cloud = fbm(nx, ny, 4);
      // Main veins: a warped sine along the slab's grain, thin and branching
      const along = (lx - 0.5) * Math.cos(s.a) + (ly - 0.5) * Math.sin(s.a);
      const v1 = Math.abs(Math.sin((along * s.f + s.o) + cloud * s.warp));
      const v2 = Math.abs(Math.sin((along * s.f * 2.3 + s.o * 1.7) + fine(nx * 2, ny * 2, 3) * 7));
      // Veins of varying width with a soft halo, as real marble's are
      const width = 0.05 + fine(nx * 0.7, ny * 0.7, 2) * 0.09;
      const core = Math.max(0, 1 - v1 / width);
      const halo = Math.max(0, 1 - v1 / (width * 4));
      const vein = core * core * 0.5 + halo * 0.16 + Math.max(0, 1 - v2 / 0.03) * 0.18;
      const speck = fine(nx * 14, ny * 14, 2);
      // Cream base with a soft warm cloud, grey-taupe veins
      let R = 236 + s.tone - cloud * 18 - speck * 6;
      let G = 228 + s.tone - cloud * 20 - speck * 6;
      let B = 216 + s.tone - cloud * 24 - speck * 6;
      const vk = Math.min(1, vein);
      R += (128 - R) * vk * 0.62;
      G += (116 - G) * vk * 0.62;
      B += (106 - B) * vk * 0.62;
      let ro = 22 + cloud * 18;
      // The joints
      const jx = x % slab;
      const jy = y % slab;
      if (jx < joint || jy < joint) {
        R = 168;
        G = 156;
        B = 144;
        ro = 190;
      }
      const i = (y * px + x) * 4;
      d[i] = R;
      d[i + 1] = G;
      d[i + 2] = B;
      d[i + 3] = 255;
      rough[y * px + x] = ro;
    }
  }
  g.putImageData(img, 0, 0);
  // Inlaid stars where four slabs meet: black marble, a plum ring, a silver dot
  const star = (cx: number, cy: number, rad: number, fill: string) => {
    g.fillStyle = fill;
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillRect(-rad, -rad, rad * 2, rad * 2);
      g.restore();
    }
  };
  // Only at the module's corners (every 2.4 m), as cabochons are laid
  for (const [cx, cy] of [
    [0, 0],
    [px, 0],
    [0, px],
    [px, px],
  ]) {
    star(cx, cy, slab * 0.1, "#5a1040");
    star(cx, cy, slab * 0.082, "#1c1416");
    g.fillStyle = "#cfd3da";
    g.beginPath();
    g.arc(cx, cy, slab * 0.016, 0, Math.PI * 2);
    g.fill();
  }
  const map = tex(c, [1, 1]);

  // Relief: the joints are a hair lower (a normal map from their edges)
  const [nc, ng] = canvas(px, px);
  const nimg = ng.createImageData(px, px);
  const nd = nimg.data;
  for (let y = 0; y < px; y++)
    for (let x = 0; x < px; x++) {
      const jx = x % slab;
      const jy = y % slab;
      let dx = 0;
      let dy = 0;
      if (jx < joint + 1) dx = jx < joint / 2 ? 0.6 : -0.6;
      if (jy < joint + 1) dy = jy < joint / 2 ? 0.6 : -0.6;
      const i = (y * px + x) * 4;
      nd[i] = 128 + dx * 127;
      nd[i + 1] = 128 + dy * 127;
      nd[i + 2] = 255;
      nd[i + 3] = 255;
    }
  ng.putImageData(nimg, 0, 0);
  const normalMap = tex(nc, [1, 1], false);

  // Polish: glossy slabs, matt joints and inlays a touch softer
  const [rc, rg] = canvas(px, px);
  const rimg = rg.createImageData(px, px);
  const rd = rimg.data;
  for (let i = 0; i < px * px; i++) {
    rd[i * 4] = rd[i * 4 + 1] = rd[i * 4 + 2] = rough[i];
    rd[i * 4 + 3] = 255;
  }
  rg.putImageData(rimg, 0, 0);
  const roughnessMap = tex(rc, [1, 1], false);
  return { map, normalMap, roughnessMap };
}

/**
 * The inlaid border that runs near the walls: a band of black marble between
 * fine plum and silver fillets, small cream stars along it (one 2.4 m length).
 */
export function inlayBand() {
  const W = 1024;
  const H = 128;
  const [c, g] = canvas(W, H);
  const fbm = makeFbm(3);
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = fbm(x / 60, y / 60, 4);
      const v = Math.max(0, 1 - Math.abs(Math.sin(x / 40 + n * 6)) / 0.05) * 0.5;
      const i = (y * W + x) * 4;
      img.data[i] = 26 + n * 14 + v * 90;
      img.data[i + 1] = 20 + n * 12 + v * 86;
      img.data[i + 2] = 23 + n * 13 + v * 84;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  g.fillStyle = "#6a1248";
  g.fillRect(0, 0, W, 10);
  g.fillRect(0, H - 10, W, 10);
  g.fillStyle = "#cfd3da";
  g.fillRect(0, 12, W, 3);
  g.fillRect(0, H - 15, W, 3);
  for (let i = 0; i < 4; i++) {
    const cx = (i + 0.5) * (W / 4);
    for (const rot of [0, Math.PI / 4]) {
      g.save();
      g.translate(cx, H / 2);
      g.rotate(rot);
      g.fillStyle = "#e8dfd2";
      g.fillRect(-20, -20, 40, 40);
      g.restore();
    }
    g.fillStyle = "#6a1248";
    g.beginPath();
    g.arc(cx, H / 2, 8, 0, Math.PI * 2);
    g.fill();
  }
  return tex(c, [1, 1]);
}
