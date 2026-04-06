/**
 * Modern Badge Component
 * Used for status indicators, discount badges, and categories
 * Implements Tawreed's modern design system
 */

import {
    BorderRadius,
    Colors,
    Spacing,
    Typography,
} from "@/src/constants/theme-modern";
import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type BadgeVariant =
  | "primary"
  | "accent"
  | "success"
  | "error"
  | "warning"
  | "info";
type BadgeSize = "small" | "medium" | "large";

interface ModernBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function ModernBadge({
  label,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
  icon,
}: ModernBadgeProps) {
  const containerStyle = getContainerStyle(variant, size);
  const textStyleObj = getTextStyle(variant, size);

  return (
    <View style={[containerStyle, style]}>
      {icon && <>{icon}</>}
      <Text style={[textStyleObj, textStyle]}>{label}</Text>
    </View>
  );
}

function getContainerStyle(variant: BadgeVariant, size: BadgeSize): ViewStyle {
  const base = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
  };

  const sizeStyles = {
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    large: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: Colors.primaryXLight,
    },
    accent: {
      backgroundColor: Colors.accentLight,
    },
    success: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
    },
    error: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    warning: {
      backgroundColor: "rgba(245, 158, 11, 0.1)",
    },
    info: {
      backgroundColor: "rgba(14, 165, 233, 0.1)",
    },
  };

  return {
    ...base,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
}

function getTextStyle(variant: BadgeVariant, size: BadgeSize): TextStyle {
  const fontSizes = {
    small: Typography.fontSize.xs,
    medium: Typography.fontSize.sm,
    large: Typography.fontSize.md,
  };

  const colorMap = {
    primary: Colors.primary,
    accent: Colors.accent,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning || "#f59e0b",
    info: Colors.info || "#0ea5e9",
  };

  return {
    color: colorMap[variant],
    fontSize: fontSizes[size],
    fontWeight: Typography.fontWeight.semibold,
  };
}

// ============================================
// ENGAGEMENT COMPONENTS
// ============================================

/**
 * Savings Highlight Component
 * Displays money saved in a prominent, eye-catching way
 */
interface SavingsHighlightProps {
  savingsAmount: number;
  originalAmount: number;
  currency?: string;
  style?: ViewStyle;
}

export function SavingsHighlight({
  savingsAmount,
  originalAmount,
  currency = "JD",
  style,
}: SavingsHighlightProps) {
  const savingsPercent = Math.round((savingsAmount / originalAmount) * 100);

  return (
    <View style={[styles.savingsContainer, style]}>
      <Text style={styles.savingsEmoji}>🎉</Text>
      <View>
        <Text style={styles.savingsLabel}>You save</Text>
        <View style={styles.savingsAmount}>
          <Text style={styles.savingsValue}>
            {currency} {savingsAmount.toFixed(2)}
          </Text>
          <Text style={styles.savingsPercent}>({savingsPercent}%)</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Stock Status Indicator
 * Creates FOMO with stock level display
 */
interface StockStatusProps {
  stock: number;
  style?: ViewStyle;
}

export function StockStatus({ stock, style }: StockStatusProps) {
  const isLowStock = stock < 5;
  const backgroundColor = isLowStock ? Colors.error : Colors.success;
  const iconName = isLowStock ? "warning" : "checkmark-circle";

  return (
    <View style={[styles.stockContainer, { backgroundColor }, style]}>
      <Text style={styles.stockText}>
        {stock > 0 ? `✓ ${stock} in stock` : "Out of stock"}
      </Text>
    </View>
  );
}

/**
 * Limited Time Indicator
 * Creates urgency
 */
interface LimitedTimeProps {
  label: string;
  timeRemaining?: string;
  style?: ViewStyle;
}

export function LimitedTimeIndicator({
  label,
  timeRemaining,
  style,
}: LimitedTimeProps) {
  return (
    <View style={[styles.limitedTimeContainer, style]}>
      <Text style={styles.limitedTimeEmoji}>⏰</Text>
      <View>
        <Text style={styles.limitedTimeLabel}>{label}</Text>
        {timeRemaining && (
          <Text style={styles.timeRemaining}>{timeRemaining}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Bestseller Badge
 * Social proof indicator
 */
interface BestsellerBadgeProps {
  style?: ViewStyle;
}

export function BestsellerBadge({ style }: BestsellerBadgeProps) {
  return (
    <ModernBadge
      label="Bestseller"
      variant="accent"
      size="small"
      style={[styles.bestsellerBadge, style]}
    />
  );
}

const styles = StyleSheet.create({
  // Savings
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },

  savingsEmoji: {
    fontSize: 24,
  },

  savingsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  savingsAmount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },

  savingsValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
  },

  savingsPercent: {
    fontSize: Typography.fontSize.md,
    color: Colors.success,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Stock
  stockContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  stockText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Limited Time
  limitedTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },

  limitedTimeEmoji: {
    fontSize: 20,
  },

  limitedTimeLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },

  timeRemaining: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Bestseller
  bestsellerBadge: {
    backgroundColor: Colors.accentLight,
  },
});
