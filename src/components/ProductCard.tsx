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
import type { Product, ProductUnit } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
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
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const isArabic = i18n.language === "ar";
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const scale = useSharedValue(1);

  const units = useMemo(
    () =>
      product.units && product.units.length > 0
        ? [...product.units].sort((a, b) => a.sortOrder - b.sortOrder)
        : null,
    [product.units],
  );

  const defaultUnit = useMemo(
    () => units?.find((u) => u.isDefault) ?? units?.[0] ?? null,
    [units],
  );

  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(
    defaultUnit,
  );

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

  const handleAddToCart = useCallback(() => {
    requireAuth(() => {
      dispatch(
        addToCartAsync({
          product,
          quantity: 1,
          selectedUnit: selectedUnit ?? undefined,
        }),
      );
    });
  }, [dispatch, product, selectedUnit, router, requireAuth, t]);

  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  return (
    <>
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
          {/* Discount badge */}
          {hasDiscount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>-{discountPercent}%</Text>
            </View>
          ) : null}
          {/* Low stock indicator */}
          {isLowStock ? (
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>
                {product.stock} {t("products.left")}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.name, isRTL && styles.textRTL]}
            numberOfLines={2}
          >
            {product.name}
          </Text>
          {!compact && product.categoryName ? (
            <Text
              style={[styles.category, isRTL && styles.textRTL]}
              numberOfLines={1}
            >
              {product.categoryName}
            </Text>
          ) : null}

          {/* Unit selector chips */}
          {units ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.unitsScroll}
              contentContainerStyle={[
                styles.unitsRow,
                isRTL && styles.unitsRowRTL,
              ]}
            >
              {units.map((unit) => {
                const isSelected = selectedUnit?.id === unit.id;
                const isDisabled = units.length === 1;
                return (
                  <Pressable
                    key={unit.id}
                    style={[
                      styles.unitChip,
                      isSelected && styles.unitChipSelected,
                      isDisabled && styles.unitChipDisabled,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setSelectedUnit(unit);
                        Haptics.selectionAsync();
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        isSelected && styles.unitChipTextSelected,
                        isDisabled && styles.unitChipTextDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      {getUnitLabel(unit)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Price row */}
          <View style={[styles.priceRow, isRTL && styles.priceRowRTL]}>
            <Text style={[styles.price, isRTL && styles.textRTL]}>
              {activePrice.toFixed(2)} {t("common.currency")}
            </Text>
            {hasDiscount ? (
              <Text style={styles.originalPrice}>
                {activeComparePrice!.toFixed(2)} {t("common.currency")}
              </Text>
            ) : null}
          </View>

          {/* Add to cart button */}
          <Pressable
            style={({ pressed }) => [
              styles.addToCartBtn,
              pressed && styles.addToCartBtnPressed,
            ]}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart" size={16} color={Colors.white} />
            <Text style={styles.addToCartText}>{t("products.addToCart")}</Text>
          </Pressable>
        </View>
      </AnimatedPressable>
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
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
    flex: 1,
    width: undefined,
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
  textRTL: {
    textAlign: "right",
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  unitsScroll: {
    marginBottom: Spacing.sm,
    marginHorizontal: -2,
  },
  unitsRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 2,
  },
  unitsRowRTL: {
    flexDirection: "row-reverse",
  },
  unitChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  unitChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  unitChipTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  unitChipDisabled: {
    opacity: 0.6,
  },
  unitChipTextDisabled: {
    color: Colors.textLight,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  priceRowRTL: {
    flexDirection: "row-reverse",
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
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  addToCartBtnPressed: {
    opacity: 0.8,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
