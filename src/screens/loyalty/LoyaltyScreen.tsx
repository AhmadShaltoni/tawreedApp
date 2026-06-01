/**
 * LoyaltyScreen - Production Loyalty Dashboard
 * Displays: Balance, Rewards, Coupons, Referral, Transactions, Campaigns
 * All data is fetched from the backend — no hardcoded values.
 */

import PointsBalanceHero from "@/src/components/loyalty/PointsBalanceHero";
import AnimatedProgressBar from "@/src/components/loyalty/AnimatedProgressBar";
import EmptyState from "@/src/components/ui/EmptyState";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { LoyaltyShadows, RarityColors } from "@/src/constants/loyaltyTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  fetchBalance,
  fetchRewards,
  fetchCoupons,
  fetchCampaigns,
  fetchReferral,
  fetchTransactions,
  redeemReward,
  resetRedemption,
} from "@/src/store/slices/loyalty.slice";
import type {
  Campaign,
  Coupon,
  LoyaltyTransaction,
  Reward,
} from "@/src/types/loyalty";
import {
  CouponStatus,
  RewardType,
  TransactionType,
} from "@/src/types/loyalty";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoyaltyScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";

  const {
    balance,
    balanceLoading,
    rewards,
    coupons,
    campaigns,
    referral,
    transactions,
    redemption,
    error,
  } = useAppSelector((state) => state.loyalty);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"rewards" | "coupons" | "campaigns" | "referral" | "transactions">("rewards");

  // Initial data fetch
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = useCallback(() => {
    dispatch(fetchBalance());
    dispatch(fetchRewards());
    dispatch(fetchCoupons());
    dispatch(fetchCampaigns());
    dispatch(fetchReferral());
    dispatch(fetchTransactions({ page: 1 }));
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    loadAllData();
    // Short delay to show refresh indicator
    setTimeout(() => setRefreshing(false), 1000);
  }, [loadAllData]);

  // ========================================
  // Redeem Flow
  // ========================================
  const handleRedeem = useCallback(
    (reward: Reward) => {
      if (!balance || balance.currentBalance < reward.pointsCost) {
        Alert.alert(
          t("loyalty.insufficientPoints"),
          t("loyalty.needMorePoints", {
            points: reward.pointsCost - (balance?.currentBalance ?? 0),
          }),
        );
        return;
      }

      const rewardName = isArabic
        ? (reward.nameAr ?? reward.name)
        : (reward.nameEn ?? reward.name);

      Alert.alert(
        t("loyalty.redeemConfirmTitle"),
        t("loyalty.redeemConfirmMessage", {
          points: reward.pointsCost,
          reward: rewardName,
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("loyalty.redeem"),
            onPress: () => dispatch(redeemReward({ rewardId: reward.id })),
          },
        ],
      );
    },
    [balance, dispatch, t, isArabic],
  );

  // Handle redemption success modal dismiss
  const handleDismissRedemption = useCallback(() => {
    dispatch(resetRedemption());
  }, [dispatch]);

  const handleCopyCode = useCallback(async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t("loyalty.codeCopied"));
  }, [t]);

  // ========================================
  // Referral Share
  // ========================================
  const handleShare = useCallback(async () => {
    if (!referral.info) return;
    try {
      await Share.share({
        message: referral.info.referralLink,
      });
    } catch {
      // User cancelled
    }
  }, [referral.info]);

  // ========================================
  // Load More Transactions
  // ========================================
  const handleLoadMoreTransactions = useCallback(() => {
    if (transactions.hasMore && !transactions.loadingMore) {
      dispatch(fetchTransactions({ page: transactions.page + 1 }));
    }
  }, [dispatch, transactions]);

  // ========================================
  // Helpers
  // ========================================
  const getTransactionIcon = (type: TransactionType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case TransactionType.EARN_ORDER:
        return "cart-outline";
      case TransactionType.EARN_WELCOME:
        return "gift-outline";
      case TransactionType.EARN_REFERRAL_INVITER:
      case TransactionType.EARN_REFERRAL_INVITEE:
        return "people-outline";
      case TransactionType.EARN_CAMPAIGN:
        return "ribbon-outline";
      case TransactionType.REDEEM:
        return "pricetag-outline";
      case TransactionType.EXPIRED:
        return "time-outline";
      default:
        return "swap-horizontal-outline";
    }
  };

  const getTransactionLabel = (type: TransactionType): string => {
    const labels: Record<TransactionType, string> = {
      [TransactionType.EARN_ORDER]: t("loyalty.orderEarned"),
      [TransactionType.EARN_WELCOME]: t("loyalty.welcomeBonus"),
      [TransactionType.EARN_REFERRAL_INVITER]: t("loyalty.referralBonus"),
      [TransactionType.EARN_REFERRAL_INVITEE]: t("loyalty.referralBonus"),
      [TransactionType.EARN_CAMPAIGN]: t("loyalty.campaignBonus"),
      [TransactionType.REDEEM]: t("loyalty.redeemed"),
      [TransactionType.MANUAL_ADD]: t("loyalty.earnedPoints"),
      [TransactionType.MANUAL_REMOVE]: t("loyalty.manualAdjustment"),
      [TransactionType.EXPIRED]: t("loyalty.pointsExpired"),
    };
    return labels[type] ?? type;
  };

  const getCouponStatusColor = (status: CouponStatus) => {
    switch (status) {
      case CouponStatus.ACTIVE:
        return Colors.success;
      case CouponStatus.USED:
        return Colors.textSecondary;
      case CouponStatus.EXPIRED:
        return Colors.error;
    }
  };

  const getCouponStatusLabel = (status: CouponStatus) => {
    switch (status) {
      case CouponStatus.ACTIVE:
        return t("loyalty.activeCoupons");
      case CouponStatus.USED:
        return t("loyalty.usedOn");
      case CouponStatus.EXPIRED:
        return t("loyalty.expiredOn");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(isArabic ? "ar-JO" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getRewardTypeLabel = (type: RewardType) => {
    switch (type) {
      case RewardType.FIXED_DISCOUNT:
        return t("loyalty.discount");
      case RewardType.PERCENTAGE_DISCOUNT:
        return t("loyalty.discount");
      case RewardType.FREE_DELIVERY:
        return t("loyalty.rewards");
      case RewardType.CUSTOM:
        return t("loyalty.rewards");
    }
  };

  // ========================================
  // Global loading state for first load
  // ========================================
  const isFirstLoad =
    balanceLoading && !balance && rewards.items.length === 0;

  if (isFirstLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ========================================
  // Render
  // ========================================
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ========================================
            Section 1: Balance Hero
            ======================================== */}
        {balance ? (
          <Animated.View entering={FadeInDown.delay(100)}>
            <PointsBalanceHero
              currentBalance={balance.currentBalance}
              totalEarned={balance.totalEarned}
              totalRedeemed={balance.totalRedeemed}
            />
          </Animated.View>
        ) : balanceLoading ? (
          <View style={styles.balanceSkeleton}>
            <ActivityIndicator color={Colors.white} />
          </View>
        ) : error ? (
          <Pressable style={styles.errorCard} onPress={() => dispatch(fetchBalance())}>
            <Ionicons name="refresh-outline" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{t("common.retry")}</Text>
          </Pressable>
        ) : null}

        {/* ========================================
            Tab Navigation
            ======================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {([
            { key: "rewards" as const, label: t("loyalty.rewards"), icon: "gift-outline" as const },
            { key: "coupons" as const, label: t("loyalty.coupons"), icon: "pricetag-outline" as const },
            { key: "campaigns" as const, label: t("loyalty.campaigns"), icon: "ribbon-outline" as const },
            { key: "referral" as const, label: t("loyalty.referral"), icon: "people-outline" as const },
            { key: "transactions" as const, label: t("loyalty.transactions"), icon: "time-outline" as const },
          ]).map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ========================================
            Section 2: Rewards
            ======================================== */}
        {activeTab === "rewards" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {rewards.loading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : rewards.items.length === 0 ? (
              <EmptyState
                icon="gift-outline"
                title={t("loyalty.noTransactions")}
                message={t("loyalty.noTransactionsMessage")}
              />
            ) : (
              <View style={styles.rewardsGrid}>
                {rewards.items.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    currentBalance={balance?.currentBalance ?? 0}
                    onRedeem={() => handleRedeem(reward)}
                    isArabic={isArabic}
                    t={t}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ========================================
            Section 3: Coupons
            ======================================== */}
        {activeTab === "coupons" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {coupons.loading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : coupons.items.length === 0 ? (
              <EmptyState
                icon="pricetag-outline"
                title={t("loyalty.noCoupons")}
                message={t("loyalty.noActiveCouponsMessage")}
              />
            ) : (
              <View style={styles.listSection}>
                {coupons.items.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onCopy={() => handleCopyCode(coupon.code)}
                    formatDate={formatDate}
                    getCouponStatusColor={getCouponStatusColor}
                    isArabic={isArabic}
                    t={t}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ========================================
            Section 4: Campaigns
            ======================================== */}
        {activeTab === "campaigns" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {campaigns.loading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : campaigns.items.length === 0 ? (
              <EmptyState
                icon="ribbon-outline"
                title={t("loyalty.noCampaigns")}
                message={t("loyalty.noCampaignsMessage")}
              />
            ) : (
              <View style={styles.listSection}>
                {campaigns.items.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    isArabic={isArabic}
                    t={t}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ========================================
            Section 5: Referral
            ======================================== */}
        {activeTab === "referral" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {referral.loading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : !referral.info ? (
              <EmptyState
                icon="people-outline"
                title={t("loyalty.noInvites")}
                message={t("loyalty.noInvitesMessage")}
                actionLabel={t("common.retry")}
                onAction={() => dispatch(fetchReferral())}
              />
            ) : (
              <ReferralSection
                info={referral.info}
                onShare={handleShare}
                onCopyCode={() => handleCopyCode(referral.info!.referralCode)}
                onCopyLink={() => handleCopyCode(referral.info!.referralLink)}
                isArabic={isArabic}
                t={t}
              />
            )}
          </Animated.View>
        )}

        {/* ========================================
            Section 6: Transactions
            ======================================== */}
        {activeTab === "transactions" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {transactions.loading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : transactions.items.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title={t("loyalty.noTransactions")}
                message={t("loyalty.noTransactionsMessage")}
              />
            ) : (
              <View style={styles.listSection}>
                {transactions.items.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    getIcon={getTransactionIcon}
                    getLabel={getTransactionLabel}
                    formatDate={formatDate}
                    isArabic={isArabic}
                    t={t}
                  />
                ))}
                {transactions.hasMore && (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreTransactions}
                    disabled={transactions.loadingMore}
                  >
                    {transactions.loadingMore ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.loadMoreText}>
                        {t("loyalty.viewAll")}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* ========================================
          Redemption Success Modal
          ======================================== */}
      <Modal
        visible={redemption.success}
        transparent
        animationType="fade"
        onRequestClose={handleDismissRedemption}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>{t("loyalty.redeemSuccess")}</Text>
            {redemption.couponCode && (
              <View style={styles.couponCodeBox}>
                <Text style={styles.couponCodeLabel}>{t("loyalty.couponCode")}</Text>
                <Text style={styles.couponCodeValue}>{redemption.couponCode}</Text>
                <Pressable
                  style={styles.copyButton}
                  onPress={() => handleCopyCode(redemption.couponCode!)}
                >
                  <Ionicons name="copy-outline" size={18} color={Colors.white} />
                  <Text style={styles.copyButtonText}>{t("loyalty.copyCode")}</Text>
                </Pressable>
              </View>
            )}
            <Text style={styles.modalHint}>{t("loyalty.useAtCheckout")}</Text>
            <Pressable style={styles.modalDismiss} onPress={handleDismissRedemption}>
              <Text style={styles.modalDismissText}>{t("common.confirm")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Redemption Error */}
      {redemption.error && (
        <Modal
          visible={!!redemption.error}
          transparent
          animationType="fade"
          onRequestClose={handleDismissRedemption}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.modalTitle}>{t("loyalty.redeemError")}</Text>
              <Text style={styles.modalHint}>{redemption.error}</Text>
              <Pressable style={styles.modalDismiss} onPress={handleDismissRedemption}>
                <Text style={styles.modalDismissText}>{t("common.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ============================================
// Sub-Components
// ============================================

function RewardCard({
  reward,
  currentBalance,
  onRedeem,
  isArabic,
  t,
}: {
  reward: Reward;
  currentBalance: number;
  onRedeem: () => void;
  isArabic: boolean;
  t: (key: string, opts?: any) => string;
}) {
  const name = isArabic ? (reward.nameAr ?? reward.name) : (reward.nameEn ?? reward.name);
  const description = isArabic
    ? (reward.descriptionAr ?? reward.description)
    : (reward.descriptionEn ?? reward.description);
  const canAfford = currentBalance >= reward.pointsCost;
  const rarityColor = RarityColors[reward.rarity]?.primary ?? Colors.textSecondary;

  return (
    <View style={[styles.rewardCard, !canAfford && styles.rewardCardLocked]}>
      <View style={[styles.rarityBadge, { backgroundColor: rarityColor + "15" }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>
          {t(`loyalty.${reward.rarity?.toLowerCase() ?? "common"}`)}
        </Text>
      </View>
      <Text style={styles.rewardName} numberOfLines={2}>{name}</Text>
      <Text style={styles.rewardDescription} numberOfLines={2}>{description}</Text>

      {/* Reward value */}
      {reward.discountValue != null && (
        <Text style={styles.rewardValue}>
          {reward.discountValue} {t("common.currency")} {t("loyalty.discount")}
        </Text>
      )}
      {reward.discountPercentage != null && (
        <Text style={styles.rewardValue}>
          {reward.discountPercentage}% {t("loyalty.discount")}
        </Text>
      )}

      <View style={styles.rewardFooter}>
        <Text style={[styles.pointsCost, !canAfford && styles.pointsCostLocked]}>
          {t("loyalty.pointsCost", { points: reward.pointsCost })}
        </Text>
        <Pressable
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
          onPress={onRedeem}
          disabled={!canAfford || !reward.isActive}
        >
          <Text style={[styles.redeemButtonText, !canAfford && styles.redeemButtonTextDisabled]}>
            {canAfford ? t("loyalty.redeem") : t("loyalty.insufficientPoints")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CouponCard({
  coupon,
  onCopy,
  formatDate,
  getCouponStatusColor,
  isArabic,
  t,
}: {
  coupon: Coupon;
  onCopy: () => void;
  formatDate: (d: string) => string;
  getCouponStatusColor: (s: CouponStatus) => string;
  isArabic: boolean;
  t: (key: string, opts?: any) => string;
}) {
  const statusColor = getCouponStatusColor(coupon.status);
  const rewardName = isArabic
    ? (coupon.rewardNameAr ?? coupon.rewardName)
    : (coupon.rewardNameEn ?? coupon.rewardName);

  return (
    <View style={styles.couponCard}>
      <View style={styles.couponHeader}>
        <View>
          <Text style={styles.couponRewardName}>{rewardName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {coupon.status}
            </Text>
          </View>
        </View>
        {coupon.status === CouponStatus.ACTIVE && (
          <Pressable style={styles.couponCopyBtn} onPress={onCopy}>
            <Ionicons name="copy-outline" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>

      <View style={styles.couponCodeRow}>
        <Ionicons name="pricetag" size={14} color={Colors.primary} />
        <Text style={styles.couponCodeText}>{coupon.code}</Text>
      </View>

      {/* Discount info */}
      {coupon.discountValue != null && (
        <Text style={styles.couponDiscount}>
          {coupon.discountValue} {t("common.currency")} {t("loyalty.discount")}
        </Text>
      )}
      {coupon.discountPercentage != null && (
        <Text style={styles.couponDiscount}>
          {coupon.discountPercentage}% {t("loyalty.discount")}
        </Text>
      )}

      {/* Dates */}
      {coupon.expiresAt && (
        <Text style={styles.couponExpiry}>
          {t("loyalty.validUntil")}: {formatDate(coupon.expiresAt)}
        </Text>
      )}
      {coupon.usedAt && (
        <Text style={styles.couponExpiry}>
          {t("loyalty.usedOn")}: {formatDate(coupon.usedAt)}
        </Text>
      )}
    </View>
  );
}

function CampaignCard({
  campaign,
  isArabic,
  t,
}: {
  campaign: Campaign;
  isArabic: boolean;
  t: (key: string, opts?: any) => string;
}) {
  const name = isArabic ? (campaign.nameAr ?? campaign.name) : (campaign.nameEn ?? campaign.name);
  const description = isArabic
    ? (campaign.descriptionAr ?? campaign.description)
    : (campaign.descriptionEn ?? campaign.description);
  const progress = campaign.progressPercentage ?? 0;
  const isCompleted = campaign.progress?.isCompleted;

  return (
    <View style={styles.campaignCard}>
      <View style={styles.campaignHeader}>
        <Ionicons
          name={isCompleted ? "checkmark-circle" : "ribbon-outline"}
          size={20}
          color={isCompleted ? Colors.success : Colors.primary}
        />
        <Text style={styles.campaignName}>{name}</Text>
      </View>
      <Text style={styles.campaignDescription}>{description}</Text>

      {/* Progress */}
      <View style={styles.campaignProgress}>
        <AnimatedProgressBar
          progress={progress}
          height={8}
          showPulse={!isCompleted}
        />
        <View style={styles.campaignProgressLabels}>
          <Text style={styles.campaignProgressText}>
            {Math.round(progress)}%
          </Text>
          <Text style={styles.campaignProgressText}>
            {campaign.progress?.currentValue ?? 0} / {campaign.targetValue}
          </Text>
        </View>
      </View>

      {/* Reward info */}
      <Text style={styles.campaignReward}>
        {t("loyalty.earnPoints", { points: campaign.rewardPoints })}
      </Text>

      {isCompleted && (
        <Text style={styles.campaignCompleted}>
          {t("loyalty.completed")} ✓
        </Text>
      )}
    </View>
  );
}

function ReferralSection({
  info,
  onShare,
  onCopyCode,
  onCopyLink,
  isArabic,
  t,
}: {
  info: { referralCode: string; referralLink: string; totalInvited: number; totalEarned: number };
  onShare: () => void;
  onCopyCode: () => void;
  onCopyLink: () => void;
  isArabic: boolean;
  t: (key: string, opts?: any) => string;
}) {
  return (
    <View style={styles.referralSection}>
      {/* Referral Code Card */}
      <View style={styles.referralCodeCard}>
        <Text style={styles.referralLabel}>{t("loyalty.yourReferralCode")}</Text>
        <Text style={styles.referralCode}>{info.referralCode}</Text>
        <View style={styles.referralActions}>
          <Pressable style={styles.referralBtn} onPress={onCopyCode}>
            <Ionicons name="copy-outline" size={18} color={Colors.white} />
            <Text style={styles.referralBtnText}>{t("loyalty.copyCode")}</Text>
          </Pressable>
          <Pressable style={[styles.referralBtn, styles.referralBtnSecondary]} onPress={onShare}>
            <Ionicons name="share-outline" size={18} color={Colors.primary} />
            <Text style={[styles.referralBtnText, styles.referralBtnTextSecondary]}>
              {t("loyalty.shareCode")}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Referral Stats */}
      <View style={styles.referralStats}>
        <View style={styles.referralStat}>
          <Text style={styles.referralStatValue}>{info.totalInvited}</Text>
          <Text style={styles.referralStatLabel}>{t("loyalty.totalInvited")}</Text>
        </View>
        <View style={styles.referralStatDivider} />
        <View style={styles.referralStat}>
          <Text style={styles.referralStatValue}>{info.totalEarned}</Text>
          <Text style={styles.referralStatLabel}>{t("loyalty.totalReferralEarned")}</Text>
        </View>
      </View>
    </View>
  );
}

function TransactionRow({
  transaction,
  getIcon,
  getLabel,
  formatDate,
  isArabic,
  t,
}: {
  transaction: LoyaltyTransaction;
  getIcon: (type: TransactionType) => keyof typeof Ionicons.glyphMap;
  getLabel: (type: TransactionType) => string;
  formatDate: (d: string) => string;
  isArabic: boolean;
  t: (key: string, opts?: any) => string;
}) {
  const isPositive = transaction.amount > 0;
  const description = isArabic
    ? (transaction.descriptionAr ?? transaction.description)
    : (transaction.descriptionEn ?? transaction.description);

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: isPositive ? Colors.success + "15" : Colors.error + "15" }]}>
        <Ionicons
          name={getIcon(transaction.type)}
          size={18}
          color={isPositive ? Colors.success : Colors.error}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionLabel}>{getLabel(transaction.type)}</Text>
        {description ? (
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
      </View>
      <Text style={[styles.transactionAmount, isPositive ? styles.amountPositive : styles.amountNegative]}>
        {isPositive ? "+" : ""}{transaction.amount}
      </Text>
    </View>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  // Balance skeleton
  balanceSkeleton: {
    height: 180,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Error card
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.error + "10",
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },

  // Tab bar
  tabBar: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tabBarContent: {
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },

  // Section loading
  sectionLoading: {
    paddingVertical: Spacing.xxxl * 2,
    alignItems: "center",
  },

  // Rewards grid
  rewardsGrid: {
    gap: Spacing.md,
  },
  rewardCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  rewardCardLocked: {
    opacity: 0.7,
  },
  rarityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  rarityText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rewardName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  rewardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  rewardValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  rewardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  pointsCost: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  pointsCostLocked: {
    color: Colors.textLight,
  },
  redeemButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  redeemButtonDisabled: {
    backgroundColor: Colors.border,
  },
  redeemButtonText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.white,
  },
  redeemButtonTextDisabled: {
    color: Colors.textLight,
  },

  // Coupons list
  listSection: {
    gap: Spacing.md,
  },
  couponCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  couponRewardName: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  couponCopyBtn: {
    padding: Spacing.sm,
  },
  couponCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryXLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  couponCodeText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  couponDiscount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  couponExpiry: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },

  // Campaigns
  campaignCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  campaignName: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  campaignDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  campaignProgress: {
    marginBottom: Spacing.sm,
  },
  campaignProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  campaignProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  campaignReward: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  campaignCompleted: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
    marginTop: Spacing.xs,
  },

  // Referral
  referralSection: {
    gap: Spacing.lg,
  },
  referralCodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
    ...Shadows.sm,
  },
  referralLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  referralCode: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  referralActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  referralBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  referralBtnSecondary: {
    backgroundColor: Colors.primaryXLight,
  },
  referralBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  referralBtnTextSecondary: {
    color: Colors.primary,
  },
  referralStats: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  referralStat: {
    flex: 1,
    alignItems: "center",
  },
  referralStatValue: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
  },
  referralStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  referralStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  // Transactions
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  transactionDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: FontSize.xxs,
    color: Colors.textLight,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FontSize.md,
    fontWeight: "700",
    marginLeft: Spacing.sm,
  },
  amountPositive: {
    color: Colors.success,
  },
  amountNegative: {
    color: Colors.error,
  },

  // Load more
  loadMoreButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  loadMoreText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalIconContainer: {
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  couponCodeBox: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  couponCodeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  couponCodeValue: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  copyButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  modalHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalDismiss: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    width: "100%",
    alignItems: "center",
  },
  modalDismissText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
});
