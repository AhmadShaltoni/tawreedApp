/**
 * Modern Product Card Component
 * Implements conversion-optimized design with UX enhancements:
 * - Discount badge in orange for urgency
 * - Ratings prominently displayed with review count
 * - Stock indicator for FOMO creation
 * - Direct "Add to Cart" button with orange accent
 * - Smooth animations and shadows
 */

import {
    BorderRadius,
    Colors,
    Shadows,
    Spacing,
    Typography,
} from "@/src/constants/theme-modern";
import type { Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

interface ModernProductCardProps {
  product: Product;
  onPress: (id: string) => void;
  onAddToCart: (id: string) => void;
  containerStyle?: ViewStyle;
}

export function ModernProductCard({
  product,
  onPress,
  onAddToCart,
  containerStyle,
}: ModernProductCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  // Calculate discount percentage if applicable
  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  // Mock rating data (in real app, fetch from API)
  const rating = 4.8;
  const reviewCount = 2347;

  const handleAddToCart = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 300);
    onAddToCart(product.id);
  };

  const isLowStock = product.stock && product.stock < 5;
  const isBestseller = product.sells && product.sells > 100; // Mock bestseller logic

  return (
    <Pressable
      style={[
        styles.container,
        isPressed && styles.containerPressed,
        containerStyle,
      ]}
      onPress={() => onPress(product.id)}
      activeOpacity={0.7}
    >
      {/* IMAGE CONTAINER */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* DISCOUNT BADGE - Orange for urgency */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* BESTSELLER BADGE */}
        {isBestseller && (
          <View style={styles.bestsellerBadge}>
            <Ionicons name="flame" size={12} color={Colors.accent} />
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}

        {/* STOCK STATUS - Low stock creates FOMO */}
        {isLowStock && (
          <View style={styles.stockWarning}>
            <Text style={styles.stockText}>Only {product.stock} left</Text>
          </View>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* PRODUCT NAME */}
        <Text style={styles.productName} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* RATING & REVIEWS - Social Proof */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            <Ionicons name="star" size={14} color={Colors.accent} />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
          <Text style={styles.reviewCount}>({reviewCount})</Text>
        </View>

        {/* PRICE SECTION - Highlight savings */}
        <View style={styles.priceContainer}>
          <View style={{ flexDirection: "row", gap: Spacing.sm }}>
            <Text style={styles.currentPrice}>
              JD {product.price.toFixed(2)}
            </Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>
                JD {product.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>

          {/* SAVINGS INDICATOR */}
          {product.originalPrice && discountPercent > 0 && (
            <Text style={styles.savingsText}>
              Save JD {(product.originalPrice - product.price).toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {/* ADD TO CART BUTTON - Orange CTA */}
      <Pressable
        style={[
          styles.addToCartButton,
          isPressed && { backgroundColor: Colors.accentDark },
        ]}
        onPress={handleAddToCart}
        android_ripple={{ color: Colors.white, foreground: true }}
      >
        <Ionicons name="add-circle" size={16} color={Colors.white} />
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.soft,
    marginBottom: Spacing.md,
  },

  containerPressed: {
    ...Shadows.medium,
    transform: [{ scale: 0.98 }],
  },

  // IMAGE SECTION
  imageContainer: {
    width: "100%",
    height: 150,
    backgroundColor: Colors.background,
    position: "relative",
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  // DISCOUNT BADGE - Red urgency
  discountBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  discountText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },

  // BESTSELLER BADGE
  bestsellerBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "center",
  },

  bestsellerText: {
    color: Colors.accent,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // STOCK WARNING
  stockWarning: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },

  stockText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // CONTENT SECTION
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  productName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.heading,
  },

  // RATING & REVIEWS
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },

  ratingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },

  reviewCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // PRICE SECTION
  priceContainer: {
    marginBottom: Spacing.md,
  },

  currentPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  originalPrice: {
    fontSize: Typography.fontSize.md,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },

  savingsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.xs,
  },

  // ADD TO CART BUTTON
  addToCartButton: {
    backgroundColor: Colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },

  addToCartText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});
