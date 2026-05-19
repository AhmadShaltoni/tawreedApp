/**
 * PointsEarnedToast
 * Floating "+X نقطة" animation that appears and rises
 * 
 * USAGE: Mounted globally in root layout, triggered via Redux
 * PERFORMANCE: Native driver only, no layout calculations
 */

import { LoyaltyTypography } from "@/src/constants/loyaltyTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { hidePointsEarned } from "@/src/store/slices/loyalty.slice";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useFloatingPoints } from "@/src/animations/useFloatingPoints";

export default function PointsEarnedToast() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { amount, visible, sourceY } = useAppSelector(
    (state) => state.loyalty.pointsEarned,
  );

  const animatedStyle = useFloatingPoints(visible, {
    duration: 2000,
    distance: -80,
    onComplete: () => {
      dispatch(hidePointsEarned());
    },
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        sourceY ? { top: sourceY } : styles.centerPosition,
      ]}
      pointerEvents="none" // Don't block touches
    >
      <Text style={styles.text}>
        +{amount} {t("loyalty.points")}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerPosition: {
    top: "50%",
  },
  text: {
    ...LoyaltyTypography.floatingPoints,
    color: "#ffffff",
    fontWeight: "700",
  },
});
