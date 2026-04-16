/**
 * Auth Slice Tests
 * Tests: login, register, logout, restoreSession, guest mode, location update
 */
import authReducer, {
    clearError,
    continueAsGuest,
    login,
    logout,
    register,
    restoreSession,
    updateUser,
    updateUserLocation,
} from "@/src/store/slices/auth.slice";
import { configureStore } from "@reduxjs/toolkit";

// Mock services
jest.mock("@/src/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    updateLocation: jest.fn(),
  },
}));

jest.mock("@/src/services/tokenStorage", () => ({
  getToken: jest.fn(),
  setToken: jest.fn(() => Promise.resolve()),
  removeToken: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

import { authService } from "@/src/services/auth.service";
import { getToken, removeToken, setToken } from "@/src/services/tokenStorage";

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;
const mockSetToken = setToken as jest.MockedFunction<typeof setToken>;
const mockRemoveToken = removeToken as jest.MockedFunction<typeof removeToken>;

function createTestStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

const mockUser = {
  id: "user-1",
  username: "Ahmad",
  phone: "0791234567",
  storeName: "متجر أحمد",
  role: "buyer",
  cityId: null,
  areaId: null,
};

const mockAuthResponse = {
  token: "jwt-token-123",
  user: mockUser,
};

describe("Auth Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  // ─── Initial State ───
  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isGuest).toBe(false);
      expect(state.isInitialized).toBe(false);
    });
  });

  // ─── Login ───
  describe("Login", () => {
    it("should handle successful login", async () => {
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);

      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("jwt-token-123");
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should store token on successful login", async () => {
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);

      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      expect(mockSetToken).toHaveBeenCalledWith("jwt-token-123");
    });

    it("should handle login failure", async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new Error("بيانات الدخول غير صحيحة"),
      );

      await store.dispatch(login({ phone: "0791234567", password: "wrong" }));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe("بيانات الدخول غير صحيحة");
      expect(state.loading).toBe(false);
    });

    it("should set loading during login", async () => {
      let pendingResolve: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        pendingResolve = resolve;
      });
      mockAuthService.login.mockReturnValueOnce(pendingPromise as any);

      const promise = store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      expect(store.getState().auth.loading).toBe(true);

      pendingResolve!(mockAuthResponse);
      await promise;

      expect(store.getState().auth.loading).toBe(false);
    });
  });

  // ─── Register ───
  describe("Register", () => {
    const registerPayload = {
      username: "Ahmad",
      phone: "0791234567",
      storeName: "متجر أحمد",
      password: "password123",
      confirmPassword: "password123",
    };

    it("should handle successful registration", async () => {
      mockAuthService.register.mockResolvedValueOnce(mockAuthResponse);

      await store.dispatch(register(registerPayload));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("jwt-token-123");
    });

    it("should store token on successful registration", async () => {
      mockAuthService.register.mockResolvedValueOnce(mockAuthResponse);

      await store.dispatch(register(registerPayload));

      expect(mockSetToken).toHaveBeenCalledWith("jwt-token-123");
    });

    it("should handle registration failure (duplicate phone)", async () => {
      mockAuthService.register.mockRejectedValueOnce(
        new Error("رقم الهاتف مسجل مسبقاً"),
      );

      await store.dispatch(register(registerPayload));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe("رقم الهاتف مسجل مسبقاً");
    });
  });

  // ─── Restore Session ───
  describe("Restore Session", () => {
    it("should restore session when token exists", async () => {
      mockGetToken.mockResolvedValueOnce("saved-token");
      mockAuthService.getMe.mockResolvedValueOnce(mockUser);

      await store.dispatch(restoreSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe("saved-token");
      expect(state.isInitialized).toBe(true);
    });

    it("should handle no saved token", async () => {
      mockGetToken.mockResolvedValueOnce(null);

      await store.dispatch(restoreSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });

    it("should handle expired/invalid token", async () => {
      mockGetToken.mockResolvedValueOnce("expired-token");
      mockAuthService.getMe.mockRejectedValueOnce(new Error("401"));

      await store.dispatch(restoreSession());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
      expect(mockRemoveToken).toHaveBeenCalled();
    });
  });

  // ─── Logout ───
  describe("Logout", () => {
    it("should clear all auth state on logout", async () => {
      // First login
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);
      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then logout
      await store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isGuest).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should remove token on logout", async () => {
      await store.dispatch(logout());
      expect(mockRemoveToken).toHaveBeenCalled();
    });
  });

  // ─── Guest Mode ───
  describe("Guest Mode", () => {
    it("should enable guest mode", () => {
      store.dispatch(continueAsGuest());

      const state = store.getState().auth;
      expect(state.isGuest).toBe(true);
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });

    it("should clear guest mode on logout", async () => {
      store.dispatch(continueAsGuest());
      expect(store.getState().auth.isGuest).toBe(true);

      await store.dispatch(logout());
      expect(store.getState().auth.isGuest).toBe(false);
    });
  });

  // ─── Reducers ───
  describe("Reducers", () => {
    it("should clear error", async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error("خطأ"));
      await store.dispatch(login({ phone: "0791234567", password: "wrong" }));
      expect(store.getState().auth.error).toBeTruthy();

      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it("should update user data", async () => {
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);
      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      store.dispatch(updateUser({ storeName: "متجر جديد" }));

      expect(store.getState().auth.user?.storeName).toBe("متجر جديد");
    });

    it("should not update user if not authenticated", () => {
      store.dispatch(updateUser({ storeName: "متجر" }));
      expect(store.getState().auth.user).toBeNull();
    });
  });

  // ─── Update Location ───
  describe("Update Location", () => {
    it("should update user location", async () => {
      // First login
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);
      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      const updatedUser = {
        ...mockUser,
        cityId: "city-1",
        city: { id: "city-1", name: "عمان", nameEn: "Amman" },
      };
      mockAuthService.updateLocation.mockResolvedValueOnce(updatedUser);

      await store.dispatch(updateUserLocation({ cityId: "city-1" }));

      const state = store.getState().auth;
      expect(state.user?.cityId).toBe("city-1");
    });

    it("should handle location update failure", async () => {
      mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);
      await store.dispatch(
        login({ phone: "0791234567", password: "password123" }),
      );

      mockAuthService.updateLocation.mockRejectedValueOnce(
        new Error("فشل التحديث"),
      );

      await store.dispatch(updateUserLocation({ cityId: "city-1" }));

      expect(store.getState().auth.error).toBe("فشل التحديث");
    });
  });
});
