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

  return (
    <View style={styles.container}>
      {item.productImage ? (
        <Image
          source={{ uri: item.productImage }}
          style={styles.image}
          contentFit="cover"
          recyclingKey={item.id}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="cube-outline" size={22} color={Colors.textLight} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.productName}
        </Text>
        <Text style={styles.meta}>
          {(item.price ?? 0).toFixed(2)} {t("common.currency")} ×{" "}
          {item.quantity} {unitLabel}
        </Text>
      </View>

      <Text style={styles.subtotal}>
        {(item.subtotal ?? 0).toFixed(2)} {t("common.currency")}
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
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  subtotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
});
