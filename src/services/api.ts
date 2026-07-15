import { API_BASE_URL } from "@/src/constants/api";
import { getToken, removeToken } from "@/src/services/tokenStorage";
import axios from "axios";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Never let credentials, OTP codes, or JWTs reach the logs — device logs are
// readable by anyone with the phone attached to a debugger.
const SENSITIVE_KEYS = [
  "password",
  "confirmpassword",
  "token",
  "verificationtoken",
  "authorization",
  "code",
];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.includes(key.toLowerCase()) ? "***" : redact(val),
      ]),
    );
  }
  return value;
}

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log("📤 HTTP Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
        data: redact(config.data),
      });
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log("📥 HTTP Response:", {
        status: response.status,
        url: response.config.url,
        data: redact(response.data),
      });
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    if (__DEV__) {
      const logPayload = {
        status,
        url: error.response?.config?.url,
        data: redact(error.response?.data),
        message: error.message,
      };
      if (status == null || status >= 500) {
        console.error("📥 HTTP Error:", logPayload);
      } else {
        console.warn("📥 HTTP Error:", logPayload);
      }
    }

    if (status === 401) {
      removeToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
