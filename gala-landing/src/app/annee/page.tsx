"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function CetteAnnee() {
  const { texts } = useLanguage();

  // Simple non-function variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  // Simple parent for stagger if you prefer (optional)
  const titleParent = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  const cards = texts.annee?.cards || [
    {
      src: "/images/lema.svg",
      title: "Stands et Job Corners",
      text: "Des entreprises et startups pour orienter, recruter et échanger directement avec les participants.",
      delay: 0.05,
    },
    {
      src: "/images/gpt.svg",
      title: "CV review corner",
      text: "Un espace dédié à l'analyse et au conseil sur les CV des étudiants, animé par des professionnels. Une surprise attendra nos invités le jour J.",
      badge: "NOUVEAU!",
      delay: 0.18,
    },
    {
      src: "/images/host.svg",
      title: "TED-Style Talks",
      text: "Des interventions dynamiques de 15 à 20 minutes animées par des conférenciers et experts sur des thématiques variées liées à l'innovation, à la technologie et au développement personnel.",
      badge: "NOUVEAU!",
      delay: 0.31,
    },
  ];

  return (
    <main
      className="w-full min-h-screen flex flex-col items-center p-5 px-4 py-16 overflow-hidden bg-[#141414] relative"
      style={{
        background: `linear-gradient(180deg, #121212 0%, #1A1A1A 50%, #141414 100%)`,
      }}
    >
      {/* Decorative Champagne & Lavender Ambient Glows */}
      <div className="absolute top-[20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-radial from-[#DFC598]/10 via-[#ECE5F8]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-radial from-[#ECE5F8]/10 via-[#DFC598]/10 to-transparent blur-3xl pointer-events-none" />

      {/* SECTION TITRE */}
      <motion.div
        className="w-full max-w-5xl text-center z-10"
        variants={titleParent}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.04, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-serif bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#DFC598] bg-clip-text text-transparent font-bold"
        >
          {texts.annee?.title || "Cette année"}
        </motion.h1>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.18, duration: 0.8, ease: "easeOut" }}
          className="mt-6 text-2xl md:text-3xl font-serif text-[#F7F4EE] font-semibold"
        >
          {texts.annee?.subtitle || "8ème édition"}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.32, duration: 0.9, ease: "easeOut" }}
          className="mt-6 text-base md:text-lg text-[#D5CEC0] text-center max-w-3xl mx-auto leading-relaxed"
        >
          {texts.annee?.description ||
            "Pour cette 8ème édition, nous visons à aller encore plus loin en proposant des espaces interactifs, des conférences enrichissantes et des opportunités inédites pour les étudiants et jeunes diplômés."}
        </motion.p>
      </motion.div>

      {/* SECTION CARTES */}
      <section className="flex flex-col md:flex-row justify-center items-start gap-10 md:gap-12 text-[#1A1A1A] mt-16 z-10">
        {cards.map((card: any, idx: number) => (
          <motion.div
            key={idx}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{
              delay: card.delay,
              duration: 0.8,
              type: "spring",
              stiffness: 120,
              damping: 16,
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 20px 40px -8px rgba(0,0,0,0.3)",
            }}
            className="flex flex-col items-start bg-white rounded-3xl shadow-2xl p-7 w-80 h-[500px] text-left cursor-pointer border border-[#EAE3D5] hover:border-[#C5A880]/60 transition-all"
          >
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="w-full flex items-center justify-center p-4 bg-[#FAF7F2] rounded-2xl mb-5"
            >
              <Image
                src={card.src}
                alt={card.title}
                width={400}
                height={400}
                className="w-full h-36 object-contain"
              />
            </motion.div>

            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#1A1A1A] mb-1">
                {card.title}
              </h3>
              {card.badge && (
                <span className="px-2.5 py-0.5 text-xs font-sans font-semibold rounded-full bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]">
                  {card.badge}
                </span>
              )}
            </div>

            <p className="text-sm md:text-base text-[#6B6862] leading-relaxed">{card.text}</p>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
