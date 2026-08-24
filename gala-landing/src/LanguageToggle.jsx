"use client";

import { useState, useEffect } from "react";
import fr from "../translations/fr.json";
import en from "../translations/en.json";

export default function useLanguage() {
  const [lang, setLang] = useState("fr");
  const [texts, setTexts] = useState(fr);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") || "fr";
    setLang(savedLang);
    setTexts(savedLang === "fr" ? fr : en);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === "fr" ? "en" : "fr";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    setTexts(newLang === "fr" ? fr : en);
  };

  return { lang, texts, toggleLanguage };
}
