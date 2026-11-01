"use client";

import { useMemo, useState, Suspense, useId, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  useAnimate,
} from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, ChevronDown, AlertCircle, PenLine, RotateCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as z from "zod";
import { useLanguage } from "../../context/LanguageContext";
import { GALA_EASE, GalaStar } from "../components/gala/Room";

const fieldOfStudyOptions = [
  { value: "hydraulics", label: "Hydraulics Engineering" },
  { value: "green_hydrogen", label: "Green Hydrogen & Clean Energy" },
  { value: "civil", label: "Civil Engineering" },
  { value: "chemical", label: "Chemical Engineering" },
  { value: "materials", label: "Materials Science & Engineering" },
  { value: "mining", label: "Mining Engineering" },
  { value: "industrial", label: "Industrial Engineering" },
  { value: "mechanical", label: "Mechanical Engineering" },
  { value: "automotive", label: "Automotive Engineering" },
  { value: "environmental", label: "Environmental Engineering" },
  { value: "electrical", label: "Electrical Engineering" },
  { value: "electronics", label: "Electronics Engineering" },
  { value: "qhse", label: "QHSE & Industrial Safety" },
  { value: "automation", label: "Automation & Robotics" },
  { value: "datascience_ai", label: "Data Science & Artificial Intelligence" },
  { value: "OTHER", label: "Other Discipline" },
];

const universityOptions = [
  { value: "ENP", label: "École Nationale Polytechnique (ENP)" },
  { value: "ENSTA", label: "ENSTA" },
  { value: "USTHB", label: "USTHB" },
  { value: "ESAA", label: "ESAA" },
  { value: "ENSTP", label: "ENSTP" },
  { value: "OTHER", label: "Other Institution" },
];

const heardAboutOptions = [
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Through a Friend", label: "Colleague Recommendation" },
  { value: "OTHER", label: "Other" },
];

const createRegistrationSchema = (lang: "fr" | "en") => {
  const messages = {
    fr: {
      invalidEmail: "Adresse e-mail invalide",
      required: "Ce champ est obligatoire",
    },
    en: {
      invalidEmail: "Invalid email address",
      required: "This field is required",
    },
  }[lang] || {
    invalidEmail: "Invalid email address",
    required: "This field is required",
  };

  return z.object({
    email: z.string().email(messages.invalidEmail),
    first_name: z.string().min(1, messages.required),
    last_name: z.string().min(1, messages.required),
    phone: z.string().min(1, messages.required),
    participant_type: z.enum(["ST", "G"]).default("ST"),

    university: z.enum(["ENP", "ENSTA", "USTHB", "ESAA", "ENSTP", "OTHER"]),
    university_other: z.string().optional(),

    field_of_study: z.enum([
      "hydraulics",
      "datascience_ai",
      "green_hydrogen",
      "civil",
      "materials",
      "mining",
      "industrial",
      "mechanical",
      "automotive",
      "environmental",
      "electrical",
      "electronics",
      "qhse",
      "automation",
      "OTHER",
      "chemical",
    ]),
    field_of_study_other: z.string().optional(),

    academic_level: z.enum([
      "Bachelor’s Degree",
      "Master’s Degree",
      "Engineering Degree",
      "PhD",
      "Postgraduate Studies (PGS)",
      "OTHER",
    ]),
    academic_level_other: z.string().optional(),

    graduation_year: z.enum([
      "2023",
      "2024",
      "2025",
      "2026",
      "2027",
      "2028",
      "OTHER",
    ]),
    graduation_year_other: z.string().optional(),

    current_year: z.enum(["1", "2", "3", "4", "5", "GRADUATED"]).default("1"),
    plans_next_year: z.string().min(1, messages.required),
    personal_description: z.string().optional(),
    perspective_gala: z.string().min(1, messages.required),
    benefit_from_event: z.string().min(1, messages.required),
    attended_before: z.boolean().default(false),
    heard_about: z.enum([
      "Facebook",
      "Instagram",
      "Through a Friend",
      "LinkedIn",
      "OTHER",
    ]),
    heard_about_other: z.string().optional(),
    additional_comments: z.string().optional(),
  });
};

type RegistrationData = z.infer<ReturnType<typeof createRegistrationSchema>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Texts = any;

/** Label text without the trailing " *" (required is shown as its own mark) */
const plainLabel = (s: string | undefined, fallback: string) => (s || fallback).replace(/\s*\*\s*$/, "");
/** Step titles arrive as "01 PERSONAL": keep the word */
const stepWord = (s: string | undefined, fallback: string) => (s || fallback).replace(/^\d+\s*/, "");

