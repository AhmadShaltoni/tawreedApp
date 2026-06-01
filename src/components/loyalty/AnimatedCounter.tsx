/**
 * AnimatedCounter Component
 * Displays numbers with smooth counting animation
 *
 * PERFORMANCE: Uses Reanimated Text with native driver
 */

import { useAnimatedCounter } from "@/src/animations/useAnimatedCounter";
import { LoyaltyTypography } from "@/src/constants/loyaltyTheme";
import React from "react";
import { StyleSheet, TextStyle } from "react-native";
import Animated from "react-native-reanimated";

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

const AnimatedText = Animated.createAnimatedComponent(Animated.Text);

export default function AnimatedCounter({
  value,
  style,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const { animatedProps } = useAnimatedCounter(value);

  return (
    <AnimatedText
      style={[styles.text, style]}
      // @ts-ignore - animatedProps text is supported
      animatedProps={animatedProps}
    >
      {prefix}
      {/* Value animates here */}
      {suffix}
    </AnimatedText>
  );
}

const styles = StyleSheet.create({
  text: {
    ...LoyaltyTypography.number,
  },
});
