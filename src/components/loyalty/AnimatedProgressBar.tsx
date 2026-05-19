/**
 * AnimatedProgressBar Component
 * Smooth progress bar with spring animation and near-completion pulse
 * 
 * PERFORMANCE: Uses native driver for width transform
 */

import { useProgressFill } from "@/src/animations/useProgressFill";
import { usePulseAnimation } from "@/src/animations/usePulseAnimation";
import {
  CompletionThresholds,
  LoyaltySpacing,
  RarityColors,
} from "@/src/constants/loyaltyTheme";
import { Colors } from "@/src/constants/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  showPulse?: boolean;
  style?: ViewStyle;
}

export default function AnimatedProgressBar({
  progress,
  height = LoyaltySpacing.progressBar.standard,
  backgroundColor = Colors.border,
  fillColor,
  showPulse = true,
  style,
}: AnimatedProgressBarProps) {
  const { animatedStyle } = useProgressFill(progress);
  
  // Pulse animation when near completion
  const isNearCompletion = progress >= CompletionThresholds.veryClose * 100;
  const pulseStyle = usePulseAnimation({
    enabled: showPulse && isNearCompletion,
    intensity: 0.03,
    duration: 1200,
  });

  // Determine fill color based on progress
  const determinedFillColor = fillColor || getProgressColor(progress);

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: determinedFillColor,
          },
          animatedStyle,
          isNearCompletion && pulseStyle,
        ]}
      />
      
      {/* Golden glow at >90% */}
      {progress >= CompletionThresholds.almostThere * 100 && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: RarityColors.LEGENDARY.primary,
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}

function getProgressColor(progress: number): string {
  if (progress >= 90) return RarityColors.LEGENDARY.primary; // Gold
  if (progress >= 70) return RarityColors.EPIC.primary; // Purple
  if (progress >= 40) return RarityColors.RARE.primary; // Blue
  return RarityColors.COMMON.primary; // Gray
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    borderRadius: 999,
    position: "absolute",
    left: 0,
    top: 0,
  },
  glow: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 999,
    opacity: 0.3,
  },
});
