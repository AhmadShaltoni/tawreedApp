import { BorderRadius, Colors, FontSize, Spacing } from "@/src/constants/theme";
import type { OrderDetail } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface OrderPricingCardProps {
  order: OrderDetail;
}

export default function OrderPricingCard({ order }: OrderPricingCardProps) {
  const { t } = useTranslation();

  // Calculate subtotal from items
  const itemsSubtotal =
    order.items?.reduce((sum, item) => {
      const itemTotal =
        item.subtotal && item.subtotal > 0
          ? item.subtotal
          : (item.price ?? 0) * (item.quantity ?? 0);
      return sum + itemTotal;
    }, 0) ?? 0;

  // Use backend subtotal if available, else calculated
  const subtotal = order.subtotal ?? itemsSubtotal;
  const total = order.total ?? subtotal;
  const deliveryFee = order.deliveryFee;
  const isFreeDelivery = order.isFreeDelivery;
  const discountAmount = order.discountAmount;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("orders.pricingSummary")}</Text>

      {/* Product subtotal */}
      <View style={styles.row}>
        <Text style={styles.label}>{t("delivery.productSubtotal")}</Text>
        <Text style={styles.value}>
          {subtotal.toFixed(2)} {t("common.currency")}
        </Text>
      </View>

      {/* Discount if any */}
      {discountAmount != null && discountAmount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, styles.discountLabel]}>
            {t("checkout.discount")}
            {order.couponCode ? ` (${order.couponCode})` : ""}
          </Text>
          <Text style={styles.discountValue}>
            -{discountAmount.toFixed(2)} {t("common.currency")}
          </Text>
        </View>
      )}

      {/* Delivery fee */}
      {deliveryFee != null && (
        <View style={styles.row}>
          <Text style={styles.label}>{t("delivery.deliveryFee")}</Text>
          {isFreeDelivery || deliveryFee === 0 ? (
            <View style={styles.freeRow}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.success}
              />
              <Text style={styles.freeValue}>{t("delivery.free")}</Text>
            </View>
          ) : (
            <Text style={styles.value}>
              {deliveryFee.toFixed(2)} {t("common.currency")}
            </Text>
          )}
        </View>
      )}

      <View style={styles.totalDivider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t("delivery.grandTotal")}</Text>
        <Text style={styles.totalValue}>
          {total.toFixed(2)} {t("common.currency")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  discountLabel: {
    color: Colors.success,
  },
  discountValue: {
    color: Colors.success,
    fontWeight: "600",
    fontSize: FontSize.sm,
  },
  freeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  freeValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.primary,
    marginVertical: Spacing.sm,
    opacity: 0.2,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.primary,
  },
});
