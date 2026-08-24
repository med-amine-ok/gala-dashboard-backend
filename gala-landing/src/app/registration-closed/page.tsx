"use client";

import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function RegistrationClosedPage() {
  const language = useLanguage();
  const { texts } = language;

  return (
    <main className="min-h-screen bg-[#F7F4EE] flex items-center justify-center py-16 px-4 text-[#1A1A1A] font-sans relative overflow-hidden">
      {/* Decorative Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[550px] h-[550px] rounded-full bg-radial from-[#DFC598]/15 via-[#ECE5F8]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/20 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl p-10 shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] text-center z-10"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-[#F9ECEF] border border-[#F2C2CB] flex items-center justify-center mb-6">
          <XCircle size={44} className="text-[#8B2635]" />
        </div>
        <h1 className="text-3xl font-serif text-[#1A1A1A] font-bold">
          {texts.register?.closed?.title || "Inscriptions fermées"}
        </h1>
        <p className="text-[#6B6862] mt-3 leading-relaxed">
          {texts.register?.closed?.message ||
            "Nous vous remercions de votre intérêt, mais les inscriptions sont désormais fermées."}
        </p>

        {texts.register?.closed?.subtitle && (
          <p className="text-[#96928B] mt-2 text-sm">
            {texts.register?.closed?.subtitle}
          </p>
        )}
      </motion.div>
    </main>
  );
}
