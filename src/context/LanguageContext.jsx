import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../data/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("rotadocorte_lang");
      if (saved && ["pt", "en", "es", "fr"].includes(saved)) {
        return saved;
      }
      const browserLang = navigator.language?.substring(0, 2)?.toLowerCase();
      if (["pt", "en", "es", "fr"].includes(browserLang)) {
        return browserLang;
      }
    } catch {
      // fallback
    }
    return "pt";
  });

  useEffect(() => {
    try {
      localStorage.setItem("rotadocorte_lang", lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  const t = translations[lang] || translations.pt;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
