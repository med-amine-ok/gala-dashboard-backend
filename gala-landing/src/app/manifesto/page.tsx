"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function ManifestoSection() {
  const { texts } = useLanguage();

  return (
    <section
      id="manifesto"
      className="relative min-h-[85vh] w-full bg-[#F5F1E8] text-[#1E1E1E] flex flex-col justify-center py-24 sm:py-36 px-6 sm:px-12 overflow-hidden border-t border-[#E5DAC6]/60"
    >
      {/* Refined Ambient Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto">
        {/* Category Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E]">
            {texts.manifesto?.label || "THE GALA EXPERIENCE"}
          </span>
        </motion.div>

        {/* Large Cinzel Statement */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-cinzel text-4xl sm:text-6xl lg:text-7xl font-light text-[#1E1E1E] leading-[1.12] mb-12 whitespace-pre-line"
        >
          {texts.manifesto?.headline || "One night.\nThe right people.\nEndless possibilities."}
        </motion.h2>

        {/* Expanding Champagne Gold Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="origin-left w-full h-[1px] bg-gradient-to-r from-[#B89A5E] via-[#DED3BD] to-transparent mb-12"
        />

        {/* Editorial Narrative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="md:col-span-7 space-y-6 text-base sm:text-lg text-[#6B665E] font-light leading-relaxed"
          >
            <p>
              {texts.manifesto?.paragraph1 ||
                "GALA is not merely an annual gathering. It is an intentional sanctuary designed for high-calibre engineering minds and forward-thinking corporate titans to cross paths."}
            </p>
            <p>
              {texts.manifesto?.paragraph2 ||
                "We curate an environment where meaningful dialogue replaces elevator pitches, and where a single conversation can redefine an engineer's career or illuminate an enterprise's future."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="md:col-span-5 p-8 rounded-2xl bg-[#FAF9F6] border border-[#E5DAC6] shadow-[0_10px_30px_-15px_rgba(30,30,30,0.03)]"
          >
            <p className="font-cinzel text-xl sm:text-2xl text-[#1E1E1E] font-medium leading-snug mb-6">
              {texts.manifesto?.quote ||
                "“Connections that matter. Conversations that create opportunity.”"}
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E5DAC6]">
              {(texts.manifesto?.stats || [
                { value: "100%", label: "Curated Attendance" },
                { value: "1:1", label: "Executive Access" },
                { value: "5-Star", label: "Refined Hospitality" },
              ]).map((st: any, idx: number) => (
                <div key={idx} className="text-left">
                  <span className="font-cinzel text-xl font-bold text-[#B89A5E]">
                    {st.value}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-[#969085] mt-1 font-medium">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
