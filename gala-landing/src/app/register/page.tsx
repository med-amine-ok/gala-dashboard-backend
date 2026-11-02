"use client";

import { useMemo, useState, Suspense, useId, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, ChevronDown, AlertCircle, PenLine, Send, Clock } from "lucide-react";
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

function RegistrationContent() {
  const searchParams = useSearchParams();
  // Requested tier from the link (kept for the request flow; not shown)
  const requestedTier = searchParams.get("tier") || "signature";
  void requestedTier;

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

  const sendRequest = async () => {
    const valid = await trigger();
    if (valid) {
      handleSubmit(onSubmit)();
    }
  };

  const data = watch();
  const reduce = useReducedMotion();

  // Which way the steps slide: forward from the right, back from the left
  const prevStepRef = useRef(step);
  const direction = step >= prevStepRef.current ? 1 : -1;
  prevStepRef.current = step;

  const copy = guideCopy(lang as "fr" | "en", texts);
  const stage = done ? 5 : step;

  // A new step starts at its title: bring the panel's top back into view
  const panelRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = panelRef.current;
    if (el && el.getBoundingClientRect().top < 80) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: reduce ? "auto" : "smooth" });
    }
  }, [stage, reduce]);

  // Continue: move on if the step is complete; otherwise bring the first
  // field that needs attention into view
  const goNext = async () => {
    await nextStep();
    requestAnimationFrame(() => {
      if (Object.keys(methods.formState.errors).length) {
        const el = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };
  const goTo = (n: number) => {
    if (n < step) setStep(n);
  };

  const renderStep = (n: number) => {
    switch (n) {
      case 1:
        return <StepAbout texts={texts} />;
      case 2:
        return <StepPath texts={texts} />;
      case 3:
        return <StepVision texts={texts} />;
      case 4:
        return <StepReview data={data} texts={texts} copy={copy} onEdit={setStep} />;
      default:
        return <Received data={data} texts={texts} copy={copy} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#1d0314] text-[var(--color-cream)] font-sans">
      <Salon />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-10 sm:pt-8">
        <Link href="/" aria-label="Return to the Gala">
          <Image src="/GALA-silver.png" alt="Engineers' Gala" width={631} height={215} priority className="h-auto w-[92px] sm:w-[116px]" />
        </Link>
        <Link
          href="/"
          className="group inline-flex min-h-[44px] items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-[var(--color-silver)] transition-colors hover:text-[var(--color-cream)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="hidden sm:inline">{copy.back}</span>
          <span className="sm:hidden">{copy.backShort}</span>
        </Link>
      </header>

      {/* Phones: where you are, always in sight */}
      {!done && <MobileProgress step={step} copy={copy} />}

      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-36 pt-4 sm:px-10 sm:pb-24 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14 lg:pt-12">
        <Guide step={stage} copy={copy} texts={texts} onJump={goTo} done={done} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="min-w-0">
            <section
              ref={panelRef}
              aria-labelledby="step-title"
              className="relative overflow-hidden rounded-[22px] border border-[var(--color-silver)]/14 bg-[linear-gradient(180deg,rgba(52,8,34,0.82),rgba(34,4,22,0.86))] shadow-[0_40px_90px_-40px_rgba(5,0,3,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
            >
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={stage}
                  custom={direction}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 28 * direction }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 * direction }}
                  transition={{ duration: 0.35, ease: GALA_EASE }}
                  className="p-5 sm:p-10"
                >
                  {!done && <StepHeader step={step} copy={copy} />}
                  {renderStep(stage)}
                </motion.div>
              </AnimatePresence>
            </section>

            <AnimatePresence>
              {submitError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 flex items-start gap-3 rounded-xl border border-[#e36db3]/40 bg-[#4c0933]/70 p-4 text-[14px] text-[var(--color-cream)]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f29ed0]" aria-hidden />
                  <span>{submitError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions: under the form on larger screens, fixed at the foot on phones */}
            {!done && (
              <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-silver)]/15 bg-[#1d0314]/94 px-4 py-3 backdrop-blur-md sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <div className="flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={loading}
                      className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-medium text-[var(--color-cream)]/75 transition-colors hover:text-[var(--color-cream)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-silver)] disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden />
                      {texts.register?.buttons?.previous || copy.previous}
                    </button>
                  ) : (
                    <span className="hidden text-[12.5px] text-[var(--color-cream)]/50 sm:block">
                      <span className="text-[#f0a6d2]">*</span> {copy.requiredNote}
                    </span>
                  )}
                  {step < 4 ? (
                    <PrimaryButton onClick={goNext}>
                      <span className="sm:hidden">{copy.continueShort}</span>
                      <span className="hidden sm:inline">
                        {copy.continueTo} {copy.steps[step].name}
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton onClick={sendRequest} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          {texts.register?.buttons?.submitting || copy.sending}
                        </>
                      ) : (
                        <>
                          {copy.send}
                          <Send className="h-4 w-4" aria-hidden />
                        </>
                      )}
                    </PrimaryButton>
                  )}
                </div>
              </div>
            )}
            {done && (
              <div className="mt-6 flex justify-center sm:justify-end">
                <PrimaryButton href="/">
                  {copy.returnHome} <ArrowRight className="h-4 w-4" aria-hidden />
                </PrimaryButton>
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

/* ───────────────────────────── Words ───────────────────────────── */

/** Plain, direct wording for the guide (English / French) */
function guideCopy(lang: "fr" | "en", texts: Texts) {
  const fr = lang === "fr";
  const st = texts.register?.steps || {};
  const step = (i: number, name: string, nameFr: string, what: string, whatFr: string) => ({
    name: fr ? nameFr : name,
    what: fr ? whatFr : what,
    sub: st[`step${i}`]?.subtitle as string | undefined,
  });
  return {
    eyebrow: texts.invitations?.label || (fr ? "Pass d'admission officiel" : "Official admission pass"),
    title: fr ? "Demandez votre pass d'admission" : "Request your admission pass",
    intro: fr
      ? "Quatre étapes courtes. Notre comité étudie chaque demande et vous répond par e-mail."
      : "Four short steps. Our committee reviews every request and replies by email.",
    time: fr ? "Environ 3 minutes" : "About 3 minutes",
    steps: [
      step(1, "About you", "Vous", "Tell us who you are and how to reach you.", "Dites-nous qui vous êtes et comment vous joindre."),
      step(2, "Your path", "Votre parcours", "Share where you are heading next.", "Partagez vos ambitions pour la suite."),
      step(3, "Your vision", "Votre vision", "Tell us what you expect from the Gala.", "Dites-nous ce que vous attendez du Gala."),
      step(4, "Review & send", "Vérifier & envoyer", "Check your answers, then send your request.", "Vérifiez vos réponses, puis envoyez votre demande."),
    ],
    stepOf: (n: number) => (fr ? `Étape ${n} sur 4` : `Step ${n} of 4`),
    requiredNote: fr ? "Champ obligatoire" : "Required field",
    optional: fr ? "facultatif" : "optional",
    previous: fr ? "Retour" : "Back",
    continueTo: fr ? "Continuer :" : "Continue to",
    continueShort: fr ? "Continuer" : "Continue",
    send: fr ? "Envoyer ma demande" : "Send my request",
    sending: fr ? "Envoi…" : "Sending…",
    edit: fr ? "Modifier" : "Edit",
    back: fr ? "Retour à la soirée" : "Return to the evening",
    backShort: fr ? "Retour" : "Back",
    returnHome: fr ? "Retour au Gala" : "Return to the Gala",
    pass: fr ? "Votre pass" : "Your pass",
    afterTitle: fr ? "Et ensuite ?" : "What happens next",
    after: fr
      ? ["Demande envoyée", "Étude par le comité", "Réponse par e-mail", "Votre invitation"]
      : ["Request sent", "Committee review", "Reply by email", "Your invitation"],
  };
}
type Copy = ReturnType<typeof guideCopy>;

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


/* ───────────────────────────── The guide ───────────────────────────── */

/** Left on desktop: what this is, the four steps as a checklist, the pass */
function Guide({ step, copy, texts, onJump, done }: { step: number; copy: Copy; texts: Texts; onJump: (n: number) => void; done: boolean }) {
  return (
    <aside className="lg:sticky lg:top-10 lg:self-start">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[var(--color-silver)]">{copy.eyebrow}</p>
      <h1 className="mt-3 font-cormorant text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.05] text-[var(--color-cream)]">{copy.title}</h1>
      <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-[var(--color-cream)]/70">{copy.intro}</p>
      <p className="mt-3 hidden items-center gap-2 text-[13px] text-[var(--color-silver-light)]/80 lg:inline-flex">
        <Clock className="h-4 w-4" aria-hidden /> {copy.time}
      </p>

      {/* The steps, as a checklist (desktop) */}
      <nav aria-label="Registration steps" className="mt-8 hidden lg:block">
        <ol className="relative space-y-1">
          <span aria-hidden className="absolute bottom-6 left-[17px] top-6 w-px bg-[var(--color-silver)]/15" />
          {copy.steps.map((s, i) => {
            const n = i + 1;
            const state = done || n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li key={s.name}>
                <button
                  type="button"
                  onClick={() => onJump(n)}
                  disabled={done || n >= step}
                  aria-current={state === "current" ? "step" : undefined}
                  className={`group relative flex w-full items-start gap-4 rounded-xl px-0 py-3 text-left transition-colors ${
                    state === "done" && !done ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span
                    className={`relative z-10 flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors duration-500 ${
                      state === "current"
                        ? "border-[#f0f2f6] bg-[#8a1460] text-[var(--color-cream)] shadow-[0_0_0_5px_rgba(211,55,145,0.18)]"
                        : state === "done"
                          ? "border-[#d6dbe2]/70 bg-[#2a0619] text-[#eef0f4] group-hover:border-[#f0f2f6]"
                          : "border-[#d6dbe2]/25 bg-[#1d0314] text-[#d6dbe2]/45"
                    }`}
                  >
                    {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : n}
                  </span>
                  <span className="min-w-0 pt-1">
                    <span
                      className={`block text-[15px] font-semibold ${
                        state === "current" ? "text-[var(--color-cream)]" : state === "done" ? "text-[var(--color-cream)]/80" : "text-[var(--color-cream)]/45"
                      }`}
                    >
                      {s.name}
                      {state === "done" && !done && (
                        <span className="ml-2 text-[11px] font-normal text-[var(--color-silver)]/70 opacity-0 transition-opacity group-hover:opacity-100">
                          {copy.edit}
                        </span>
                      )}
                    </span>
                    <span className={`mt-0.5 block text-[13px] leading-snug ${state === "current" ? "text-[var(--color-cream)]/65" : "text-[var(--color-cream)]/35"}`}>
                      {s.what}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* The pass being requested */}
      <div className="mt-8 hidden rounded-2xl border border-[var(--color-silver)]/14 bg-[#2a0619]/60 p-5 lg:block">
        <div className="flex items-baseline justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">{copy.pass}</span>
          <span className="font-cinzel text-[22px] font-semibold gala-engraved">{texts.invitations?.price || "1,000 DA"}</span>
        </div>
        <div className="mt-3 space-y-1 text-[13px] text-[var(--color-cream)]/65">
          {texts.invitations?.date && <p>{texts.invitations.date}</p>}
          {texts.invitations?.venue && <p>{texts.invitations.venue}</p>}
        </div>
      </div>
    </aside>
  );
}

/** Phones: a slim bar under the header — the step, its name, a silver line */
function MobileProgress({ step, copy }: { step: number; copy: Copy }) {
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--color-silver)]/12 bg-[#1d0314]/92 px-5 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-semibold text-[var(--color-cream)]">
          {copy.stepOf(step)} <span className="font-normal text-[var(--color-cream)]/60">· {copy.steps[step - 1].name}</span>
        </span>
        <span className="text-[12px] text-[var(--color-cream)]/45">{copy.time}</span>
      </div>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[var(--color-silver)]/15">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,#c9ced8,#f2f4f8)]"
          initial={false}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.6, ease: GALA_EASE }}
        />
      </div>
    </div>
  );
}

function StepHeader({ step, copy }: { step: number; copy: Copy }) {
  const s = copy.steps[step - 1];
  return (
    <div className="mb-7 sm:mb-9">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">{copy.stepOf(step)}</p>
      <h2 id="step-title" className="mt-2 font-cormorant text-[clamp(28px,3vw,38px)] font-medium leading-tight text-[var(--color-cream)]">
        {s.name}
      </h2>
      <p className="mt-1.5 text-[14.5px] text-[var(--color-cream)]/65">{s.what}</p>
    </div>
  );
}

/* ───────────────────────────── Fields ───────────────────────────── */

/** Soft filled field: a dark plum panel; its foot lights silver while you type */
const fieldBox =
  "w-full rounded-[12px] border border-transparent bg-[#3a0a28]/75 px-4 text-[16px] text-[var(--color-cream)] placeholder:text-[var(--color-cream)]/30 outline-none transition-[box-shadow,background-color] duration-300 hover:bg-[#430c2f]/80 focus:bg-[#46102f] focus:shadow-[inset_0_-2px_0_#e8ecf2]";
const fieldBad = "shadow-[inset_0_0_0_1px_rgba(240,120,190,0.75)] focus:shadow-[inset_0_0_0_1px_rgba(240,120,190,0.75),inset_0_-2px_0_#f29ed0]";

function useField(name: keyof RegistrationData) {
  const { getFieldState, formState, watch } = useFormContext<RegistrationData>();
  const id = useId();
  const st = getFieldState(name, formState);
  const value = watch(name);
  const filled = typeof value === "string" ? value.trim().length > 0 : value != null;
  return { id, errId: `${id}-err`, hintId: `${id}-hint`, error: st.error?.message as string | undefined, ok: st.isTouched && !st.invalid && filled };
}

function FieldLabel({ htmlFor, children, required, copyOptional }: { htmlFor: string; children: React.ReactNode; required?: boolean; copyOptional: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[14px] font-medium text-[var(--color-cream)]/90">
      {children}
      {required ? (
        <span className="ml-1 text-[#f0a6d2]" aria-hidden>
          *
        </span>
      ) : (
        <span className="ml-2 text-[12.5px] font-normal text-[var(--color-cream)]/40">({copyOptional})</span>
      )}
    </label>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 flex items-center gap-1.5 text-[13px] text-[#f4a9d6]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

const useOptionalWord = () => {
  const { lang } = useLanguage();
  return lang === "fr" ? "facultatif" : "optional";
};

function Field({
  name,
  label,
  required,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  hint,
}: {
  name: keyof RegistrationData;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  hint?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, errId, hintId, error, ok } = useField(name);
  const optional = useOptionalWord();
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} required={required} copyOptional={optional}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-required={required}
          aria-describedby={[error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
          {...register(name)}
          className={`${fieldBox} h-[52px] pr-11 ${error ? fieldBad : ""}`}
        />
        {ok && <Check className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#cfe9d8]" aria-hidden />}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-[12.5px] text-[var(--color-cream)]/45">
          {hint}
        </p>
      )}
      <FieldError id={errId} error={error} />
    </div>
  );
}

function SelectField({
  name,
  label,
  required,
  options,
}: {
  name: keyof RegistrationData;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, errId, error } = useField(name);
  const optional = useOptionalWord();
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} required={required} copyOptional={optional}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          {...register(name)}
          className={`${fieldBox} h-[52px] cursor-pointer appearance-none truncate pr-11 [&>option]:bg-[#2b051e] [&>option]:text-[15px] ${error ? fieldBad : ""}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d6dbe2]/70" aria-hidden />
      </div>
      <FieldError id={errId} error={error} />
    </div>
  );
}

function TextField({
  name,
  label,
  required,
  placeholder,
  rows = 4,
  hint,
}: {
  name: keyof RegistrationData;
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  const { id, errId, hintId, error } = useField(name);
  const optional = useOptionalWord();
  return (
    <div>
      <FieldLabel htmlFor={id} required={required} copyOptional={optional}>
        {label}
      </FieldLabel>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={[error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
        {...register(name)}
        className={`${fieldBox} resize-y py-3.5 leading-relaxed ${error ? fieldBad : ""}`}
      />
      {hint && !error && (
        <p id={hintId} className="mt-2 text-[12.5px] text-[var(--color-cream)]/45">
          {hint}
        </p>
      )}
      <FieldError id={errId} error={error} />
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
          transition={{ duration: 0.35, ease: GALA_EASE }}
          className="overflow-hidden"
        >
          <div className="pt-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────────── The steps ───────────────────────────── */

function StepAbout({ texts }: { texts: Texts }) {
  const { watch } = useFormContext<RegistrationData>();
  const f = texts.register?.fields || {};
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6">
      <Field name="first_name" label={plainLabel(f.firstName, "First name")} required autoComplete="given-name" />
      <Field name="last_name" label={plainLabel(f.lastName, "Last name")} required autoComplete="family-name" />
      <Field
        name="email"
        type="email"
        label={plainLabel(f.email, "Email address")}
        required
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        hint="Your answer and your invitation will be sent here."
      />
      <Field name="phone" type="tel" label={plainLabel(f.phone, "Phone number")} required autoComplete="tel" inputMode="tel" placeholder="+213 5XX XX XX XX" />
      <div>
        <SelectField
          name="university"
          label={plainLabel(f.university, "University / Grande École")}
          required
          options={universityOptions.map((o) => ({ ...o, label: f.universities?.[o.value] || o.label }))}
        />
        <Reveal show={watch("university") === "OTHER"}>
          <Field name="university_other" label={plainLabel(f.universityOther, "Your institution")} placeholder="Name of your institution" />
        </Reveal>
      </div>
      <div>
        <SelectField
          name="field_of_study"
          label={plainLabel(f.fieldOfStudy, "Engineering specialization")}
          required
          options={fieldOfStudyOptions.map((o) => ({ ...o, label: f.fieldOfStudies?.[o.value] || o.label }))}
        />
        <Reveal show={watch("field_of_study") === "OTHER"}>
          <Field name="field_of_study_other" label={plainLabel(f.fieldOfStudyOther, "Your field")} placeholder="Your discipline" />
        </Reveal>
      </div>
    </div>
  );
}

function StepPath({ texts }: { texts: Texts }) {
  const f = texts.register?.fields || {};
  return (
    <div className="space-y-6">
      <TextField
        name="plans_next_year"
        label={plainLabel(f.plansNextYear, "What are your primary ambitions for the coming year?")}
        required
        placeholder="e.g. Seeking a graduate engineering role in the energy transition or AI systems…"
        hint="A few sentences are enough."
      />
      <TextField
        name="personal_description"
        label={plainLabel(f.personalDescription, "Short personal statement or executive summary")}
        placeholder="e.g. Key achievements, technical passions, projects you have led…"
        rows={3}
      />
    </div>
  );
}

function StepVision({ texts }: { texts: Texts }) {
  const { watch, setValue } = useFormContext<RegistrationData>();
  const f = texts.register?.fields || {};
  const attended = watch("attended_before");
  return (
    <div className="space-y-6">
      <TextField name="perspective_gala" label={plainLabel(f.perspectiveGala, "What is your vision of the GALA experience?")} required rows={3} />
      <TextField name="benefit_from_event" label={plainLabel(f.benefitFromEvent, "How will participating in GALA accelerate your career?")} required rows={3} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="mb-2 text-[14px] font-medium text-[var(--color-cream)]/90">{plainLabel(f.attendedBefore, "Attended a previous edition?")}</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {[
              { v: true, l: texts.register?.options?.yes || "Yes" },
              { v: false, l: texts.register?.options?.no || "No" },
            ].map((o) => {
              const on = attended === o.v;
              return (
                <label
                  key={String(o.v)}
                  className={`flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[15px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-[#e8ecf2] ${
                    on
                      ? "bg-[#7d1155] text-[var(--color-cream)] shadow-[inset_0_0_0_1px_rgba(232,236,242,0.6)]"
                      : "bg-[#3a0a28]/75 text-[var(--color-cream)]/65 hover:bg-[#430c2f]/80"
                  }`}
                >
                  <input type="radio" name="attended_before_choice" value={String(o.v)} checked={on} onChange={() => setValue("attended_before", o.v)} className="sr-only" />
                  {on && <Check className="h-4 w-4" aria-hidden />}
                  {o.l}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div>
          <SelectField name="heard_about" label={plainLabel(f.heardAbout, "How did you discover GALA?")} options={heardAboutOptions} />
          <Reveal show={watch("heard_about") === "OTHER"}>
            <Field name="heard_about_other" label={plainLabel(f.heardAboutOther, "Please specify")} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/** Everything at a glance, each part editable, before sending */
function StepReview({ data, texts, copy, onEdit }: { data: RegistrationData; texts: Texts; copy: Copy; onEdit: (step: number) => void }) {
  const f = texts.register?.fields || {};
  const university =
    data.university === "OTHER" && data.university_other ? data.university_other : labelFor(universityOptions, data.university, f.universities);
  const field =
    data.field_of_study === "OTHER" && data.field_of_study_other ? data.field_of_study_other : labelFor(fieldOfStudyOptions, data.field_of_study, f.fieldOfStudies);
  const heard = data.heard_about === "OTHER" && data.heard_about_other ? data.heard_about_other : labelFor(heardAboutOptions, data.heard_about);

  const groups: { step: number; rows: [string, string | undefined][] }[] = [
    {
      step: 1,
      rows: [
        [plainLabel(f.firstName, "First name") + " / " + plainLabel(f.lastName, "Last name"), [data.first_name, data.last_name].filter(Boolean).join(" ")],
        [plainLabel(f.email, "Email address"), data.email],
        [plainLabel(f.phone, "Phone number"), data.phone],
        [plainLabel(f.university, "University"), university],
        [plainLabel(f.fieldOfStudy, "Specialization"), field],
      ],
    },
    {
      step: 2,
      rows: [
        [plainLabel(f.plansNextYear, "Ambitions"), data.plans_next_year],
        [plainLabel(f.personalDescription, "Personal statement"), data.personal_description],
      ],
    },
    {
      step: 3,
      rows: [
        [plainLabel(f.perspectiveGala, "Your vision"), data.perspective_gala],
        [plainLabel(f.benefitFromEvent, "Career benefit"), data.benefit_from_event],
        [plainLabel(f.attendedBefore, "Attended before"), data.attended_before ? texts.register?.options?.yes || "Yes" : texts.register?.options?.no || "No"],
        [plainLabel(f.heardAbout, "Discovered via"), heard],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.step} className="rounded-2xl bg-[#3a0a28]/55 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--color-cream)]">
              {g.step}. {copy.steps[g.step - 1].name}
            </span>
            <button
              type="button"
              onClick={() => onEdit(g.step)}
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[var(--color-silver-light)]/80 transition-colors hover:bg-white/5 hover:text-[var(--color-cream)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d6dbe2]"
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden /> {copy.edit}
            </button>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {g.rows.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[12px] text-[var(--color-cream)]/45">{k}</dt>
                <dd className="mt-0.5 line-clamp-3 break-words text-[14.5px] text-[var(--color-cream)]/90">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** Sent: what happens now */
function Received({ data, texts, copy }: { data: RegistrationData; texts: Texts; copy: Copy }) {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col items-center py-4 text-center sm:py-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7d1155] shadow-[0_0_0_8px_rgba(211,55,145,0.15)]">
        <Check className="h-7 w-7 text-[var(--color-cream)]" aria-hidden />
      </span>
      <h2 id="step-title" className="mt-6 font-cormorant text-[clamp(30px,4vw,44px)] font-medium leading-tight text-[var(--color-cream)]">
        {texts.register?.success?.title || "Your request has been received."}
      </h2>
      {name && <p className="mt-2 font-cinzel text-[17px] font-semibold tracking-[0.12em] gala-engraved">{name}</p>}
      <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-[var(--color-cream)]/70">
        {texts.register?.success?.message ||
          "Our admissions committee will carefully review your credentials. You will receive an official invitation update via email."}
      </p>
      <div className="mt-8 w-full max-w-lg border-t border-[#d6dbe2]/15 pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-silver)]">{copy.afterTitle}</p>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {copy.after.map((j, i) => (
            <li key={j} className="flex flex-col items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] ${
                  i === 0 ? "border-[#e8ecf2] bg-[#7d1155] text-[var(--color-cream)]" : "border-[#d6dbe2]/30 text-[#d6dbe2]/60"
                }`}
              >
                {i === 0 ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span className={`text-[12.5px] ${i === 0 ? "text-[var(--color-cream)]" : "text-[var(--color-cream)]/50"}`}>{j}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ───────────────────────────── Buttons ───────────────────────────── */

function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const cls =
    "group relative inline-flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-full border border-[#e8ecf2]/55 bg-[linear-gradient(180deg,#8a1460,#550a39)] px-7 text-[14px] font-semibold text-[var(--color-cream)] shadow-[0_14px_30px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] transition-[transform,border-color,filter] duration-300 hover:border-[#f4f5f7] hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d6dbe2] sm:flex-none sm:px-9";
  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] transition-transform duration-700 group-hover:translate-x-[300%]"
      />
      <span className="relative inline-flex items-center gap-2.5">{children}</span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}
