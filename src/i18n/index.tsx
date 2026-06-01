import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { uk } from './uk';

export type Language = 'en' | 'uk';

const translations = { en, uk };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('vstudio_lang');
    return saved === 'uk' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('vstudio_lang', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
