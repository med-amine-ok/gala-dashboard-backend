"use client";

import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  CHAPTER_IMAGES,
  MovementIndex,
  NUMERALS,
  type Chapter,
} from "../components/gala/Programme";
import { useLanguage } from "../../context/LanguageContext";
import {
  CountUp,
  DrawnRule,
  GALA_EASE,
  GalaButton,
  GalaFrame,
  RoomMasthead,
} from "../components/gala/Room";
import Stage3D, {
  optimisedImage,
  stageDust,
  type StageContext,
} from "../components/gala/Stage3D";

const EDITION_IMAGES: Record<string, string> = {
  "2017": "/images/2017.jpg",
  "2018": "/images/2018.jpg",
  "2019": "/images/2019.png",
  "2021": "/images/2021.jpg",
  "2022": "/images/2022.jpg",
  "2023": "/images/2023.jpg",
  "2024": "/images/2024.webp",
  "2025": "/images/2025.webp",
};
/* Every edition from the first, in order, arriving at this year (2026, the
   programme). Editions without a photograph yet are shown as an engraved
   year card until their pictures are added to EDITION_IMAGES. */
const YEARS = ["2017", "2018", "2019", "2021", "2022", "2023", "2024", "2025"];

interface Edition {
  year: string;
  title: string;
  story: string;
  stats: { value: string; label: string }[];
  image?: string;
}

/**
 * III · THE CHAPTERS — the reel
 * Real 3D (three.js): the past editions and this year's four acts hang on a
 * great curved wall around you, like the inside of a panorama, mirrored softly
 * in a dark glossy floor. Scrolling turns the reel; each photograph stays a
 * simple flat print, hung on the arc facing you. The words for
 * the photograph in front of you roll in beneath it, and a rail of chapters
 * (I 2017 … V 2026) shows where you are and takes you to any of them.
 * Reduced motion: the editions as an editorial column, then the four acts.
 */
export default function ArchivesSection() {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const chapters: Chapter[] = texts.thisYear?.chapters || [];
  const reduceMotion = useReducedMotion();

  const editions: Edition[] = YEARS.map((year) => {
    const e = a.editions?.[year] || {};
    return {
      year,
      // The year is shown on its own; keep only the edition's name
      title: (e.title || `GALA ${year}`).replace(/^(GALA\s+)?\d{4}\s*·\s*/, ""),
      story: e.story || "",
      stats: e.stats || [],
      image: EDITION_IMAGES[year],
    };
  });

  return (
    <section className="relative w-full bg-transparent text-[var(--color-cream)]">
      {reduceMotion && (
        <div className="px-6 sm:px-12">
          <RoomMasthead
            numeral="III"
            label="THE CHAPTERS"
            headline={a.headline || "Every edition leaves a story."}
            intro={a.subheadline}
          />
        </div>
      )}
      {reduceMotion ? (
        <>
          <EditionColumn editions={editions} />
          <div className="mt-24">
            <MovementIndex />
          </div>
        </>
      ) : (
        <ChaptersReel editions={editions} chapters={chapters} />
      )}

      {reduceMotion && (
        <div className="relative flex justify-center px-6 pb-28 pt-10 sm:pb-36">
          <GalaButton href="#tarification">
            {a.joinCTA || "JOIN THE 2026 EDITION"}
          </GalaButton>
        </div>
      )}
    </section>
  );
}

