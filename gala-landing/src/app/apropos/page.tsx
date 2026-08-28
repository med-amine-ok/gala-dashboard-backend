"use client";

import { motion } from "framer-motion";

export default function AboutUsSection() {
  return (
    <section
      id="apropos"
      className="relative w-full min-h-[85vh] px-8 py-16 lg:px-20 lg:py-24 flex flex-col justify-between bg-[#F5F1E8] text-[#1E1E1E] border-t border-[#E5DAC6]/60 font-sans overflow-hidden"
    >
      {/* Ambient Luxury Glows */}
      <div className="absolute top-[10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,#DED3BD_0%,transparent_70%)] opacity-35 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,#ECE5F8_0%,transparent_70%)] opacity-40 blur-3xl pointer-events-none" />

      {/* Top Content: Title + Horizontal Layout */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="flex flex-col items-start gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B89A5E] block">
            ABOUT US
          </span>
          <h2 className="font-cinzel uppercase text-[#1E1E1E] text-[32px] sm:text-[45px] lg:text-[64px] font-light tracking-wider leading-none">
            Who are we
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center mt-8 lg:mt-12 gap-6 lg:gap-20">
          {/* VIC Logo */}
          <img
            src="/vic.png"
            alt="Vision & Innovation Club"
            className="w-[120px] h-[50px] lg:w-[220px] lg:h-[90px] object-contain select-none"
          />

          {/* Champagne Divider Line */}
          <div className="h-[220px] w-[1.5px] bg-[#B89A5E]/40 hidden lg:inline" />
          <div className="w-[200px] h-[1.5px] bg-[#B89A5E]/40 lg:hidden" />

          {/* Narrative & Stats */}
          <div className="flex flex-col gap-3 lg:gap-2">
            <h3 className="text-[20px] lg:text-[36px] font-cinzel text-[#1E1E1E] font-bold tracking-[0.08em]">
              VISION & INNOVATION CLUB
            </h3>
            <p className="text-[13px] sm:text-[15px] lg:text-[18px] text-[#6B665E] lg:max-w-[700px] font-light leading-relaxed">
              {`A scientific club founded in 2014 at the National Polytechnic School of Algiers under the supervision of the scientific and cultural association "EL–MAARIFA", which aims to foster creativity, communication, and innovation among students.`}
            </p>

            {/* Metric Counters */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-12 mt-4 lg:mt-6">
              <p className="uppercase text-[12px] lg:text-[18px] font-cinzel text-[#1E1E1E] tracking-wider">
                <span className="font-cinzel font-bold text-[24px] lg:text-[38px] mr-2 text-[#B89A5E]">
                  10+
                </span>{" "}
                Major Events
              </p>
              <div className="w-[80px] h-px bg-[#B89A5E]/40 lg:hidden" />
              <p className="uppercase text-[12px] lg:text-[18px] font-cinzel text-[#1E1E1E] tracking-wider">
                <span className="font-cinzel font-bold text-[24px] lg:text-[38px] mr-2 text-[#B89A5E]">
                  200+
                </span>{" "}
                Active Members
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Metadata & Institutional Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full pt-12 lg:pt-16"
      >
        <div className="h-[1px] w-full bg-[#E5DAC6] lg:mb-6" />

        <div className="flex flex-wrap gap-8 sm:gap-12 lg:gap-24 mb-4 lg:mb-0 text-[10px] sm:text-[12px] uppercase font-mono tracking-widest text-[#969085]">
          <div className="flex flex-col gap-1.5 font-semibold text-[#1E1E1E]">
            <a
              href="https://www.enp.edu.dz/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors"
            >
              NATIONAL POLYTECHNIC SCHOOL
            </a>
            <a
              href="mailto:vic@g.enp.edu.dz"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors font-normal text-[#6B665E]"
            >
              vic@g.enp.edu.dz
            </a>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="cursor-pointer hover:text-[#B89A5E] transition-colors text-[#1E1E1E]">
              WHAT IS GALA®
            </span>
            <span className="cursor-pointer hover:text-[#B89A5E] transition-colors">
              ABOUT US
            </span>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
            <a
              href="https://www.facebook.com/vic.enpa"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors"
            >
              FACEBOOK
            </a>
            <a
              href="https://www.instagram.com/vic.enp/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors"
            >
              INSTAGRAM
            </a>
            <a
              href="https://www.linkedin.com/company/vicenp/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors"
            >
              LINKEDIN
            </a>
            <a
              href="https://www.tiktok.com/@vic.enp"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-[#B89A5E] transition-colors"
            >
              TIKTOK
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
