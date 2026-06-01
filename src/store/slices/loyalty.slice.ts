/**
 * Loyalty Redux Slice
 * State management for loyalty & rewards system
 */

import { loyaltyService } from "@/src/services/loyalty.service";
import type {
    ApplyReferralPayload,
    Campaign,
    Coupon,
    LoyaltyBalance,
    LoyaltyTransaction,
    PointsEarnedAnimation,
    RedeemRewardPayload,
    RedemptionState,
    ReferralInfo,
    Reward,
    ValidateCouponPayload,
} from "@/src/types/loyalty";
import { RewardRarity } from "@/src/types/loyalty"; // Regular import for enum
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// ============================================
// State Interface
// ============================================

interface LoyaltyState {
  // Balance & overall info
  balance: LoyaltyBalance | null;
  balanceLoading: boolean;

  // Transactions (paginated)
  transactions: {
    items: LoyaltyTransaction[];
    page: number;
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
  };

  // Rewards catalog
  rewards: {
    items: Reward[];
    loading: boolean;
  };

  // User's coupons
  coupons: {
    items: Coupon[];
    loading: boolean;
  };

  // Campaigns & progress
  campaigns: {
    items: Campaign[];
    loading: boolean;
  };

  // Referral info
  referral: {
    info: ReferralInfo | null;
    loading: boolean;
  };

  // Redemption state
  redemption: RedemptionState;

  // Points earned animation trigger
  pointsEarned: PointsEarnedAnimation;

  // Global loading & error
  loading: boolean;
  error: string | null;
}

const initialState: LoyaltyState = {
  balance: null,
  balanceLoading: false,

  transactions: {
    items: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
  },

  rewards: {
    items: [],
    loading: false,
  },

  coupons: {
    items: [],
    loading: false,
  },

  campaigns: {
    items: [],
    loading: false,
  },

  referral: {
    info: null,
    loading: false,
  },

  redemption: {
    loading: false,
    success: false,
    error: null,
    couponCode: null,
  },

  pointsEarned: {
    amount: 0,
    visible: false,
  },

  loading: false,
  error: null,
};

// ============================================
// Async Thunks
// ============================================

/**
 * Fetch user loyalty balance
 */
