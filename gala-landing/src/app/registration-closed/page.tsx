"use client";

import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function RegistrationClosedPage() {
  const language = useLanguage();
  const { texts } = language;

  return (
    <main className="min-h-screen bg-[var(--color-cream)] flex items-center justify-center py-16 px-4 text-[var(--color-dark)] font-sans relative overflow-hidden">
      {/* Decorative Ambient Subtle Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(139,30,45,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(45,7,13,0.06)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-[var(--color-dark)] rounded-3xl p-10 shadow-2xl border border-[var(--color-silver)]/30 text-center z-10"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-maroon)] border border-[var(--color-silver)]/40 flex items-center justify-center mb-6">
          <XCircle size={44} className="text-[var(--color-silver)]" />
        </div>
        <h1 className="text-3xl font-cinzel text-[var(--color-cream)] font-bold">
          {texts.register?.closed?.title || "Inscriptions fermées"}
        </h1>
        <p className="text-[var(--color-cream)]/80 mt-3 leading-relaxed">
          {texts.register?.closed?.message ||
            "Nous vous remercions de votre intérêt, mais les inscriptions sont désormais fermées."}
        </p>

        {texts.register?.closed?.subtitle && (
          <p className="text-[var(--color-silver)] mt-2 text-sm">
            {texts.register?.closed?.subtitle}
          </p>
        )}
      </motion.div>
    </main>
  );
}
