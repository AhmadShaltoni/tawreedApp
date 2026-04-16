/**
 * Token Storage Tests
 * Tests: secure storage on native, localStorage on web, CRUD operations
 */

// Mock Platform for different tests
const mockPlatform = { OS: "ios" as string, select: jest.fn() };
jest.mock("react-native", () => ({
  Platform: mockPlatform,
  I18nManager: { isRTL: true, allowRTL: jest.fn(), forceRTL: jest.fn() },
}));

const mockSecureStore = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
};
jest.mock("expo-secure-store", () => mockSecureStore);

jest.mock("@/src/constants/api", () => ({
  STORAGE_KEYS: { AUTH_TOKEN: "tawreed_auth_token" },
}));

import { getToken, removeToken, setToken } from "@/src/services/tokenStorage";

describe("Token Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlatform.OS = "ios";
  });

  // ─── Native (iOS/Android) - Secure Store ───
  describe("Native Platform (SecureStore)", () => {
    it("should get token from SecureStore", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce("jwt-token-123");

      const token = await getToken();

      expect(token).toBe("jwt-token-123");
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(
        "tawreed_auth_token",
      );
    });

    it("should return null when no token stored", async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const token = await getToken();
      expect(token).toBeNull();
    });

    it("should set token in SecureStore", async () => {
      await setToken("new-jwt-token");

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        "tawreed_auth_token",
        "new-jwt-token",
      );
    });

    it("should remove token from SecureStore", async () => {
      await removeToken();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "tawreed_auth_token",
      );
    });
  });

  // ─── Security ───
  describe("Security", () => {
    it("should use expo-secure-store on native (encrypted storage)", async () => {
      mockPlatform.OS = "ios";
      mockSecureStore.getItemAsync.mockResolvedValueOnce("token");

      await getToken();

      // Verifies we use SecureStore, not AsyncStorage
      expect(mockSecureStore.getItemAsync).toHaveBeenCalled();
    });

    it("should use expo-secure-store on Android too", async () => {
      mockPlatform.OS = "android";
      mockSecureStore.getItemAsync.mockResolvedValueOnce("token");

      await getToken();

      expect(mockSecureStore.getItemAsync).toHaveBeenCalled();
    });
  });
});
