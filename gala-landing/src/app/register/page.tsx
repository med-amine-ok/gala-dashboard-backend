"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import { useLanguage } from "../../context/LanguageContext";

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
        data.graduation_year === "OTHER" ? data.graduation_year_other || "" : "",
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
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
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
            "Failed to submit request. Please verify your details."
        );
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError(
        texts.register?.errors?.network ||
          "Unable to connect to the secure server. Please try again."
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
      fieldsToValidate = ["perspective_gala", "benefit_from_event", "heard_about"];
    }

    const valid = await trigger(fieldsToValidate);
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Success Celebration View
  if (done) {
    return (
      <main className="min-h-screen bg-[#F5F1E8] flex items-center justify-center py-20 px-6 text-[#1E1E1E] font-sans relative overflow-hidden">
        <div className="max-w-2xl w-full p-8 sm:p-14 rounded-3xl bg-[#FAF9F6] border border-[#E5DAC6] shadow-[0_30px_60px_-15px_rgba(30,30,30,0.08)] text-center relative z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#ECE5F8] border border-[#DDD0F3] flex items-center justify-center mb-6 text-[#6E4FA0]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] uppercase tracking-[0.25em] text-[#B89A5E] font-semibold block mb-2">
            REGISTRATION TRANSMITTED
          </span>

          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-[#1E1E1E] mb-4">
            {texts.register?.success?.title || "Your request has been received."}
          </h1>

          <p className="text-sm sm:text-base text-[#6B665E] font-light leading-relaxed max-w-md mx-auto mb-10">
            {texts.register?.success?.message ||
              "Our admissions committee will carefully review your credentials. You will receive an official invitation update via email."}
          </p>

          {/* Luxury Journey Milestone Progress */}
          <div className="py-6 border-y border-[#E5DAC6] mb-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#969085] font-semibold mb-4">
              ADMISSION JOURNEY
            </p>
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
              <div className="text-[#B89A5E] font-bold">1. REQUESTED</div>
              <div className="text-[#969085]">2. REVIEW</div>
              <div className="text-[#969085]">3. APPROVAL</div>
              <div className="text-[#969085]">4. INVITATION</div>
            </div>
          </div>

          <Link href="/">
            <button className="px-8 py-3.5 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.2em] transition-all cursor-pointer border border-[#1E1E1E]">
              RETURN TO GALA →
            </button>
          </Link>
        </div>
      </main>
    );
  }

  const stepLabels = [
    { num: "01", title: texts.register?.steps?.step1?.title || "PERSONAL" },
    { num: "02", title: texts.register?.steps?.step2?.title || "PROFILE" },
    { num: "03", title: texts.register?.steps?.step3?.title || "VISION" },
    { num: "04", title: texts.register?.steps?.step4?.title || "REVIEW" },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <main className="min-h-screen bg-[#F5F1E8] flex flex-col justify-center py-20 px-6 sm:px-12 text-[#1E1E1E] font-sans relative overflow-hidden">
          <div className="max-w-4xl w-full mx-auto my-auto z-10">
            {/* Header */}
            <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DAC6] pb-6">
              <div>
                <Link href="/" className="inline-block font-cinzel text-xl font-bold tracking-[0.2em] text-[#1E1E1E] hover:text-[#B89A5E] mb-2 transition-colors">
                  GALA · ALGIERS 2026
                </Link>
                <h1 className="font-cinzel text-3xl sm:text-4xl font-light text-[#1E1E1E]">
                  {texts.register?.headline || "Your evening\nbegins here."}
                </h1>
              </div>

              {/* Admission Pass Pill */}
              <div className="text-xs uppercase tracking-widest text-[#B89A5E] px-4 py-2 rounded-full bg-[#FAF9F6] border border-[#E5DAC6] self-start sm:self-auto font-mono font-bold">
                ADMISSION PASS · 1,000 DA
              </div>
            </div>

            {/* Refined Horizontal Step Progress */}
            <div className="grid grid-cols-4 gap-2 mb-10">
              {stepLabels.map((s, idx) => {
                const stepNum = idx + 1;
                const isCurrent = step === stepNum;
                const isPassed = step > stepNum;

                return (
                  <div key={idx} className="space-y-2">
                    <div
                      className={`h-[2px] transition-all duration-500 ${
                        isCurrent
                          ? "bg-[#B89A5E]"
                          : isPassed
                          ? "bg-[#1E1E1E]"
                          : "bg-[#E5DAC6]"
                      }`}
                    />
                    <p
                      className={`text-[10px] uppercase tracking-widest font-mono ${
                        isCurrent
                          ? "text-[#B89A5E] font-bold"
                          : isPassed
                          ? "text-[#1E1E1E]"
                          : "text-[#969085]"
                      }`}
                    >
                      {s.num} {s.title}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Form Card */}
            <div className="p-8 sm:p-12 rounded-3xl bg-[#FAF9F6] border border-[#E5DAC6] shadow-[0_25px_50px_-15px_rgba(30,30,30,0.06)]">
              <AnimatePresence mode="wait">
                {step === 1 && <Step1 texts={texts} />}
                {step === 2 && <Step2 texts={texts} />}
                {step === 3 && <Step3 texts={texts} />}
                {step === 4 && <Step4 data={watch()} requestedTier={requestedTier} texts={texts} />}
              </AnimatePresence>

              {submitError && (
                <div className="mt-6 p-4 rounded-xl bg-[#F9ECEF] border border-[#F2C2CB] text-[#8B2635] text-xs font-semibold text-center">
                  {submitError}
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="mt-12 pt-6 border-t border-[#E5DAC6] flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#E5DAC6] text-[#6B665E] hover:text-[#1E1E1E] hover:bg-[#F5F1E8] text-xs font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{texts.register?.buttons?.previous || "PREVIOUS"}</span>
                  </button>
                ) : (
                  <Link href="/">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-full border border-transparent text-[#969085] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </Link>
                )}

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.2em] transition-all cursor-pointer border border-[#1E1E1E] hover:border-[#B89A5E]"
                  >
                    <span>{texts.register?.buttons?.next || "CONTINUE"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const valid = await trigger();
                      if (valid) {
                        handleSubmit(onSubmit)();
                      }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-10 py-3.5 rounded-full bg-[#1E1E1E] text-[#FAF9F6] hover:bg-[#B89A5E] hover:text-[#1E1E1E] text-xs font-semibold uppercase tracking-[0.2em] transition-all cursor-pointer border border-[#1E1E1E] hover:border-[#B89A5E] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>{texts.register?.buttons?.submitting || "SUBMITTING REQUEST..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{texts.register?.buttons?.submit || "SUBMIT INVITATION REQUEST"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </form>
    </FormProvider>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center font-cinzel text-xl text-[#B89A5E]">
          LOADING GALA INVITATION...
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}

// ----------------- STEP 1: PERSONAL & ACADEMIC -----------------
function Step1({ texts }: { texts: any }) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<RegistrationData>();

  const showUniversityOther = watch("university") === "OTHER";
  const showFieldOfStudyOther = watch("field_of_study") === "OTHER";

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-medium text-[#1E1E1E] mb-1">
          {texts.register?.steps?.step1?.subtitle || "Identity & Credentials"}
        </h3>
        <p className="text-xs text-[#969085]">Please provide your official information.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.firstName || "First Name *"}
          </label>
          <input
            {...register("first_name")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E]"
          />
          {errors.first_name && (
            <p className="text-xs text-red-600 mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.lastName || "Last Name *"}
          </label>
          <input
            {...register("last_name")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E]"
          />
          {errors.last_name && (
            <p className="text-xs text-red-600 mt-1">{errors.last_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.email || "Email Address *"}
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E]"
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.phone || "Phone Number *"}
          </label>
          <input
            {...register("phone")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E]"
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.university || "University / Grande École *"}
          </label>
          <select
            {...register("university")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] cursor-pointer"
          >
            <option value="ENP">École Nationale Polytechnique (ENP)</option>
            <option value="ENSTA">ENSTA</option>
            <option value="USTHB">USTHB</option>
            <option value="ESAA">ESAA</option>
            <option value="ENSTP">ENSTP</option>
            <option value="OTHER">Other Institution</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.fieldOfStudy || "Engineering Specialization *"}
          </label>
          <select
            {...register("field_of_study")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] cursor-pointer"
          >
            {fieldOfStudyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {texts.register?.fields?.fieldOfStudies?.[opt.value] || opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------- STEP 2: PROFILE & AMBITIONS -----------------
function Step2({ texts }: { texts: any }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistrationData>();

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-medium text-[#1E1E1E] mb-1">
          {texts.register?.steps?.step2?.subtitle || "Ambitions & Trajectory"}
        </h3>
        <p className="text-xs text-[#969085]">Share your goals for the upcoming year.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.plansNextYear || "What are your primary ambitions for the coming year? *"}
          </label>
          <textarea
            rows={3}
            {...register("plans_next_year")}
            placeholder="e.g. Seeking graduate engineering roles in energy transition or AI systems..."
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] resize-none"
          />
          {errors.plans_next_year && (
            <p className="text-xs text-red-600 mt-1">{errors.plans_next_year.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.personalDescription || "Short personal statement or executive summary"}
          </label>
          <textarea
            rows={3}
            {...register("personal_description")}
            placeholder="Key achievements, technical passions, or project leadership..."
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] resize-none"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ----------------- STEP 3: VISION & DETAILS -----------------
function Step3({ texts }: { texts: any }) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<RegistrationData>();

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-medium text-[#1E1E1E] mb-1">
          {texts.register?.steps?.step3?.subtitle || "GALA Perspective & Synergy"}
        </h3>
        <p className="text-xs text-[#969085]">How your presence elevates the collective experience.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.perspectiveGala || "What is your vision of the GALA experience? *"}
          </label>
          <textarea
            rows={3}
            {...register("perspective_gala")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] resize-none"
          />
          {errors.perspective_gala && (
            <p className="text-xs text-red-600 mt-1">{errors.perspective_gala.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
            {texts.register?.fields?.benefitFromEvent || "How will participating in GALA accelerate your career? *"}
          </label>
          <textarea
            rows={3}
            {...register("benefit_from_event")}
            className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] resize-none"
          />
          {errors.benefit_from_event && (
            <p className="text-xs text-red-600 mt-1">{errors.benefit_from_event.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-2">
              {texts.register?.fields?.attendedBefore || "Attended Previous Edition?"}
            </label>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  checked={watch("attended_before") === true}
                  onChange={() => setValue("attended_before", true)}
                  className="accent-[#B89A5E]"
                />
                <span>{texts.register?.options?.yes || "Yes"}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  checked={watch("attended_before") === false}
                  onChange={() => setValue("attended_before", false)}
                  className="accent-[#B89A5E]"
                />
                <span>{texts.register?.options?.no || "No"}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-[#969085] font-semibold mb-1">
              {texts.register?.fields?.heardAbout || "Discovery Channel"}
            </label>
            <select
              {...register("heard_about")}
              className="w-full bg-transparent border-b border-[#E5DAC6] focus:border-[#B89A5E] focus:outline-none py-2.5 text-base text-[#1E1E1E] cursor-pointer"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Through a Friend">Colleague Recommendation</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------- STEP 4: EDITORIAL REVIEW -----------------
function Step4({
  data,
  requestedTier,
  texts,
}: {
  data: RegistrationData;
  requestedTier: string;
  texts: any;
}) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-cinzel text-xl sm:text-2xl font-medium text-[#1E1E1E] mb-1">
          {texts.register?.steps?.step4?.subtitle || "Review & Confirmation"}
        </h3>
        <p className="text-xs text-[#969085]">Please verify your dossier before final transmission.</p>
      </div>

      <div className="space-y-4 text-sm text-[#1E1E1E]">
        <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#E5DAC6] flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#969085]">ADMISSION PASS</p>
            <p className="font-cinzel text-base font-bold text-[#1E1E1E]">
              OFFICIAL ADMISSION TICKET · 1,000 DA
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-[#B89A5E]">
            ALGIERS · 08 NOV 2026
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F5F1E8] border border-[#E5DAC6]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#969085]">CANDIDATE</p>
            <p className="font-semibold">{data.first_name} {data.last_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#969085]">EMAIL</p>
            <p className="font-semibold">{data.email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#969085]">INSTITUTION</p>
            <p className="font-semibold">{data.university}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#969085]">SPECIALTY</p>
            <p className="font-semibold">{data.field_of_study}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
