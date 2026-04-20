import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

import ar from "./ar.json";
import en from "./en.json";

const LANGUAGE_KEY = "tawreed_language";

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

// Always default to Arabic
const defaultLang = "ar";

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

// Apply RTL setting for default language
const applyRTLSetting = (lang: string) => {
  const isArabic = lang === "ar";
  
  // For iOS, we need to ensure RTL is applied immediately and properly
  if (I18nManager.isRTL !== isArabic) {
    I18nManager.allowRTL(isArabic);
    I18nManager.forceRTL(isArabic);
  }
};

// Load saved language preference
export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === "ar" || saved === "en")) {
      await changeLanguage(saved);
    } else {
      // Apply default RTL setting for Arabic
      applyRTLSetting(defaultLang);
    }
  } catch {
    // Use default RTL setting
    applyRTLSetting(defaultLang);
  }
}

export async function changeLanguage(lang: "ar" | "en"): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);

  // Apply RTL settings immediately
  applyRTLSetting(lang);
  
  // Note: RTL change requires app restart to take full effect on iOS
}

export function getCurrentLanguage(): "ar" | "en" {
  return (i18n.language as "ar" | "en") ?? "ar";
}

export function isRTL(): boolean {
  return i18n.language === "ar";
}

export default i18n;
