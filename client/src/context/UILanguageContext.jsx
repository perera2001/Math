import React, { createContext, useContext, useState } from "react";
import translations from "../constants/uiTranslations";

const UILanguageContext = createContext(null);

export const UILanguageProvider = ({ children }) => {
  const [uiLang, setUiLang] = useState(
    () => localStorage.getItem("uiLang") || "en",
  );

  const switchLang = (lang) => {
    localStorage.setItem("uiLang", lang);
    setUiLang(lang);
  };

  const t = (key, vars) => {
    const str = translations[uiLang]?.[key] ?? translations.en[key] ?? key;
    if (!vars) return str;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replace(`{${k}}`, v),
      str,
    );
  };

  return (
    <UILanguageContext.Provider value={{ uiLang, switchLang, t }}>
      {children}
    </UILanguageContext.Provider>
  );
};

export const useUILang = () => useContext(UILanguageContext);
