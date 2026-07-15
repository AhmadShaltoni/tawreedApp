import i18n from "@/src/localization/i18n";

/**
 * Extracts error message from API response
 * Handles multiple error response formats from backend
 */
export function extractErrorMessage(error: any): string {
  // Handle various error response formats
  if (error.response?.data) {
    const data = error.response.data;

    // Format 1: { error: "message" }
    if (typeof data.error === "string") {
      return data.error;
    }

    // Format 2: { message: "message" }
    if (typeof data.message === "string") {
      return data.message;
    }

    // Format 3: { errors: { field: "message" } }
    if (data.errors && typeof data.errors === "object") {
      const firstError = Object.values(data.errors)[0];
      if (typeof firstError === "string") {
        return firstError;
      }
    }

    // Format 4: Generic response with error property
    if (data.success === false && typeof data.message === "string") {
      return data.message;
    }
  }

  // Handle Axios network error message
  if (error.message) {
    // Don't return generic network messages
    if (error.message === "Network Error") {
      return "خطأ في الاتصال. تحقق من اتصالك بالإنترنت.";
    }
    if (error.message.includes("timeout")) {
      return "انتهت مهلة الانتظار. حاول مرة أخرى.";
    }
    return error.message;
  }

  // Fallback for unknown errors
  return "حدث خطأ. يرجى المحاولة مرة أخرى.";
}

/**
 * HTTP Status Code error messages (fallback)
 */
const statusCodeMessages: Record<number, string> = {
  400: "طلب غير صحيح",
  401: "جلسة منتهية. يرجى تسجيل الدخول مرة أخرى.",
  403: "لا تملك صلاحيات كافية",
  404: "الموارد المطلوبة غير موجودة",
  409: "هناك تضارب في البيانات. يرجى التحقق والمحاولة مرة أخرى.",
  422: "بيانات غير صحيحة",
  429: "عدد محاولات كثيرة. حاول لاحقاً.",
  500: "خطأ في الخادم. حاول لاحقاً.",
  502: "خطأ في الخادم. حاول لاحقاً.",
  503: "الخدمة غير متاحة حالياً.",
  504: "انتهت مهلة انتظار الخادم.",
};

/**
 * Get error message with fallback to status code message
 */
export function getErrorMessage(error: any): string {
  const extractedMessage = extractErrorMessage(error);

  // If we got a meaningful message, return it
  if (
    extractedMessage &&
    !extractedMessage.includes("Error") &&
    !extractedMessage.includes("error")
  ) {
    return extractedMessage;
  }

  // Fallback to status code message
  const statusCode = error.response?.status;
  if (statusCode && statusCodeMessages[statusCode]) {
    return statusCodeMessages[statusCode];
  }

  return extractedMessage || "حدث خطأ. يرجى المحاولة مرة أخرى.";
}

/** Pulls a human-readable message out of a backend error body, if any. */
function extractServerMessage(data: any): string | null {
  if (!data) return null;
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  if (data.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)[0];
    if (typeof firstError === "string") return firstError;
  }
  return null;
}

export type AuthErrorContext = "login" | "register" | "otp";

/**
 * Localized, user-facing message for login/register/OTP failures.
 *
 * Unlike the generic getErrorMessage, this maps the statuses that have one
 * unambiguous meaning in an auth flow (401 on login = wrong credentials,
 * 409 on register = phone already taken) to fixed translated strings, so the
 * user always sees a clear, actionable message in their own language — never
 * a raw Axios/technical error.
 */
export function getAuthErrorMessage(
  error: any,
  context: AuthErrorContext,
): string {
  const status: number | undefined = error?.response?.status;

  // No HTTP response → connectivity problem, not a credentials problem.
  if (!error?.response) {
    const msg = typeof error?.message === "string" ? error.message : "";
    if (error?.code === "ECONNABORTED" || msg.includes("timeout")) {
      return i18n.t("errors.api.timeout");
    }
    return i18n.t("errors.api.network");
  }

  if (context === "login" && (status === 400 || status === 401)) {
    return i18n.t("auth.invalidCredentials");
  }
  if (context === "register" && status === 409) {
    return i18n.t("auth.phoneExists");
  }
  if (status === 429) {
    return i18n.t("errors.api.tooMany");
  }
  if (status != null && status >= 500) {
    return i18n.t("errors.api.server");
  }

  const serverMessage = extractServerMessage(error.response?.data);
  if (serverMessage) return serverMessage;

  return i18n.t("errors.api.generic");
}
