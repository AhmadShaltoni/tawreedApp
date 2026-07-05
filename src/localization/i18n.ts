import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DevSettings, I18nManager } from "react-native";

import ar from "./ar.json";
import en from "./en.json";

const LANGUAGE_KEY = "tawreed_language";
// Guards against a reload loop if the native side fails to apply the direction
const RTL_SYNC_KEY = "tawreed_rtl_sync_target";

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

/**
 * Make the native layout direction match the app language.
 *
 * `I18nManager.forceRTL()` only takes effect after the JS bundle reloads,
 * so when a mismatch is detected we force the direction and reload the app
 * automatically (at most once per target direction, to avoid reload loops).
 * This guarantees Arabic always renders RTL — including the very first
 * launch and right after switching languages.
 */
async function syncLayoutDirection(lang: string): Promise<void> {
  const shouldBeRTL = lang === "ar";

  if (I18nManager.isRTL === shouldBeRTL) {
    await AsyncStorage.removeItem(RTL_SYNC_KEY).catch(() => {});
    return;
  }

  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  const target = shouldBeRTL ? "rtl" : "ltr";
  const attempted = await AsyncStorage.getItem(RTL_SYNC_KEY).catch(() => null);
  if (attempted === target) {
    // Already tried reloading for this direction — don't loop.
    return;
  }
  await AsyncStorage.setItem(RTL_SYNC_KEY, target).catch(() => {});

  try {
    await Updates.reloadAsync();
  } catch {
    // expo-updates is unavailable in dev — fall back to a dev reload.
    if (__DEV__) {
      DevSettings.reload();
    }
  }
}

// Load saved language preference
export async function loadSavedLanguage(): Promise<void> {
  let lang: "ar" | "en" = defaultLang;
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === "ar" || saved === "en") {
      lang = saved;
      await i18n.changeLanguage(lang);
    }
  } catch {
    // Fall back to default language
  }

  await syncLayoutDirection(lang);
}

export async function changeLanguage(lang: "ar" | "en"): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);

  // Applies the direction and reloads the app automatically when needed
  await syncLayoutDirection(lang);
}

export function getCurrentLanguage(): "ar" | "en" {
  return (i18n.language as "ar" | "en") ?? "ar";
}

export function isRTL(): boolean {
  return i18n.language === "ar";
}

export default i18n;