function RegistrationContent() {
  const searchParams = useSearchParams();
  const requestedTier = searchParams.get("tier") || "signature";

  const [step, setStep] = useState<number>(1);
  const [done, setDone] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { lang, texts } = useLanguage();

  const registrationSchema = useMemo(() => {
    return createRegistrationSchema(lang as "fr" | "en");
  }, [lang]);

  const methods = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema) as never,
    // Check each field as it is left, then again on Continue
    mode: "onTouched",
    defaultValues: {
      attended_before: false,
      participant_type: "ST",
      current_year: "1",
      university: "ENP",
      field_of_study: "datascience_ai",
      academic_level: "Engineering Degree",
      graduation_year: "2026",
      heard_about: "LinkedIn",
    },
  });

  const { handleSubmit, watch, trigger, setError } = methods;

  const onSubmit = async (data: RegistrationData) => {
    setSubmitError(null);
    setLoading(true);

    const payload = {
      ...data,
      university_other:
        data.university === "OTHER" ? data.university_other || "" : "",
      field_of_study_other:
        data.field_of_study === "OTHER" ? data.field_of_study_other || "" : "",
      academic_level_other:
        data.academic_level === "OTHER" ? data.academic_level_other || "" : "",
      graduation_year_other:
        data.graduation_year === "OTHER"
          ? data.graduation_year_other || ""
          : "",
      heard_about_other:
        data.heard_about === "OTHER" ? data.heard_about_other || "" : "",
    };

    try {
      let response = await fetch("/api/participants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok && response.status === 404) {
        const defaultUrl =
          process.env.NODE_ENV === "production"
            ? "https://gala-dashboard-backend.onrender.com"
            : "http://127.0.0.1:8000";
        const apiBaseUrl = (
          process.env.NEXT_PUBLIC_API_BASE_URL || defaultUrl
        ).replace(/\/$/, "");
        response = await fetch(`${apiBaseUrl}/api/participants/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const resJson = await response.json().catch(() => null);

      if (!response.ok) {
        if (resJson) {
          if (resJson.email) {
            const emailMsg = Array.isArray(resJson.email)
              ? resJson.email.join(" ")
              : String(resJson.email);
            setError("email", { message: emailMsg });
            setSubmitError(emailMsg);
            setStep(1);
            return;
          }
          if (resJson.error || resJson.detail || resJson.details) {
            setSubmitError(resJson.error || resJson.detail || resJson.details);
            return;
          }
        }
        setSubmitError(
          texts.register?.errors?.submit ||
            "Failed to submit request. Please verify your details.",
        );
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(
        texts.register?.errors?.network ||
          "Unable to connect to the secure server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegistrationData)[] = [];

    if (step === 1) {
      fieldsToValidate = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "university",
        "field_of_study",
        "academic_level",
        "graduation_year",
      ];
    } else if (step === 2) {
      fieldsToValidate = ["plans_next_year"];
    } else if (step === 3) {
      fieldsToValidate = [
        "perspective_gala",
        "benefit_from_event",
        "heard_about",
      ];
    }

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const data = watch();
  const [shake, setShake] = useState(0);
  // Turn the card if the face is complete; otherwise a gentle shake and the
  // first unwritten line takes focus
  const turnCard = async () => {
    await nextStep();
    requestAnimationFrame(() => {
      if (Object.keys(methods.formState.errors).length) {
        setShake((n) => n + 1);
        document.querySelector<HTMLElement>('[aria-invalid="true"]:not([inert] *)')?.focus({ preventScroll: false });
      }
    });
  };
  const sendRequest = async () => {
    const valid = await trigger();
    if (valid) {
      handleSubmit(onSubmit)();
    }
  };

  // The card turns half a revolution per step; faces alternate front / back
  const turns = done ? 4 : step - 1;
  const stage = done ? 5 : step;
  const frontStage = turns % 2 === 0 ? stage : stage + 1;
  const backStage = turns % 2 === 1 ? stage : stage + 1;

  const faceTitles = [
    stepWord(texts.register?.steps?.step1?.title, "Personal"),
    stepWord(texts.register?.steps?.step2?.title, "Profile"),
    stepWord(texts.register?.steps?.step3?.title, "Vision"),
    stepWord(texts.register?.steps?.step4?.title, "Review"),
  ];

  const renderFace = (n: number) => {
    switch (n) {
      case 1:
        return <FaceAdmission texts={texts} />;
      case 2:
        return <FaceAmbitions texts={texts} />;
      case 3:
        return <FaceVision texts={texts} />;
      case 4:
        return <FaceSeal data={data} texts={texts} loading={loading} onSeal={sendRequest} onEdit={setStep} requestedTier={requestedTier} />;
      case 5:
        return <FaceReceived data={data} texts={texts} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1d0314] text-[var(--color-cream)] font-sans">
      <Salon />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Link href="/" aria-label="Return to the Gala">
          <Image src="/GALA-silver.png" alt="Engineers' Gala" width={631} height={215} priority className="h-auto w-[100px] sm:w-[120px]" />
        </Link>
        <Link
          href="/"
          className="group inline-flex min-h-[44px] items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--color-silver)] transition-colors hover:text-[var(--color-cream)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="hidden sm:inline">Return to the evening</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-40 pt-8 sm:px-10 sm:pb-24 sm:pt-10">
        <div className="mx-auto max-w-[920px] text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">
            {texts.invitations?.label || "Official admission pass"}
          </p>
          <h1 className="mt-3 font-cormorant text-[clamp(32px,4.4vw,52px)] italic leading-[1.05] text-[var(--color-cream)]">
            {(texts.register?.headline || "Your evening\nbegins here.").replace(/\n/g, " ")}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[13.5px] font-light text-[var(--color-cream)]/60">
            Fill in your card directly — write on the lines, then turn it over.
          </p>
        </div>

        {/* Where you are on the card */}
        {!done && <CardProgress step={step} titles={faceTitles} onJump={(n) => n < step && setStep(n)} />}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 sm:mt-8">
            <TheCard turns={turns} shake={shake}>
              {{
                front: renderFace(frontStage),
                back: renderFace(backStage),
                frontActive: turns % 2 === 0,
              }}
            </TheCard>

            <AnimatePresence>
              {submitError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto mt-6 flex max-w-[920px] items-start gap-3 rounded-xl border border-[#e36db3]/40 bg-[#4c0933]/70 p-4 text-[13px] text-[var(--color-cream)]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f29ed0]" aria-hidden />
                  <span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Turning controls: under the card on large screens, pinned on phones */}
            {!done && step < 4 && (
              <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-silver)]/15 bg-[#1d0314]/92 px-5 py-4 backdrop-blur-md sm:static sm:mx-auto sm:mt-8 sm:max-w-[920px] sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                <div className="flex items-center justify-between gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]/75 transition-colors hover:text-[var(--color-cream)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-silver)]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                      {texts.register?.buttons?.previous || "Previous"}
                    </button>
                  ) : (
                    <span className="text-[10.5px] uppercase tracking-[0.24em] text-[var(--color-silver)]/60">I / IV</span>
                  )}
                  <TurnButton onClick={turnCard}>
                    {texts.register?.buttons?.next || "Continue"}
                    <RotateCw className="h-4 w-4" aria-hidden />
                  </TurnButton>
                </div>
              </div>
            )}
            {!done && step === 4 && (
              <div className="mx-auto mt-6 flex max-w-[920px] justify-start">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)]/75 transition-colors hover:text-[var(--color-cream)] disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  {texts.register?.buttons?.previous || "Previous"}
                </button>
              </div>
            )}
            {done && (
              <div className="mx-auto mt-10 flex max-w-[920px] justify-center">
                <TurnButton href="/">
                  Return to the Gala <ArrowRight className="h-4 w-4" aria-hidden />
                </TurnButton>
              </div>
            )}
          </form>
        </FormProvider>
      </main>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1d0314]">
          <GalaStar className="w-12 animate-pulse text-[var(--color-silver)]" />
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}

/* ───────────────────────────── The setting ───────────────────────────── */

/** Velvet salon: the template's plum velvet, drifting light and slow silver motes */
function Salon() {
  const motes = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 1 + ((i * 7) % 3),
        delay: (i % 9) * 0.7,
        dur: 6 + (i % 5) * 1.6,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* The post template's plum velvet, its light drifting across the tufting */}
      <div className="gala-velvet absolute inset-0" />
      <div className="gala-velvet-light absolute -inset-[10%]" />
      <div className="gala-velvet-veil absolute inset-0 opacity-90" />
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#e8ecf2] motion-safe:animate-[mote_var(--d)_ease-in-out_infinite]"
          style={
            {
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              opacity: 0.35,
              animationDelay: `${m.delay}s`,
              "--d": `${m.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function labelFor(list: { value: string; label: string }[], value: string | undefined, dict?: Record<string, string>) {
  if (!value) return "";
  return dict?.[value] || list.find((o) => o.value === value)?.label || value;
}

/* ───────────────────────────── The card ───────────────────────────── */

/**
 * The card itself: two faces of heavy burgundy stock with a silver core,
 * stacked in one grid cell so it sizes to its content. Each step is a small
 * piece of theatre: the card lifts toward the guest, banks, turns half a
 * revolution while a band of light crosses it and silver dust lifts from its
 * edges, then settles back onto the table. The face turned away is inert.
 */
function TheCard({
  turns,
  shake,
  children,
}: {
  turns: number;
  shake: number;
  children: { front: React.ReactNode; back: React.ReactNode; frontActive: boolean };
}) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [3, -3]), { stiffness: 70, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 70, damping: 18 });
  const [typing, setTyping] = useState(false);
  const [liftScope, animateLift] = useAnimate();
  const [shadowScope, animateShadow] = useAnimate();
  const prevTurns = useRef(turns);
  const [burst, setBurst] = useState(0);
  const [sweep, setSweep] = useState(0);

  useEffect(() => {
    if (prevTurns.current === turns) return;
    const dir = turns > prevTurns.current ? 1 : -1;
    prevTurns.current = turns;
    if (reduce) return;
    setBurst((b) => b + 1);
    setSweep((w) => w + 1);
    // Lift toward the guest and bank into the turn, then settle onto the table
    animateLift(
      liftScope.current,
      { z: [0, 170, 0], y: [0, -24, 0], rotateX: [0, 8, 0], rotateZ: [0, -3 * dir, 0] },
      { duration: 0.95, times: [0, 0.4, 1], ease: [0.3, 0.1, 0.2, 1] },
    );
    animateShadow(
      shadowScope.current,
      { scaleX: [1, 0.72, 1], opacity: [0.75, 0.3, 0.75], y: [0, 26, 0] },
      { duration: 0.95, times: [0, 0.4, 1], ease: [0.3, 0.1, 0.2, 1] },
    );
  }, [turns, reduce, animateLift, animateShadow, liftScope, shadowScope]);

  // A firm little shake when a line still needs writing
  useEffect(() => {
    if (!shake || reduce) return;
    animateLift(liftScope.current, { x: [0, -14, 11, -7, 4, 0], rotateZ: [0, -1.2, 1, -0.5, 0, 0] }, { duration: 0.55, ease: "easeOut" });
  }, [shake, reduce, animateLift, liftScope]);

  return (
    <div
      className="relative mx-auto w-full max-w-[920px] [perspective:2200px]"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || typing) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onFocusCapture={() => {
        // Hold still while the guest writes
        setTyping(true);
        mx.set(0);
        my.set(0);
      }}
      onBlurCapture={() => setTyping(false)}
    >
      <div ref={shadowScope} aria-hidden className="absolute inset-x-[6%] -bottom-8 h-12 rounded-[50%] bg-black/70 opacity-75 blur-2xl" />
      <motion.div style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY }} className="[transform-style:preserve-3d]">
        <div ref={liftScope} className="[transform-style:preserve-3d]">
          <motion.div
            initial={false}
            animate={{ rotateY: turns * 180 }}
            transition={reduce ? { duration: 0 } : { duration: 0.95, ease: [0.3, 0.1, 0.15, 1] }}
            className="grid [transform-style:preserve-3d]"
          >
            {/* The card's silver core, sandwiched between its two faces */}
            {[-1.6, 0, 1.6].map((z) => (
              <div
                key={z}
                aria-hidden
                className="rounded-[26px] bg-[linear-gradient(135deg,#d9dde3,#7d848f_50%,#c9ced6)] [grid-area:1/1]"
                style={{ transform: `translateZ(${z}px)` }}
              />
            ))}
            <Face active={children.frontActive} sweep={sweep}>
              {children.front}
            </Face>
            <Face active={!children.frontActive} sweep={sweep} back>
              {children.back}
            </Face>
          </motion.div>
        </div>
      </motion.div>
      {burst > 0 && <DustBurst key={burst} />}
    </div>
  );
}

