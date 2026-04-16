/**
 * Product Service Tests
 * Tests: mapProduct function, image URL resolution, discount logic
 */
jest.mock("@/src/constants/api", () => ({
  API_BASE_URL: "http://localhost:3000",
  API_ENDPOINTS: {
    PRODUCTS: {
      LIST: "/api/v1/products",
      DETAIL: (id: string) => `/api/v1/products/${id}`,
      FEATURED: "/api/v1/products",
    },
  },
}));

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { mapProduct } from "@/src/services/product.service";
import type { ApiProduct } from "@/src/types";

const baseApiProduct: ApiProduct = {
  id: "prod-1",
  name: "تفاح أحمر",
  description: "تفاح طازج من المزرعة",
  price: 2.5,
  image: "/uploads/products/apple.jpg",
  images: [],
  categoryId: "cat-1",
  unit: "kg",
  stock: 100,
  minOrderQuantity: 1,
  isActive: true,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("Product Service - mapProduct", () => {
  // ─── Image URL Resolution ───
  describe("Image URL Resolution", () => {
    it("should prepend API_BASE_URL to relative image paths", () => {
      const product = mapProduct(baseApiProduct);
      expect(product.images[0]).toBe(
        "http://localhost:3000/uploads/products/apple.jpg",
      );
    });

    it("should keep absolute URLs unchanged", () => {
      const apiProduct = {
        ...baseApiProduct,
        image: "https://cdn.example.com/apple.jpg",
      };
      const product = mapProduct(apiProduct);
      expect(product.images[0]).toBe("https://cdn.example.com/apple.jpg");
    });

    it("should handle product with no image", () => {
      const apiProduct = { ...baseApiProduct, image: null };
      const product = mapProduct(apiProduct);
      expect(product.images).toEqual([]);
    });

    it("should handle multiple images", () => {
      const apiProduct = {
        ...baseApiProduct,
        image: "/uploads/main.jpg",
        images: ["/uploads/img1.jpg", "/uploads/img2.jpg"],
      };
      const product = mapProduct(apiProduct);
      expect(product.images).toHaveLength(3);
      expect(product.images[0]).toContain("main.jpg");
      expect(product.images[1]).toContain("img1.jpg");
      expect(product.images[2]).toContain("img2.jpg");
    });
  });

  // ─── Discount Price Logic ───
  describe("Discount Price Logic", () => {
    it("should set discountPrice when compareAtPrice > price", () => {
      const apiProduct = {
        ...baseApiProduct,
        price: 2.0,
        compareAtPrice: 3.5,
      };
      const product = mapProduct(apiProduct);
      expect(product.price).toBe(3.5); // original price
      expect(product.discountPrice).toBe(2.0); // sale price
    });

    it("should not set discountPrice when no compareAtPrice", () => {
      const product = mapProduct(baseApiProduct);
      expect(product.discountPrice).toBeUndefined();
      expect(product.price).toBe(2.5);
    });

    it("should not set discountPrice when compareAtPrice <= price", () => {
      const apiProduct = {
        ...baseApiProduct,
        price: 5.0,
        compareAtPrice: 3.0,
      };
      const product = mapProduct(apiProduct);
      expect(product.discountPrice).toBeUndefined();
    });
  });

  // ─── Field Mapping ───
  describe("Field Mapping", () => {
    it("should map all required fields", () => {
      const product = mapProduct(baseApiProduct);
      expect(product.id).toBe("prod-1");
      expect(product.name).toBe("تفاح أحمر");
      expect(product.description).toBe("تفاح طازج من المزرعة");
      expect(product.categoryId).toBe("cat-1");
      expect(product.unit).toBe("kg");
      expect(product.stock).toBe(100);
      expect(product.minOrder).toBe(1);
    });

    it("should map category name from nested object", () => {
      const apiProduct = {
        ...baseApiProduct,
        category: { id: "cat-1", name: "فواكه", slug: "fruits" },
      };
      const product = mapProduct(apiProduct);
      expect(product.categoryName).toBe("فواكه");
    });

    it("should map product units", () => {
      const apiProduct = {
        ...baseApiProduct,
        units: [
          {
            id: "unit-1",
            unit: "box",
            label: "صندوق",
            labelEn: "Box",
            piecesPerUnit: 12,
            price: 25,
            compareAtPrice: null,
            isDefault: true,
            sortOrder: 0,
          },
        ],
      };
      const product = mapProduct(apiProduct);
      expect(product.units).toHaveLength(1);
      expect(product.units![0].label).toBe("صندوق");
      expect(product.units![0].piecesPerUnit).toBe(12);
    });

    it("should default minOrder to 1", () => {
      const apiProduct = { ...baseApiProduct, minOrderQuantity: 1 };
      const product = mapProduct(apiProduct);
      expect(product.minOrder).toBe(1);
    });

    it("should default sku to empty string", () => {
      const apiProduct = { ...baseApiProduct, sku: null };
      const product = mapProduct(apiProduct);
      expect(product.sku).toBe("");
    });
  });
});
