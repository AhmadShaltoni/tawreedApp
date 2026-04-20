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
import type { Product, ProductUnit, ProductVariant } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  const variantScrollRef = useRef<ScrollView>(null);
  const unitScrollRef = useRef<ScrollView>(null);
  const [quantity, setQuantity] = useState(1);

  // --- Variants ---
  const variants = useMemo(
    () =>
      product.variants && product.variants.length > 0
        ? [...product.variants]
            .filter((v) => v.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [product.variants],
  );

  const defaultVariant = useMemo(
    () => variants.find((v) => v.isDefault) ?? variants[0] ?? null,
    [variants],
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    defaultVariant,
  );

  const hasVariants = variants.length >= 1;
  const hasMultipleVariants = variants.length > 1;

  // --- Units (from selected variant) ---
  const units = useMemo(
    () =>
      selectedVariant && selectedVariant.units.length > 0
        ? [...selectedVariant.units].sort((a, b) => a.sortOrder - b.sortOrder)
        : null,
    [selectedVariant],
  );

  const defaultUnit = useMemo(
    () => units?.find((u) => u.isDefault) ?? units?.[0] ?? null,
    [units],
  );

  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(
    defaultUnit,
  );

  const handleVariantChange = useCallback(
    (variant: ProductVariant) => {
      setSelectedVariant(variant);
      const newUnits = [...variant.units].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const newDefault =
        newUnits.find((u) => u.isDefault) ?? newUnits[0] ?? null;
      setSelectedUnit(newDefault);
      Haptics.selectionAsync();
    },
    [],
  );

  const hasUnits = (units?.length ?? 0) >= 1;
  const hasMultipleUnits = (units?.length ?? 0) > 1;

  // --- Pricing ---
  const activePrice = selectedUnit ? selectedUnit.price : product.price;
  const activeComparePrice = selectedUnit
    ? selectedUnit.compareAtPrice
    : product.discountPrice != null
      ? product.price
      : null;

  const hasDiscount =
    activeComparePrice != null && activeComparePrice > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((activeComparePrice! - activePrice) / activeComparePrice!) * 100,
      )
    : 0;

  // --- Stock ---
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock === 0;

  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  const getVariantLabel = (variant: ProductVariant) =>
    isArabic ? variant.size : (variant.sizeEn ?? variant.size);

  /** Get the display price for a specific variant (from its default unit) */
  const getVariantPrice = (variant: ProductVariant): number => {
    const vUnits = [...variant.units].sort((a, b) => a.sortOrder - b.sortOrder);
    const vDefault = vUnits.find((u) => u.isDefault) ?? vUnits[0];
    return vDefault ? vDefault.price : product.price;
  };

  const handleAddToCart = useCallback(() => {
    requireAuth(() => {
      dispatch(
        addToCartAsync({
          product,
          quantity,
          selectedUnit: selectedUnit ?? undefined,
          selectedVariant: selectedVariant ?? undefined,
        }),
      );
      setQuantity(1);
    });
  }, [dispatch, product, quantity, selectedUnit, selectedVariant, requireAuth]);

  const currency = isArabic ? "د.أ" : "JOD";

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
                  : require("@/assets/images/icon.png")
              }
              style={[styles.image, compact && styles.imageCompact]}
              contentFit="contain"
              transition={200}
              recyclingKey={product.id}
            />
            {hasDiscount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {isArabic ? `خصم ${discountPercent}%` : `${discountPercent}% OFF`}
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.favoriteIcon}>
              <Ionicons name="heart-outline" size={20} color={Colors.primary} />
            </Pressable>
            {isOutOfStock ? (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>
                  {t("products.outOfStock")}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        {/* Info section */}
        <View style={styles.info}>
          <Pressable onPress={() => onPress(product)}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
          </Pressable>

          {/* ── Size selector ── */}
          {hasVariants ? (
            <View style={styles.selectorGroup}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorLabel}>
                  {isArabic ? "اختر الحجم" : "Select Size"}
                </Text>
                <Ionicons name="pricetag-outline" size={13} color={Colors.primary} />
              </View>
              <ScrollView
                ref={variantScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantOutOfStock = variant.stock === 0;
                  const variantPrice = getVariantPrice(variant);
                  const isSingleOption = !hasMultipleVariants;
                  return (
                    <Pressable
                      key={variant.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                        variantOutOfStock && styles.chipDisabled,
                      ]}
                      onPress={() => {
                        if (!variantOutOfStock && hasMultipleVariants) handleVariantChange(variant);
                      }}
                      disabled={variantOutOfStock || isSingleOption}
                    >
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={9} color={Colors.white} />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {getVariantLabel(variant)}
                      </Text>
                      <Text
                        style={[
                          styles.chipPrice,
                          isSelected && styles.chipPriceSelected,
                        ]}
                      >
                        {currency} {variantPrice.toFixed(2)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Divider ── */}
          {hasVariants && hasUnits ? (
            <View style={styles.sectionDivider} />
          ) : null}

          {/* ── Unit selector ── */}
          {hasUnits && units ? (
            <View style={styles.selectorGroup}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorLabel}>
                  {isArabic ? "اختر الكمية" : "Select Unit"}
                </Text>
                <Ionicons name="cube-outline" size={13} color={Colors.primary} />
              </View>
              <ScrollView
                ref={unitScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {units.map((unit) => {
                  const isSelected = selectedUnit?.id === unit.id;
                  const unitLabel = getUnitLabel(unit);
                  const isSingleUnit = !hasMultipleUnits;
                  return (
                    <Pressable
                      key={unit.id}
                      style={[
                        styles.chip,
                        styles.chipUnit,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => {
                        if (hasMultipleUnits) {
                          setSelectedUnit(unit);
                          Haptics.selectionAsync();
                        }
                      }}
                      disabled={isSingleUnit}
                    >
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={9} color={Colors.white} />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {unitLabel}
                      </Text>
                      {unit.piecesPerUnit > 1 && (
                        <Text
                          style={[
                            styles.chipSub,
                            isSelected && styles.chipSubSelected,
                          ]}
                        >
                          ({unit.piecesPerUnit})
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* ── Price + Quantity row ── */}
          <View style={styles.priceQtyRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.currentPrice}>
                {currency} {(activePrice * quantity).toFixed(2)}
              </Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  {currency} {activeComparePrice!.toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.qtyControl}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q + 1))}
              >
                <Ionicons name="add" size={14} color={Colors.text} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={14} color={Colors.text} />
              </Pressable>
            </View>
          </View>

          {/* ── Add to cart ── */}
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
            <Text style={styles.cartBtnText}>
              {isArabic ? "أضف إلى السلة" : "Add to Cart"}
            </Text>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "75%", height: 130 },
  imageCompact: { height: 100 },

  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: "800" },

  favoriteIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 2,
  },
  outOfStockOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 4,
    alignItems: "center",
  },
  outOfStockText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  /* ── Info ── */
  info: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 2,
  },

  /* ── Selector ── */
  selectorGroup: { marginTop: 8 },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginBottom: 6,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },

  /* ── Chips ── */
  chipsRow: { gap: 5, flexDirection: "row", paddingBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    position: "relative",
    overflow: "visible",
  },
  chipUnit: { minWidth: 50, paddingHorizontal: 12 },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#dbeafe",
  },
  chipDisabled: { opacity: 0.35 },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  chipTextSelected: { color: Colors.primary, fontWeight: "700" },
  chipPrice: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 1,
  },
  chipPriceSelected: { color: Colors.primary },
  chipSub: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.textLight,
    marginTop: 1,
  },
  chipSubSelected: { color: Colors.primary },
  checkBadge: {
    position: "absolute",
    bottom: -7,
    alignSelf: "center",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.white,
    zIndex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 10,
  },

  /* ── Price + Qty row ── */
  priceQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  priceBlock: { alignItems: "flex-start" },
  currentPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 9,
    color: Colors.textLight,
    textDecorationLine: "line-through",
    marginTop: 1,
  },

  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 22,
    textAlign: "center",
  },

  /* ── Add to cart ── */
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  cartBtnPressed: { opacity: 0.85 },
  cartBtnDisabled: { backgroundColor: Colors.textLight },
  cartBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
