/**
 * Modern Card Component with Glassmorphism Support
 * Soft UI design with subtle shadows and borders
 */

import {
    BorderRadius,
    Colors,
    Shadows,
    Spacing,
} from "@/src/constants/theme-modern";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glassmorphic?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  testID?: string;
}

export function ModernCard({
  children,
  style,
  glassmorphic = false,
  pressable = false,
  onPress,
  testID,
}: ModernCardProps) {
  const cardStyle = [styles.card, glassmorphic && styles.glassmorphic, style];

  const content = (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );

  if (pressable && onPress) {
    return (
      <View style={{ ...styles.pressableContainer }} onTouchEnd={onPress}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },

  glassmorphic: {
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    // Note: For true glassmorphism with blur, use react-native-blur
    // and wrap this component with BlurView
  },

  pressableContainer: {
    overflow: "hidden",
  },
});
