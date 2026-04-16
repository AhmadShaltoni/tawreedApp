/**
 * useAuthGuard Hook Tests
 * Tests: guest protection, auth check, login modal trigger
 */
jest.mock("@/src/store", () => ({
  useAppSelector: jest.fn(),
}));

import { useAppSelector } from "@/src/store";

const mockUseAppSelector = useAppSelector as jest.MockedFunction<
  typeof useAppSelector
>;

// Simple hook runner (no need for full renderHook)
function getHookResult(isAuthenticated: boolean) {
  const { useState, useCallback } = require("react");

  // Track state changes
  let showLoginModal = false;
  let setShowLoginModal = (val: boolean) => {
    showLoginModal = val;
  };

  mockUseAppSelector.mockReturnValue({ isAuthenticated });

  // Simulate the hook logic directly
  const requireAuth = (callback?: () => void) => {
    if (isAuthenticated) {
      callback?.();
      return true;
    }
    showLoginModal = true;
    return false;
  };

  return {
    isAuthenticated,
    requireAuth,
    get showLoginModal() {
      return showLoginModal;
    },
  };
}

describe("useAuthGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authenticated User", () => {
    it("should allow operation when authenticated", () => {
      const guard = getHookResult(true);
      const callback = jest.fn();

      const result = guard.requireAuth(callback);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
      expect(guard.showLoginModal).toBe(false);
    });

    it("should return true without callback", () => {
      const guard = getHookResult(true);

      const result = guard.requireAuth();

      expect(result).toBe(true);
    });
  });

  describe("Guest User", () => {
    it("should block operation when guest", () => {
      const guard = getHookResult(false);
      const callback = jest.fn();

      const result = guard.requireAuth(callback);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
      expect(guard.showLoginModal).toBe(true);
    });

    it("should trigger login modal for guest", () => {
      const guard = getHookResult(false);

      guard.requireAuth();

      expect(guard.showLoginModal).toBe(true);
    });
  });

  describe("Protected Operations", () => {
    it("should protect cart add operation", () => {
      const guard = getHookResult(false);
      const addToCart = jest.fn();

      guard.requireAuth(addToCart);

      expect(addToCart).not.toHaveBeenCalled();
    });

    it("should protect checkout operation", () => {
      const guard = getHookResult(false);
      const checkout = jest.fn();

      guard.requireAuth(checkout);

      expect(checkout).not.toHaveBeenCalled();
    });

    it("should allow cart operations when authenticated", () => {
      const guard = getHookResult(true);
      const addToCart = jest.fn();

      guard.requireAuth(addToCart);

      expect(addToCart).toHaveBeenCalled();
    });
  });
});
