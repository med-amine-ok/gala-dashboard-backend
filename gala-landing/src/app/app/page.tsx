"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";

export default function App() {
  const { texts } = useLanguage();
  const [activeTab, setActiveTab] = useState("features");

  const features = texts.application?.features || [
    {
      title: "Agenda détaillé en temps réel",
      description: "Accédez instantanément à l'agenda et aux activités",
    },
    {
      title: "Carte interactive",
      description:
        "Localisez les stands et zones clés sur la carte interactive",
    },
    {
      title: "Messagerie interne pour échanger avec les participants",
      description:
        "Participez aux discussions et panels directement depuis l'application",
    },
    {
      title: "Accès à du contenu exclusif",
      description: "Recevez des notifications et mises à jour en temps réel",
    },
  ];

  const tutorialSteps = texts.application?.tutorialSteps || [
    "Téléchargez l'application depuis le lien officiel",
    "Installez-la facilement sur votre smartphone",
    "Connectez-vous ou créez votre compte",
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen py-16 px-4 bg-[#F7F4EE] font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Titre principal */}
        <motion.div
          className="text-center sm:text-6xl text-4xl font-serif font-bold mb-8 border-b border-[#EAE3D5] pb-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent">
            {texts.application?.title?.gradient || "Application officielle"}
          </span>
          <span className="text-[#1A1A1A] ml-2 font-serif">
            {texts.application?.title?.black || "du GALA"}
          </span>
        </motion.div>

        {/* Boutons sous le grand titre */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-4 mb-12"
        >
          <button
            onClick={() => setActiveTab("features")}
            className={`px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "features"
                ? "bg-[#1A1A1A] text-[#F7F4EE] shadow-md"
                : "bg-[#EAE3D5]/60 text-[#6B6862] hover:bg-[#EAE3D5] hover:text-[#1A1A1A]"
            }`}
          >
            {texts.application?.featuresTab || "Fonctionnalités"}
          </button>
          <button
            onClick={() => setActiveTab("tutorial")}
            className={`px-8 py-3 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === "tutorial"
                ? "bg-[#1A1A1A] text-[#F7F4EE] shadow-md"
                : "bg-[#EAE3D5]/60 text-[#6B6862] hover:bg-[#EAE3D5] hover:text-[#1A1A1A]"
            }`}
          >
            {texts.application?.tutorialTab || "Tutorielle"}
          </button>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Colonne gauche - Texte fixe */}
          <div className="flex-1">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <motion.div
                className="text-left sm:text-4xl text-2xl font-serif font-bold mb-4"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <span className="text-[#1A1A1A]">
                  {texts.application?.title?.black1 || "L'expérience "}
                </span>
                <span className="bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent">
                  {texts.application?.title?.gradient2 || " Engineers' GALA"}
                </span>
                <span className="text-[#1A1A1A]">
                  {texts.application?.title?.black2 || " à portée de main"}
                </span>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <p className="text-lg text-[#6B6862] leading-relaxed">
                  {texts.application?.description1 ||
                    "L'application officielle du GALA est conçue pour"}
                </p>
                <p className="text-lg text-[#6B6862] leading-relaxed">
                  {texts.application?.description2 ||
                    "accompagner chaque participant et optimiser son expérience"}
                </p>
              </motion.div>
            </motion.div>

            {/* Contenu dynamique */}
            {activeTab === "features" ? (
              <>
                {/* Fonctionnalités */}
                <motion.h3
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-serif text-[#1A1A1A] font-bold mb-6"
                >
                  {texts.application?.featuresTitle || "Fonctionnalités clés :"}
                </motion.h3>

                <div className="space-y-4">
                  {features.map((feature: any, index: number) => (
                    <motion.div
                      key={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white rounded-2xl p-6 shadow-xs border border-[#EAE3D5] hover:border-[#C5A880]/40 hover:shadow-md transition-all duration-300"
                    >
                      <h4 className="text-lg text-[#1A1A1A] font-serif font-bold mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm md:text-base text-[#6B6862] leading-relaxed">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Tutorielle */}
                <motion.h3
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-xl font-serif text-[#1A1A1A] font-bold mb-6"
                >
                  {texts.application?.tutorialTitle ||
                    "Tutoriel d'installation et guide utilisateur"}
                </motion.h3>

                <div className="space-y-4">
                  {tutorialSteps.map((step: string, index: number) => (
                    <motion.div
                      key={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white rounded-2xl p-6 shadow-xs border border-[#EAE3D5] hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {index + 1}
                        </div>
                        <p className="text-base text-[#1A1A1A] pt-1 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite - Image téléphone */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative p-4"
            >
              <Image
                src="/images/tlf.svg"
                alt="Application mobile GALA"
                width={300}
                height={600}
                className="w-64 lg:w-80 drop-shadow-xl"
              />
            </motion.div>
          </div>
        </div>

        {/* Bouton Télécharger l'appli */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="flex justify-center mt-16"
        >
          <a
            href="https://gala-app.netlify.app/"
            className="bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#DFC598] text-[#1A1A1A] text-lg font-semibold uppercase tracking-wider px-10 py-4 rounded-full hover:scale-105 transition-transform duration-300 shadow-xl shadow-[#C5A880]/20 border border-[#E5DAC6]"
          >
            {texts.application?.downloadButton || "Télécharger l'appli"}
          </a>
        </motion.div>
      </div>
    </main>
  );
}
