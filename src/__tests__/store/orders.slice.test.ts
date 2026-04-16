/**
 * Orders Slice Tests
 * Tests: fetch orders, order detail, create order, update order
 */
import ordersReducer, {
    clearOrderDetail,
    clearOrdersError,
    createOrder,
    fetchOrderDetail,
    fetchOrders,
    updateOrder,
} from "@/src/store/slices/orders.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/order.service", () => ({
  orderService: {
    getOrders: jest.fn(),
    getOrderDetail: jest.fn(),
    createOrder: jest.fn(),
    updateOrder: jest.fn(),
  },
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

import { orderService } from "@/src/services/order.service";

const mockOrderService = orderService as jest.Mocked<typeof orderService>;

const mockOrders = [
  {
    id: "order-1",
    orderNumber: "ORD-001",
    status: "PENDING" as const,
    total: 50.0,
    itemCount: 3,
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "order-2",
    orderNumber: "ORD-002",
    status: "DELIVERED" as const,
    total: 120.0,
    itemCount: 5,
    createdAt: "2026-03-20T10:00:00Z",
  },
];

const mockOrderDetail = {
  id: "order-1",
  orderNumber: "ORD-001",
  status: "PENDING" as const,
  total: 50.0,
  itemCount: 2,
  createdAt: "2026-04-01T10:00:00Z",
  updatedAt: "2026-04-01T10:00:00Z",
  shippingAddress: "شارع الملك عبدالله",
  city: "عمان",
  items: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "تفاح",
      price: 2.5,
      quantity: 10,
      unit: "kg",
      subtotal: 25.0,
    },
    {
      id: "item-2",
      productId: "prod-2",
      productName: "موز",
      price: 1.5,
      quantity: 10,
      unit: "kg",
      subtotal: 15.0,
    },
  ],
  statusHistory: [
    { status: "PENDING" as const, timestamp: "2026-04-01T10:00:00Z" },
  ],
};

function createTestStore() {
  return configureStore({ reducer: { orders: ordersReducer } });
}

