'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import fr from '../translations/fr.json';
import en from '../translations/en.json';

type Language = 'fr' | 'en';

interface LanguageContextType {
  lang: Language;
  texts: any;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // CHANGEMENT ICI : 'en' par défaut au lieu de 'fr'
  const [lang, setLang] = useState<Language>('en');
  const [texts, setTexts] = useState(en); // Anglais par défaut

  useEffect(() => {
    // Charger la langue sauvegardée, sinon utiliser l'anglais par défaut
    const savedLang = localStorage.getItem('lang') as Language || 'en';
    setLang(savedLang);
    setTexts(savedLang === 'fr' ? fr : en);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'fr' ? 'en' : 'fr';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    setTexts(newLang === 'fr' ? fr : en);
  };

  return (
    <LanguageContext.Provider value={{ lang, texts, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};