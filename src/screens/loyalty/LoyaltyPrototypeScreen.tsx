/**
 * Loyalty Visual Prototype
 * Demonstrates the premium engagement experience
 * 
 * This screen showcases:
 * - Animated points counter
 * - Premium gradient hero card
 * - Progress bars with near-completion pulse
 * - Celebration animations
 * - Smooth micro-interactions
 * 
 * USAGE: Temporary prototype for visual testing
 */

import AnimatedProgressBar from "@/src/components/loyalty/AnimatedProgressBar";
import PointsBalanceHero from "@/src/components/loyalty/PointsBalanceHero";
import RewardRevealScreen from "@/src/components/loyalty/celebrations/RewardRevealScreen";
import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { useAppDispatch } from "@/src/store";
import {
  showPointsEarned,
  showRewardReveal,
} from "@/src/store/slices/loyalty.slice";
import { haptics } from "@/src/utils/haptics";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CouponStatus, RewardType } from "@/src/types/loyalty";

export default function LoyaltyPrototypeScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Demo state
  const [pointsBalance, setPointsBalance] = useState(1250);
  const [campaignProgress, setCampaignProgress] = useState(75);

  const handleAddPoints = () => {
    const newPoints = pointsBalance + 50;
    setPointsBalance(newPoints);
    
    // Trigger floating points animation
    dispatch(showPointsEarned({ amount: 50 }));
    haptics.light();
  };

  const handleIncrementProgress = () => {
    const newProgress = Math.min(100, campaignProgress + 10);
    setCampaignProgress(newProgress);
    haptics.selection();
    
    if (newProgress >= 100) {
      haptics.success();
    }
  };

  const handleShowRewardReveal = () => {
    // Mock coupon data
    const mockCoupon = {
      id: "demo-1",
      code: "REWARD2024",
      rewardId: "reward-1",
      rewardName: "خصم 50 دينار",
      rewardNameEn: "50 JOD Discount",
      status: CouponStatus.ACTIVE,
      discountValue: 50,
      redeemedAt: new Date().toISOString(),
    };

    dispatch(showRewardReveal(mockCoupon));
    haptics.celebration();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Loyalty System Prototype</Text>
        <Text style={styles.subtitle}>
          Premium Engagement Experience Demo
        </Text>

        {/* Points Balance Hero */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <PointsBalanceHero
            currentBalance={pointsBalance}
            totalEarned={2500}
            totalRedeemed={1250}
          />
        </Animated.View>

        {/* Interactive Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Demo</Text>

          <Pressable style={styles.demoButton} onPress={handleAddPoints}>
            <Text style={styles.demoButtonText}>
              + Add 50 Points (with animation)
            </Text>
          </Pressable>

          <Pressable
            style={styles.demoButton}
            onPress={handleShowRewardReveal}
          >
            <Text style={styles.demoButtonText}>
              Show Reward Reveal (Fullscreen)
            </Text>
          </Pressable>
        </View>

        {/* Progress Bars Demo */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Campaign Progress Demo</Text>

          <View style={styles.progressDemo}>
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Standard Progress (40%)
                </Text>
                <Text style={styles.progressPercent}>40%</Text>
              </View>
              <AnimatedProgressBar progress={40} showPulse={false} />
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Near Completion (85%) - Pulsing 🔥
                </Text>
                <Text style={styles.progressPercent}>85%</Text>
              </View>
              <AnimatedProgressBar progress={85} showPulse={true} />
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Interactive ({campaignProgress}%)
                </Text>
                <Text style={styles.progressPercent}>{campaignProgress}%</Text>
              </View>
              <AnimatedProgressBar
                progress={campaignProgress}
                showPulse={true}
              />
              <Pressable
                style={styles.smallButton}
                onPress={handleIncrementProgress}
              >
                <Text style={styles.smallButtonText}>+10% Progress</Text>
              </Pressable>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Almost There (95%) - Golden Glow ✨
                </Text>
                <Text style={styles.progressPercent}>95%</Text>
              </View>
              <AnimatedProgressBar progress={95} showPulse={true} />
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completed! 🎉</Text>
                <Text style={styles.progressPercent}>100%</Text>
              </View>
              <AnimatedProgressBar progress={100} showPulse={false} />
            </View>
          </View>
        </Animated.View>

        {/* Feature Highlights */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <FeatureItem icon="✅" text="60fps native animations (Reanimated)" />
            <FeatureItem icon="🎨" text="Premium gradient hero cards" />
            <FeatureItem icon="📊" text="Animated progress with pulse near completion" />
            <FeatureItem icon="🎉" text="Fullscreen reward reveal experience" />
            <FeatureItem icon="✨" text="Floating points earned toast" />
            <FeatureItem icon="📱" text="Haptic feedback on all interactions" />
            <FeatureItem icon="🔄" text="Smooth spring-based counters" />
            <FeatureItem icon="🏆" text="Rarity-based visual treatment" />
            <FeatureItem icon="🎯" text="Near-completion psychological triggers" />
            <FeatureItem icon="⚡" text="Android-optimized performance" />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Reward Reveal Modal (triggered by Redux) */}
      <RewardRevealScreen />
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

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
    gap: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  demoButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  demoButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  progressDemo: {
    gap: Spacing.xl,
  },
  progressItem: {
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  progressPercent: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  smallButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  smallButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
});
