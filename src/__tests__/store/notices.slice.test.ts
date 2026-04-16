/**
 * Notices Slice Tests
 * Tests: fetch notices, auto-rotation
 */
import noticesReducer, {
    fetchNotices,
    nextNotice,
} from "@/src/store/slices/notices.slice";
import { configureStore } from "@reduxjs/toolkit";

jest.mock("@/src/services/notice.service", () => ({
  noticeService: {
    getNotices: jest.fn(),
  },
}));

jest.mock("@/src/utils/errorHandler", () => ({
  getErrorMessage: jest.fn((e: any) => e.message || "Error"),
}));

import { noticeService } from "@/src/services/notice.service";

const mockNoticeService = noticeService as jest.Mocked<typeof noticeService>;

const mockNotices = [
  {
    id: "notice-1",
    text: "عرض خاص على المنتجات الطازجة!",
    backgroundColor: "#FF6B35",
    textColor: "#FFFFFF",
    isActive: true,
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "notice-2",
    text: "توصيل مجاني للطلبات أكثر من 50 دينار",
    backgroundColor: "#1E3A8A",
    textColor: "#FFFFFF",
    isActive: true,
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "notice-3",
    text: "أسعار الجملة متاحة الآن",
    backgroundColor: "#10B981",
    textColor: "#FFFFFF",
    isActive: true,
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
];

function createTestStore() {
  return configureStore({ reducer: { notices: noticesReducer } });
}

describe("Notices Slice", () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = store.getState().notices;
      expect(state.items).toEqual([]);
      expect(state.currentIndex).toBe(0);
      expect(state.loading).toBe(false);
    });
  });

  describe("Fetch Notices", () => {
    it("should fetch notices", async () => {
      mockNoticeService.getNotices.mockResolvedValueOnce(mockNotices);

      await store.dispatch(fetchNotices());

      const state = store.getState().notices;
      expect(state.items).toHaveLength(3);
      expect(state.currentIndex).toBe(0);
    });

    it("should reset index on refetch", async () => {
      mockNoticeService.getNotices.mockResolvedValueOnce(mockNotices);
      await store.dispatch(fetchNotices());
      store.dispatch(nextNotice());
      expect(store.getState().notices.currentIndex).toBe(1);

      mockNoticeService.getNotices.mockResolvedValueOnce(mockNotices);
      await store.dispatch(fetchNotices());
      expect(store.getState().notices.currentIndex).toBe(0);
    });

    it("should handle empty notices", async () => {
      mockNoticeService.getNotices.mockResolvedValueOnce([]);

      await store.dispatch(fetchNotices());

      expect(store.getState().notices.items).toEqual([]);
    });

    it("should preserve custom colors", async () => {
      mockNoticeService.getNotices.mockResolvedValueOnce(mockNotices);

      await store.dispatch(fetchNotices());

      const items = store.getState().notices.items;
      expect(items[0].backgroundColor).toBe("#FF6B35");
      expect(items[1].backgroundColor).toBe("#1E3A8A");
      expect(items[2].backgroundColor).toBe("#10B981");
    });
  });

  describe("Auto-rotation (nextNotice)", () => {
    beforeEach(async () => {
      mockNoticeService.getNotices.mockResolvedValueOnce(mockNotices);
      await store.dispatch(fetchNotices());
    });

    it("should advance to next notice", () => {
      store.dispatch(nextNotice());
      expect(store.getState().notices.currentIndex).toBe(1);

      store.dispatch(nextNotice());
      expect(store.getState().notices.currentIndex).toBe(2);
    });

    it("should wrap around to first notice", () => {
      store.dispatch(nextNotice()); // 1
      store.dispatch(nextNotice()); // 2
      store.dispatch(nextNotice()); // 0 (wrap)

      expect(store.getState().notices.currentIndex).toBe(0);
    });

    it("should not crash with empty notices", () => {
      const emptyStore = createTestStore();
      emptyStore.dispatch(nextNotice());
      expect(emptyStore.getState().notices.currentIndex).toBe(0);
    });
  });
});
