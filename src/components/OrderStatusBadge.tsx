import { BorderRadius, FontSize, Spacing } from "@/src/constants/theme";
import type { OrderStatus } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: { color: "#92400e", bg: "#fef3c7", icon: "time-outline" },
  CONFIRMED: { color: "#0891b2", bg: "#cffafe", icon: "checkmark-outline" },
  PROCESSING: { color: "#1e40af", bg: "#dbeafe", icon: "cog-outline" },
  SHIPPED: { color: "#6d28d9", bg: "#ede9fe", icon: "airplane-outline" },
  DELIVERED: {
    color: "#166534",
    bg: "#dcfce7",
    icon: "checkmark-done-outline",
  },
  CANCELLED: { color: "#991b1b", bg: "#fee2e2", icon: "close-circle-outline" },
};

export const STATUS_TRANSLATION_KEY: Record<OrderStatus, string> = {
  PENDING: "orders.statusPending",
  CONFIRMED: "orders.statusConfirmed",
  PROCESSING: "orders.statusProcessing",
  SHIPPED: "orders.statusShipped",
  DELIVERED: "orders.statusDelivered",
  CANCELLED: "orders.statusCancelled",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: "sm" | "md" | "lg";
}

export { STATUS_CONFIG };

export default function OrderStatusBadge({
  status,
  size = "sm",
}: OrderStatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  const iconSize = size === "lg" ? 18 : size === "md" ? 14 : 12;
  const fontSize =
    size === "lg" ? FontSize.sm : size === "md" ? FontSize.xs : FontSize.xxs;
  const paddingH =
    size === "lg" ? Spacing.md : size === "md" ? Spacing.sm + 2 : Spacing.sm;
  const paddingV =
    size === "lg" ? Spacing.sm : size === "md" ? Spacing.xs + 1 : Spacing.xs;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
      <Text
        style={[styles.text, { color: config.color, fontSize }]}
        numberOfLines={1}
      >
        {t(STATUS_TRANSLATION_KEY[status] ?? "orders.statusPending")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: BorderRadius.full,
  },
  text: {
    fontWeight: "700",
  },
});
