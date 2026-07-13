import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import type { OrderItem } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface OrderProductItemProps {
  item: OrderItem;
}

export default function OrderProductItem({ item }: OrderProductItemProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const unitLabel = isAr
    ? (item.unitLabel ?? item.unit)
    : (item.unitLabelEn ?? item.unit);
  const variantSize = isAr
    ? item.variantSize
    : (item.variantSizeEn ?? item.variantSize);
  const optionName = isAr
    ? item.optionName
    : (item.optionNameEn ?? item.optionName);

  const displayImage = item.optionImage || item.productImage;

  return (
    <View style={[styles.container, item.isReward && styles.rewardContainer]}>
      {displayImage ? (
        <Image
          source={{ uri: displayImage }}
          style={styles.image}
          contentFit="cover"
          recyclingKey={item.id}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons
            name={item.isReward ? "gift-outline" : "cube-outline"}
            size={22}
            color={item.isReward ? "#ea580c" : Colors.textLight}
          />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.productName}
        </Text>
        {item.isReward ? (
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardBadgeText}>
              🎁 {t("orders.prize")}
            </Text>
          </View>
        ) : null}
        {variantSize ? (
          <Text style={styles.variantSize}>{variantSize}</Text>
        ) : null}
        {optionName ? (
          <Text style={styles.optionName}>{optionName}</Text>
        ) : null}
        {item.isReward ? (
          <Text style={styles.meta}>
            {t("orders.prizeFree")} × {item.quantity}
          </Text>
        ) : (
          <Text style={styles.meta}>
            {(item.price ?? 0).toFixed(2)} {t("common.currency")} ×{" "}
            {item.quantity} {unitLabel}
          </Text>
        )}
        {item.note ? (
          <Text style={styles.note} numberOfLines={2}>
            {item.note}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.subtotal, item.isReward && styles.rewardSubtotal]}>
        {item.isReward
          ? `0.00 ${t("common.currency")}`
          : `${(item.subtotal ?? 0).toFixed(2)} ${t("common.currency")}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBackground,
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  variantSize: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 1,
  },
  optionName: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: "500",
    marginTop: 1,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  subtotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  rewardContainer: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  rewardBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffedd5",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    marginTop: 2,
  },
  rewardBadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    color: "#ea580c",
  },
  rewardSubtotal: {
    color: "#ea580c",
  },
});
