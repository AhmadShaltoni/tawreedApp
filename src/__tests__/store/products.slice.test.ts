/**
 * Products Slice Tests
 * Tests: fetch products, pagination, featured, product detail, filters
 */
import productsReducer, {
    clearFilters,
    clearSelectedProduct,
    fetchFeaturedProducts,
    fetchMoreProducts,
    fetchProductDetail,
    fetchProducts,
    setFilters,
} from "@/src/store/slices/products.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/product.service", () => ({
  productService: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    getFeatured: jest.fn(),
  },
  mapProduct: jest.fn((p: any) => p),
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

jest.mock("@/src/utils/cache", () => ({
  getCached: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve()),
}));

import { productService } from "@/src/services/product.service";

const mockProductService = productService as jest.Mocked<typeof productService>;

const mockProducts = [
  {
    id: "prod-1",
    name: "تفاح أحمر",
    description: "تفاح طازج",
    price: 2.5,
    sku: "APL-001",
    images: [],
    categoryId: "cat-1",
    unit: "kg",
    minOrder: 1,
    stock: 100,
    featured: false,
    createdAt: "2026-01-01",
    isActive: true,
    variants: [],
  },
  {
    id: "prod-2",
    name: "موز",
    description: "موز أصفر",
    price: 1.5,
    sku: "BAN-001",
    images: [],
    categoryId: "cat-1",
    unit: "kg",
    minOrder: 1,
    stock: 50,
    featured: true,
    createdAt: "2026-01-02",
    isActive: true,
    variants: [],
  },
];

function createTestStore() {
  return configureStore({ reducer: { products: productsReducer } });
}

