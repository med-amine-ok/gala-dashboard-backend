"use client";

import { useCallback, useRef } from "react";
import * as THREE from "three";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CountUp, DrawnRule, GALA_EASE, RoomMasthead } from "../components/gala/Room";
import Stage3D, { type StageContext } from "../components/gala/Stage3D";

/**
 * VI · THE HOSTS
 * The Vision & Innovation Club, presented like a house crest: their story on one
 * side, the club's seal on the other, then the figures — set inside a slow
 * constellation of silver points that gathers as a ring, swells into a sphere
 * and unwinds into a galaxy as you scroll past — and the three principles.
 */
export default function AboutUsSection() {
  const { texts } = useLanguage();
  const s = texts.story || {};
  const stats: { value: string; label: string }[] = s.stats || [];
  const pillars: { title: string; desc: string }[] = s.pillars || [];

  return (
    <section className="relative w-full overflow-hidden bg-transparent px-6 py-28 text-[var(--color-cream)] sm:px-12 sm:py-36 font-sans">
      <div className="relative z-10 mx-auto max-w-6xl">
        <RoomMasthead numeral="VI" label={s.roomLabel || "THE HOSTS"} headline={s.headline || "The story behind the night."} />

        {/* The belief, set large, beside the club's seal */}
        <div className="mt-20 grid grid-cols-1 items-center gap-16 sm:mt-28 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {s.lead && (
              <motion.blockquote
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.2, ease: GALA_EASE }}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-2 -top-14 font-cormorant text-[140px] leading-none gala-engraved opacity-60 sm:-left-8 sm:-top-20 sm:text-[200px]"
                >
                  “
                </span>
                <p className="relative whitespace-pre-line font-cormorant text-[clamp(28px,3.6vw,52px)] italic leading-[1.12] text-[var(--color-cream)]">
                  {s.lead}
                </p>
              </motion.blockquote>
            )}
            <DrawnRule className="mt-10 max-w-sm" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {[s.paragraph1, s.paragraph2].filter(Boolean).map((p: string, i: number) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1, delay: 0.15 + i * 0.12, ease: GALA_EASE }}
                  className="text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/72"
                >
                  {p}
                </motion.p>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.4, ease: GALA_EASE }}
            className="flex justify-center lg:col-span-5"
          >
            <ClubCrest />
          </motion.div>
        </div>

        {/* The figures, at display size across the room */}
        {stats.length > 0 && (
          <Constellation>
          <dl className="relative z-10 grid grid-cols-3 border-y border-[var(--color-silver)]/15">
            {stats.map((st, i) => (
              <motion.div
                key={st.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.1, delay: i * 0.1, ease: GALA_EASE }}
                className={`flex flex-col items-center gap-3 px-1 py-8 text-center sm:py-12 ${i > 0 ? "border-l border-[var(--color-silver)]/12" : ""}`}
              >
                <dd className="font-cinzel text-[clamp(34px,8.5vw,128px)] font-semibold leading-none gala-engraved">
                  <CountUp value={st.value} />
                </dd>
                <dt className="text-[8.5px] font-semibold uppercase leading-snug tracking-[0.18em] text-[var(--color-cream)]/60 sm:text-[11px] sm:tracking-[0.3em]">
                  {st.label}
                </dt>
              </motion.div>
            ))}
          </dl>
          </Constellation>
        )}

        {/* The three principles */}
        {pillars.length > 0 && (
          <ol className="mt-20 grid grid-cols-1 gap-14 sm:mt-24 md:grid-cols-3 md:gap-10">
            {pillars.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1, delay: i * 0.12, ease: GALA_EASE }}
                className="relative"
              >
                <span className="block font-cinzel text-[56px] font-semibold leading-none gala-engraved opacity-90">
                  {["I", "II", "III"][i]}
                </span>
                <DrawnRule className="mt-5" />
                <h3 className="mt-5 font-cormorant text-[28px] italic leading-tight text-[var(--color-cream)]">{p.title}</h3>
                <p className="mt-3 text-[14.5px] font-light leading-relaxed text-[var(--color-cream)]/70">{p.desc}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/**
 * The club's mark, and nothing else: the Vision & Innovation Club lockup in
 * brushed silver foil, one hairline and one engraved line beneath. A band of
 * light passes across the foil as the visitor scrolls by.
 */
function ClubCrest() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sheen = useTransform(scrollYProgress, [0.15, 0.85], ["130%", "-30%"]);
  const MASK =
    "[mask-image:url(/images/vic-lockup.png)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-image:url(/images/vic-lockup.png)] [-webkit-mask-size:contain] [-webkit-mask-repeat:no-repeat] [-webkit-mask-position:center]";

  return (
    <div ref={ref} className="flex w-[min(78vw,400px)] flex-col items-center">
      <div className="relative aspect-[900/365] w-full [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.18))_drop-shadow(0_18px_30px_rgba(5,1,4,0.7))]">
        <div role="img" aria-label="Vision & Innovation Club" className={`absolute inset-0 gala-brushed ${MASK}`} />
        {/* Light passing over the foil */}
        <motion.div
          aria-hidden="true"
          style={reduceMotion ? undefined : { backgroundPositionX: sheen }}
          className={`absolute inset-0 bg-[linear-gradient(100deg,transparent_40%,rgba(255,255,255,0.75)_50%,transparent_60%)] bg-[length:250%_100%] mix-blend-soft-light ${MASK}`}
        />
      </div>
      <span aria-hidden="true" className="mt-10 block h-px w-16 bg-gradient-to-r from-transparent via-[var(--color-silver)]/70 to-transparent" />
      <span className="mt-5 whitespace-nowrap text-center font-cinzel text-[8.5px] font-semibold tracking-[0.3em] text-[var(--color-silver)] sm:text-[10px] sm:tracking-[0.34em]">
        ÉCOLE NATIONALE POLYTECHNIQUE · 2014
      </span>
    </div>
  );
}

