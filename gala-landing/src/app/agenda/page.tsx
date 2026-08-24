"use client";

import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";

export default function Agenda() {
  const { texts } = useLanguage();

  const agendaItems = texts.agenda?.items || [
    { id: 1, time: "9:00-9:30", title: "Check-in" },
    { id: 2, time: "9:30-12:00", title: "Stands et expositions" },
    { id: 3, time: "13:00-13:30", title: "Check-in 2" },
    { id: 4, time: "13:30-14:00", title: "Cérémonie d'ouverture" },
    { id: 5, time: "14:00-14:30", title: "1ère Conférence" },
    { id: 6, time: "14:30-15:30", title: "Table ronde interactive" },
    { id: 7, time: "15:30-16:00", title: "Pause café & Networking" },
    { id: 8, time: "16:00-16:30", title: "2ème Conférence" },
    { id: 9, time: "16:30-17:30", title: "Table ronde thématique" },
    { id: 10, time: "17:30-18:00", title: "Panel de discussion" },
    { id: 11, time: "18:00-18:20", title: "Cérémonie de clôture" },
  ];

  // Animation slide-in
  const slideIn = (direction: "left" | "right") => ({
    hidden: { opacity: 0, x: direction === "left" ? -100 : 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  });

  return (
    <main className="relative min-h-screen py-16 px-4 bg-[#F7F4EE] font-sans">
      {/* Décor SVG */}
      <div className="absolute top-80 right-0 w-32 h-32 opacity-20">
        <Image src="/images/Agenda.svg" alt="decor" width={128} height={128} />
      </div>
      <div className="absolute top-220 left-0 w-40 h-40 opacity-20">
        <Image src="/images/Agenda.svg" alt="decor" width={128} height={128} />
      </div>
      <div className="absolute top-450 right-0 w-40 h-40 opacity-20">
        <Image src="/images/Agenda.svg" alt="decor" width={128} height={128} />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Titre principal */}
        <motion.div
          className="sm:text-6xl text-4xl font-serif font-bold mb-12"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent">
            {texts.agenda?.title?.part1 || "Agenda officielle"}
          </span>
          <br />
          <span className="text-[#1A1A1A] font-serif">
            {texts.agenda?.title?.highlighted || "Engineers' GALA"}
          </span>
        </motion.div>

        {/* Timeline */}
        <div className="relative md:pt-30 pt-10 space-y-8">
          {agendaItems.map((item: any, index: number) => {
            const direction = index % 2 === 0 ? "right" : "left";

            return (
              <motion.div
                key={item.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={slideIn(direction)}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center ${
                  index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                <div
                  className={`flex-1 flex justify-center md:${
                    index % 2 === 0 ? "justify-start" : "justify-end"
                  } w-full`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="transition-all duration-300 w-full md:max-w-3xl"
                  >
                    <div className="bg-gradient-to-r from-[#DFC598] via-[#C5A880] to-[#DFC598] p-0.5 rounded-full shadow-lg shadow-[#1A1A1A]/5 w-full">
                      <div
                        className={`bg-white rounded-full p-6 flex flex-row items-center justify-center gap-4 md:gap-6 text-center w-full border border-[#EAE3D5] ${
                          index % 2 === 0 ? "md:flex-row-reverse" : "md:flex-row"
                        }`}
                      >
                        {/* Numéro */}
                        <span className="bg-gradient-to-r from-[#C5A880] via-[#DFC598] to-[#8C6F45] bg-clip-text text-transparent text-5xl md:text-7xl font-serif font-bold mb-0">
                          {item.id.toString().padStart(2, "0")}
                        </span>

                        {/* Texte */}
                        <div
                          className={`flex flex-col items-center justify-center w-full ${
                            index % 2 === 0
                              ? "md:items-end text-left"
                              : "md:items-start text-right"
                          }`}
                        >
                          <span className="text-xl md:text-3xl font-serif text-[#1A1A1A] font-bold">
                            {item.time}
                          </span>
                          <h3 className="text-base md:text-xl text-[#6B6862] mt-1 font-medium">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
