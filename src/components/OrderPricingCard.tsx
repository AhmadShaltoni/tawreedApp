import { BorderRadius, Colors, FontSize, Spacing } from "@/src/constants/theme";
import type { OrderDetail } from "@/src/types";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface OrderPricingCardProps {
  order: OrderDetail;
}

export default function OrderPricingCard({ order }: OrderPricingCardProps) {
  const { t } = useTranslation();

  const subtotal =
    order.items?.reduce((sum, item) => sum + (item.subtotal ?? 0), 0) ?? 0;
  const total = order.total ?? subtotal;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("orders.pricingSummary")}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{t("checkout.subtotal")}</Text>
        <Text style={styles.value}>
          {subtotal.toFixed(2)} {t("common.currency")}
        </Text>
      </View>

      {subtotal !== total && (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.label, styles.adjustmentLabel]}>
              {subtotal > total ? t("checkout.discount") : t("orders.fees")}
            </Text>
            <Text
              style={[
                styles.value,
                subtotal > total ? styles.discountValue : styles.feeValue,
              ]}
            >
              {subtotal > total ? "-" : "+"}
              {Math.abs(total - subtotal).toFixed(2)} {t("common.currency")}
            </Text>
          </View>
        </>
      )}

      <View style={styles.totalDivider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t("checkout.total")}</Text>
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
  adjustmentLabel: {
    fontStyle: "italic",
  },
  discountValue: {
    color: Colors.success,
    fontWeight: "600",
  },
  feeValue: {
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
    opacity: 0.5,
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
