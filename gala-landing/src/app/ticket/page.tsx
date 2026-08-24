"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";

export default function TicketPricing() {
  const { texts } = useLanguage();

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const titleParent = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };

  return (
    <main className="w-full min-h-screen flex flex-col items-center p-5 overflow-hidden bg-[#F7F4EE] border-b border-[#EAE3D5] py-16 font-sans">
      {/* TITLE */}
      <motion.div
        className="w-full max-w-5xl text-center"
        variants={titleParent}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={fadeUp}
          transition={{ delay: 0.04, duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-serif font-bold bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent"
        >
          {texts.pricing?.title?.part1 || "Frais d’entrée"}{" "}
          <span className="font-serif">
            {texts.pricing?.title?.highlighted || "Unique"}
          </span>
        </motion.h1>

        <motion.h2
          variants={fadeUp}
          transition={{ delay: 0.18, duration: 0.8, ease: "easeOut" }}
          className="mt-4 text-2xl md:text-3xl font-serif text-[#1A1A1A] font-semibold"
        >
          {texts.pricing?.subtitle || "Accès réservé aux participants inscrits"}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ delay: 0.32, duration: 0.9, ease: "easeOut" }}
          className="mt-4 text-base md:text-lg text-[#6B6862] text-center max-w-2xl mx-auto leading-relaxed"
        >
          {texts.pricing?.description ||
            "La participation à l’événement est ouverte uniquement aux personnes inscrites et validées. Le tarif symbolique de 1000 DA donne accès à l’ensemble des activités, conférences et expositions du jour."}
        </motion.p>
      </motion.div>

      {/* PRICE CARD */}
      <section className="flex justify-center items-center mt-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{
            delay: 0.45,
            duration: 0.8,
            type: "spring",
            stiffness: 120,
            damping: 16,
          }}
          whileHover={{
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(26,26,26,0.25)",
          }}
          className="flex flex-col items-center bg-[#1A1A1A] rounded-3xl shadow-2xl p-8 md:w-3xl text-center border border-[#C5A880]/30"
        >
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
          >
            <Image
              src="/images/ticket.png"
              alt="Ticket"
              width={600}
              height={300}
              className="mb-4 drop-shadow-lg"
            />
          </motion.div>

          <h3 className="text-3xl font-serif text-[#F7F4EE] mb-1 font-bold">
            {texts.pricing?.ticketName || "Entrée Générale"}
          </h3>

          <p className="text-5xl font-bold bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#DFC598] bg-clip-text text-transparent mb-3">
            1000 DA
          </p>

          <p className="text-sm md:text-base text-[#D5CEC0] max-w-xl mx-auto leading-relaxed">
            {texts.pricing?.note ||
              "Un tarif unique pour accéder à l’expérience VIC — conférences, stands et espaces d’échanges réservés aux participants inscrits."}
          </p>
        </motion.div>
      </section>
    </main>
  );
}