describe("Products Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  // ─── Initial State ───
  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().products;
      expect(state.items).toEqual([]);
      expect(state.featured).toEqual([]);
      expect(state.selectedProduct).toBeNull();
      expect(state.total).toBe(0);
      expect(state.page).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.filters).toEqual({ page: 1, limit: 20 });
    });
  });

  // ─── Fetch Products ───
  describe("Fetch Products", () => {
    it("should fetch products list", async () => {
      mockProductService.getProducts.mockResolvedValueOnce({
        products: mockProducts,
        total: 2,
        page: 1,
        limit: 20,
      });

      await store.dispatch(fetchProducts(undefined));

      const state = store.getState().products;
      expect(state.items).toHaveLength(2);
      expect(state.total).toBe(2);
      expect(state.page).toBe(1);
      expect(state.loading).toBe(false);
    });

    it("should fetch products with search filter", async () => {
      mockProductService.getProducts.mockResolvedValueOnce({
        products: [mockProducts[0]],
        total: 1,
        page: 1,
        limit: 20,
      });

      await store.dispatch(fetchProducts({ search: "تفاح" }));

      expect(mockProductService.getProducts).toHaveBeenCalledWith({
        search: "تفاح",
      });
      expect(store.getState().products.items).toHaveLength(1);
    });

    it("should fetch products with category filter", async () => {
      mockProductService.getProducts.mockResolvedValueOnce({
        products: mockProducts,
        total: 2,
        page: 1,
        limit: 20,
      });

      await store.dispatch(fetchProducts({ categoryId: "cat-1" }));

      expect(mockProductService.getProducts).toHaveBeenCalledWith({
        categoryId: "cat-1",
      });
    });

    it("should handle fetch products failure", async () => {
      mockProductService.getProducts.mockRejectedValueOnce(
        new Error("خطأ في تحميل المنتجات"),
      );

      await store.dispatch(fetchProducts(undefined));

      const state = store.getState().products;
      expect(state.error).toBe("خطأ في تحميل المنتجات");
      expect(state.items).toEqual([]);
    });
  });

  // ─── Fetch More Products (Pagination) ───
  describe("Pagination", () => {
    it("should append more products on pagination", async () => {
      // Initial load
      mockProductService.getProducts.mockResolvedValueOnce({
        products: mockProducts,
        total: 4,
        page: 1,
        limit: 2,
      });
      await store.dispatch(fetchProducts({ page: 1, limit: 2 }));
      expect(store.getState().products.items).toHaveLength(2);

      // Load more
      const moreProducts = [
        { ...mockProducts[0], id: "prod-3", name: "برتقال" },
        { ...mockProducts[1], id: "prod-4", name: "عنب" },
      ];
      mockProductService.getProducts.mockResolvedValueOnce({
        products: moreProducts,
        total: 4,
        page: 2,
        limit: 2,
      });
      await store.dispatch(fetchMoreProducts({ page: 2, limit: 2 }));

      const state = store.getState().products;
      expect(state.items).toHaveLength(4);
      expect(state.page).toBe(2);
    });

    it("should set loadingMore flag during pagination", async () => {
      let resolveMore: (value: any) => void;
      const pendingMore = new Promise((resolve) => {
        resolveMore = resolve;
      });
      mockProductService.getProducts.mockReturnValueOnce(pendingMore as any);

      const promise = store.dispatch(fetchMoreProducts({ page: 2, limit: 20 }));
      expect(store.getState().products.loadingMore).toBe(true);

      resolveMore!({ products: [], total: 0, page: 2, limit: 20 });
      await promise;
      expect(store.getState().products.loadingMore).toBe(false);
    });
  });

  // ─── Featured Products ───
  describe("Featured Products", () => {
    it("should fetch featured products", async () => {
      mockProductService.getFeatured.mockResolvedValueOnce({
        products: [mockProducts[1]],
        total: 1,
        page: 1,
        limit: 20,
      });

      await store.dispatch(fetchFeaturedProducts(undefined));

      expect(store.getState().products.featured).toHaveLength(1);
    });

    it("should use cache for featured products", async () => {
      const { getCached } = require("@/src/utils/cache");
      getCached.mockResolvedValueOnce([mockProducts[1]]);

      await store.dispatch(fetchFeaturedProducts(undefined));

      expect(mockProductService.getFeatured).not.toHaveBeenCalled();
      expect(store.getState().products.featured).toHaveLength(1);
    });

    it("should bypass cache when force refresh", async () => {
      mockProductService.getFeatured.mockResolvedValueOnce({
        products: [mockProducts[1]],
        total: 1,
        page: 1,
        limit: 20,
      });

      await store.dispatch(fetchFeaturedProducts({ force: true }));

      expect(mockProductService.getFeatured).toHaveBeenCalled();
    });
  });

  // ─── Product Detail ───
  describe("Product Detail", () => {
    it("should fetch product detail", async () => {
      mockProductService.getProduct.mockResolvedValueOnce(mockProducts[0]);

      await store.dispatch(fetchProductDetail("prod-1"));

      const state = store.getState().products;
      expect(state.selectedProduct).toEqual(mockProducts[0]);
      expect(state.loadingDetail).toBe(false);
    });

    it("should handle product detail failure", async () => {
      mockProductService.getProduct.mockRejectedValueOnce(
        new Error("المنتج غير موجود"),
      );

      await store.dispatch(fetchProductDetail("nonexistent"));

      expect(store.getState().products.error).toBe("المنتج غير موجود");
    });

    it("should clear selected product", async () => {
      mockProductService.getProduct.mockResolvedValueOnce(mockProducts[0]);
      await store.dispatch(fetchProductDetail("prod-1"));
      expect(store.getState().products.selectedProduct).not.toBeNull();

      store.dispatch(clearSelectedProduct());
      expect(store.getState().products.selectedProduct).toBeNull();
    });
  });

  // ─── Filters ───
  describe("Filters", () => {
    it("should set filters and reset page to 1", () => {
      store.dispatch(setFilters({ search: "تفاح", categoryId: "cat-1" }));

      const state = store.getState().products;
      expect(state.filters.search).toBe("تفاح");
      expect(state.filters.categoryId).toBe("cat-1");
      expect(state.filters.page).toBe(1);
    });

    it("should clear filters to defaults", () => {
      store.dispatch(setFilters({ search: "تفاح" }));
      store.dispatch(clearFilters());

      expect(store.getState().products.filters).toEqual({
        page: 1,
        limit: 20,
      });
    });
  });
});
