import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface OrderDeliveryCardProps {
  city: string;
  address: string;
  notes?: string | null;
}

export default function OrderDeliveryCard({
  city,
  address,
  notes,
}: OrderDeliveryCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("orders.shippingInfo")}</Text>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="business-outline"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>{t("checkout.city")}</Text>
          <Text style={styles.value}>{city}</Text>
        </View>
      </View>

      {address ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="location-outline"
              size={16}
              color={Colors.textSecondary}
            />
          </View>
          <View style={styles.content}>
            <Text style={styles.label}>{t("orders.address")}</Text>
            <Text style={styles.value}>{address}</Text>
          </View>
        </View>
      ) : null}

      {notes ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={Colors.textSecondary}
            />
          </View>
          <View style={styles.content}>
            <Text style={styles.label}>{t("orders.buyerNotes")}</Text>
            <Text style={styles.value}>{notes}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
    lineHeight: 20,
  },
});
