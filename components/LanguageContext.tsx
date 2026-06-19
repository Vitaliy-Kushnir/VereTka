
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../lib/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectLanguage = (): string => {
  const savedLang = localStorage.getItem('veretka-language');
  if (savedLang && translations[savedLang as keyof typeof translations]) {
    return savedLang;
  }
  
  if (typeof navigator !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'ru' || browserLang === 'be') {
      return 'uk';
    }
    if (translations[browserLang as keyof typeof translations]) {
      return browserLang;
    }
  }
  return 'uk'; // default fallback if neither saved nor supported browser lang is found
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(detectLanguage);

  useEffect(() => {
    localStorage.setItem('veretka-language', language);
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('veretka-language', lang);
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const langDict = translations[language as keyof typeof translations] || translations['uk'];
    let text = langDict[key as keyof typeof translations['uk']] || translations['uk'][key as keyof typeof translations['uk']] || key;
    
    if (variables) {
      Object.keys(variables).forEach(varKey => {
        text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(variables[varKey]));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
