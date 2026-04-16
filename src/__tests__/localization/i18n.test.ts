/**
 * i18n Localization Tests
 * Tests: default language, language switching, RTL, persistence
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

// Need to re-mock i18n for these tests since we want to test the actual logic
jest.unmock("i18next");
jest.unmock("react-i18next");

// Mock i18next with controllable state
let mockLanguage = "ar";
const mockI18n = {
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  changeLanguage: jest.fn((lang: string) => {
    mockLanguage = lang;
    return Promise.resolve();
  }),
  get language() {
    return mockLanguage;
  },
  t: jest.fn((key: string) => key),
};

jest.mock("i18next", () => ({
  __esModule: true,
  default: mockI18n,
}));

jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

// Import after mocking
import {
    changeLanguage,
    getCurrentLanguage,
    isRTL,
    loadSavedLanguage,
} from "@/src/localization/i18n";

describe("i18n Localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLanguage = "ar";
    (AsyncStorage.clear as jest.Mock)();
  });

  // ─── Default Language ───
  describe("Default Language", () => {
    it("should default to Arabic", () => {
      expect(getCurrentLanguage()).toBe("ar");
    });

    it("should be RTL by default", () => {
      expect(isRTL()).toBe(true);
    });
  });

  // ─── Language Switching ───
  describe("Language Switching", () => {
    it("should change to English", async () => {
      await changeLanguage("en");

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "tawreed_language",
        "en",
      );
    });

    it("should change to Arabic", async () => {
      mockLanguage = "en";
      await changeLanguage("ar");

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("ar");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "tawreed_language",
        "ar",
      );
    });

    it("should set RTL for Arabic", async () => {
      // Simulate switching from English to Arabic
      (I18nManager as any).isRTL = false;
      mockLanguage = "en";
      await changeLanguage("ar");

      expect(I18nManager.allowRTL).toHaveBeenCalledWith(true);
      expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
    });

    it("should set LTR for English", async () => {
      // Simulate current RTL state
      (I18nManager as any).isRTL = true;
      await changeLanguage("en");

      expect(I18nManager.allowRTL).toHaveBeenCalledWith(false);
      expect(I18nManager.forceRTL).toHaveBeenCalledWith(false);
    });
  });

  // ─── Language Persistence ───
  describe("Language Persistence", () => {
    it("should load saved Arabic language", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("ar");

      await loadSavedLanguage();

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("ar");
    });

    it("should load saved English language", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("en");

      await loadSavedLanguage();

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith("en");
    });

    it("should use default if no saved language", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await loadSavedLanguage();

      // Should not change language, keep default
      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    });

    it("should ignore invalid saved language", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("fr");

      await loadSavedLanguage();

      expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    });
  });

  // ─── getCurrentLanguage & isRTL ───
  describe("Helper Functions", () => {
    it("should return current language", () => {
      mockLanguage = "en";
      expect(getCurrentLanguage()).toBe("en");

      mockLanguage = "ar";
      expect(getCurrentLanguage()).toBe("ar");
    });

    it("should return RTL status based on language", () => {
      mockLanguage = "ar";
      expect(isRTL()).toBe(true);

      mockLanguage = "en";
      expect(isRTL()).toBe(false);
    });
  });
});
