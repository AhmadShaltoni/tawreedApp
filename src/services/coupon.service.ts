import { API_ENDPOINTS } from "@/src/constants/api";
import type {
    CouponConfirmPayload,
    CouponConfirmResponse,
    CouponValidatePayload,
    CouponValidateResponse,
} from "@/src/types";
import apiClient from "./api";

export const couponService = {
  validateCoupon: async (
    payload: CouponValidatePayload,
  ): Promise<CouponValidateResponse> => {
    const { data } = await apiClient.post<CouponValidateResponse>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      payload,
    );
    return data;
  },

  confirmCoupon: async (
    payload: CouponConfirmPayload,
  ): Promise<CouponConfirmResponse> => {
    const { data } = await apiClient.post<CouponConfirmResponse>(
      API_ENDPOINTS.COUPONS.CONFIRM,
      payload,
    );
    return data;
  },
};
