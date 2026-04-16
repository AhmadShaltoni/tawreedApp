/**
 * Notifications Slice Tests
 * Tests: fetch notifications, mark read, mark all read, unread count
 */
import notificationsReducer, {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "@/src/store/slices/notifications.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/notification.service", () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
  pushNotificationService: {
    initialize: jest.fn(),
    cleanup: jest.fn(),
  },
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

import { notificationService } from "@/src/services/notification.service";

const mockNotificationService = notificationService as jest.Mocked<
  typeof notificationService
>;

const mockNotifications = [
  {
    id: "notif-1",
    type: "order_update" as const,
    title: "تحديث الطلب",
    message: "تم تأكيد طلبك ORD-001",
    read: false,
    data: { orderId: "order-1" },
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "notif-2",
    type: "new_product" as const,
    title: "منتج جديد",
    message: "تم إضافة منتج جديد: تفاح عضوي",
    read: false,
    createdAt: "2026-04-01T09:00:00Z",
  },
  {
    id: "notif-3",
    type: "promotion" as const,
    title: "عرض خاص",
    message: "خصم 20% على جميع المنتجات",
    read: true,
    createdAt: "2026-03-30T10:00:00Z",
  },
  {
    id: "notif-4",
    type: "system" as const,
    title: "تحديث النظام",
    message: "تم تحديث التطبيق بنجاح",
    read: true,
    createdAt: "2026-03-29T10:00:00Z",
  },
];

function createTestStore() {
  return configureStore({ reducer: { notifications: notificationsReducer } });
}

describe("Notifications Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  // ─── Initial State ───
  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().notifications;
      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.unreadCount).toBe(0);
    });
  });

  // ─── Fetch Notifications ───
  describe("Fetch Notifications", () => {
    it("should fetch all notifications", async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );

      await store.dispatch(fetchNotifications());

      const state = store.getState().notifications;
      expect(state.items).toHaveLength(4);
      expect(state.loading).toBe(false);
    });

    it("should calculate unread count correctly", async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );

      await store.dispatch(fetchNotifications());

      // 2 unread: notif-1, notif-2
      expect(store.getState().notifications.unreadCount).toBe(2);
    });

    it("should handle all notification types", async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );

      await store.dispatch(fetchNotifications());

      const items = store.getState().notifications.items;
      const types = items.map((n) => n.type);
      expect(types).toContain("order_update");
      expect(types).toContain("new_product");
      expect(types).toContain("promotion");
      expect(types).toContain("system");
    });

    it("should handle fetch failure", async () => {
      mockNotificationService.getNotifications.mockRejectedValueOnce(
        new Error("فشل تحميل الإشعارات"),
      );

      await store.dispatch(fetchNotifications());

      expect(store.getState().notifications.error).toBe("فشل تحميل الإشعارات");
    });
  });

  // ─── Mark as Read ───
  describe("Mark Notification Read", () => {
    beforeEach(async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );
      await store.dispatch(fetchNotifications());
    });

    it("should mark single notification as read", async () => {
      mockNotificationService.markAsRead.mockResolvedValueOnce();

      await store.dispatch(markNotificationRead("notif-1"));

      const state = store.getState().notifications;
      const notif = state.items.find((n) => n.id === "notif-1");
      expect(notif?.read).toBe(true);
      expect(state.unreadCount).toBe(1); // was 2, now 1
    });

    it("should not decrement unread count for already-read notification", async () => {
      mockNotificationService.markAsRead.mockResolvedValueOnce();

      // notif-3 is already read
      await store.dispatch(markNotificationRead("notif-3"));

      expect(store.getState().notifications.unreadCount).toBe(2); // unchanged
    });
  });

  // ─── Mark All Read ───
  describe("Mark All Read", () => {
    it("should mark all notifications as read", async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );
      await store.dispatch(fetchNotifications());
      expect(store.getState().notifications.unreadCount).toBe(2);

      mockNotificationService.markAllAsRead.mockResolvedValueOnce();
      await store.dispatch(markAllNotificationsRead());

      const state = store.getState().notifications;
      expect(state.unreadCount).toBe(0);
      expect(state.items.every((n) => n.read)).toBe(true);
    });
  });

  // ─── Deep Link Data ───
  describe("Notification Data", () => {
    it("should preserve notification data for deep linking", async () => {
      mockNotificationService.getNotifications.mockResolvedValueOnce(
        mockNotifications,
      );

      await store.dispatch(fetchNotifications());

      const orderNotif = store
        .getState()
        .notifications.items.find((n) => n.id === "notif-1");
      expect(orderNotif?.data?.orderId).toBe("order-1");
    });
  });
});
