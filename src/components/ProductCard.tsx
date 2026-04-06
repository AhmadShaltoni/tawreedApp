import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import type { Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  compact?: boolean;
  grid?: boolean;
}

function ProductCard({
  product,
  onPress,
  compact = false,
  grid = false,
}: ProductCardProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;
  const savings = hasDiscount ? product.price - product.discountPrice! : 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        compact && styles.cardCompact,
        grid && styles.cardGrid,
        animStyle,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(product);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            product.images?.[0]
              ? { uri: product.images[0] }
              : require("@/assets/images/icon.png")
          }
          style={[styles.image, compact && styles.imageCompact]}
          contentFit="cover"
          transition={200}
          recyclingKey={product.id}
        />
        {/* Orange discount badge */}
        {hasDiscount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        ) : null}
        {/* Low stock FOMO indicator */}
        {isLowStock ? (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{product.stock} left</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {!compact && product.categoryName ? (
          <Text style={styles.category} numberOfLines={1}>
            {product.categoryName}
          </Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {(hasDiscount ? product.discountPrice! : product.price).toFixed(2)}{" "}
            {t("common.currency")}
          </Text>
          {hasDiscount ? (
            <Text style={styles.originalPrice}>{product.price.toFixed(2)}</Text>
          ) : null}
        </View>
        {/* Savings callout */}
        {hasDiscount && !compact ? (
          <View style={styles.savingsRow}>
            <Ionicons name="pricetag" size={10} color={Colors.success} />
            <Text style={styles.savingsText}>
              Save {savings.toFixed(2)} {t("common.currency")}
            </Text>
          </View>
        ) : null}
        {!compact ? (
          <Text style={styles.unit}>
            Min: {product.minOrder} {product.unit}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    width: 175,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  cardCompact: {
    width: 155,
  },
  cardGrid: {
    width: "100%",
    marginRight: 0,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 145,
    backgroundColor: Colors.inputBackground,
  },
  imageCompact: {
    height: 120,
  },
  badge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  stockBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(239,68,68,0.9)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stockText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  info: {
    padding: Spacing.md,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 19,
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.success,
  },
  unit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
