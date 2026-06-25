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
  verificationToken?: string;
}

export interface SendOtpPayload {
  phone: string;
  channel?: "whatsapp" | "sms";
}

export interface SendOtpResponse {
  success: boolean;
  channel: "whatsapp" | "sms";
  expiresIn: number;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface VerifyOtpResponse {
  verificationToken: string;
}

export interface ResendSmsOtpPayload {
  phone: string;
}

export interface OtpStatusResponse {
  canResendWhatsApp: boolean;
  canResendSms: boolean;
  whatsAppCooldown: number;
  smsCooldown: number;
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
  name?: string;
  email?: string;
  businessName?: string;
  role: string;
  cityId?: string | null;
  areaId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: { id: string; name: string; nameEn: string } | null;
  area?: { id: string; name: string; nameEn: string } | null;
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
      ...(payload.verificationToken && {
        verificationToken: payload.verificationToken,
      }),
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

  updateLocation: async (cityId: string, areaId?: string): Promise<User> => {
    const { data } = await apiClient.patch<User>(
      API_ENDPOINTS.USER.UPDATE_LOCATION,
      { cityId, areaId },
    );
    return data;
  },

  sendOtp: async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
    const { data } = await apiClient.post<SendOtpResponse>(
      API_ENDPOINTS.AUTH.OTP_SEND,
      payload,
    );
    return data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      API_ENDPOINTS.AUTH.OTP_VERIFY,
      payload,
    );
    return data;
  },

  resendSmsOtp: async (
    payload: ResendSmsOtpPayload,
  ): Promise<SendOtpResponse> => {
    const { data } = await apiClient.post<SendOtpResponse>(
      API_ENDPOINTS.AUTH.OTP_RESEND_SMS,
      payload,
    );
    return data;
  },

  getOtpStatus: async (phone: string): Promise<OtpStatusResponse> => {
    const { data } = await apiClient.get<OtpStatusResponse>(
      API_ENDPOINTS.AUTH.OTP_STATUS,
      { params: { phone } },
    );
    return data;
  },

  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(API_ENDPOINTS.USER.DELETE_ACCOUNT);
    return data;
  },
};
