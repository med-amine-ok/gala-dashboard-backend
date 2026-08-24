"use client";

import { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";

// Payment Schema
const paymentSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  first_name: z.string().min(1, "Champ obligatoire"),
  last_name: z.string().min(1, "Champ obligatoire"),
  phone: z.string().min(1, "Champ obligatoire"),
});

type PaymentData = z.infer<typeof paymentSchema>;

export default function PaymentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const methods = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {},
  });

  const { handleSubmit } = methods;
  const { id } = useParams();

  const onSubmit = async (data: PaymentData) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/payments/${id}`, { method: "POST" });

      // Try to parse JSON once
      const json = await res.json().catch(() => {
        throw new Error("Invalid JSON response from server");
      });

      if (!res.ok) {
        throw new Error(json?.message || "Failed to create payment link");
      }

      if (!json.checkout_url) {
        throw new Error("Payment link not found in response");
      }

      console.log("Payment link:", json.checkout_url);
      router.push(json.checkout_url);
    } catch (err) {
      console.error("Payment error:", err);
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center py-16 px-4 text-[#1A1A1A] font-sans relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#DFC598]/15 via-[#ECE5F8]/20 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/20 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="w-full max-w-3xl bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] z-10">
            <Header title="Paiement" subtitle="Informations de facturation" />

            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  name="first_name"
                  label="Prénom *"
                  error={methods.formState.errors.first_name?.message}
                />
                <TextField
                  name="last_name"
                  label="Nom *"
                  error={methods.formState.errors.last_name?.message}
                />
                <TextField
                  name="email"
                  type="email"
                  label="Adresse e-mail *"
                  error={methods.formState.errors.email?.message}
                />
                <TextField
                  name="phone"
                  label="Téléphone *"
                  error={methods.formState.errors.phone?.message}
                />
              </div>
            </motion.div>

            {error && (
              <div className="mt-6 p-4 bg-[#F9ECEF] border border-[#F2C2CB] rounded-xl flex items-center gap-3 text-[#8B2635] text-xs font-semibold">
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6E4FA0] bg-[#ECE5F8] border border-[#DDD0F3] hover:bg-[#DDD0F3] hover:shadow-md hover:shadow-[#C8B6E2]/25 transition-all disabled:opacity-50 shadow-2xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-1 h-4 w-4" />
                    Redirection...
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Procéder au paiement
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </form>
    </FormProvider>
  );
}

// Header
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

// Text Field
function TextField({
  name,
  label,
  error,
  type = "text",
}: {
  name: keyof PaymentData;
  label: string;
  error?: string;
  type?: string;
}) {
  const { register } = useFormContext<PaymentData>();
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
