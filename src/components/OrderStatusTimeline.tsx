import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import type { OrderStatus } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { STATUS_CONFIG, STATUS_TRANSLATION_KEY } from "./OrderStatusBadge";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

export default function OrderStatusTimeline({
  currentStatus,
}: OrderStatusTimelineProps) {
  const { t } = useTranslation();
  const isCancelled = currentStatus === "CANCELLED";
  const currentStepIndex = isCancelled
    ? -1
    : ALL_STATUSES.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <View style={styles.cancelledBanner}>
        <Ionicons
          name="close-circle"
          size={20}
          color={STATUS_CONFIG.CANCELLED.color}
        />
        <Text style={styles.cancelledText}>{t("orders.statusCancelled")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {ALL_STATUSES.map((status, index) => {
        const stepConfig = STATUS_CONFIG[status];
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <View key={status} style={styles.step}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  isCompleted && styles.connectorActive,
                ]}
              />
            )}
            <View
              style={[
                styles.circle,
                isCompleted && {
                  backgroundColor: stepConfig.color,
                  borderColor: stepConfig.color,
                },
                isCurrent && styles.circleCurrent,
              ]}
            >
              {isCompleted ? (
                <Ionicons
                  name={isCurrent ? stepConfig.icon : "checkmark"}
                  size={isCurrent ? 14 : 12}
                  color={Colors.white}
                />
              ) : (
                <View style={styles.dot} />
              )}
            </View>
            <Text
              style={[
                styles.label,
                isCompleted && styles.labelActive,
                isCurrent && {
                  color: stepConfig.color,
                  fontWeight: "700",
                },
              ]}
            >
              {t(STATUS_TRANSLATION_KEY[status])}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: 13,
    top: -Spacing.lg,
    width: 2,
    height: Spacing.lg,
    backgroundColor: Colors.border,
  },
  connectorActive: {
    backgroundColor: Colors.success,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  circleCurrent: {
    transform: [{ scale: 1.1 }],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textLight,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  labelActive: {
    color: Colors.text,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fee2e2",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cancelledText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#991b1b",
  },
});
