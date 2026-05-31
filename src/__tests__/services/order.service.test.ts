/**
 * Order Service Tests
 * Tests: cart validation fallback behavior
 */
jest.mock("@/src/constants/api", () => ({
  API_BASE_URL: "http://localhost:3000",
  API_ENDPOINTS: {
    CART: {
      VALIDATE: "/api/v1/cart/validate",
    },
    ORDERS: {
      LIST: "/api/v1/orders",
      DETAIL: (id: string) => `/api/v1/orders/${id}`,
      CREATE: "/api/v1/orders",
      UPDATE: (id: string) => `/api/v1/orders/${id}`,
      RECENT: "/api/v1/orders?limit=5&sort=recent",
    },
  },
}));

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

import apiClient from "@/src/services/api";
import { orderService } from "@/src/services/order.service";

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("Order Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateCart", () => {
    it("should return backend validation response", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: { valid: false, invalidItems: [] },
      });

      const result = await orderService.validateCart();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/v1/cart/validate");
      expect(result).toEqual({ valid: false, invalidItems: [] });
    });

    it("should not block checkout when validation endpoint returns 405", async () => {
      mockApiClient.get.mockRejectedValueOnce({
        response: { status: 405, data: { message: "Method Not Allowed" } },
      });

      await expect(orderService.validateCart()).resolves.toEqual({
        valid: true,
      });
    });

    it("should not block checkout when validation endpoint is missing", async () => {
      mockApiClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: "Not Found" } },
      });

      await expect(orderService.validateCart()).resolves.toEqual({
        valid: true,
      });
    });
  });
});