/* ───────────────────────────── The constellation ───────────────────────────── */

function Constellation({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => (progress.current = v));
  const setup = useCallback((ctx: StageContext) => buildConstellation(ctx, progress), []);
  return (
    <div ref={ref} className="relative mt-16 py-20 sm:mt-20 sm:py-28">
      <Stage3D setup={setup} className="absolute inset-x-[-10vw] inset-y-0 [mask-image:radial-gradient(ellipse_at_center,#000_45%,transparent_75%)]" />
      {children}
    </div>
  );
}

/** Points that morph ring → sphere → galaxy with scroll, turning slowly */
function buildConstellation(ctx: StageContext, progress: { current: number }) {
  const { scene, camera, isMobile } = ctx;
  const N = isMobile ? 1400 : 2600;
  const ring = new Float32Array(N * 3);
  const sphere = new Float32Array(N * 3);
  const galaxy = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const silver = new THREE.Color(0xe8ecf4);
  const rose = new THREE.Color(0xd33791);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    // A ring with a little thickness
    const a = (i / N) * Math.PI * 2 * 3 + Math.random() * 0.2;
    const rr = 3.2 + (Math.random() - 0.5) * 0.35;
    ring.set([Math.cos(a) * rr, (Math.random() - 0.5) * 0.18, Math.sin(a) * rr], i * 3);
    // A sphere (Fibonacci shell)
    const y = 1 - (2 * (i + 0.5)) / N;
    const sr = Math.sqrt(1 - y * y);
    const phi = i * 2.39996;
    const R = 2.5 + (Math.random() - 0.5) * 0.1;
    sphere.set([Math.cos(phi) * sr * R, y * R, Math.sin(phi) * sr * R], i * 3);
    // A three-armed spiral galaxy
    const arm = (i % 3) * ((Math.PI * 2) / 3);
    const d = Math.pow(r, 0.6) * 4.6;
    const g = arm + d * 1.1;
    const sc = (1 - r) * 0.5 + 0.12;
    galaxy.set(
      [Math.cos(g) * d + (Math.random() - 0.5) * sc, (Math.random() - 0.5) * sc * 0.6, Math.sin(g) * d + (Math.random() - 0.5) * sc],
      i * 3,
    );
    c.copy(silver).lerp(rose, Math.random() < 0.22 ? 0.85 : Math.random() * 0.15);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const pos = new Float32Array(ring);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const sprite = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 32;
    const g2 = cv.getContext("2d")!;
    const grad = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.4)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(cv);
  })();
  const mat = new THREE.PointsMaterial({
    size: isMobile ? 0.1 : 0.09,
    map: sprite,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  camera.position.set(0, 2, 7.5);
  camera.lookAt(0, 0, 0);

  let p = 0;
  return {
    update(dt: number, t: number) {
      p = THREE.MathUtils.damp(p, progress.current, 3, dt);
      // 0 → 0.5: ring to sphere; 0.5 → 1: sphere to galaxy
      const k1 = THREE.MathUtils.smoothstep(p, 0.15, 0.45);
      const k2 = THREE.MathUtils.smoothstep(p, 0.55, 0.85);
      for (let i = 0; i < N * 3; i++) {
        const ab = ring[i] + (sphere[i] - ring[i]) * k1;
        pos[i] = ab + (galaxy[i] - ab) * k2;
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y = t * 0.06 + ctx.pointer.x * 0.5;
      points.rotation.x = 0.15 + ctx.pointer.y * 0.25 + k2 * 0.25;
      mat.opacity = 0.9 + 0.1 * Math.sin(t * 0.8);
    },
    resize(w: number) {
      camera.position.z = w < 700 ? 10 : 7.5;
    },
  };
}