describe("Orders Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  // ─── Initial State ───
  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().orders;
      expect(state.items).toEqual([]);
      expect(state.selectedOrder).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.creating).toBe(false);
      expect(state.updating).toBe(false);
    });
  });

  // ─── Fetch Orders ───
  describe("Fetch Orders", () => {
    it("should fetch orders list", async () => {
      mockOrderService.getOrders.mockResolvedValueOnce(mockOrders);

      await store.dispatch(fetchOrders());

      const state = store.getState().orders;
      expect(state.items).toHaveLength(2);
      expect(state.items[0].orderNumber).toBe("ORD-001");
      expect(state.loading).toBe(false);
    });

    it("should handle fetch orders failure", async () => {
      mockOrderService.getOrders.mockRejectedValueOnce(
        new Error("فشل تحميل الطلبات"),
      );

      await store.dispatch(fetchOrders());

      expect(store.getState().orders.error).toBe("فشل تحميل الطلبات");
    });
  });

  // ─── Order Detail ───
  describe("Order Detail", () => {
    it("should fetch order detail", async () => {
      mockOrderService.getOrderDetail.mockResolvedValueOnce(mockOrderDetail);

      await store.dispatch(fetchOrderDetail("order-1"));

      const state = store.getState().orders;
      expect(state.selectedOrder).toEqual(mockOrderDetail);
      expect(state.selectedOrder?.items).toHaveLength(2);
      expect(state.loadingDetail).toBe(false);
    });

    it("should handle order detail failure", async () => {
      mockOrderService.getOrderDetail.mockRejectedValueOnce(
        new Error("الطلب غير موجود"),
      );

      await store.dispatch(fetchOrderDetail("nonexistent"));

      expect(store.getState().orders.error).toBe("الطلب غير موجود");
    });

    it("should clear order detail", async () => {
      mockOrderService.getOrderDetail.mockResolvedValueOnce(mockOrderDetail);
      await store.dispatch(fetchOrderDetail("order-1"));
      expect(store.getState().orders.selectedOrder).not.toBeNull();

      store.dispatch(clearOrderDetail());
      expect(store.getState().orders.selectedOrder).toBeNull();
    });
  });

  // ─── Create Order ───
  describe("Create Order", () => {
    it("should create a new order", async () => {
      mockOrderService.createOrder.mockResolvedValueOnce(mockOrderDetail);

      await store.dispatch(
        createOrder({
          deliveryAddress: "شارع الملك عبدالله",
          deliveryCity: "عمان",
          buyerNotes: "من فضلك التوصيل صباحاً",
        }),
      );

      const state = store.getState().orders;
      expect(state.creating).toBe(false);
      expect(state.items).toHaveLength(1);
      expect(state.items[0].orderNumber).toBe("ORD-001");
    });

    it("should prepend new order to list", async () => {
      // Seed existing orders
      mockOrderService.getOrders.mockResolvedValueOnce(mockOrders);
      await store.dispatch(fetchOrders());
      expect(store.getState().orders.items).toHaveLength(2);

      // Create new order
      const newOrder = {
        ...mockOrderDetail,
        id: "order-3",
        orderNumber: "ORD-003",
      };
      mockOrderService.createOrder.mockResolvedValueOnce(newOrder);

      await store.dispatch(
        createOrder({
          deliveryAddress: "شارع الجامعة",
          deliveryCity: "إربد",
        }),
      );

      const items = store.getState().orders.items;
      expect(items).toHaveLength(3);
      expect(items[0].orderNumber).toBe("ORD-003"); // prepended
    });

    it("should handle create order failure", async () => {
      mockOrderService.createOrder.mockRejectedValueOnce(
        new Error("السلة فارغة"),
      );

      await store.dispatch(
        createOrder({
          deliveryAddress: "test",
          deliveryCity: "test",
        }),
      );

      const state = store.getState().orders;
      expect(state.creating).toBe(false);
      expect(state.error).toBe("السلة فارغة");
    });

    it("should create order with coupon", async () => {
      mockOrderService.createOrder.mockResolvedValueOnce(mockOrderDetail);

      await store.dispatch(
        createOrder({
          deliveryAddress: "شارع الملك عبدالله",
          deliveryCity: "عمان",
          couponCode: "SAVE10",
        }),
      );

      expect(mockOrderService.createOrder).toHaveBeenCalledWith({
        deliveryAddress: "شارع الملك عبدالله",
        deliveryCity: "عمان",
        couponCode: "SAVE10",
      });
    });
  });

  // ─── Update Order ───
  describe("Update Order", () => {
    it("should update order details", async () => {
      mockOrderService.getOrders.mockResolvedValueOnce(mockOrders);
      await store.dispatch(fetchOrders());

      const updatedOrder = {
        ...mockOrderDetail,
        status: "CONFIRMED" as const,
      };
      mockOrderService.updateOrder.mockResolvedValueOnce(updatedOrder);

      await store.dispatch(
        updateOrder({
          id: "order-1",
          payload: { buyerNotes: "ملاحظة محدثة" },
        }),
      );

      const state = store.getState().orders;
      expect(state.selectedOrder?.status).toBe("CONFIRMED");
      expect(state.items[0].status).toBe("CONFIRMED");
    });

    it("should handle update order failure", async () => {
      mockOrderService.updateOrder.mockRejectedValueOnce(
        new Error("لا يمكن تعديل الطلب"),
      );

      await store.dispatch(
        updateOrder({ id: "order-1", payload: { buyerNotes: "test" } }),
      );

      expect(store.getState().orders.error).toBe("لا يمكن تعديل الطلب");
    });
  });

  // ─── Order Status Checks ───
  describe("Order Status Types", () => {
    it("should handle all 6 order statuses", async () => {
      const statuses = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ] as const;

      for (const status of statuses) {
        const order = { ...mockOrders[0], status };
        mockOrderService.getOrders.mockResolvedValueOnce([order]);

        await store.dispatch(fetchOrders());
        expect(store.getState().orders.items[0].status).toBe(status);
      }
    });
  });

  // ─── Error Clearing ───
  describe("Error Management", () => {
    it("should clear orders error", async () => {
      mockOrderService.getOrders.mockRejectedValueOnce(new Error("خطأ"));
      await store.dispatch(fetchOrders());
      expect(store.getState().orders.error).toBeTruthy();

      store.dispatch(clearOrdersError());
      expect(store.getState().orders.error).toBeNull();
    });
  });
});
