/**
 * PointsBalanceHero Component
 * Large hero card displaying loyalty points balance with gradient
 *
 * VISUAL: Premium gold gradient, centered balance, decorative glow circles,
 * and three separated stat pills (earned / redeemed / remaining).
 */

import {
    LoyaltyGradients,
    LoyaltyShadows,
    LoyaltySpacing,
    LoyaltyTypography,
} from "@/src/constants/loyaltyTheme";
import {
    BorderRadius,
    Colors,
    FontSize,
    Spacing
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AnimatedCounter from "./AnimatedCounter";

interface PointsBalanceHeroProps {
  currentBalance: number | undefined;
  totalEarned: number | undefined;
  totalRedeemed: number | undefined;
  onPress?: () => void;
}

interface StatPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | undefined;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={Colors.white} />
      </View>
      <Text style={styles.statValue}>
        {value != null ? value.toLocaleString() : "0"}
      </Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export default function PointsBalanceHero({
  currentBalance,
  totalEarned,
  totalRedeemed,
  onPress,
}: PointsBalanceHeroProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={LoyaltyGradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative glow circles */}
        <View style={styles.decorCircleTop} pointerEvents="none" />
        <View style={styles.decorCircleBottom} pointerEvents="none" />

        {/* Header — trophy badge + label */}
        <View style={styles.header}>
          <View style={styles.trophyBadge}>
            <Ionicons name="trophy" size={20} color={Colors.white} />
          </View>
          <Text style={styles.label}>{t("loyalty.currentBalance")}</Text>
        </View>

        {/* Main Balance — centered */}
        <View style={styles.balanceContainer}>
          <AnimatedCounter
            value={currentBalance ?? 0}
            style={styles.balanceText}
          />
          <Text style={styles.pointsLabel}>{t("loyalty.points")}</Text>
        </View>

        {/* Stats — three separated pills */}
        <View style={styles.statsRow}>
          <StatPill
            icon="trending-up"
            value={totalEarned}
            label={t("loyalty.totalEarned")}
          />
          <StatPill
            icon="gift-outline"
            value={totalRedeemed}
            label={t("loyalty.totalRedeemed")}
          />
          <StatPill
            icon="wallet-outline"
            value={currentBalance}
            label={t("loyalty.remainingPoints")}
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...LoyaltyShadows.premium,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    padding: LoyaltySpacing.hero,
    overflow: "hidden",
  },

  // Decorative background circles
  decorCircleTop: {
    position: "absolute",
    top: -60,
    insetInlineEnd: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  decorCircleBottom: {
    position: "absolute",
    bottom: -70,
    insetInlineStart: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  trophyBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.20)",
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    letterSpacing: 0.5,
  },

  // Balance
  balanceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
  },
  balanceText: {
    ...LoyaltyTypography.balanceHero,
    color: Colors.white,
    marginHorizontal: Spacing.sm,
  },
  pointsLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xxs,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
});
