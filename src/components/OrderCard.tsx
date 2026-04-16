import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import type { Order } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import OrderStatusBadge from "./OrderStatusBadge";

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

/** Show a short, readable order ID (last 6 chars uppercased) */
function formatOrderId(raw: string): string {
  if (!raw) return "#—";
  // If it's already a short/numeric order number, use as-is
  if (raw.length <= 10) return `#${raw}`;
  // Otherwise take last 6 characters and uppercase
  return `#${raw.slice(-6).toUpperCase()}`;
}

const MAX_PRODUCT_THUMBS = 3;

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTotal = (): number => {
    if (order.total !== undefined && order.total !== null) return order.total;
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);
    }
    return 0;
  };

  const total = getTotal();
  const hasItems = order.items && order.items.length > 0;
  const itemCount = hasItems ? order.items!.length : order.itemCount || 0;
  const visibleItems = hasItems
    ? order.items!.slice(0, MAX_PRODUCT_THUMBS)
    : [];
  const extraCount = hasItems
    ? Math.max(0, order.items!.length - MAX_PRODUCT_THUMBS)
    : 0;

  // Build product names summary
  const productNames = hasItems
    ? order.items!.map((item) => item.productName).join("، ")
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {/* Row 1: Status badge + date */}
      <View style={styles.topRow}>
        <OrderStatusBadge status={order.status} size="sm" />
        <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Row 2: Product thumbnails + info */}
      <View style={styles.contentRow}>
        {/* Product image(s) */}
        {hasItems ? (
          <View style={styles.thumbsContainer}>
            {visibleItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.thumbWrap,
                  index > 0 && { marginLeft: -8 },
                  { zIndex: MAX_PRODUCT_THUMBS - index },
                ]}
              >
                {item.productImage ? (
                  <Image
                    source={{ uri: item.productImage }}
                    style={styles.thumb}
                    contentFit="cover"
                    recyclingKey={item.id}
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Ionicons
                      name="cube-outline"
                      size={18}
                      color={Colors.textLight}
                    />
                  </View>
                )}
              </View>
            ))}
            {extraCount > 0 && (
              <View style={[styles.thumbWrap, { marginLeft: -8, zIndex: 0 }]}>
                <View style={[styles.thumb, styles.thumbExtra]}>
                  <Text style={styles.extraText}>+{extraCount}</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons
              name="receipt-outline"
              size={22}
              color={Colors.textLight}
            />
          </View>
        )}

        {/* Product names + count */}
        <View style={styles.infoCol}>
          {productNames ? (
            <Text style={styles.productNames} numberOfLines={2}>
              {productNames}
            </Text>
          ) : (
            <Text style={styles.productNames} numberOfLines={1}>
              {t("orders.orderNumber")} {formatOrderId(order.orderNumber)}
            </Text>
          )}
          <Text style={styles.itemCount}>
            {itemCount} {itemCount !== 1 ? t("common.items") : t("common.item")}
          </Text>
        </View>
      </View>

      {/* Row 3: Total + arrow */}
      <View style={styles.bottomRow}>
        <Text style={styles.orderId}>{formatOrderId(order.orderNumber)}</Text>
        <View style={styles.totalRow}>
          {total > 0 ? (
            <Text style={styles.total}>
              {total.toFixed(2)} {t("common.currency")}
            </Text>
          ) : (
            <Text style={styles.viewDetails}>{t("orders.viewDetails")}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  // Row 1
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  // Row 2
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  thumbsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  thumbWrap: {
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm - 2,
    backgroundColor: Colors.inputBackground,
  },
  thumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  thumbExtra: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryXLight,
  },
  extraText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.primary,
  },
  infoCol: {
    flex: 1,
  },
  productNames: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  itemCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Row 3
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderId: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  viewDetails: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
});
