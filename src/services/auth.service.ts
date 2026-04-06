import { API_ENDPOINTS } from "@/src/constants/api";
import apiClient from "./api";

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  phone: string;
  storeName: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  phone: string;
  storeName: string;
  role: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload, // Sends: { phone, password }
    );
    return data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    // Add action: "register" and fixed role: "buyer" to payload
    const registerPayload = {
      action: "register",
      username: payload.username,
      phone: payload.phone,
      storeName: payload.storeName,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      role: "buyer",
    };

    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      registerPayload, // Sends: { action: "register", username, phone, storeName, password, confirmPassword, role: "buyer" }
    );
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    return data;
  },
};
