// Mock React Native modules
jest.mock("react-native", () => ({
  Platform: { OS: "ios", select: (obj: any) => obj.ios },
  I18nManager: { isRTL: true, allowRTL: jest.fn(), forceRTL: jest.fn() },
  Alert: { alert: jest.fn() },
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
        return Promise.resolve();
      }),
      multiRemove: jest.fn((keys: string[]) => {
        keys.forEach((k) => delete store[k]);
        return Promise.resolve();
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
        return Promise.resolve();
      }),
    },
  };
});

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { appOwnership: "standalone" },
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" }),
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: "ExponentPushToken[test]" }),
  ),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  AndroidImportance: { MAX: 5 },
}));

// Mock i18next
jest.mock("i18next", () => ({
  __esModule: true,
  default: {
    use: jest.fn().mockReturnThis(),
    init: jest.fn().mockReturnThis(),
    changeLanguage: jest.fn(() => Promise.resolve()),
    language: "ar",
    t: jest.fn((key: string) => key),
  },
}));

jest.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: jest.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ar", changeLanguage: jest.fn() },
  }),
}));

// Mock notification permission tracker
jest.mock("@/src/utils/notificationPermissionTracker", () => ({
  notificationPermissionTracker: {
    getAttemptCount: jest.fn(() => Promise.resolve(0)),
    incrementAttemptCount: jest.fn(() => Promise.resolve()),
    getStatus: jest.fn(() =>
      Promise.resolve({
        attemptCount: 0,
        isPermanentlyDenied: false,
        shouldShowCustomModal: false,
      }),
    ),
    markModalShownToday: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
  },
}));
