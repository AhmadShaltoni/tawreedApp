/**
 * Cart Slice Tests
 * Tests: fetch cart, add/update/remove items, clear cart, logout cleanup
 */
import authReducer, { logout } from "@/src/store/slices/auth.slice";
import cartReducer, {
    addToCartAsync,
    clearCart,
    clearCartError,
    fetchCart,
    removeFromCart,
    removeFromCartAsync,
    updateCartItemAsync,
    updateQuantity,
} from "@/src/store/slices/cart.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/cart.service", () => ({
  cartService: {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
  },
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

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

import { cartService } from "@/src/services/cart.service";

const mockCartService = cartService as jest.Mocked<typeof cartService>;

const mockProduct = {
  id: "prod-1",
  name: "تفاح أحمر",
  nameAr: "تفاح أحمر",
  description: "تفاح طازج",
  price: 2.5,
  sku: "APL-001",
  images: ["/images/apple.jpg"],
  categoryId: "cat-1",
  unit: "kg",
  minOrder: 1,
  stock: 100,
  featured: false,
  createdAt: "2026-01-01",
};

const mockUnit = {
  id: "unit-1",
  unit: "box",
  label: "صندوق",
  labelEn: "Box",
  piecesPerUnit: 12,
  price: 25,
  compareAtPrice: null,
  isDefault: true,
  sortOrder: 0,
};

function createTestStore() {
  return configureStore({
    reducer: { cart: cartReducer, auth: authReducer },
  });
}

describe("Cart Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  // ─── Initial State ───
  describe("Initial State", () => {
    it("should have empty cart initially", () => {
      const state = store.getState().cart;
      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.updating).toEqual({});
    });
  });

  // ─── Fetch Cart ───
  describe("Fetch Cart", () => {
    it("should fetch cart items from API", async () => {
      const apiItems = [
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 3,
        },
      ];
      mockCartService.getCart.mockResolvedValueOnce(apiItems);

      await store.dispatch(fetchCart());

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].cartItemId).toBe("cart-1");
      expect(state.items[0].quantity).toBe(3);
      expect(state.loading).toBe(false);
    });

    it("should handle fetch cart failure", async () => {
      mockCartService.getCart.mockRejectedValueOnce(
        new Error("خطأ في تحميل السلة"),
      );

      await store.dispatch(fetchCart());

      const state = store.getState().cart;
      expect(state.items).toEqual([]);
      expect(state.error).toBe("خطأ في تحميل السلة");
    });
  });

  // ─── Add to Cart ───
  describe("Add to Cart", () => {
    it("should add a new product to cart", async () => {
      mockCartService.addToCart.mockResolvedValueOnce({
        id: "cart-1",
        productId: "prod-1",
        product: mockProduct,
        quantity: 2,
      });

      await store.dispatch(
        addToCartAsync({ product: mockProduct, quantity: 2 }),
      );

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it("should add product with selected unit", async () => {
      mockCartService.addToCart.mockResolvedValueOnce({
        id: "cart-2",
        productId: "prod-1",
        productUnitId: "unit-1",
        product: mockProduct,
        productUnit: mockUnit,
        quantity: 1,
      });

      await store.dispatch(
        addToCartAsync({
          product: mockProduct,
          quantity: 1,
          selectedUnit: mockUnit,
        }),
      );

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].selectedUnit?.id).toBe("unit-1");
    });

    it("should update existing item quantity if already in cart", async () => {
      // Add first item
      mockCartService.addToCart.mockResolvedValueOnce({
        id: "cart-1",
        productId: "prod-1",
        product: mockProduct,
        quantity: 2,
      });
      await store.dispatch(
        addToCartAsync({ product: mockProduct, quantity: 2 }),
      );

      // Add same item again - API returns updated quantity
      mockCartService.addToCart.mockResolvedValueOnce({
        id: "cart-1",
        productId: "prod-1",
        product: mockProduct,
        quantity: 5,
      });
      await store.dispatch(
        addToCartAsync({ product: mockProduct, quantity: 3 }),
      );

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(5);
    });

    it("should handle add to cart failure", async () => {
      mockCartService.addToCart.mockRejectedValueOnce(new Error("فشل الإضافة"));

      await store.dispatch(
        addToCartAsync({ product: mockProduct, quantity: 1 }),
      );

      const state = store.getState().cart;
      expect(state.error).toBe("فشل الإضافة");
    });
  });

  // ─── Update Cart Item ───
  describe("Update Cart Item", () => {
    it("should update item quantity", async () => {
      // Seed cart
      mockCartService.getCart.mockResolvedValueOnce([
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 2,
        },
      ]);
      await store.dispatch(fetchCart());

      mockCartService.updateCartItem.mockResolvedValueOnce({
        id: "cart-1",
        productId: "prod-1",
        product: mockProduct,
        quantity: 5,
      });

      await store.dispatch(
        updateCartItemAsync({ cartItemId: "cart-1", quantity: 5 }),
      );

      const state = store.getState().cart;
      expect(state.items[0].quantity).toBe(5);
    });

    it("should track updating state per item", async () => {
      mockCartService.getCart.mockResolvedValueOnce([
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 2,
        },
      ]);
      await store.dispatch(fetchCart());

      let resolveUpdate: (value: any) => void;
      const pendingUpdate = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockCartService.updateCartItem.mockReturnValueOnce(pendingUpdate as any);

      const promise = store.dispatch(
        updateCartItemAsync({ cartItemId: "cart-1", quantity: 5 }),
      );

      expect(store.getState().cart.updating["cart-1"]).toBe(true);

      resolveUpdate!({
        id: "cart-1",
        productId: "prod-1",
        product: mockProduct,
        quantity: 5,
      });
      await promise;

      expect(store.getState().cart.updating["cart-1"]).toBeUndefined();
    });
  });

  // ─── Remove from Cart ───
  describe("Remove from Cart", () => {
    it("should remove item via API", async () => {
      mockCartService.getCart.mockResolvedValueOnce([
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 2,
        },
        {
          id: "cart-2",
          productId: "prod-2",
          product: { ...mockProduct, id: "prod-2" },
          quantity: 1,
        },
      ]);
      await store.dispatch(fetchCart());
      expect(store.getState().cart.items).toHaveLength(2);

      mockCartService.removeCartItem.mockResolvedValueOnce();
      await store.dispatch(removeFromCartAsync("cart-1"));

      const state = store.getState().cart;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].cartItemId).toBe("cart-2");
    });
  });

  // ─── Local Reducers ───
  describe("Local Reducers", () => {
    beforeEach(async () => {
      mockCartService.getCart.mockResolvedValueOnce([
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 3,
        },
      ]);
      await store.dispatch(fetchCart());
    });

    it("should update quantity locally", () => {
      store.dispatch(updateQuantity({ cartItemId: "cart-1", quantity: 10 }));
      expect(store.getState().cart.items[0].quantity).toBe(10);
    });

    it("should remove item locally", () => {
      store.dispatch(removeFromCart("cart-1"));
      expect(store.getState().cart.items).toHaveLength(0);
    });

    it("should clear entire cart", () => {
      store.dispatch(clearCart());
      expect(store.getState().cart.items).toEqual([]);
      expect(store.getState().cart.error).toBeNull();
    });

    it("should clear cart error", async () => {
      mockCartService.getCart.mockRejectedValueOnce(new Error("خطأ"));
      await store.dispatch(fetchCart());
      expect(store.getState().cart.error).toBeTruthy();

      store.dispatch(clearCartError());
      expect(store.getState().cart.error).toBeNull();
    });
  });

  // ─── Logout Clears Cart ───
  describe("Logout Cleanup", () => {
    it("should clear cart on logout", async () => {
      mockCartService.getCart.mockResolvedValueOnce([
        {
          id: "cart-1",
          productId: "prod-1",
          product: mockProduct,
          quantity: 2,
        },
      ]);
      await store.dispatch(fetchCart());
      expect(store.getState().cart.items).toHaveLength(1);

      await store.dispatch(logout());

      const state = store.getState().cart;
      expect(state.items).toEqual([]);
      expect(state.error).toBeNull();
    });
  });
});