/** Phones and tablets: an editorial column, each edition its own spread */
function EditionColumn({ editions }: { editions: Edition[] }) {
  return (
    <ol className="mx-auto mt-16 flex max-w-xl flex-col gap-24 px-6 sm:px-12">
      {editions.map((e, i) => (
        <motion.li
          key={e.year}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, ease: GALA_EASE }}
        >
          <div className="flex items-end justify-between">
            <span className="font-cinzel text-[clamp(72px,22vw,120px)] font-semibold leading-[0.85] gala-engraved">
              {e.year}
            </span>
            <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-silver)]">
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(editions.length).padStart(2, "0")}
            </span>
          </div>
          <DrawnRule className="mt-3" />
          <GalaFrame className="mt-6">
            <div
              data-gala-media={e.image ? "" : undefined}
              className="relative aspect-[3/2] overflow-hidden"
            >
              {e.image ? (
                <Image
                  src={e.image}
                  alt={e.title}
                  fill
                  sizes="(max-width: 640px) 90vw, 560px"
                  className="object-cover [filter:brightness(0.88)_contrast(1.06)_saturate(0.85)]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_center,#4a0c32,#1d0210)]">
                  <span className="font-cinzel text-[64px] font-semibold gala-engraved">{e.year}</span>
                </div>
              )}
            </div>
          </GalaFrame>
          <h3 className="mt-6 font-cormorant text-[28px] italic leading-tight text-[var(--color-cream)]">
            {e.title}
          </h3>
          <p className="mt-3 text-[15px] font-light leading-relaxed text-[var(--color-cream)]/72">
            {e.story}
          </p>
          <Stats stats={e.stats} />
        </motion.li>
      ))}
    </ol>
  );
}

