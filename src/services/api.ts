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

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("📤 HTTP Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
      data: config.data,
    });
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    console.log("📥 HTTP Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const logError = status == null || status >= 500;
    const logPayload = {
      status: error.response?.status,
      url: error.response?.config?.url,
      data: error.response?.data,
      message: error.message,
    };

    if (logError) {
      console.error("📥 HTTP Error:", logPayload);
    } else {
      console.warn("📥 HTTP Error:", logPayload);
    }

    if (status === 401) {
      removeToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