function Face({ children, back, active, sweep }: { children: React.ReactNode; back?: boolean; active: boolean; sweep: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      // The face turned away can't be reached by keyboard or screen reader
      inert={!active}
      aria-hidden={!active}
      className="relative overflow-hidden rounded-[26px] bg-[radial-gradient(130%_100%_at_15%_0%,#70104e_0%,#3d072a_48%,#1e0214_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_50px_90px_-40px_rgba(0,0,0,0.95)] [backface-visibility:hidden] [grid-area:1/1]"
      // Each face sits just proud of the silver core on its own side
      style={{ transform: back ? "rotateY(180deg) translateZ(2.6px)" : "translateZ(2.6px)" }}
    >
      {/* Engraved guilloché and a fine silver border inset like a debossed rule */}
      <svg aria-hidden viewBox="0 0 400 260" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1]">
        {Array.from({ length: 26 }).map((_, i) => (
          <path
            key={i}
            d={`M -10 ${30 + i * 9} C 90 ${0 + i * 9}, 170 ${70 + i * 9}, 250 ${30 + i * 9} S 390 ${0 + i * 9}, 420 ${40 + i * 9}`}
            fill="none"
            stroke="#f4d5e9"
            strokeWidth="0.45"
          />
        ))}
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-[12px] rounded-[16px] border border-[#d6dbe2]/30 sm:inset-[16px]" />
      <div aria-hidden className="pointer-events-none absolute inset-[16px] rounded-[13px] border border-[#d6dbe2]/10 sm:inset-[21px]" />

      {/* The writing settles onto the face as it comes round, and lifts off as it turns away */}
      <motion.div
        initial={false}
        animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 10, filter: "blur(4px)" }}
        transition={
          reduce
            ? { duration: 0 }
            : active
              ? { duration: 0.55, delay: 0.38, ease: GALA_EASE }
              : { duration: 0.18, delay: 0, ease: "easeOut" }
        }
        className="relative px-6 pb-8 pt-7 sm:px-14 sm:pb-12 sm:pt-11"
      >
        {children}
      </motion.div>

      {/* A band of light crossing the stock as the card turns */}
      {sweep > 0 && !reduce && (
        <motion.div
          key={sweep}
          aria-hidden
          initial={{ x: "-130%", opacity: 0 }}
          animate={{ x: "130%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.05, delay: 0.1, ease: [0.3, 0.1, 0.2, 1] }}
          className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(100deg,transparent_30%,rgba(255,240,250,0.16)_46%,rgba(255,255,255,0.32)_50%,rgba(255,240,250,0.16)_54%,transparent_70%)] mix-blend-screen"
        />
      )}
    </div>
  );
}

