"use client";

import { Facebook, Instagram, Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";

export default function Footer() {
  const { texts } = useLanguage();

  return (
    <footer className="relative w-full text-[#F7F4EE] py-16 px-6 md:px-16 overflow-hidden bg-[#121212] border-t border-[#2D2D2D] font-sans">
      {/* Animated soft gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#C5A880]/10 via-[#C8B6E2]/10 to-[#C5A880]/10 opacity-30"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        {/* Logo & description */}
        <div>
          <Image
            src="/images/logogala.png"
            alt="Gala Logo"
            width={180}
            height={90}
            className="mx-auto md:mx-0 mb-4"
          />
          <p className="text-[#96928B] text-sm max-w-xs mx-auto md:mx-0 leading-relaxed">
            {texts.footer?.description ||
              "Engineer's Gala réunit chaque année les esprits les plus brillants pour célébrer la créativité, la technologie et l'entrepreneuriat."}
          </p>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-[#DFC598] text-lg mb-4 font-serif font-bold border-b border-[#C5A880]/30 inline-block pb-1">
            {texts.footer?.quickLinks || "Liens rapides"}
          </h3>
          <ul className="space-y-2 text-[#96928B] text-sm font-medium">
            <li>
              <Link href="#accueil" className="hover:text-[#DFC598] transition-colors">
                {texts.nav?.menu?.find((item: any) => item.id === "accueil")
                  ?.label || "Accueil"}
              </Link>
            </li>
            <li>
              <Link
                href="#historique"
                className="hover:text-[#DFC598] transition-colors"
              >
                {texts.nav?.menu?.find((item: any) => item.id === "historique")
                  ?.label || "Historique"}
              </Link>
            </li>
            <li>
              <Link
                href="#cetteannee"
                className="hover:text-[#DFC598] transition-colors"
              >
                {texts.nav?.menu?.find((item: any) => item.id === "cetteannee")
                  ?.label || "Cette année"}
              </Link>
            </li>
            <li>
              <Link
                href="#tarification"
                className="hover:text-[#DFC598] transition-colors"
              >
                {texts.nav?.menu?.find((item: any) => item.id === "tarification")
                  ?.label || "tarification"}
              </Link>
            </li>
            <li>
              <Link
                href="#app"
                className="hover:text-[#DFC598] transition-colors"
              >
                {texts.nav?.menu?.find((item: any) => item.id === "app")
                  ?.label || "app"}
              </Link>
            </li>
            <li>
              <Link href="#apropos" className="hover:text-[#DFC598] transition-colors">
                {texts.nav?.menu?.find((item: any) => item.id === "apropos")
                  ?.label || "À propos"}
              </Link>
            </li>

            <li>
              <Link href="#contact" className="hover:text-[#DFC598] transition-colors">
                {texts.footer?.contact || "Contact"}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & social */}
        <div>
          <h3 className="text-[#DFC598] text-lg mb-4 font-serif font-bold border-b border-[#C5A880]/30 inline-block pb-1">
            {texts.footer?.contact || "Contact"}
          </h3>
          <p className="text-[#96928B] text-sm mb-3">
            {texts.footer?.address ||
              "École Nationale Polytechnique d'Alger, Algérie"}
          </p>
          <p className="text-[#96928B] text-sm mb-5">
            {texts.footer?.emailLabel || "Email :"}{" "}
            <a
              href="mailto:vic@g.enp.edu.dz"
              className="text-[#DFC598] hover:underline"
            >
              vic@g.enp.edu.dz
            </a>
          </p>

          <div className="flex justify-center md:justify-start gap-4">
            {[
              {
                name: "facebook",
                url: "https://www.facebook.com/share/1HyVdF9GZX/",
                icon: Facebook,
              },
              {
                name: "instagram",
                url: "https://www.instagram.com/vic.enp?igsh=MTkzdjZtbWtqbTd5bQ==",
                icon: Instagram,
              },
              {
                name: "linkedin",
                url: "https://www.linkedin.com/company/vicenp/",
                icon: Linkedin,
              },
            ].map(({ name, url, icon: Icon }) => (
              <motion.a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, rotate: 4 }}
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-[#121212] transition-colors"
              >
                <Icon size={16} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <motion.div
        className="relative z-10 mt-12 text-center text-xs text-[#6B6862]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        © {new Date().getFullYear()}{" "}
        {texts.footer?.copyright || "Engineer's Gala — Tous droits réservés."}
      </motion.div>
    </footer>
  );
}