function Stats({ stats }: { stats: Edition["stats"] }) {
  if (!stats.length) return null;
  return (
    <dl className="mt-7 grid grid-cols-3 border-t border-[var(--color-silver)]/15">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`pt-4 ${i > 0 ? "border-l border-[var(--color-silver)]/12 pl-4" : ""}`}
        >
          <dd className="font-cinzel text-[26px] font-semibold leading-none gala-engraved sm:text-[32px]">
            <CountUp value={s.value} />
          </dd>
          <dt className="mt-2 text-[9px] font-semibold uppercase leading-snug tracking-[0.2em] text-[var(--color-cream)]/55 sm:text-[9.5px]">
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/* ───────────────────────────── The film ───────────────────────────── */

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

type ReelItem =
  | { kind: "edition"; src: string; edition: Edition; chapter: number }
  | { kind: "act"; src: string; act: Chapter; index: number; chapter: number };

function ChaptersReel({
  editions,
  chapters,
}: {
  editions: Edition[];
  chapters: Chapter[];
}) {
  const { texts } = useLanguage();
  const a = texts.archives || {};
  const y = texts.thisYear || {};
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const P = editions.length;
  const items: ReelItem[] = [
    ...editions.map((e, i) => ({
      kind: "edition" as const,
      src: e.image || `year:${e.year}`,
      edition: e,
      chapter: i,
    })),
    ...chapters.map((c, i) => ({
      kind: "act" as const,
      src: CHAPTER_IMAGES[c.id] || CHAPTER_IMAGES.people,
      act: c,
      index: i,
      chapter: P,
    })),
  ];
  const N = items.length;

  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
    setActive(Math.min(N - 1, Math.max(0, Math.round(v * (N - 1)))));
  });
  // The reel is built once; its photographs never change
  const setup = useCallback(
    (ctx: StageContext) =>
      buildReel(
        ctx,
        items.map((it) => it.src),
        progress,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + ((el.offsetHeight - window.innerHeight) * i) / (N - 1) + 2,
      behavior: "smooth",
    });
  };

  const it = items[active];
  const chapterNow = it.chapter;

  return (
    <>
      <div
        ref={ref}
        className="relative"
        style={{ height: `${N * 55 + 30}vh` }}
      >
        {/* Menu links to the programme land on Chapter V */}
        <div
          id="piliers"
          aria-hidden
          className="pointer-events-none absolute left-0"
          style={{ top: `calc((100% - 100vh) * ${P / Math.max(1, N - 1)})` }}
        />

        <div className="sticky top-0 h-[100dvh] overflow-hidden">
          <Stage3D setup={setup} className="absolute inset-0" />

          {/* The room's title, above the reel */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[76px] sm:px-10 lg:pt-[84px]">
            <div className="mx-auto flex max-w-7xl items-baseline justify-between gap-6">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">
                III · {a.label || "THE ARCHIVES"}
              </span>
              <span className="hidden whitespace-pre-line text-right font-cormorant text-[clamp(18px,1.6vw,24px)] italic leading-tight text-[var(--color-cream)]/80 sm:block">
                {(chapterNow < P ? a.headline : y.headline) || ""}
              </span>
            </div>
          </div>

          {/* A shade over the floor so the words read clearly */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[46%] bg-[linear-gradient(0deg,rgba(24,2,14,0.92)_0%,rgba(24,2,14,0.6)_45%,transparent_100%)]" />
        {/* The words for the photograph in front of you */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-10 px-5 sm:bottom-[96px] sm:px-10">
            <div className="mx-auto max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div key={active} className="max-w-xl">
                  <RollLine delay={0}>
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--color-silver)]">
                      Chapter {ROMAN[chapterNow]} ·{" "}
                      {it.kind === "edition"
                        ? it.edition.year
                        : `2026 · ${y.label || "This year"} · ${NUMERALS[it.index]}`}
                    </span>
                  </RollLine>
                  <RollLine delay={0.06}>
                    <h3 className="mt-2 font-cormorant text-[clamp(28px,3.4vw,52px)] italic leading-[1.05] text-[var(--color-cream)]">
                      {it.kind === "edition" ? it.edition.title : it.act.title}
                    </h3>
                  </RollLine>
                  <RollLine delay={0.12}>
                    <p className="mt-2 line-clamp-2 text-[13.5px] font-light leading-relaxed text-[var(--color-cream)]/72 sm:text-[14.5px]">
                      {it.kind === "edition"
                        ? it.edition.story
                        : it.act.description}
                    </p>
                  </RollLine>
                  {it.kind === "edition" && it.edition.stats.length > 0 && (
                    <RollLine delay={0.18}>
                      <dl className="mt-3 hidden gap-8 sm:flex">
                        {it.edition.stats.map((st) => (
                          <div key={st.label}>
                            <dd className="font-cinzel text-[24px] font-semibold leading-none gala-engraved">
                              <CountUp value={st.value} />
                            </dd>
                            <dt className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]/55">
                              {st.label}
                            </dt>
                          </div>
                        ))}
                      </dl>
                    </RollLine>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* The chapter rail */}
          <nav
            aria-label="Chapters"
            className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 sm:px-10 sm:pb-7"
          >
            <div className="relative mx-auto max-w-7xl">
              <div className="absolute left-0 right-0 top-[5px] h-px bg-[var(--color-silver)]/15" />
              <motion.div
                className="absolute left-0 top-[5px] h-px origin-left bg-[linear-gradient(90deg,var(--color-silver),var(--color-silver-light))]"
                style={{ scaleX: scrollYProgress, width: "100%" }}
              />
              {/* One stop for every photograph on the reel, where it stands
                  along the scroll: a year for each edition, then 2026 and
                  small stops for this year's four acts */}
              <ol className="relative h-9">
                {items.map((item, k) => {
                  const at = (k / Math.max(1, N - 1)) * 100;
                  const isYear = item.kind === "edition" || k === P;
                  const chapter = item.chapter;
                  const reached = k <= active;
                  const current = isYear ? chapter === chapterNow && (k < P || active >= P) : k === active;
                  const label = item.kind === "edition" ? item.edition.year : "2026";
                  return (
                    <li
                      key={k}
                      className={`absolute top-0 ${k === 0 ? "" : k === N - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                      style={{ left: `${at}%` }}
                    >
                      <button
                        type="button"
                        onClick={() => goTo(k)}
                        aria-label={
                          isYear
                            ? `Chapter ${ROMAN[chapter]}, ${label}`
                            : `2026, ${NUMERALS[item.kind === "act" ? item.index : 0]}`
                        }
                        aria-current={k === active ? "step" : undefined}
                        className={`group flex flex-col gap-2 luxury-focus-ring ${k === 0 ? "items-start" : k === N - 1 ? "items-end" : "items-center"}`}
                      >
                        <span
                          className={`block rotate-45 border transition-colors duration-700 ${
                            isYear ? "h-[11px] w-[11px]" : "mt-[2px] h-[7px] w-[7px]"
                          } ${
                            reached
                              ? "border-[var(--color-silver-light)] bg-[var(--color-silver-light)]"
                              : "border-[var(--color-silver)]/40 bg-[#1d0210] group-hover:border-[var(--color-silver-light)]"
                          }`}
                        />
                        {isYear && (
                          <span
                            className={`whitespace-nowrap font-cinzel text-[10.5px] tracking-[0.2em] transition-opacity duration-700 ${current ? "opacity-100" : "opacity-45 group-hover:opacity-80"}`}
                          >
                            <span className="text-[var(--color-silver-light)]">{ROMAN[chapter]}</span>
                            <span className="ml-1.5 hidden lg:inline">{label}</span>
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>
        </div>
      </div>
      {/* After the reel: the invitation onward */}
      <div className="flex justify-center px-6 pb-20 pt-12">
        <GalaButton href="#tarification">
          {a.joinCTA || "JOIN THE 2026 EDITION"}
        </GalaButton>
      </div>
    </>
  );
}

/** A line that rolls up into view from beneath a mask */
function RollLine({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "105%" }}
        animate={{
          y: "0%",
          transition: { duration: 0.75, delay: 0.15 + delay, ease: GALA_EASE },
        }}
        exit={{ y: "-105%", transition: { duration: 0.3, ease: GALA_EASE } }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* The reel in WebGL ------------------------------------------------------------ */

const REEL_VERT = /* glsl */ `
  uniform float uAngle;   // where along the wall this photograph hangs (radians)
  uniform float uRadius;
  uniform float uMirror;  // 1 for the reflection on the floor
  uniform float uFloor;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Each photograph stays a flat print, hung on the arc facing you
    float y = p.y;
    if (uMirror > 0.5) y = 2.0 * uFloor - y;
    vec3 c = vec3(sin(uAngle) * uRadius, 0.0, -cos(uAngle) * uRadius);
    vec3 tangent = vec3(cos(uAngle), 0.0, sin(uAngle));
    vec3 w = c + tangent * p.x + vec3(0.0, y, 0.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  }
`;

const REEL_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uHas;
  uniform vec2 uRepeat;
  uniform vec2 uOffset;
  uniform float uAspect;
  uniform float uMirror;
  uniform float uOpacity;
  varying vec2 vUv;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float d = sdRoundBox(p, vec2(uAspect * 0.5, 0.5), 0.02);
    float aa = fwidth(d);
    float alpha = 1.0 - smoothstep(-aa, aa, d);
    vec3 col = uHas > 0.5 ? texture2D(map, vUv * uRepeat + uOffset).rgb : vec3(0.12, 0.02, 0.08);
    // A hairline of silver at the edge
    col = mix(col, vec3(0.86, 0.88, 0.92), smoothstep(-0.007 - aa, -0.007 + aa, d) * 0.7);
    if (uMirror > 0.5) {
      // The reflection fades away from the floor line
      alpha *= pow(1.0 - vUv.y, 2.2) * 0.26;
    }
    gl_FragColor = vec4(col, alpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

/** A card for an edition awaiting its photographs: the year, engraved in silver on plum */
function yearCard(year: string) {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 800;
  const g = c.getContext("2d")!;
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
  g.fillStyle = "rgba(214,219,226,0.55)";
  g.font = `600 30px ${serif}`;
  g.fillText("ENGINEERS' GALA", 600, 560);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildReel(
  ctx: StageContext,
  images: string[],
  progress: { current: number },
) {
  const { scene, camera, isMobile } = ctx;
  const N = images.length;
  const W = isMobile ? 3.1 : 4.6;
  const H = W / 1.5;
  const R = isMobile ? 6.2 : 8.4;
  const GAP = isMobile ? 0.35 : 0.5;
  const STEP = (W + GAP) / R; // radians between photographs
  const FLOOR = -H / 2 - 0.12;
  const LIFT = isMobile ? 0.55 : 0.35; // the wall sits a little above the eye line

  type Frame = {
    photo: THREE.ShaderMaterial;
    mirror: THREE.ShaderMaterial;
    meshes: THREE.Mesh[];
    shown: number;
  };
  // Only the photographs near the front are drawn: with every edition on the
  // reel it would otherwise wrap round the room and show behind the others
  const SHOWN = 1.25; // radians either side of straight ahead
  const frames: Frame[] = images.map((src) => {
    const geo = new THREE.PlaneGeometry(W, H);
    const make = (mirror: boolean) =>
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: null },
          uHas: { value: 0 },
          uRepeat: { value: new THREE.Vector2(1, 1) },
          uOffset: { value: new THREE.Vector2(0, 0) },
          uAspect: { value: W / H },
          uAngle: { value: 0 },
          uRadius: { value: R },
          uMirror: { value: mirror ? 1 : 0 },
          uFloor: { value: FLOOR },
          uOpacity: { value: 0 },
        },
        vertexShader: REEL_VERT,
        fragmentShader: REEL_FRAG,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
    const photo = make(false);
    const mirror = make(true);
    const m1 = new THREE.Mesh(geo, photo);
    const m2 = new THREE.Mesh(geo, mirror);
    m1.frustumCulled = m2.frustumCulled = false;
    m1.renderOrder = 2;
    m2.renderOrder = 1;
    scene.add(m1, m2);
    const f: Frame = { photo, mirror, meshes: [m1, m2], shown: 0 };
    // An edition without photographs yet: its year engraved on velvet
    const source: Promise<THREE.Texture> = src.startsWith("year:")
      ? Promise.resolve(yearCard(src.slice(5)))
      : ctx.texture(optimisedImage(src, isMobile ? 1200 : 1920));
    source.then((t) => {
      const img = t.image as { width: number; height: number };
      const ia = img.width / img.height;
      const fa = W / H;
      const rep =
        ia > fa ? new THREE.Vector2(fa / ia, 1) : new THREE.Vector2(1, ia / fa);
      const off = new THREE.Vector2((1 - rep.x) / 2, (1 - rep.y) / 2);
      for (const m of [photo, mirror]) {
        m.uniforms.map.value = t;
        m.uniforms.uHas.value = 1;
        m.uniforms.uRepeat.value.copy(rep);
        m.uniforms.uOffset.value.copy(off);
      }
    });
    return f;
  });

  // A soft rose light on the wall straight ahead, and dust in the room
  const glow = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(211,55,145,0.35)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.Mesh(
      new THREE.PlaneGeometry(W * 3, H * 3),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
  })();
  glow.position.set(0, 0, -R - 0.6);
  glow.renderOrder = 0;
  scene.add(glow);
  const dust = stageDust(
    isMobile ? 160 : 300,
    new THREE.Vector3(R * 2, 6, R * 2),
    0.045,
  );
  scene.add(dust);

  let rot = 0;
  const look = new THREE.Vector3();
  return {
    update(dt: number, t: number) {
      const target = progress.current * (N - 1) * STEP;
      rot = THREE.MathUtils.damp(rot, target, 3.6, dt);

      frames.forEach((f, i) => {
        const angle = i * STEP - rot;
        // Photographs fade in on arrival; far ones rest quietly
        f.shown = Math.min(1, f.shown + dt * 1.5);
        const away = Math.abs(angle);
        const visible = away < SHOWN;
        for (const mesh of f.meshes) mesh.visible = visible;
        if (!visible) return;
        // Neighbours are a little quieter, and fade out towards the edge
        const fade = 1 - THREE.MathUtils.smoothstep(away, SHOWN * 0.7, SHOWN);
        for (const m of [f.photo, f.mirror]) {
          m.uniforms.uAngle.value = angle;
          m.uniforms.uOpacity.value = f.shown * fade * (1 - Math.min(1, away / 1.4) * 0.45);
        }
      });
      dust.rotation.y = t * 0.02 - rot * 0.3;

      camera.position.set(
        ctx.pointer.x * 0.25,
        -LIFT + ctx.pointer.y * 0.12,
        0,
      );
      look.set(ctx.pointer.x * 0.6, -LIFT * 0.4, -R);
      camera.lookAt(look);
    },
    resize(w: number, h: number) {
      camera.fov = w / h < 0.8 ? 64 : 42;
      camera.near = 0.1;
      camera.updateProjectionMatrix();
    },
  };
}
