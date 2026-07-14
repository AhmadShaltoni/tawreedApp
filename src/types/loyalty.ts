/**
 * Loyalty System Type Definitions
 * All interfaces for the loyalty & rewards experience
 */

// ============================================
// Enums
// ============================================

export enum TransactionType {
  EARN_ORDER = "EARN_ORDER",
  EARN_WELCOME = "EARN_WELCOME",
  EARN_REFERRAL_INVITER = "EARN_REFERRAL_INVITER",
  EARN_REFERRAL_INVITEE = "EARN_REFERRAL_INVITEE",
  EARN_CAMPAIGN = "EARN_CAMPAIGN",
  REDEEM = "REDEEM",
  MANUAL_ADD = "MANUAL_ADD",
  MANUAL_REMOVE = "MANUAL_REMOVE",
  EXPIRED = "EXPIRED",
}

export enum RewardType {
  FIXED_DISCOUNT = "FIXED_DISCOUNT",
  PERCENTAGE_DISCOUNT = "PERCENTAGE_DISCOUNT",
  FREE_DELIVERY = "FREE_DELIVERY",
  FREE_PRODUCT = "FREE_PRODUCT",
  CUSTOM = "CUSTOM",
}

export enum RewardRarity {
  COMMON = "COMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
}

export enum CouponStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
}

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

// ============================================
// Core Interfaces
// ============================================

export interface LoyaltyEarnConfig {
  isEnabled: boolean;
  pointsPerJod: number;
  calculationBase: number;
  minOrderValue: number | null;
  excludeDeliveryFees: boolean;
  roundingMode: "FLOOR" | "CEIL" | "ROUND";
  earnTrigger: "ORDER_PLACED" | "DELIVERED";
}

export interface LoyaltyBalance {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  recentTransactions: LoyaltyTransaction[];
  /** Public earn settings — lets the app forecast points before checkout */
  earnConfig?: LoyaltyEarnConfig;
}

export interface LoyaltyTransaction {
  id: string;
  type: TransactionType;
  amount: number; // Positive for earn, negative for redeem
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  createdAt: string;
  relatedOrderId?: string;
  relatedRewardId?: string;
  relatedCampaignId?: string;
}

export interface Reward {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type: RewardType;
  rarity: RewardRarity; // Frontend rarity mapping
  pointsCost: number;
  discountValue?: number; // For FIXED_DISCOUNT
  discountPercentage?: number; // For PERCENTAGE_DISCOUNT
  maxDiscountAmount?: number; // For PERCENTAGE_DISCOUNT cap
  image?: string;
  isActive: boolean;
  expiryDays?: number; // Days until redeemed coupon expires
  minOrderAmount?: number; // Minimum order total to use coupon

  // Free product prize (type = FREE_PRODUCT)
  product?: {
    id: string;
    name: string;
    nameEn?: string | null;
    image?: string | null;
  } | null;

  // UI state helpers
  isAffordable?: boolean; // Frontend-computed: currentBalance >= pointsCost
  isLocked?: boolean; // Frontend: not affordable or not active
}

export interface Coupon {
  id: string;
  code: string;
  rewardId: string;
  rewardName: string;
  rewardNameAr?: string;
  rewardNameEn?: string;
  rewardType?: RewardType;
  status: CouponStatus;
  discountValue?: number;
  discountPercentage?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  redeemedAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedInOrderId?: string;
  freeProduct?: {
    productId?: string | null;
    name?: string | null;
    nameEn?: string | null;
    image?: string | null;
  } | null;
}

export interface Campaign {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type: "ORDER_COUNT" | "TOTAL_SPENT" | "PRODUCT_PURCHASE";
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  targetValue: number; // e.g., 5 orders, 500 JOD spent
  rewardPoints: number;

  // User progress
  progress?: CampaignProgress;

  // UI helpers
  progressPercentage?: number; // Frontend-computed
  isNearCompletion?: boolean; // Frontend: > 70%
  remainingAmount?: number; // Frontend: targetValue - currentValue
}

export interface CampaignProgress {
  campaignId: string;
  currentValue: number; // e.g., 3 orders, 350 JOD spent
  isCompleted: boolean;
  completedAt?: string;
  milestones?: CampaignMilestone[];
}

export interface CampaignMilestone {
  id: string;
  value: number; // e.g., 2 orders, 200 JOD
  points: number; // Points earned at this milestone
  reached: boolean;
  reachedAt?: string;
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalInvited: number;
  totalEarned: number;
  invitees?: ReferralInvitee[];
}

export interface ReferralInvitee {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  joinedAt: string;
  pointsEarned: number;
  status: "PENDING" | "COMPLETED"; // COMPLETED = they made first order
}

// ============================================
// API Response Shapes
// ============================================

export interface LoyaltyBalanceResponse {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  recentTransactions: LoyaltyTransaction[];
}

export interface TransactionsResponse {
  transactions: LoyaltyTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RewardsResponse {
  rewards: Reward[];
}

export interface CouponsResponse {
  coupons: Coupon[];
}

export interface CampaignsResponse {
  campaigns: Campaign[];
}

export interface ReferralResponse {
  referralCode: string;
  referralLink: string;
  totalInvited: number;
  totalEarned: number;
  invitees: ReferralInvitee[];
}

export interface RedeemRewardPayload {
  rewardId: string;
}

export interface RedeemRewardResponse {
  success: boolean;
  couponCode: string;
}

export interface ValidateCouponPayload {
  couponCode: string;
  orderTotal: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  finalTotal?: number;
  couponId?: string;
  rewardType?: RewardType;
  rewardName?: string;
  rewardNameEn?: string | null;
  freeDelivery?: boolean;
  freeProduct?: {
    productId?: string | null;
    name?: string | null;
    nameEn?: string | null;
    image?: string | null;
  } | null;
  error?: string;
}

export interface ApplyReferralPayload {
  referralCode: string;
}

export interface ApplyReferralResponse {
  success: boolean;
  message: string;
  pointsEarned?: number;
}

// ============================================
// UI State Helpers
// ============================================

export interface PointsEarnedAnimation {
  amount: number;
  visible: boolean;
  sourceY?: number; // Y position of source element (for animation origin)
}

export interface RedemptionState {
  loading: boolean;
  success: boolean;
  error: string | null;
  couponCode: string | null;
}

// ============================================
// Analytics Events
// ============================================

export interface LoyaltyAnalyticsEvent {
  event: string;
  params?: Record<string, any>;
  timestamp: string;
}

export type LoyaltyEventType =
  | "loyalty_dashboard_view"
  | "reward_card_tap"
  | "redemption_start"
  | "redemption_confirm"
  | "redemption_success"
  | "redemption_fail"
  | "campaign_progress_view"
  | "coupon_copy"
  | "coupon_use_at_checkout"
  | "referral_share"
  | "referral_code_copy"
  | "near_completion_impression"
  | "transaction_history_view"
  | "rewards_catalog_view";
