/* eslint-disable react/no-unescaped-entities */
"use client";
import React from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext"; // Import du contexte

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.3, duration: 0.6, ease: "easeOut" },
  }),
};

export default function Historique() {
  const { texts } = useLanguage(); // Utilisation du contexte global

  return (
    <div className="w-full min-h-screen text-[#1A1A1A] bg-[#F7F4EE]">
      <main className="flex flex-col items-center justify-center text-center relative px-4 py-16 overflow-hidden font-sans">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-serif bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent font-bold"
        >
          {texts.historique?.title || "Éditions précédentes"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 text-2xl md:text-3xl font-serif text-[#1A1A1A]"
        >
          {texts.historique?.subtitle || "historique de Engineers' GALA"}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-4 mb-8 text-base md:text-lg text-[#6B6862] max-w-4xl leading-relaxed"
        >
          {texts.historique?.description ||
            "Depuis sa première édition, Engineers' GALA s'est imposé comme un rendez-vous incontournable de l'ingénierie en Algérie. Chaque édition est marquée par des conférences de qualité, des invités prestigieux et une atmosphère unique d'innovation et de networking."}
        </motion.p>

        {/* Timeline */}
        <section className="relative w-full max-w-6xl mt-8">
          {/* Vertical line only on medium+ screens */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 hidden md:flex flex-col opacity-60">
            <Image
              src="/images/Union.svg"
              alt="timeline line"
              className="object-contain h-full"
              width={60}
              height={0}
              unoptimized
              priority
            />
          </div>

          {(
            texts.historique?.events || [
              {
                year: "2017",
                text: `Première édition, lancement du concept "Engineers' GALA".`,
                img: "/images/lowla.png",
                reverse: false,
              },
              {
                year: "2019",
                text: `Plus de 300 participants, invités du secteur de l'énergie.`,
                img: "/images/deuxième.png",
                reverse: true,
              },
              {
                year: "2024",
                text: `200 participants, stands d'entreprises, conférences et tables rondes animées par des experts.`,
                img: "/images/troisième.png",
                reverse: false,
              },
            ]
          ).map((event: any, i: number) => (
            <motion.div
              key={event.year}
              className={`flex flex-col md:flex-row ${
                event.reverse ? "md:flex-row-reverse" : ""
              } items-start md:items-center mb-16 relative text-left`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInVariants}
              custom={i}
            >
              {/* Text */}
              <div
                className={`w-full md:w-1/2 flex flex-col ${
                  event.reverse
                    ? "md:pl-12 md:items-start text-left"
                    : "md:pr-12 md:items-end md:text-right"
                }`}
              >
                <p className="text-3xl font-serif font-bold text-[#C5A880]">{event.year}</p>
                <p className="mt-2 text-base md:text-lg text-[#6B6862] max-w-md leading-relaxed">
                  {event.text}
                </p>
              </div>

              {/* Image */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="w-full md:w-1/2 mt-4 md:mt-0 flex justify-start md:justify-center"
              >
                <Image
                  src={event.img}
                  alt={`${event.year} event`}
                  width={380}
                  height={240}
                  className="rounded-2xl shadow-xl shadow-[#1A1A1A]/5 border border-[#EAE3D5] object-cover"
                />
              </motion.div>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
