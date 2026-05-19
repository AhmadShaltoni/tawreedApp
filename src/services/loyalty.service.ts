/**
 * Loyalty Service
 * API calls for loyalty & rewards system
 * Follows existing service pattern (auth.service.ts, product.service.ts)
 */

import { API_ENDPOINTS } from "@/src/constants/api";
import type {
  ApplyReferralPayload,
  ApplyReferralResponse,
  CampaignsResponse,
  CouponsResponse,
  LoyaltyBalanceResponse,
  RedeemRewardPayload,
  RedeemRewardResponse,
  ReferralResponse,
  RewardsResponse,
  TransactionsResponse,
  ValidateCouponPayload,
  ValidateCouponResponse,
} from "@/src/types/loyalty";
import apiClient from "./api";

class LoyaltyService {
  /**
   * Get user loyalty balance and recent transactions
   */
  async getBalance(): Promise<LoyaltyBalanceResponse> {
    const response = await apiClient.get<LoyaltyBalanceResponse>(
      API_ENDPOINTS.LOYALTY.BALANCE,
    );
    return response.data;
  }

  /**
   * Get paginated transaction history
   */
  async getTransactions(
    page: number = 1,
    limit: number = 20,
  ): Promise<TransactionsResponse> {
    const response = await apiClient.get<TransactionsResponse>(
      API_ENDPOINTS.LOYALTY.TRANSACTIONS,
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  /**
   * Get rewards catalog
   */
  async getRewards(): Promise<RewardsResponse> {
    const response = await apiClient.get<RewardsResponse>(
      API_ENDPOINTS.LOYALTY.REWARDS,
    );
    return response.data;
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    payload: RedeemRewardPayload,
  ): Promise<RedeemRewardResponse> {
    const response = await apiClient.post<RedeemRewardResponse>(
      API_ENDPOINTS.LOYALTY.REDEEM,
      payload,
    );
    return response.data;
  }

  /**
   * Get user's coupons (active, used, expired)
   */
  async getCoupons(): Promise<CouponsResponse> {
    const response = await apiClient.get<CouponsResponse>(
      API_ENDPOINTS.LOYALTY.COUPONS,
    );
    return response.data;
  }

  /**
   * Validate a coupon at checkout
   */
  async validateCoupon(
    payload: ValidateCouponPayload,
  ): Promise<ValidateCouponResponse> {
    const response = await apiClient.post<ValidateCouponResponse>(
      API_ENDPOINTS.LOYALTY.VALIDATE_COUPON,
      payload,
    );
    return response.data;
  }

  /**
   * Get active campaigns and user progress
   */
  async getCampaigns(): Promise<CampaignsResponse> {
    const response = await apiClient.get<CampaignsResponse>(
      API_ENDPOINTS.LOYALTY.CAMPAIGNS,
    );
    return response.data;
  }

  /**
   * Get referral information
   */
  async getReferral(): Promise<ReferralResponse> {
    const response = await apiClient.get<ReferralResponse>(
      API_ENDPOINTS.LOYALTY.REFERRAL,
    );
    return response.data;
  }

  /**
   * Apply a referral code during signup
   */
  async applyReferralCode(
    payload: ApplyReferralPayload,
  ): Promise<ApplyReferralResponse> {
    const response = await apiClient.post<ApplyReferralResponse>(
      API_ENDPOINTS.LOYALTY.REFERRAL_APPLY,
      payload,
    );
    return response.data;
  }
}

export const loyaltyService = new LoyaltyService();
