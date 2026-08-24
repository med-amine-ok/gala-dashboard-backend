"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const { lang, texts, toggleLanguage } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = document.querySelectorAll("section[id]");
      let current = "home";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const offset = window.innerHeight / 2;
        if (rect.top <= offset && rect.bottom >= offset) {
          current = section.id;
        }
      });
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  // Filter out the "agenda" item from the menu
  const menuItems = (texts.nav.menu || []).filter(
    ({ id }: { id: string }) => id !== "agenda"
  );

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 font-sans
        ${
          scrolled
            ? "bg-[#F7F4EE]/90 shadow-sm backdrop-blur-md border-b border-[#EAE3D5]"
            : "bg-transparent"
        }
      `}
    >
      {/* NAV CONTENT */}
      <div className="flex justify-between items-center px-6 md:px-8 py-4 max-w-7xl mx-auto transition-all duration-500">
        {/* LEFT MENU (Desktop) */}
        <nav
          className={`hidden md:flex gap-6 text-sm font-semibold tracking-wide transition-colors ${
            scrolled ? "text-[#1A1A1A]" : "text-[#F7F4EE]"
          }`}
        >
          {menuItems.map(({ label, id }: { label: string; id: string }) => (
            <button
              key={id}
              onClick={() => handleScrollTo(id)}
              className={`relative bg-transparent border-none transition-colors cursor-pointer
                hover:text-[#C5A880]
                ${activeSection === id ? "text-[#C5A880]" : ""}
              `}
            >
              {label}
              <span
                className={`absolute left-0 -bottom-1 h-[2px] w-full rounded-full bg-[#C5A880] transition-opacity duration-300
                  ${activeSection === id ? "opacity-100" : "opacity-0"}
                `}
              ></span>
            </button>
          ))}
        </nav>

        {/* RIGHT SECTION (Desktop) */}
        <div
          className={`hidden md:flex items-center gap-6 text-sm font-semibold transition-colors ${
            scrolled ? "text-[#1A1A1A]" : "text-[#F7F4EE]"
          }`}
        >
          <p
            className="cursor-pointer hover:text-[#C5A880] transition-colors uppercase tracking-wider text-xs font-bold"
            onClick={toggleLanguage}
          >
            {lang === "fr" ? "FR " : "EN "}
          </p>
          <Link href="/register">
            <button
              className={`cursor-pointer rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all
              ${
                scrolled
                  ? "bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3] hover:bg-[#DDD0F3] hover:shadow-md hover:shadow-[#C8B6E2]/25 shadow-2xs"
                  : "bg-white/10 text-[#F7F4EE] border border-white/30 backdrop-blur-xs hover:bg-[#ECE5F8] hover:text-[#6E4FA0] hover:border-[#DDD0F3]"
              }`}
            >
              {texts.nav.register}
            </button>
          </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className={`md:hidden transition-colors ${
            scrolled ? "text-[#1A1A1A]" : "text-[#F7F4EE]"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      <div
        className={`md:hidden flex flex-col items-start px-6 transition-all duration-500 overflow-hidden
          ${
            menuOpen
              ? "py-4 space-y-4 max-h-[400px] opacity-100 border-b"
              : "py-0 space-y-0 max-h-0 opacity-0"
          }
          ${
            scrolled
              ? "bg-[#F7F4EE]/95 text-[#1A1A1A] border-[#EAE3D5]"
              : "bg-[#1A1A1A]/95 text-[#F7F4EE] border-[#2D2D2D]"
          }
        `}
      >
        {menuItems.map(({ label, id }: { label: string; id: string }) => (
          <button
            key={id}
            onClick={() => handleScrollTo(id)}
            className={`w-full text-left text-sm font-semibold transition-colors hover:text-[#C5A880] cursor-pointer ${
              activeSection === id ? "text-[#C5A880]" : ""
            }`}
          >
            {label}
          </button>
        ))}

        <Link href="/register" className="w-full">
          <button
            className={`mt-2 rounded-full px-6 py-2.5 transition-all w-full text-center text-xs font-semibold uppercase tracking-wider cursor-pointer 
            ${
              scrolled
                ? "bg-[#ECE5F8] text-[#6E4FA0] border border-[#DDD0F3]"
                : "bg-white/10 text-[#F7F4EE] border border-white/30"
            }`}
          >
            {texts.nav.register}
          </button>
        </Link>

        <p
          className="text-center w-full cursor-pointer hover:text-[#C5A880] mt-2 text-xs font-bold uppercase tracking-wider"
          onClick={toggleLanguage}
        >
          {lang === "fr" ? "FR " : "EN "}
        </p>
      </div>
    </header>
  );
}
