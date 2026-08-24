"use client";

import { useMemo, useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import * as z from "zod";
import { useLanguage } from "../../context/LanguageContext";

const fieldOfStudyOptions = [
  { value: "hydraulics", label: "Hydraulics" },
  { value: "green_hydrogen", label: "Green Hydrogen" },
  { value: "civil", label: "Civil Engineering" },
  { value: "chemical", label: "Chemical Engineering" },
  { value: "materials", label: "Materials Engineering" },
  { value: "mining", label: "Mining Engineering" },
  { value: "industrial", label: "Industrial Engineering" },
  { value: "mechanical", label: "Mechanical Engineering" },
  { value: "automotive", label: "Automotive Engineering" },
  { value: "environmental", label: "Environmental Engineering" },
  { value: "electrical", label: "Electrical Engineering" },
  { value: "electronics", label: "Electronics Engineering" },
  { value: "qhse", label: "QHSE (Quality, Health, Safety & Environment)" },
  { value: "automation", label: "Automation & Control" },
  { value: "datascience_ai", label: "Data Science & AI" },
  { value: "OTHER", label: "Other" },
];

const createRegistrationSchema = (lang: "fr" | "en") => {
  const messages = {
    fr: {
      invalidEmail: "Adresse e-mail invalide",
      required: "Champ obligatoire",
    },
    en: {
      invalidEmail: "Invalid email address",
      required: "This field is required",
    },
  }[lang] || {
    invalidEmail: "Adresse e-mail invalide",
    required: "Champ obligatoire",
  };

  return z.object({
    email: z.string().email(messages.invalidEmail),
    first_name: z.string().min(1, messages.required),
    last_name: z.string().min(1, messages.required),
    phone: z.string().min(1, messages.required),

    participant_type: z.enum(["ST", "G"]).default("ST"),

    job_title: z.string().optional(),
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
    attended_before: z.boolean(),
    heard_about: z.enum([
      "Facebook",
      "Instagram",
      "Through a Friend",
      "LinkedIn",
      "OTHER",
    ]),
    heard_about_other: z.string().optional(),
    additional_comments: z.string().optional(),
    linkedin_url: z.string().optional(),
  });
};

type RegistrationData = z.infer<ReturnType<typeof createRegistrationSchema>>;

// ----------------- MAIN COMPONENT -----------------
export default function RegistrationPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const language = useLanguage();
  const { texts } = language;

  const registrationSchema = useMemo(() => {
    return createRegistrationSchema(language.lang as "fr" | "en");
  }, [language.lang]);

  const methods = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema) as never,
    defaultValues: {
      attended_before: false,
      participant_type: "ST",
      current_year: "1",
    },
  });

  const { handleSubmit, watch, trigger, setError } = methods;

  const onSubmit = async (data: RegistrationData) => {
    setSubmitError(null);
    setLoading(true);

    // Clean up conditional other fields before sending
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
      // Primary: try internal Next.js API route proxy
      let response = await fetch("/api/participants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Fallback: direct to API base URL if internal route is unreachable
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
            setStep(1); // Jump back to step 1 so user can see and change email
            return;
          }

          if (resJson.error || resJson.detail || resJson.details) {
            setSubmitError(resJson.error || resJson.detail || resJson.details);
            return;
          }

          // Handle generic field error dictionary
          const errorEntries = Object.entries(resJson);
          if (errorEntries.length > 0) {
            const [field, errVal] = errorEntries[0];
            const msg = Array.isArray(errVal) ? errVal.join(" ") : String(errVal);
            setSubmitError(`${field}: ${msg}`);
            return;
          }
        }

        setSubmitError(
          texts.register?.errors?.submit ||
            "Échec de l'inscription. Veuillez vérifier vos informations."
        );
        return;
      }

      setDone(true);
    } catch (err) {
      console.error("❌ Network error:", err);
      setSubmitError(
        texts.register?.errors?.network ||
          "Impossible de se connecter au serveur backend. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate before moving to next step
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

  if (done) {
    return (
      <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center py-16 px-4 text-[#1A1A1A] font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#DFC598]/15 via-[#ECE5F8]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/20 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] text-center z-10"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[#ECE5F8] border border-[#DDD0F3] flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-[#6E4FA0]" />
          </div>
          <h1 className="text-3xl font-serif text-[#1A1A1A] font-bold">
            {texts.register?.success?.title || "Inscription réussie !"}
          </h1>
          <p className="text-[#6B6862] mt-3 leading-relaxed">
            {texts.register?.success?.message ||
              "Merci pour votre participation à l'Engineers' Gala. Votre inscription a été enregistrée avec succès."}
          </p>
        </motion.div>
      </main>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center py-16 px-4 text-[#1A1A1A] font-sans relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#DFC598]/15 via-[#ECE5F8]/20 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/20 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] z-10">
            {/* Progress bar */}
            <div className="w-full bg-[#EAE3D5] rounded-full h-2 mb-10 overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#6E4FA0]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && <Step1 texts={texts} />}
              {step === 2 && <Step2 texts={texts} />}
              {step === 3 && <Step3 texts={texts} />}
              {step === 4 && <Step4 data={watch()} texts={texts} />}
            </AnimatePresence>

            {submitError && (
              <div className="mt-6 p-4 rounded-xl bg-[#F9ECEF] border border-[#F2C2CB] text-[#8B2635] text-xs font-semibold text-center">
                {submitError}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 flex justify-end gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="cursor-pointer border border-[#E5DAC6] text-[#6B6862] rounded-2xl px-8 py-3 hover:bg-[#F7F4EE] hover:text-[#1A1A1A] transition-all text-xs font-semibold uppercase tracking-wider"
                  disabled={loading}
                >
                  {texts.register?.buttons?.previous || "Précédent"}
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="cursor-pointer rounded-2xl px-8 py-3 text-xs font-semibold uppercase tracking-wider text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] hover:bg-[#DDD0F3] hover:shadow-md hover:shadow-[#C8B6E2]/25 transition-all shadow-2xs"
                  disabled={loading}
                >
                  {texts.register?.buttons?.next || "Suivant"}
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
                  className="cursor-pointer flex items-center justify-center gap-2 rounded-2xl px-8 py-3 text-xs font-semibold uppercase tracking-wider text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] hover:bg-[#DDD0F3] hover:shadow-md hover:shadow-[#C8B6E2]/25 transition-all disabled:opacity-50 shadow-2xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-1 h-4 w-4" />
                      {texts.register?.buttons?.submitting || "Soumission..."}
                    </>
                  ) : (
                    texts.register?.buttons?.submit || "Soumettre"
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </form>
    </FormProvider>
  );
}

// ----------------- STEP COMPONENTS -----------------
function Step1({ texts }: { texts: any }) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<RegistrationData>();

  const showUniversityOther = watch("university") === "OTHER";
  const showFieldOfStudyOther = watch("field_of_study") === "OTHER";
  const showAcademicLevelOther = watch("academic_level") === "OTHER";
  const showGraduationYearOther = watch("graduation_year") === "OTHER";

  const universityOptions = [
    { value: "ENP", label: texts.register?.fields?.universities?.ENP || "ENP" },
    {
      value: "ENSTA",
      label: texts.register?.fields?.universities?.ENSTA || "ENSTA",
    },
    {
      value: "USTHB",
      label: texts.register?.fields?.universities?.USTHB || "USTHB",
    },
    {
      value: "ESAA",
      label: texts.register?.fields?.universities?.ESAA || "ESAA",
    },
    {
      value: "ENSTP",
      label: texts.register?.fields?.universities?.ENSTP || "ENSTP",
    },
    {
      value: "OTHER",
      label: texts.register?.fields?.universities?.OTHER || "Other",
    },
  ];

  const fieldOfStudyOptionsTranslated = fieldOfStudyOptions.map((opt) => ({
    value: opt.value,
    label: texts.register?.fields?.fieldOfStudies?.[opt.value] || opt.label,
  }));

  const academicLevelOptions = [
    {
      value: "Bachelor’s Degree",
      label:
        texts.register?.fields?.academicLevels?.bachelor || "Bachelor’s Degree",
    },
    {
      value: "Master’s Degree",
      label:
        texts.register?.fields?.academicLevels?.master || "Master’s Degree",
    },
    {
      value: "Engineering Degree",
      label:
        texts.register?.fields?.academicLevels?.engineering ||
        "Engineering Degree",
    },
    {
      value: "PhD",
      label: texts.register?.fields?.academicLevels?.phd || "PhD",
    },
    {
      value: "Postgraduate Studies (PGS)",
      label:
        texts.register?.fields?.academicLevels?.pgs ||
        "Postgraduate Studies (PGS)",
    },
    {
      value: "OTHER",
      label: texts.register?.fields?.academicLevels?.other || "Other",
    },
  ];

  const graduationYearOptions = [
    "2023",
    "2024",
    "2025",
    "2026",
    "2027",
    "2028",
    "OTHER",
  ].map((year) => ({
    value: year,
    label: texts.register?.fields?.graduationYears?.[year] || year,
  }));

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <Header
        title={texts.register?.steps?.step1?.title || "Partie 01"}
        subtitle={
          texts.register?.steps?.step1?.subtitle || "Informations personnelles"
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="first_name"
          label={texts.register?.fields?.firstName || "Prénom *"}
          error={errors.first_name?.message}
        />
        <TextField
          name="last_name"
          label={texts.register?.fields?.lastName || "Nom *"}
          error={errors.last_name?.message}
        />
        <TextField
          name="email"
          type="email"
          label={texts.register?.fields?.email || "Adresse e-mail *"}
          error={errors.email?.message}
        />
        <TextField
          name="phone"
          label={texts.register?.fields?.phone || "Téléphone *"}
          error={errors.phone?.message}
        />

        <SelectField
          name="university"
          label={texts.register?.fields?.university || "Université *"}
          error={errors.university?.message}
          options={universityOptions}
        />

        {showUniversityOther && (
          <TextField
            name="university_other"
            label={
              texts.register?.fields?.universityOther ||
              "Précisez votre université *"
            }
            error={errors.university_other?.message}
          />
        )}

        <SelectMajor
          name="field_of_study"
          label={texts.register?.fields?.fieldOfStudy || "Spécialité *"}
          error={errors.field_of_study?.message}
          options={fieldOfStudyOptionsTranslated}
        />

        {showFieldOfStudyOther && (
          <TextField
            name="field_of_study_other"
            label={
              texts.register?.fields?.fieldOfStudyOther ||
              "Précisez votre spécialité *"
            }
            error={errors.field_of_study_other?.message}
          />
        )}

        <SelectField
          name="academic_level"
          label={texts.register?.fields?.academicLevel || "Niveau académique *"}
          error={errors.academic_level?.message}
          options={academicLevelOptions}
        />

        {showAcademicLevelOther && (
          <TextField
            name="academic_level_other"
            label={
              texts.register?.fields?.academicLevelOther ||
              "Précisez votre niveau académique *"
            }
            error={errors.academic_level_other?.message}
          />
        )}

        <SelectField
          name="graduation_year"
          label={
            texts.register?.fields?.graduationYear || "Année de diplomation *"
          }
          error={errors.graduation_year?.message}
          options={graduationYearOptions}
        />

        {showGraduationYearOther && (
          <TextField
            name="graduation_year_other"
            label={
              texts.register?.fields?.graduationYearOther ||
              "Précisez votre année de diplomation *"
            }
            error={errors.graduation_year_other?.message}
          />
        )}
      </div>
    </motion.div>
  );
}

function Step2({ texts }: { texts: any }) {
  const {
    formState: { errors },
  } = useFormContext<RegistrationData>();

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <Header
        title={texts.register?.steps?.step2?.title || "Partie 02"}
        subtitle={
          texts.register?.steps?.step2?.subtitle || "Vos plans et motivation"
        }
      />
      <div className="space-y-4">
        <TextAreaField
          name="plans_next_year"
          label={
            texts.register?.fields?.plansNextYear ||
            "Quels sont vos projets pour l'année à venir ? *"
          }
          error={errors.plans_next_year?.message}
        />
        <TextAreaField
          name="personal_description"
          label={
            texts.register?.fields?.personalDescription ||
            "Courte description personnelle / Motivation"
          }
          error={errors.personal_description?.message}
        />
      </div>
    </motion.div>
  );
}

function Step3({ texts }: { texts: any }) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<RegistrationData>();

  const showHeardAboutOther = watch("heard_about") === "OTHER";

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <Header
        title={texts.register?.steps?.step3?.title || "Partie 03"}
        subtitle={
          texts.register?.steps?.step3?.subtitle || "Votre vision du Gala"
        }
      />
      <div className="space-y-4">
        <TextAreaField
          name="perspective_gala"
          label={
            texts.register?.fields?.perspectiveGala ||
            "Que savez-vous du Engineers' Gala ? *"
          }
          error={errors.perspective_gala?.message}
        />
        <TextAreaField
          name="benefit_from_event"
          label={
            texts.register?.fields?.benefitFromEvent ||
            "En quoi votre participation vous sera bénéfique ? *"
          }
          error={errors.benefit_from_event?.message}
        />

        <div className="mt-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6]">
          <label className="block mb-2 text-xs font-semibold text-[#6B6862] uppercase tracking-wider">
            {texts.register?.fields?.attendedBefore ||
              "Avez-vous déjà assisté à une édition précédente ? *"}
          </label>
          <div className="flex gap-6 mt-2 text-[#1A1A1A] text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="true"
                checked={watch("attended_before") === true}
                onChange={() => setValue("attended_before", true)}
                className="accent-[#6E4FA0]"
              />{" "}
              {texts.register?.options?.yes || "Oui"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="false"
                checked={watch("attended_before") === false}
                onChange={() => setValue("attended_before", false)}
                className="accent-[#6E4FA0]"
              />{" "}
              {texts.register?.options?.no || "Non"}
            </label>
          </div>
        </div>

        <SelectField
          name="heard_about"
          label={
            texts.register?.fields?.heardAbout ||
            "Comment avez-vous entendu parler du Gala ? *"
          }
          error={errors.heard_about?.message}
          options={[
            {
              value: "Facebook",
              label:
                texts.register?.fields?.heardAboutOptions?.Facebook || "Facebook",
            },
            {
              value: "Instagram",
              label:
                texts.register?.fields?.heardAboutOptions?.Instagram ||
                "Instagram",
            },
            {
              value: "Through a Friend",
              label:
                texts.register?.fields?.heardAboutOptions?.throughAFriend ||
                "Through a Friend",
            },
            {
              value: "LinkedIn",
              label:
                texts.register?.fields?.heardAboutOptions?.LinkedIn || "LinkedIn",
            },
            {
              value: "OTHER",
              label: texts.register?.fields?.heardAboutOptions?.OTHER || "Other",
            },
          ]}
        />
        {showHeardAboutOther && (
          <TextField
            name="heard_about_other"
            label={
              texts.register?.fields?.heardAboutOther || "Précisez comment *"
            }
            error={errors.heard_about_other?.message}
          />
        )}

        <TextAreaField
          name="additional_comments"
          label={
            texts.register?.fields?.additionalComments ||
            "Commentaires additionnels"
          }
          error={errors.additional_comments?.message}
        />
      </div>
    </motion.div>
  );
}

function Step4({ data, texts }: { data: RegistrationData; texts: any }) {
  const getLabel = (field: keyof RegistrationData, value: string) => {
    if (!value) return "";

    switch (field) {
      case "university": {
        const options = [
          {
            value: "ENP",
            label: texts.register?.fields?.universities?.ENP || "ENP",
          },
          {
            value: "ENSTA",
            label: texts.register?.fields?.universities?.ENSTA || "ENSTA",
          },
          {
            value: "USTHB",
            label: texts.register?.fields?.universities?.USTHB || "USTHB",
          },
          {
            value: "ESAA",
            label: texts.register?.fields?.universities?.ESAA || "ESAA",
          },
          {
            value: "ENSTP",
            label: texts.register?.fields?.universities?.ENSTP || "ENSTP",
          },
          {
            value: "OTHER",
            label:
              data.university_other ||
              texts.register?.fields?.universities?.OTHER ||
              "Other",
          },
        ];
        return options.find((o) => o.value === value)?.label || value;
      }
      case "field_of_study": {
        const options = fieldOfStudyOptions.map((opt) => ({
          value: opt.value,
          label:
            texts.register?.fields?.fieldOfStudies?.[opt.value] || opt.label,
        }));
        if (value === "OTHER") return data.field_of_study_other || "Other";
        return options.find((o) => o.value === value)?.label || value;
      }
      case "academic_level": {
        const options = [
          {
            value: "Bachelor’s Degree",
            label:
              texts.register?.fields?.academicLevels?.bachelor ||
              "Bachelor’s Degree",
          },
          {
            value: "Master’s Degree",
            label:
              texts.register?.fields?.academicLevels?.master ||
              "Master’s Degree",
          },
          {
            value: "Engineering Degree",
            label:
              texts.register?.fields?.academicLevels?.engineering ||
              "Engineering Degree",
          },
          {
            value: "PhD",
            label: texts.register?.fields?.academicLevels?.phd || "PhD",
          },
          {
            value: "Postgraduate Studies (PGS)",
            label:
              texts.register?.fields?.academicLevels?.pgs || "PGS",
          },
          {
            value: "OTHER",
            label:
              data.academic_level_other ||
              texts.register?.fields?.academicLevels?.other ||
              "Other",
          },
        ];
        return options.find((o) => o.value === value)?.label || value;
      }
      case "graduation_year": {
        if (value === "OTHER") return data.graduation_year_other || "Other";
        return value;
      }
      case "current_year": {
        const yearsMap: Record<string, string> = {
          "1": "1ère année",
          "2": "2ème année",
          "3": "3ème année",
          "4": "4ème année",
          "5": "5ème année",
          GRADUATED: "Diplômé(e)",
        };
        return yearsMap[value] || value;
      }
      case "heard_about": {
        const options = [
          {
            value: "Facebook",
            label:
              texts.register?.fields?.heardAboutOptions?.Facebook || "Facebook",
          },
          {
            value: "Instagram",
            label:
              texts.register?.fields?.heardAboutOptions?.Instagram ||
              "Instagram",
          },
          {
            value: "Through a Friend",
            label:
              texts.register?.fields?.heardAboutOptions?.throughAFriend ||
              "Through a Friend",
          },
          {
            value: "LinkedIn",
            label:
              texts.register?.fields?.heardAboutOptions?.LinkedIn || "LinkedIn",
          },
          {
            value: "OTHER",
            label:
              data.heard_about_other ||
              texts.register?.fields?.heardAboutOptions?.OTHER ||
              "Other",
          },
        ];
        return options.find((o) => o.value === value)?.label || value;
      }
      default:
        return value;
    }
  };

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
    >
      <Header
        title={texts.register?.steps?.step4?.title || "Partie 04"}
        subtitle={texts.register?.steps?.step4?.subtitle || "Confirmation"}
      />
      <p className="text-[#6B6862] mb-8 text-center text-sm">
        {texts.register?.confirmation?.message ||
          "Vérifiez vos informations avant de soumettre votre inscription."}
      </p>
      <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E5DAC6] text-left text-[#1A1A1A] space-y-2 text-sm">
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.firstName || "Prénom").replace("*", "")}</span>
          <span className="font-semibold">{data.first_name}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.lastName || "Nom").replace("*", "")}</span>
          <span className="font-semibold">{data.last_name}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.email || "Email").replace("*", "")}</span>
          <span className="font-semibold">{data.email}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.university || "Université").replace("*", "")}</span>
          <span className="font-semibold">{getLabel("university", data.university)}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.fieldOfStudy || "Spécialité").replace("*", "")}</span>
          <span className="font-semibold">{getLabel("field_of_study", data.field_of_study)}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.academicLevel || "Niveau académique").replace("*", "")}</span>
          <span className="font-semibold">{getLabel("academic_level", data.academic_level)}</span>
        </p>
        <p className="flex justify-between border-b border-[#EAE3D5] pb-1.5">
          <span className="text-[#6B6862]">{(texts.register?.fields?.graduationYear || "Année de diplomation").replace("*", "")}</span>
          <span className="font-semibold">{getLabel("graduation_year", data.graduation_year)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-[#6B6862]">{(texts.register?.fields?.heardAbout || "Comment avez-vous entendu parler du Gala ?").replace("*", "")}</span>
          <span className="font-semibold">{getLabel("heard_about", data.heard_about)}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ----------------- SMALL COMPONENTS -----------------
function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-[#C5A880] text-xs font-semibold uppercase tracking-wider font-sans">
        {title}
      </h2>
      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mt-1 font-serif">
        {subtitle}
      </h1>
    </div>
  );
}

function TextField({
  name,
  label,
  error,
  type = "text",
}: {
  name: keyof RegistrationData;
  label: string;
  error?: string;
  type?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-[#6B6862] uppercase tracking-wider">
        {label}
      </label>
      <input
        {...register(name)}
        type={type}
        className="w-full rounded-xl border border-[#E5DAC6] bg-[#FAF7F2] px-4 py-2.5 text-sm placeholder-[#A0A0A0] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
      />
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function TextAreaField({
  name,
  label,
  error,
}: {
  name: keyof RegistrationData;
  label: string;
  error?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  return (
    <div className="mt-4">
      <label className="block mb-2 text-xs font-semibold text-[#6B6862] uppercase tracking-wider">
        {label}
      </label>
      <textarea
        {...register(name)}
        rows={3}
        className="w-full rounded-xl border border-[#E5DAC6] bg-[#FAF7F2] px-4 py-2.5 text-sm placeholder-[#A0A0A0] text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
      />
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

type Option = {
  value: string;
  label: string;
};

function SelectField({
  name,
  label,
  options,
  error,
}: {
  name: keyof RegistrationData;
  label: string;
  options: Option[];
  error?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-[#6B6862] uppercase tracking-wider">
        {label}
      </label>
      <select
        {...register(name)}
        className="w-full rounded-xl border border-[#E5DAC6] bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
      >
        <option value="">
          {label.includes("*") ? "Sélectionner *" : "Sélectionner"}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

function SelectMajor({
  name,
  label,
  options,
  error,
}: {
  name: keyof RegistrationData;
  label: string;
  options: Option[];
  error?: string;
}) {
  const { register } = useFormContext<RegistrationData>();
  return (
    <div>
      <label className="block mb-2 text-xs font-semibold text-[#6B6862] uppercase tracking-wider">
        {label}
      </label>
      <select
        {...register(name)}
        className="w-full rounded-xl border border-[#E5DAC6] bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880] focus:border-[#C5A880] transition-colors"
      >
        <option value="">
          {label.includes("*") ? "Sélectionner *" : "Sélectionner"}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1.5">{error}</p>}
    </div>
  );
}
