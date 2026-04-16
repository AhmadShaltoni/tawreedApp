/**
 * Cache Utility Tests
 * Tests: get/set cache, TTL expiry, cache clearing
 */
import { clearCache, getCached, setCache } from "@/src/utils/cache";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Cache Utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.clear as jest.Mock)();
  });

  // ─── setCache ───
  describe("setCache", () => {
    it("should store data with prefix and timestamp", async () => {
      await setCache("test_key", { name: "test" });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "tawreed_cache_test_key",
        expect.any(String),
      );

      const storedValue = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(storedValue);
      expect(parsed.data).toEqual({ name: "test" });
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.ttl).toBe(30 * 60 * 1000); // 30 minutes default
    });

    it("should store data with custom TTL", async () => {
      const customTTL = 60 * 60 * 1000; // 1 hour
      await setCache("custom_ttl", { data: 1 }, customTTL);

      const storedValue = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
      const parsed = JSON.parse(storedValue);
      expect(parsed.ttl).toBe(customTTL);
    });
  });

  // ─── getCached ───
  describe("getCached", () => {
    it("should return cached data if not expired", async () => {
      const cacheEntry = {
        data: { products: [{ id: "1" }] },
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheEntry),
      );

      const result = await getCached<{ products: any[] }>("test_key");
      expect(result).toEqual({ products: [{ id: "1" }] });
    });

    it("should return null for expired cache", async () => {
      const cacheEntry = {
        data: { name: "old" },
        timestamp: Date.now() - 31 * 60 * 1000, // 31 minutes ago
        ttl: 30 * 60 * 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheEntry),
      );

      const result = await getCached("test_key");
      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        "tawreed_cache_test_key",
      );
    });

    it("should return null for missing cache key", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getCached("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null and not crash on corrupt data", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("not json");

      const result = await getCached("corrupt");
      expect(result).toBeNull();
    });
  });

  // ─── clearCache ───
  describe("clearCache", () => {
    it("should clear only cache keys with prefix", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        "tawreed_cache_products",
        "tawreed_cache_categories",
        "tawreed_auth_token",
        "other_key",
      ]);

      await clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        "tawreed_cache_products",
        "tawreed_cache_categories",
      ]);
    });

    it("should handle no cache keys", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        "other_key",
      ]);

      await clearCache();

      expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
    });
  });

  // ─── TTL Boundary Tests ───
  describe("TTL Boundaries", () => {
    it("should return data at exactly TTL boundary (not expired)", async () => {
      const ttl = 30 * 60 * 1000;
      const cacheEntry = {
        data: { valid: true },
        timestamp: Date.now() - ttl + 1000, // 1 second before expiry
        ttl,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheEntry),
      );

      const result = await getCached("boundary");
      expect(result).toEqual({ valid: true });
    });
  });
});
