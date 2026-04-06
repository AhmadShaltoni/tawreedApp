import Loader from "@/src/components/ui/Loader";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
    clearOrderDetail,
    fetchOrderDetail,
} from "@/src/store/slices/orders.slice";
import type { OrderStatus } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    color: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  pending: {
    color: "#92400e",
    bg: "#fef3c7",
    icon: "time-outline",
    label: "Pending",
  },
  confirmed: {
    color: "#1e40af",
    bg: "#dbeafe",
    icon: "checkmark-circle-outline",
    label: "Confirmed",
  },
  processing: {
    color: "#6d28d9",
    bg: "#ede9fe",
    icon: "cog-outline",
    label: "Processing",
  },
  shipped: {
    color: "#0369a1",
    bg: "#e0f2fe",
    icon: "airplane-outline",
    label: "Shipped",
  },
  delivered: {
    color: "#166534",
    bg: "#dcfce7",
    icon: "checkmark-done-outline",
    label: "Delivered",
  },
  cancelled: {
    color: "#991b1b",
    bg: "#fee2e2",
    icon: "close-circle-outline",
    label: "Cancelled",
  },
};

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { selectedOrder: order, loadingDetail } = useAppSelector(
    (state) => state.orders,
  );

  useEffect(() => {
    if (id) dispatch(fetchOrderDetail(id));
    return () => {
      dispatch(clearOrderDetail());
    };
  }, [dispatch, id]);

  if (loadingDetail || !order) {
    return <Loader />;
  }

  const config = STATUS_CONFIG[order.status];
  const isCancelled = order.status === "cancelled";

  const currentStepIndex = isCancelled
    ? -1
    : ALL_STATUSES.indexOf(order.status);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("orders.orderDetail")} #{order.orderNumber}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={28} color={config.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.statusDate}>
              {formatDate(order.updatedAt ?? order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("orders.timeline")}</Text>
            <View style={styles.timeline}>
              {ALL_STATUSES.map((status, index) => {
                const stepConfig = STATUS_CONFIG[status];
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={status} style={styles.timelineStep}>
                    {/* Connector line */}
                    {index > 0 ? (
                      <View
                        style={[
                          styles.connector,
                          isCompleted && styles.connectorActive,
                        ]}
                      />
                    ) : null}

                    {/* Step circle */}
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && {
                          backgroundColor: stepConfig.color,
                          borderColor: stepConfig.color,
                        },
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons
                          name={isCurrent ? stepConfig.icon : "checkmark"}
                          size={isCurrent ? 14 : 12}
                          color={Colors.white}
                        />
                      ) : (
                        <View style={styles.stepDot} />
                      )}
                    </View>

                    {/* Step label */}
                    <Text
                      style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelActive,
                        isCurrent && {
                          color: stepConfig.color,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {stepConfig.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.cancelledBanner}>
              <Ionicons
                name="close-circle"
                size={20}
                color={STATUS_CONFIG.cancelled.color}
              />
              <Text style={styles.cancelledText}>
                {t("orders.statusCancelled")}
              </Text>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("orders.items")} ({order.items?.length ?? 0})
          </Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={
                  item.productImage
                    ? { uri: item.productImage }
                    : require("@/assets/images/icon.png")
                }
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.price.toFixed(2)} {t("common.currency")} x{" "}
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {item.subtotal.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orders.shippingInfo")}</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("orders.address")}</Text>
                <Text style={styles.detailValue}>{order.shippingAddress}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="business-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("checkout.city")}</Text>
                <Text style={styles.detailValue}>{order.city}</Text>
              </View>
            </View>
            {order.notes ? (
              <View style={styles.detailRow}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t("checkout.notes")}</Text>
                  <Text style={styles.detailValue}>{order.notes}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("checkout.total")}</Text>
              <Text style={styles.totalValue}>
                {order.total.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
            <Text style={styles.orderDate}>
              Placed on {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Timeline
  timeline: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  timelineStep: {
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
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleCurrent: {
    transform: [{ scale: 1.1 }],
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textLight,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  stepLabelActive: {
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
  // Items
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  // Shipping details
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
    gap: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  // Total
  totalCard: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.primary,
  },
  orderDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
