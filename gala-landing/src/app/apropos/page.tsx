/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext"; // Import du contexte

export default function Apropos() {
  const { texts } = useLanguage(); // Utilisation du contexte global
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true });

  // Target numbers
  const targetNumbers = [15, 200, 800];

  // Motion values and springs (hooks at top-level)
  const motionValues = targetNumbers.map(() => useMotionValue(0));
  const springs = motionValues.map((mv) =>
    useSpring(mv, { stiffness: 60, damping: 20 })
  );

  // State to display in JSX
  const [counters, setCounters] = useState([0, 0, 0]);

  // Subscribe to springs
  useEffect(() => {
    const unsubscribes = springs.map((spring, i) =>
      spring.on("change", (latest) => {
        setCounters((prev) => {
          const copy = [...prev];
          copy[i] = Math.floor(latest);
          return copy;
        });
      })
    );

    if (isInView) {
      motionValues.forEach((mv, i) => mv.set(targetNumbers[i]));
    }

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [isInView, motionValues, springs]);

  // ✅ Properly typed fade-up animation
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  };

  return (
    <section className="w-full flex justify-center text-[#1A1A1A] bg-[#F7F4EE] py-16 font-sans">
      <div className="flex flex-col md:flex-row-reverse gap-8 md:gap-12 p-8 max-w-[1800px] w-full">
        {/* Text Column */}
        <div className="flex-1 flex flex-col gap-4 order-1">
          <motion.h1
            className="sm:text-6xl text-4xl font-serif font-bold text-[#1A1A1A]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {texts.apropos?.title?.part1 || "À propos du"}{" "}
            <span className="bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent font-serif">
              {texts.apropos?.title?.highlighted || "Vision & Innovation Club"}
            </span>
          </motion.h1>

          <motion.p
            className="text-base md:text-lg text-[#6B6862] max-w-md leading-relaxed"
            custom={1.2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {texts.apropos?.description ||
              "Créé en 2014 sous la tutelle de l'association « EL-MAARIFA », le Vision & Innovation Club (VIC) est un club scientifique actif à l'École Nationale Polytechnique d'Alger."}
          </motion.p>

          {/* Stats */}
          <motion.h2
            className="text-xl md:text-2xl font-serif font-bold mt-4 text-[#1A1A1A]"
            custom={1.4}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {texts.apropos?.stats?.title || "Statistiques:"}
          </motion.h2>

          <motion.div
            ref={statsRef}
            className="flex flex-wrap gap-6 mt-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {(
              texts.apropos?.stats?.items || [
                "Événements majeurs",
                "Membres actifs",
                "Alumnis",
              ]
            ).map((label: string, i: number) => (
              <motion.div
                key={i}
                className="flex flex-col items-start p-4 rounded-2xl bg-white border border-[#EAE3D5] shadow-xs min-w-[120px]"
                variants={fadeUp}
                custom={i + 1}
              >
                <span className="text-4xl md:text-5xl font-serif font-bold text-[#C5A880]">
                  {counters[i]}+
                </span>
                <p className="text-xs uppercase tracking-wider text-[#6B6862] font-semibold mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Mission */}
          <motion.h2
            className="text-xl md:text-2xl font-serif font-bold mt-6 text-[#1A1A1A]"
            custom={1.6}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {texts.apropos?.mission?.title || "Notre mission:"}
          </motion.h2>

          <motion.div
            className="flex flex-col gap-3 mt-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {(
              texts.apropos?.mission?.items || [
                {
                  icon: "/images/enrichir-icon.svg",
                  text: "Enrichir les perspectives des étudiants",
                },
                {
                  icon: "/images/ofrir-icon.svg",
                  text: "Offrir une plateforme d'échange et d'interaction",
                },
                {
                  icon: "/images/organiser-icon.svg",
                  text: "Organiser compétitions, conférences, workshops et actions caritatives.",
                },
              ]
            ).map((item: any, i: number) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EAE3D5] shadow-2xs"
                variants={fadeUp}
                custom={i + 1}
              >
                <Image src={item.icon} alt="Icon" width={28} height={28} />
                <p className="text-sm md:text-base text-[#1A1A1A] font-medium">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Images Column */}
        <div className="flex-1 mt-8 md:mt-0 order-last md:order-none">
          <div className="hidden md:block relative h-[600px]">
            <Image
              src="/images/sora jama3ia 2.svg"
              alt="Image 2"
              width={400}
              height={400}
              className="absolute bottom-32 left-72 transition-transform duration-300 hover:scale-105 z-0 drop-shadow-xl"
            />
            <Image
              src="/images/sora jama3ia 1.svg"
              alt="Image 1"
              width={400}
              height={400}
              className="absolute bottom-0 left-8 transition-transform duration-300 hover:scale-105 z-10 drop-shadow-xl"
            />
          </div>

          <div className="block md:hidden relative h-[400px] flex justify-end">
            <div className="relative w-[300px] h-[300px]">
              <Image
                src="/images/sora jama3ia 2.svg"
                alt="Image 2"
                width={300}
                height={300}
                className="absolute bottom-0 right-0 transition-transform duration-300 hover:scale-105 z-0 drop-shadow-xl"
              />
              <Image
                src="/images/sora jama3ia 1.svg"
                alt="Image 1"
                width={300}
                height={300}
                className="absolute bottom-4 right-0 transition-transform duration-300 hover:scale-105 z-10 drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