/** Silver dust lifting from the card's edges as it turns */
function DustBurst() {
  const specks = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2 + Math.random() * 0.3;
        const r = 0.47 + Math.random() * 0.04;
        return {
          left: 50 + Math.cos(a) * r * 100,
          top: 50 + Math.sin(a) * r * 100,
          dx: Math.cos(a) * (40 + Math.random() * 120),
          dy: Math.sin(a) * (40 + Math.random() * 120) - 30 - Math.random() * 50,
          size: 1.5 + Math.random() * 2.5,
          delay: 0.05 + Math.random() * 0.3,
          dur: 1.1 + Math.random() * 0.9,
        };
      }),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {specks.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 0], x: p.dx, y: p.dy, scale: [0.6, 1, 0.4] }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.2, 0.7, 0.3, 1] }}
          className="absolute rounded-full bg-[#f1f3f6] shadow-[0_0_8px_2px_rgba(232,236,242,0.55)]"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}

/** The card's top line: foil mark, the face's name and its numeral */
function FaceHead({ numeral, title, right }: { numeral: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
      {/* The face's numeral, engraved large into the stock */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 right-4 select-none font-cinzel text-[150px] font-semibold leading-none text-[#f4d5e9]/[0.045] sm:right-10 sm:text-[230px]"
      >
        {numeral}
      </span>
      <div className="flex items-center gap-4">
        <Image src="/GALA-silver.png" alt="" width={631} height={215} className="h-auto w-[86px] opacity-95 sm:w-[112px]" />
        <span aria-hidden className="hidden h-8 w-px bg-[#d6dbe2]/25 sm:block" />
        <div className="hidden sm:block">
          <span className="block font-cinzel text-[11px] font-semibold tracking-[0.3em] gala-engraved">{numeral}</span>
          <span className="block font-cormorant text-[17px] italic text-[var(--color-cream)]/85">{title}</span>
        </div>
      </div>
      {right}
    </div>
  );
}

/* ───────────────────────────── Writing on the card ───────────────────────────── */

const writtenText =
  "w-full bg-transparent font-cormorant italic text-[var(--color-cream)] placeholder:text-[var(--color-cream)]/22 outline-none caret-[#e8ecf2]";

/** A caption engraved under a line, with the line's error beneath it */
function useFieldState(name: keyof RegistrationData) {
  const {
    formState: { errors },
  } = useFormContext<RegistrationData>();
  const id = useId();
  return { id, error: errors[name]?.message as string | undefined, errId: `${id}-err` };
}

function Caption({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mt-2 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#d6dbe2]/60">
      {children}
      {required ? (
        <span className="text-[#e99fcc]" aria-hidden>
          ✦
        </span>
      ) : (
        <span className="font-normal normal-case tracking-normal text-[var(--color-cream)]/30">optional</span>
      )}
    </label>
  );
}

function LineError({ id, error }: { id: string; error?: string }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#f29ed0]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** A blank on the card: you write straight onto the dotted line */
function Blank({
  name,
  caption,
  required,
  size = "md",
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
}: {
  name: keyof RegistrationData;
  caption: string;
  required?: boolean;
  size?: "lg" | "md";
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, error, errId } = useFieldState(name);
  return (
    <div className="min-w-0">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
        {...register(name)}
        className={`${writtenText} border-b ${error ? "border-[#e36db3]/80" : "border-dashed border-[#d6dbe2]/35 focus:border-solid focus:border-[#e8ecf2]"} px-1 pb-1.5 transition-colors duration-300 ${
          size === "lg" ? "h-[58px] text-[30px] sm:h-[66px] sm:text-[40px]" : "h-[46px] text-[21px] sm:text-[23px]"
        }`}
      />
      <Caption htmlFor={id} required={required}>
        {caption}
      </Caption>
      <LineError id={errId} error={error} />
    </div>
  );
}

/** A choice on the card, written in the same hand, with a quiet chevron */
function ChoiceBlank({
  name,
  caption,
  required,
  options,
}: {
  name: keyof RegistrationData;
  caption: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, error, errId } = useFieldState(name);
  return (
    <div className="min-w-0">
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...register(name)}
          className={`${writtenText} h-[46px] cursor-pointer appearance-none truncate border-b border-dashed border-[#d6dbe2]/35 px-1 pb-1.5 pr-8 text-[21px] transition-colors focus:border-solid focus:border-[#e8ecf2] sm:text-[23px] [&>option]:bg-[#2b051e] [&>option]:font-sans [&>option]:not-italic [&>option]:text-[15px]`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d6dbe2]/70" aria-hidden />
      </div>
      <Caption htmlFor={id} required={required}>
        {caption}
      </Caption>
      <LineError id={errId} error={error} />
    </div>
  );
}

/** Ruled writing lines for longer answers */
function Lines({
  name,
  prompt,
  required,
  placeholder,
  rows = 4,
}: {
  name: keyof RegistrationData;
  prompt: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, error, errId } = useFieldState(name);
  return (
    <div>
      <label htmlFor={id} className="block font-cinzel text-[13px] font-semibold leading-snug tracking-[0.06em] text-[#e3e6ea] sm:text-[15px]">
        {prompt}
        {required ? (
          <span className="ml-1.5 text-[#e99fcc]" aria-hidden>
            ✦
          </span>
        ) : (
          <span className="ml-2 font-sans text-[11px] font-normal normal-case tracking-normal text-[var(--color-cream)]/35">optional</span>
        )}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? errId : undefined}
        {...register(name)}
        className={`${writtenText} mt-3 resize-none bg-[repeating-linear-gradient(transparent,transparent_37px,rgba(214,219,226,0.22)_37px,rgba(214,219,226,0.22)_38px)] bg-local px-1 text-[21px] leading-[38px] sm:text-[22px] ${error ? "rounded-sm shadow-[0_0_0_1px_rgba(227,109,179,0.6)]" : ""}`}
      />
      <LineError id={errId} error={error} />
    </div>
  );
}

function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.45, ease: GALA_EASE }}
          className="overflow-hidden"
        >
          <div className="pt-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────── The faces ───────────────────────────── */

