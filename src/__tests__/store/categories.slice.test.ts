/**
 * Categories Slice Tests
 * Tests: fetch categories, caching
 */
import categoriesReducer, {
    fetchCategories,
} from "@/src/store/slices/categories.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/category.service", () => ({
  categoryService: {
    getCategories: jest.fn(),
  },
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

jest.mock("@/src/utils/cache", () => ({
  getCached: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve()),
}));

import { categoryService } from "@/src/services/category.service";
import { getCached } from "@/src/utils/cache";

const mockCategoryService = categoryService as jest.Mocked<
  typeof categoryService
>;
const mockGetCached = getCached as jest.MockedFunction<typeof getCached>;

const mockCategories = [
  {
    id: "cat-1",
    name: "فواكه",
    nameEn: "Fruits",
    slug: "fruits",
    parentId: null,
    depth: 0,
    hasChildren: true,
    childrenCount: 3,
    productsCount: 25,
  },
  {
    id: "cat-2",
    name: "خضروات",
    nameEn: "Vegetables",
    slug: "vegetables",
    parentId: null,
    depth: 0,
    hasChildren: false,
    childrenCount: 0,
    productsCount: 15,
  },
];

function createTestStore() {
  return configureStore({ reducer: { categories: categoriesReducer } });
}

describe("Categories Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().categories;
      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("Fetch Categories", () => {
    it("should fetch categories from API", async () => {
      mockGetCached.mockResolvedValueOnce(null);
      mockCategoryService.getCategories.mockResolvedValueOnce({
        categories: mockCategories,
        breadcrumb: [],
      });

      await store.dispatch(fetchCategories(undefined));

      const state = store.getState().categories;
      expect(state.items).toHaveLength(2);
      expect(state.items[0].name).toBe("فواكه");
    });

    it("should use cached categories if available", async () => {
      mockGetCached.mockResolvedValueOnce({
        categories: mockCategories,
        breadcrumb: [],
      });

      await store.dispatch(fetchCategories(undefined));

      expect(mockCategoryService.getCategories).not.toHaveBeenCalled();
      expect(store.getState().categories.items).toHaveLength(2);
    });

    it("should fallback to cache on API error", async () => {
      // First call: no cache
      mockGetCached.mockResolvedValueOnce(null);
      mockCategoryService.getCategories.mockRejectedValueOnce(new Error("خطأ"));
      // Fallback cache call
      mockGetCached.mockResolvedValueOnce({
        categories: mockCategories,
        breadcrumb: [],
      });

      await store.dispatch(fetchCategories(undefined));

      expect(store.getState().categories.items).toHaveLength(2);
    });

    it("should handle fetch failure with no cache", async () => {
      mockGetCached.mockResolvedValue(null);
      mockCategoryService.getCategories.mockRejectedValueOnce(
        new Error("خطأ في الشبكة"),
      );

      await store.dispatch(fetchCategories(undefined));

      expect(store.getState().categories.error).toBe("خطأ في الشبكة");
    });
  });
});
