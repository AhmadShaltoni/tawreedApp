import { API_ENDPOINTS } from "@/src/constants/api";
import type {
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
};