function FaceAdmission({ texts }: { texts: Texts }) {
  const { watch } = useFormContext<RegistrationData>();
  const f = texts.register?.fields || {};
  return (
    <div>
      <FaceHead
        numeral="I"
        title={texts.register?.steps?.step1?.subtitle || "Identity & Credentials"}
        right={
          <div className="text-right">
            <span className="block text-[8.5px] font-semibold uppercase tracking-[0.3em] text-[#d6dbe2]/60">Admission</span>
            <span className="block font-cinzel text-[18px] font-semibold gala-engraved sm:text-[22px]">{texts.invitations?.price || "1,000 DA"}</span>
          </div>
        }
      />

      <p className="text-center font-cinzel text-[10.5px] font-semibold tracking-[0.42em] text-[#d6dbe2]/70">THIS CARD ADMITS</p>
      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <Blank name="first_name" caption={plainLabel(f.firstName, "First name")} required size="lg" autoComplete="given-name" placeholder="First name" />
        <Blank name="last_name" caption={plainLabel(f.lastName, "Last name")} required size="lg" autoComplete="family-name" placeholder="Last name" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <Blank name="email" type="email" caption={plainLabel(f.email, "Email address")} required autoComplete="email" inputMode="email" placeholder="name@example.com" />
        <Blank name="phone" type="tel" caption={plainLabel(f.phone, "Phone number")} required autoComplete="tel" inputMode="tel" placeholder="+213 …" />
        <div>
          <ChoiceBlank
            name="university"
            caption={plainLabel(f.university, "University / Grande École")}
            required
            options={universityOptions.map((o) => ({ ...o, label: f.universities?.[o.value] || o.label }))}
          />
          <Reveal show={watch("university") === "OTHER"}>
            <Blank name="university_other" caption={plainLabel(f.universityOther, "Your institution")} placeholder="Name of your institution" />
          </Reveal>
        </div>
        <div>
          <ChoiceBlank
            name="field_of_study"
            caption={plainLabel(f.fieldOfStudy, "Engineering specialization")}
            required
            options={fieldOfStudyOptions.map((o) => ({ ...o, label: f.fieldOfStudies?.[o.value] || o.label }))}
          />
          <Reveal show={watch("field_of_study") === "OTHER"}>
            <Blank name="field_of_study_other" caption={plainLabel(f.fieldOfStudyOther, "Your field")} placeholder="Your discipline" />
          </Reveal>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-[#d6dbe2]/15 pt-5 text-[10px] uppercase tracking-[0.26em] text-[#d6dbe2]/55">
        <span>{texts.invitations?.date || "Saturday, November 8, 2026"}</span>
        <GalaStar className="hidden w-8 text-[#d6dbe2]/70 sm:block" />
        <span className="text-right">{texts.invitations?.venue || "Mercure Hotel, Bab Ezzouar"}</span>
      </div>
    </div>
  );
}

function FaceAmbitions({ texts }: { texts: Texts }) {
  const f = texts.register?.fields || {};
  return (
    <div>
      <FaceHead numeral="II" title={texts.register?.steps?.step2?.subtitle || "Ambitions & Trajectory"} />
      <div className="space-y-8">
        <Lines
          name="plans_next_year"
          prompt={plainLabel(f.plansNextYear, "What are your primary ambitions for the coming year?")}
          required
          placeholder="Seeking graduate engineering roles in energy transition or AI systems…"
        />
        <Lines
          name="personal_description"
          prompt={plainLabel(f.personalDescription, "Short personal statement or executive summary")}
          placeholder="Key achievements, technical passions, or project leadership…"
          rows={3}
        />
      </div>
    </div>
  );
}

function FaceVision({ texts }: { texts: Texts }) {
  const { watch, setValue } = useFormContext<RegistrationData>();
  const f = texts.register?.fields || {};
  const attended = watch("attended_before");
  return (
    <div>
      <FaceHead numeral="III" title={texts.register?.steps?.step3?.subtitle || "GALA Perspective & Synergy"} />
      <div className="space-y-8">
        <Lines name="perspective_gala" prompt={plainLabel(f.perspectiveGala, "What is your vision of the GALA experience?")} required rows={3} />
        <Lines name="benefit_from_event" prompt={plainLabel(f.benefitFromEvent, "How will participating in GALA accelerate your career?")} required rows={3} />

        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#d6dbe2]/60">
              {plainLabel(f.attendedBefore, "Attended a previous edition?")}
            </legend>
            <div role="radiogroup" className="flex gap-3">
              {[
                { v: true, l: texts.register?.options?.yes || "Yes" },
                { v: false, l: texts.register?.options?.no || "No" },
              ].map((o) => {
                const on = attended === o.v;
                return (
                  <label
                    key={String(o.v)}
                    className={`relative flex min-h-[48px] min-w-[96px] cursor-pointer items-center justify-center rounded-full border px-6 font-cormorant text-[20px] italic transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-[#e8ecf2] ${
                      on ? "border-[#e8ecf2]/80 bg-[#7d1155]/70 text-[var(--color-cream)]" : "border-[#d6dbe2]/25 text-[var(--color-cream)]/55 hover:border-[#d6dbe2]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="attended_before_choice"
                      value={String(o.v)}
                      checked={on}
                      onChange={() => setValue("attended_before", o.v)}
                      className="sr-only"
                    />
                    {on && <Check className="mr-2 h-4 w-4 not-italic" aria-hidden />}
                    {o.l}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div>
            <ChoiceBlank name="heard_about" caption={plainLabel(f.heardAbout, "How did you discover GALA?")} options={heardAboutOptions} />
            <Reveal show={watch("heard_about") === "OTHER"}>
              <Blank name="heard_about_other" caption={plainLabel(f.heardAboutOther, "Please specify")} />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The finished card, and the seal that sends it */
function FaceSeal({
  data,
  texts,
  loading,
  onSeal,
  onEdit,
  requestedTier,
}: {
  data: RegistrationData;
  texts: Texts;
  loading: boolean;
  onSeal: () => void;
  onEdit: (step: number) => void;
  requestedTier: string;
}) {
  void requestedTier;
  const f = texts.register?.fields || {};
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const university =
    data.university === "OTHER" && data.university_other ? data.university_other : labelFor(universityOptions, data.university, f.universities);
  const field =
    data.field_of_study === "OTHER" && data.field_of_study_other
      ? data.field_of_study_other
      : labelFor(fieldOfStudyOptions, data.field_of_study, f.fieldOfStudies);

  const Edit = ({ step }: { step: number }) => (
    <button
      type="button"
      onClick={() => onEdit(step)}
      className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-full px-2 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#d6dbe2]/60 transition-colors hover:text-[var(--color-cream)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d6dbe2]"
    >
      <PenLine className="h-3 w-3" aria-hidden /> Edit
    </button>
  );
  const Item = ({ k, v }: { k: string; v?: string }) => (
    <div className="min-w-0">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#d6dbe2]/55">{k}</dt>
      <dd className="mt-1 line-clamp-2 font-cormorant text-[19px] italic leading-snug text-[var(--color-cream)]">{v || "—"}</dd>
    </div>
  );

  return (
    <div>
      <FaceHead numeral="IV" title={texts.register?.steps?.step4?.subtitle || "Review & Confirmation"} />

      <div className="text-center">
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.42em] text-[#d6dbe2]/70">THIS CARD ADMITS</p>
        <p className="mt-3 font-cinzel text-[clamp(28px,4.4vw,46px)] font-semibold leading-tight gala-engraved">{name || "—"}</p>
        <p className="mt-2 font-cormorant text-[19px] italic text-[var(--color-cream)]/75">
          {[university, field].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 border-y border-[#d6dbe2]/15 py-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[11px] font-semibold tracking-[0.3em] gala-engraved">I</span>
            <Edit step={1} />
          </div>
          <dl className="mt-2 space-y-3">
            <Item k="Email" v={data.email} />
            <Item k="Phone" v={data.phone} />
          </dl>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[11px] font-semibold tracking-[0.3em] gala-engraved">II</span>
            <Edit step={2} />
          </div>
          <dl className="mt-2 space-y-3">
            <Item k="Ambitions" v={data.plans_next_year} />
          </dl>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[11px] font-semibold tracking-[0.3em] gala-engraved">III</span>
            <Edit step={3} />
          </div>
          <dl className="mt-2 space-y-3">
            <Item k="Your vision" v={data.perspective_gala} />
            <Item
              k="Discovered via"
              v={data.heard_about === "OTHER" && data.heard_about_other ? data.heard_about_other : labelFor(heardAboutOptions, data.heard_about)}
            />
          </dl>
        </div>
      </div>

      {/* Press the seal to send */}
      <div className="mt-8 flex flex-col items-center">
        <SealButton loading={loading} onPress={onSeal} />
        <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.3em] text-[#d6dbe2]/70">
          {loading
            ? texts.register?.buttons?.submitting || "Submitting request…"
            : texts.register?.buttons?.submit || "Submit invitation request"}
        </p>
        {!loading && <p className="mt-1.5 font-cormorant text-[16px] italic text-[var(--color-cream)]/55">Press the seal to send your card</p>}
      </div>
    </div>
  );
}

/** The silver VIC seal, pressed to send the card */
function SealButton({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(0);
  return (
    <motion.button
      type="button"
      onClick={() => {
        setPressed((n) => n + 1);
        onPress();
      }}
      disabled={loading}
      aria-label="Seal and send your request"
      whileHover={reduce ? undefined : { scale: 1.04, rotate: -3 }}
      whileTap={reduce ? undefined : { scale: 0.9, rotate: 0 }}
      animate={loading && !reduce ? { scale: [1, 0.92, 1] } : undefined}
      transition={loading ? { duration: 1.2, repeat: Infinity } : { type: "spring", stiffness: 300, damping: 18 }}
      className="relative h-[104px] w-[104px] cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8ecf2] disabled:cursor-wait sm:h-[118px] sm:w-[118px]"
    >
      <span className="absolute inset-0 rounded-[47%_53%_50%_50%/52%_48%_52%_48%] bg-[radial-gradient(circle_at_34%_28%,#ffffff_0%,#e4e7ec_16%,#b3b9c3_42%,#7d848f_72%,#555b65_100%)] shadow-[0_14px_28px_rgba(5,1,4,0.7),inset_0_2px_3px_rgba(255,255,255,0.75),inset_0_-4px_8px_rgba(40,44,52,0.55)]" />
      <span className="absolute inset-[11%] rounded-full bg-[radial-gradient(circle_at_40%_32%,#f4f5f7_0%,#c9ced6_45%,#9aa1ab_100%)] shadow-[inset_0_3px_6px_rgba(40,44,52,0.55),inset_0_-1px_1px_rgba(255,255,255,0.8)]" />
      <svg viewBox="0 0 100 100" className="absolute inset-[11%] h-[78%] w-[78%]" aria-hidden>
        <defs>
          <path id="send-seal-ring" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <text fill="rgba(52,57,66,0.85)" style={{ fontSize: 8.2, fontFamily: "Cinzel, serif", fontWeight: 700 }}>
          <textPath href="#send-seal-ring" textLength="228" lengthAdjust="spacing">
            ✦ SEAL & SEND ✦ VISION &amp; INNOVATION CLUB
          </textPath>
        </text>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/vic-icon.png"
        alt=""
        className="absolute left-1/2 top-1/2 h-[38%] w-auto -translate-x-1/2 -translate-y-1/2 select-none [filter:grayscale(1)_brightness(0.42)_contrast(1.2)_drop-shadow(0_1px_0_rgba(255,255,255,0.85))]"
      />
      {/* The impression spreading from the seal */}
      {pressed > 0 && !reduce && (
        <motion.span
          key={pressed}
          aria-hidden
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#e8ecf2]/60"
        />
      )}
      {loading && <Loader2 className="absolute -right-2 -top-2 h-5 w-5 animate-spin text-[#e8ecf2]" aria-hidden />}
    </motion.button>
  );
}

/** The back of the sent card */
function FaceReceived({ data, texts }: { data: RegistrationData; texts: Texts }) {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const journey = ["Requested", "Review", "Approval", "Invitation"];
  return (
    <div className="flex flex-col items-center py-4 text-center sm:py-8">
      <div className="relative">
        <GalaStar className="w-16 text-[#dfe3e8]" />
      </div>
      <span className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[#d6dbe2]/70">Registration transmitted</span>
      <h2 className="mt-4 font-cormorant text-[clamp(30px,4vw,46px)] italic leading-tight text-[var(--color-cream)]">
        {texts.register?.success?.title || "Your request has been received."}
      </h2>
      {name && <p className="mt-3 font-cinzel text-[18px] font-semibold tracking-[0.12em] gala-engraved">{name}</p>}
      <p className="mx-auto mt-5 max-w-md text-[14px] font-light leading-relaxed text-[var(--color-cream)]/70">
        {texts.register?.success?.message ||
          "Our admissions committee will carefully review your credentials. You will receive an official invitation update via email."}
      </p>
      <ol className="mt-9 grid w-full max-w-lg grid-cols-4 gap-2 border-t border-[#d6dbe2]/15 pt-6">
        {journey.map((j, i) => (
          <li key={j} className="flex flex-col items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                i === 0 ? "border-[#e8ecf2] bg-[#7d1155] text-[var(--color-cream)]" : "border-[#d6dbe2]/30 text-[#d6dbe2]/60"
              }`}
            >
              {i === 0 ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${i === 0 ? "text-[var(--color-cream)]" : "text-[#d6dbe2]/55"}`}>{j}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────────── Controls ───────────────────────────── */

function CardProgress({ step, titles, onJump }: { step: number; titles: string[]; onJump: (n: number) => void }) {
  const numerals = ["I", "II", "III", "IV"];
  return (
    <nav aria-label="Registration progress" className="mx-auto mt-8 flex max-w-[920px] items-center justify-center gap-2 sm:gap-4">
      {titles.map((t, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "todo";
        return (
          <div key={t} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => onJump(n)}
              disabled={n >= step}
              aria-current={state === "current" ? "step" : undefined}
              className="group flex min-h-[44px] cursor-pointer items-center gap-2 disabled:cursor-default"
            >
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-full border font-cinzel text-[11px] font-semibold transition-colors duration-500 ${
                  state === "current"
                    ? "border-[#e8ecf2] bg-[#7d1155] text-[var(--color-cream)]"
                    : state === "done"
                      ? "border-[#d6dbe2]/60 text-[#e8ecf2] group-hover:border-[#e8ecf2]"
                      : "border-[#d6dbe2]/20 text-[#d6dbe2]/40"
                }`}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : numerals[i]}
                {state === "current" && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-[#e8ecf2]/70"
                    animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </span>
              <span
                className={`hidden text-[10px] font-semibold uppercase tracking-[0.24em] md:inline ${
                  state === "current" ? "text-[var(--color-cream)]" : state === "done" ? "text-[#d6dbe2]/75" : "text-[#d6dbe2]/35"
                }`}
              >
                {t}
              </span>
            </button>
            {i < titles.length - 1 && (
              <span aria-hidden className="relative h-px w-6 overflow-hidden bg-[#d6dbe2]/15 sm:w-10">
                <motion.span
                  initial={false}
                  animate={{ scaleX: n < step ? 1 : 0 }}
                  transition={{ duration: 0.9, delay: n < step ? 0.6 : 0, ease: GALA_EASE }}
                  className="absolute inset-0 origin-left bg-[#e8ecf2]/70"
                />
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function TurnButton({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls =
    "group relative inline-flex min-h-[52px] cursor-pointer items-center gap-3 overflow-hidden rounded-full border border-[#e8ecf2]/60 bg-[linear-gradient(180deg,#7d1155,#4c0833)] px-7 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-[var(--color-cream)] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[transform,border-color] duration-300 hover:border-[#f4f5f7] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6dbe2] sm:px-9";
  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] transition-transform duration-700 group-hover:translate-x-[300%]"
      />
      <span className="relative inline-flex items-center gap-3">{children}</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
