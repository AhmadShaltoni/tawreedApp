import { Platform } from "react-native";

const getDefaultApiUrl = () => {
  // Web (browser) runs on the same machine as the backend → use localhost
  if (Platform.OS === "web") return "http://localhost:3000";
  // Mobile device accesses backend over LAN IP
  // return "http://192.168.20.149:3000";
  return "http://192.168.100.15:3000";
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth",
    REGISTER: "/api/v1/auth",
    ME: "/api/v1/auth/me",
  },
  PRODUCTS: {
    LIST: "/api/v1/products",
    DETAIL: (id: string) => `/api/v1/products/${id}`,
    FEATURED: "/api/v1/products",
  },
  CATEGORIES: {
    LIST: "/api/v1/categories",
  },
  CART: {
    LIST: "/api/v1/cart",
    ADD: "/api/v1/cart",
    UPDATE: (id: string) => `/api/v1/cart/${id}`,
    REMOVE: (id: string) => `/api/v1/cart/${id}`,
  },
  ORDERS: {
    LIST: "/api/v1/orders",
    DETAIL: (id: string) => `/api/v1/orders/${id}`,
    CREATE: "/api/v1/orders",
    RECENT: "/api/v1/orders?limit=5&sort=recent",
  },
  NOTIFICATIONS: {
    LIST: "/api/v1/notifications",
    MARK_READ: (id: string) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: "/api/v1/notifications/read-all",
  },
  REGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
  UNREGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "tawreed_auth_token",
} as const;
