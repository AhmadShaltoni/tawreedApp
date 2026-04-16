/**
 * Error Handler Tests
 * Tests: extractErrorMessage, getErrorMessage, status codes, network errors
 */
import { extractErrorMessage, getErrorMessage } from "@/src/utils/errorHandler";

describe("Error Handler", () => {
  // ─── extractErrorMessage ───
  describe("extractErrorMessage", () => {
    it('should extract error from { error: "message" } format', () => {
      const error = {
        response: { data: { error: "رقم الهاتف مسجل مسبقاً" } },
      };
      expect(extractErrorMessage(error)).toBe("رقم الهاتف مسجل مسبقاً");
    });

    it('should extract error from { message: "message" } format', () => {
      const error = {
        response: { data: { message: "بيانات غير صحيحة" } },
      };
      expect(extractErrorMessage(error)).toBe("بيانات غير صحيحة");
    });

    it("should extract first field error from { errors: { field: msg } }", () => {
      const error = {
        response: {
          data: { errors: { phone: "رقم الهاتف مطلوب" } },
        },
      };
      expect(extractErrorMessage(error)).toBe("رقم الهاتف مطلوب");
    });

    it("should extract from { success: false, message: msg } format", () => {
      const error = {
        response: {
          data: { success: false, message: "العملية فشلت" },
        },
      };
      expect(extractErrorMessage(error)).toBe("العملية فشلت");
    });

    it("should handle Network Error", () => {
      const error = { message: "Network Error" };
      expect(extractErrorMessage(error)).toBe(
        "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.",
      );
    });

    it("should handle timeout error", () => {
      const error = { message: "timeout of 15000ms exceeded" };
      expect(extractErrorMessage(error)).toBe(
        "انتهت مهلة الانتظار. حاول مرة أخرى.",
      );
    });

    it("should return generic error for unknown errors", () => {
      const error = {};
      expect(extractErrorMessage(error)).toBe(
        "حدث خطأ. يرجى المحاولة مرة أخرى.",
      );
    });

    it("should return generic message", () => {
      const error = { message: "some message" };
      expect(extractErrorMessage(error)).toBe("some message");
    });
  });

  // ─── getErrorMessage ───
  describe("getErrorMessage", () => {
    it("should return extracted message for meaningful errors", () => {
      const error = {
        response: { data: { error: "رقم الهاتف مسجل مسبقاً" } },
      };
      expect(getErrorMessage(error)).toBe("رقم الهاتف مسجل مسبقاً");
    });

    it("should fallback to status code message for 401", () => {
      const error = {
        response: { status: 401, data: {} },
        message: "Request failed with status code 401 Error",
      };
      expect(getErrorMessage(error)).toBe(
        "جلسة منتهية. يرجى تسجيل الدخول مرة أخرى.",
      );
    });

    it("should fallback to status code message for 403", () => {
      const error = {
        response: { status: 403, data: {} },
        message: "Forbidden Error",
      };
      expect(getErrorMessage(error)).toBe("لا تملك صلاحيات كافية");
    });

    it("should fallback to status code message for 404", () => {
      const error = {
        response: { status: 404, data: {} },
        message: "Not Found Error",
      };
      expect(getErrorMessage(error)).toBe("الموارد المطلوبة غير موجودة");
    });

    it("should fallback to status code message for 409", () => {
      const error = {
        response: { status: 409, data: {} },
        message: "Conflict Error",
      };
      expect(getErrorMessage(error)).toBe(
        "هناك تضارب في البيانات. يرجى التحقق والمحاولة مرة أخرى.",
      );
    });

    it("should fallback to status code message for 422", () => {
      const error = {
        response: { status: 422, data: {} },
        message: "Unprocessable Entity Error",
      };
      expect(getErrorMessage(error)).toBe("بيانات غير صحيحة");
    });

    it("should fallback to status code message for 429", () => {
      const error = {
        response: { status: 429, data: {} },
        message: "Too Many Requests Error",
      };
      expect(getErrorMessage(error)).toBe("عدد محاولات كثيرة. حاول لاحقاً.");
    });

    it("should fallback to status code message for 500", () => {
      const error = {
        response: { status: 500, data: {} },
        message: "Internal Server Error",
      };
      expect(getErrorMessage(error)).toBe("خطأ في الخادم. حاول لاحقاً.");
    });

    it("should fallback to status code message for 502", () => {
      const error = {
        response: { status: 502, data: {} },
        message: "Bad Gateway Error",
      };
      expect(getErrorMessage(error)).toBe("خطأ في الخادم. حاول لاحقاً.");
    });

    it("should fallback to status code message for 503", () => {
      const error = {
        response: { status: 503, data: {} },
        message: "Service Unavailable Error",
      };
      expect(getErrorMessage(error)).toBe("الخدمة غير متاحة حالياً.");
    });

    it("should fallback to status code message for 504", () => {
      const error = {
        response: { status: 504, data: {} },
        message: "Gateway Timeout Error",
      };
      expect(getErrorMessage(error)).toBe("انتهت مهلة انتظار الخادم.");
    });

    it("should return network error message", () => {
      const error = { message: "Network Error" };
      expect(getErrorMessage(error)).toBe(
        "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.",
      );
    });

    it("should return generic fallback for completely unknown errors", () => {
      const error = {};
      expect(getErrorMessage(error)).toBe("حدث خطأ. يرجى المحاولة مرة أخرى.");
    });
  });

  // ─── Security: Input Validation ───
  describe("Security - Input Handling", () => {
    it("should handle XSS-like content in error messages safely", () => {
      const error = {
        response: {
          data: { error: '<script>alert("xss")</script>' },
        },
      };
      const msg = extractErrorMessage(error);
      // The message should be returned as-is (string), not executed
      expect(typeof msg).toBe("string");
      expect(msg).toContain("<script>");
    });

    it("should handle SQL injection-like content safely", () => {
      const error = {
        response: {
          data: { error: "'; DROP TABLE users; --" },
        },
      };
      const msg = extractErrorMessage(error);
      expect(typeof msg).toBe("string");
    });

    it("should handle null/undefined data safely", () => {
      expect(extractErrorMessage({ response: { data: null } })).toBe(
        "حدث خطأ. يرجى المحاولة مرة أخرى.",
      );
      expect(extractErrorMessage({ response: null })).toBe(
        "حدث خطأ. يرجى المحاولة مرة أخرى.",
      );
    });
  });
});
