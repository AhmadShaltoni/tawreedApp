import LoginRequiredModal from "@/src/components/LoginRequiredModal";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useAppDispatch } from "@/src/store";
import { addToCartAsync } from "@/src/store/slices/cart.slice";
import type { Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const dispatch = useAppDispatch();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();

  // Get default variant and unit for quick-add
  const defaultVariant = useMemo(() => {
    const variants = product.variants?.filter((v) => v.isActive) ?? [];
    return variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  }, [product.variants]);

  const defaultUnit = useMemo(() => {
    if (!defaultVariant?.units || defaultVariant.units.length === 0)
      return null;
    const units = defaultVariant.units;
    return units.find((u) => u.isDefault) ?? units[0] ?? null;
  }, [defaultVariant]);

  // Pricing
  const currentPrice = defaultUnit ? defaultUnit.price : product.price;
  const comparePrice = defaultUnit
    ? defaultUnit.compareAtPrice
    : product.discountPrice != null
      ? product.price
      : null;

  const hasDiscount = comparePrice != null && comparePrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice! - currentPrice) / comparePrice!) * 100)
    : 0;

  // Stock
  const currentStock = defaultVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock === 0;

  // Unit info text
  const unitInfoText = useMemo(() => {
    if (!defaultVariant || !defaultUnit) return null;
    const unitLabel = isArabic ? defaultUnit.label : defaultUnit.labelEn;
    const sizeLabel = isArabic
      ? defaultVariant.size
      : (defaultVariant.sizeEn ?? defaultVariant.size);
    if (!sizeLabel) return unitLabel;
    return `${unitLabel} · ${sizeLabel}`;
  }, [defaultVariant, defaultUnit, isArabic]);

  const currency = isArabic ? "د.أ" : "JOD";

  const handleAddToCart = useCallback(() => {
    requireAuth(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dispatch(
        addToCartAsync({
          product,
          quantity: 1,
          selectedUnit: defaultUnit ?? undefined,
          selectedVariant: defaultVariant ?? undefined,
        }),
      );
    });
  }, [dispatch, product, defaultUnit, defaultVariant, requireAuth]);

  return (
    <>
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          grid && styles.cardGrid,
        ]}
      >
        {/* Image section */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress(product);
          }}
        >
          <View style={styles.imageContainer}>
            <Image
              source={
                product.images?.[0]
                  ? { uri: product.images[0] }
                  : require("@/assets/images/icon2.png")
              }
              style={[styles.image, compact && styles.imageCompact]}
              contentFit="contain"
              transition={200}
              recyclingKey={product.id}
            />
            {hasDiscount && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {isArabic
                    ? `خصم ${discountPercent}%`
                    : `${discountPercent}% OFF`}
                </Text>
              </View>
            )}
            <Pressable style={styles.favoriteIcon}>
              <Ionicons name="heart-outline" size={20} color={Colors.primary} />
            </Pressable>
            {isOutOfStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>
                  {t("products.outOfStock")}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Info section */}
        <View style={styles.info}>
          <Pressable onPress={() => onPress(product)}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
          </Pressable>

          {/* Unit info */}
          {unitInfoText && (
            <Text style={styles.unitInfo} numberOfLines={1}>
              {unitInfoText}
            </Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>
              {currency} {currentPrice.toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {currency} {comparePrice!.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Add to cart button */}
          <Pressable
            style={({ pressed }) => [
              styles.cartBtn,
              pressed && styles.cartBtnPressed,
              isOutOfStock && styles.cartBtnDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart" size={16} color={Colors.white} />
            <Text style={styles.cartBtnText}>{t("products.addToCart")}</Text>
          </Pressable>
        </View>
      </View>
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

export default memo(ProductCard);

// ─── Styles ─────────────────────────────────────────
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  /* ── Card ── */
  card: {
    backgroundColor: Colors.white,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    width: 178,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  cardCompact: { width: 158 },
  cardGrid: { flex: 1, width: undefined, marginRight: 0 },

  /* ── Image ── */
  imageContainer: {
    position: "relative",
    backgroundColor: Colors.white,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  image: {
    width: "75%",
    height: 120,
  },
  imageCompact: { height: 100 },

  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },

  favoriteIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },

  outOfStockOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    alignItems: "center",
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  /* ── Info ── */
  info: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  unitInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "400",
  },

  /* ── Price ── */
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  currentPrice: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },

  /* ── Add to cart ── */
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cartBtnPressed: {
    opacity: 0.8,
  },
  cartBtnDisabled: {
    backgroundColor: Colors.border,
  },
  cartBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