export const fetchBalance = createAsyncThunk(
  "loyalty/fetchBalance",
  async (_, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.getBalance();
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch transaction history (paginated)
 */
export const fetchTransactions = createAsyncThunk(
  "loyalty/fetchTransactions",
  async (
    { page = 1, limit = 20 }: { page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const data = await loyaltyService.getTransactions(page, limit);
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch rewards catalog
 */
export const fetchRewards = createAsyncThunk(
  "loyalty/fetchRewards",
  async (_, { rejectWithValue, getState }) => {
    try {
      const data = await loyaltyService.getRewards();

      // Enhance rewards with UI state (affordable/locked)
      const state = getState() as { loyalty: LoyaltyState };
      const currentBalance = state.loyalty.balance?.currentBalance ?? 0;

      const enhancedRewards = data.rewards.map((reward) => ({
        ...reward,
        isAffordable: currentBalance >= reward.pointsCost,
        isLocked: !reward.isActive || currentBalance < reward.pointsCost,
        // Map backend type to rarity for visual treatment
        rarity: mapRewardTypeToRarity(reward.type),
      }));

      return { rewards: enhancedRewards };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Redeem a reward
 * Backend returns { success: true, couponCode: string }
 * After success, we refresh balance, coupons, and transactions
 */
export const redeemReward = createAsyncThunk(
  "loyalty/redeemReward",
  async (payload: RedeemRewardPayload, { rejectWithValue, dispatch }) => {
    try {
      const data = await loyaltyService.redeemReward(payload);
      // Refresh related data after successful redemption
      dispatch(fetchBalance());
      dispatch(fetchCoupons());
      dispatch(fetchTransactions({ page: 1 }));
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch user coupons
 */
export const fetchCoupons = createAsyncThunk(
  "loyalty/fetchCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.getCoupons();
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Validate a coupon at checkout
 */
export const validateCoupon = createAsyncThunk(
  "loyalty/validateCoupon",
  async (payload: ValidateCouponPayload, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.validateCoupon(payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch campaigns and progress
 */
export const fetchCampaigns = createAsyncThunk(
  "loyalty/fetchCampaigns",
  async (_, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.getCampaigns();

      // Enhance campaigns with UI state
      const enhancedCampaigns = data.campaigns.map((campaign) => {
        const progressPct = campaign.progress
          ? (campaign.progress.currentValue / campaign.targetValue) * 100
          : 0;

        return {
          ...campaign,
          progressPercentage: Math.min(progressPct, 100),
          isNearCompletion: progressPct >= 70,
          remainingAmount: Math.max(
            0,
            campaign.targetValue - (campaign.progress?.currentValue ?? 0),
          ),
        };
      });

      return { campaigns: enhancedCampaigns };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch referral info
 */
export const fetchReferral = createAsyncThunk(
  "loyalty/fetchReferral",
  async (_, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.getReferral();
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Apply referral code during signup
 */
export const applyReferralCode = createAsyncThunk(
  "loyalty/applyReferralCode",
  async (payload: ApplyReferralPayload, { rejectWithValue }) => {
    try {
      const data = await loyaltyService.applyReferralCode(payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ============================================
// Helper Functions
// ============================================

/**
 * Map reward type to visual rarity
 * Frontend-first rarity system for visual treatment
 */
function mapRewardTypeToRarity(type: string): RewardRarity {
  const rarityMap: Record<string, RewardRarity> = {
    FIXED_DISCOUNT: RewardRarity.COMMON,
    PERCENTAGE_DISCOUNT: RewardRarity.RARE,
    FREE_DELIVERY: RewardRarity.EPIC,
    CUSTOM: RewardRarity.LEGENDARY,
  };

  return rarityMap[type] ?? RewardRarity.COMMON;
}

// ============================================
// Slice
// ============================================

const loyaltySlice = createSlice({
  name: "loyalty",
  initialState,
  reducers: {
    /**
     * Clear error state
     */
    clearError(state) {
      state.error = null;
      state.redemption.error = null;
    },

    /**
     * Trigger points earned animation
     */
    showPointsEarned(
      state,
      action: PayloadAction<{ amount: number; sourceY?: number }>,
    ) {
      state.pointsEarned = {
        amount: action.payload.amount,
        visible: true,
        sourceY: action.payload.sourceY,
      };
    },

    /**
     * Hide points earned animation
     */
    hidePointsEarned(state) {
      state.pointsEarned.visible = false;
    },

    /**
     * Reset redemption state
     */
    resetRedemption(state) {
      state.redemption = {
        loading: false,
        success: false,
        error: null,
        couponCode: null,
      };
    },
  },
  extraReducers: (builder) => {
    // ========================================
    // Fetch Balance
    // ========================================
    builder
      .addCase(fetchBalance.pending, (state) => {
        state.balanceLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.error = action.payload as string;
      });

    // ========================================
    // Fetch Transactions
    // ========================================
    builder
      .addCase(fetchTransactions.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        if (page === 1) {
          state.transactions.loading = true;
        } else {
          state.transactions.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        const { transactions, pagination } = action.payload;
        const page = action.meta.arg?.page ?? 1;

        if (page === 1) {
          state.transactions.items = transactions;
          state.transactions.loading = false;
        } else {
          state.transactions.items.push(...transactions);
          state.transactions.loadingMore = false;
        }

        state.transactions.page = pagination.page;
        state.transactions.hasMore = pagination.hasMore;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.transactions.loading = false;
        state.transactions.loadingMore = false;
        state.error = action.payload as string;
      });

    // ========================================
    // Fetch Rewards
    // ========================================
    builder
      .addCase(fetchRewards.pending, (state) => {
        state.rewards.loading = true;
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action) => {
        state.rewards.loading = false;
        state.rewards.items = action.payload.rewards;
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.rewards.loading = false;
        state.error = action.payload as string;
      });

    // ========================================
    // Redeem Reward
    // ========================================
    builder
      .addCase(redeemReward.pending, (state) => {
        state.redemption.loading = true;
        state.redemption.error = null;
        state.redemption.success = false;
      })
      .addCase(redeemReward.fulfilled, (state, action) => {
        state.redemption.loading = false;
        state.redemption.success = true;
        state.redemption.couponCode = action.payload.couponCode;
      })
      .addCase(redeemReward.rejected, (state, action) => {
        state.redemption.loading = false;
        state.redemption.success = false;
        state.redemption.error = action.payload as string;
      });

    // ========================================
    // Fetch Coupons
    // ========================================
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.coupons.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.coupons.loading = false;
        state.coupons.items = action.payload.coupons;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.coupons.loading = false;
        state.error = action.payload as string;
      });

    // ========================================
    // Fetch Campaigns
    // ========================================
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.campaigns.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaigns.loading = false;
        state.campaigns.items = action.payload.campaigns;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.campaigns.loading = false;
        state.error = action.payload as string;
      });

    // ========================================
    // Fetch Referral
    // ========================================
    builder
      .addCase(fetchReferral.pending, (state) => {
        state.referral.loading = true;
        state.error = null;
      })
      .addCase(fetchReferral.fulfilled, (state, action) => {
        state.referral.loading = false;
        state.referral.info = action.payload;
      })
      .addCase(fetchReferral.rejected, (state, action) => {
        state.referral.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  showPointsEarned,
  hidePointsEarned,
  resetRedemption,
} = loyaltySlice.actions;

export default loyaltySlice.reducer;
