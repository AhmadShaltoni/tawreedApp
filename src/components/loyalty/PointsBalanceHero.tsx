/**
 * PointsBalanceHero Component
 * Large hero card displaying loyalty points balance with gradient
 * 
 * VISUAL: Premium gradient card, animated counter, floating particles effect
 */

import AnimatedCounter from "./AnimatedCounter";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BorderRadius, Colors, FontSize, Shadows, Spacing } from "@/src/constants/theme";
import {
  LoyaltyGradients,
  LoyaltyShadows,
  LoyaltySpacing,
  LoyaltyTypography,
} from "@/src/constants/loyaltyTheme";
import { Ionicons } from "@expo/vector-icons";

interface PointsBalanceHeroProps {
  currentBalance: number | undefined;
  totalEarned: number | undefined;
  totalRedeemed: number | undefined;
  onPress?: () => void;
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
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={LoyaltyGradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="trophy" size={32} color={Colors.white} />
          <Text style={styles.label}>{t("loyalty.currentBalance")}</Text>
        </View>

        {/* Main Balance */}
        <View style={styles.balanceContainer}>
          <AnimatedCounter
            value={currentBalance ?? 0}
            style={styles.balanceText}
          />
          <Text style={styles.pointsLabel}>{t("loyalty.points")}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {totalEarned != null ? totalEarned.toLocaleString() : "0"}
            </Text>
            <Text style={styles.statLabel}>{t("loyalty.totalEarned")}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {totalRedeemed != null ? totalRedeemed.toLocaleString() : "0"}
            </Text>
            <Text style={styles.statLabel}>{t("loyalty.totalRedeemed")}</Text>
          </View>
        </View>

        {/* Floating particles effect placeholder */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {/* TODO: Add subtle Lottie particle animation */}
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
    minHeight: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.xxl,
  },
  balanceText: {
    ...LoyaltyTypography.balanceHero,
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  pointsLabel: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: Spacing.md,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});
