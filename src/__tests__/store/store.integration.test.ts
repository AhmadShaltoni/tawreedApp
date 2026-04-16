/**
 * Redux Store Integration Tests
 * Tests: store configuration, all slices present, typed hooks
 */
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
jest.mock("@/src/services/cart.service", () => ({
  cartService: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
  },
}));
jest.mock("@/src/services/product.service", () => ({
  productService: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    getFeatured: jest.fn(),
  },
  mapProduct: jest.fn((p: any) => p),
}));
jest.mock("@/src/services/category.service", () => ({
  categoryService: { getCategories: jest.fn() },
}));
jest.mock("@/src/services/order.service", () => ({
  orderService: {
    getOrders: jest.fn(),
    getOrderDetail: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
  },
}));
jest.mock("@/src/services/notice.service", () => ({
  noticeService: { getNotices: jest.fn() },
}));
jest.mock("@/src/services/notification.service", () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
  pushNotificationService: { initialize: jest.fn(), cleanup: jest.fn() },
}));
jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));
jest.mock("@/src/utils/cache", () => ({
  getCached: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve()),
}));

import { store } from "@/src/store";

describe("Redux Store", () => {
  describe("Store Configuration", () => {
    it("should have all required slices", () => {
      const state = store.getState();
      expect(state).toHaveProperty("auth");
      expect(state).toHaveProperty("products");
      expect(state).toHaveProperty("categories");
      expect(state).toHaveProperty("cart");
      expect(state).toHaveProperty("orders");
      expect(state).toHaveProperty("notices");
      expect(state).toHaveProperty("notifications");
    });

    it("should have 7 slices total", () => {
      const state = store.getState();
      expect(Object.keys(state)).toHaveLength(7);
    });
  });

  describe("Initial State", () => {
    it("should start unauthenticated", () => {
      expect(store.getState().auth.isAuthenticated).toBe(false);
    });

    it("should start with empty cart", () => {
      expect(store.getState().cart.items).toEqual([]);
    });

    it("should start with no products", () => {
      expect(store.getState().products.items).toEqual([]);
    });

    it("should start with no orders", () => {
      expect(store.getState().orders.items).toEqual([]);
    });

    it("should start with no notifications", () => {
      expect(store.getState().notifications.items).toEqual([]);
      expect(store.getState().notifications.unreadCount).toBe(0);
    });

    it("should start with no notices", () => {
      expect(store.getState().notices.items).toEqual([]);
    });

    it("should start with no categories", () => {
      expect(store.getState().categories.items).toEqual([]);
    });
  });

  describe("Dispatch", () => {
    it("should have dispatch function", () => {
      expect(typeof store.dispatch).toBe("function");
    });

    it("should have getState function", () => {
      expect(typeof store.getState).toBe("function");
    });

    it("should have subscribe function", () => {
      expect(typeof store.subscribe).toBe("function");
    });
  });
});
