import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import { useTranslation } from "react-i18next";

interface RTLContextType {
  isRTL: boolean;
}

const RTLContext = createContext<RTLContextType>({ isRTL: false });

export function RTLProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === "ar");

  useEffect(() => {
    // Update when language changes
    const updateRTL = (lang: string) => {
      const rtl = lang === "ar";
      setIsRTL(rtl);
      
      // Try to apply RTL to I18nManager
      if (I18nManager.isRTL !== rtl) {
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
    };

    updateRTL(i18n.language);

    // Subscribe to language changes
    const languageChangedListener = (lang: string) => {
      updateRTL(lang);
    };

    i18n.on("languageChanged", languageChangedListener);
    return () => {
      i18n.off("languageChanged", languageChangedListener);
    };
  }, [i18n]);

  return (
    <RTLContext.Provider value={{ isRTL }}>
      {children}
    </RTLContext.Provider>
  );
}

export function useRTL() {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error("useRTL must be used within RTLProvider");
  }
  return context;
}
