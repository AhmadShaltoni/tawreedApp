import { Config } from "@/src/config/env";

/**
 * API base URL is injected at build time from environment variables.
 * Loaded from:
 *   - .env.development (local development)
 *   - .env.production (production builds, EAS)
 *
 * If undefined, the app fails at startup with a clear error message.
 */
export const API_BASE_URL = Config.API_BASE_URL;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth",
    REGISTER: "/api/v1/auth",
    ME: "/api/v1/auth/me",
    OTP_SEND: "/api/v1/auth/send-otp",
    OTP_VERIFY: "/api/v1/auth/verify-otp",
    OTP_RESEND_SMS: "/api/v1/auth/resend-sms-otp",
    OTP_STATUS: "/api/v1/auth/otp-status",
  },
  PRODUCTS: {
    LIST: "/api/v1/products",
    DETAIL: (id: string) => `/api/v1/products/${id}`,
    FEATURED: "/api/v1/products",
  },
  CATEGORIES: {
    LIST: "/api/v1/categories",
  },
  BRANDS: {
    LIST: "/api/v1/brands",
    DETAIL: (slug: string) => `/api/v1/brands/${slug}`,
  },
  CART: {
    LIST: "/api/v1/cart",
    ADD: "/api/v1/cart",
    UPDATE: (id: string) => `/api/v1/cart/${id}`,
    REMOVE: (id: string) => `/api/v1/cart/${id}`,
    VALIDATE: "/api/v1/cart/validate",
  },
  ORDERS: {
    LIST: "/api/v1/orders",
    DETAIL: (id: string) => `/api/v1/orders/${id}`,
    CREATE: "/api/v1/orders",
    UPDATE: (id: string) => `/api/v1/orders/${id}`,
    RECENT: "/api/v1/orders?limit=5&sort=recent",
    EDIT_REQUEST: (id: string) => `/api/v1/orders/${id}/edit-request`,
  },
  NOTIFICATIONS: {
    LIST: "/api/v1/notifications",
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: "/api/v1/notifications/read-all",
  },
  NOTICES: {
    LIST: "/api/v1/notices",
  },
  MARKETING_SECTIONS: {
    LIST: "/api/v1/marketing-sections",
    DETAIL: (slug: string) => `/api/v1/marketing-sections/${slug}`,
  },
  COUPONS: {
    VALIDATE: "/api/v1/coupons/validate",
  },
  LOCATIONS: {
    CITIES: "/api/v1/locations/cities",
  },
  DELIVERY: {
    ZONES: "/api/v1/delivery/zones",
    FEE: "/api/v1/delivery/fee",
  },
  USER: {
    UPDATE_LOCATION: "/api/v1/user/location",
    DELETE_ACCOUNT: "/api/v1/user/account",
  },
  LOYALTY: {
    BALANCE: "/api/v1/loyalty/balance",
    TRANSACTIONS: "/api/v1/loyalty/transactions",
    REWARDS: "/api/v1/loyalty/rewards",
    REDEEM: "/api/v1/loyalty/rewards/redeem",
    COUPONS: "/api/v1/loyalty/coupons",
    VALIDATE_COUPON: "/api/v1/loyalty/coupons/validate",
    CAMPAIGNS: "/api/v1/loyalty/campaigns",
    REFERRAL: "/api/v1/loyalty/referral",
    REFERRAL_APPLY: "/api/v1/loyalty/referral/apply",
  },
  APP_VERSION: {
    CHECK: "/api/v1/app-version",
  },
  ADMIN: {
    ORDERS: "/api/v1/admin/orders",
    ORDER_DETAIL: (id: string) => `/api/v1/admin/orders/${id}`,
    ORDER_STATUS: (id: string) => `/api/v1/admin/orders/${id}`,
    EDIT_REQUEST_RESOLVE: (id: string) => `/api/v1/admin/edit-requests/${id}`,
  },
  REGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
  UNREGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "tawreed_auth_token",
} as const;
