import LoginRequiredModal from "@/src/components/LoginRequiredModal";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addToCartAsync } from "@/src/store/slices/cart.slice";
import {
  clearSelectedProduct,
  fetchProductDetail,
} from "@/src/store/slices/products.slice";
import type { ProductUnit, ProductVariant } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.75;

export default function ProductDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const { selectedProduct: product, loadingDetail } = useAppSelector(
    (state) => state.products,
  );
  const galleryRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Per-variant quantity state (variantId -> quantity)
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  // --- Variants ---
  const variants = useMemo(
    () =>
      product?.variants && product.variants.length > 0
        ? [...product.variants]
            .filter((v) => v.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [product?.variants],
  );

  const hasMultipleVariants = variants.length > 1;

  // Selected unit (applies to all variants when choosing packaging type)
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  // Get all unique units across variants
  const allUnits = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    const unitsMap = new Map<string, ProductUnit>();
    variants.forEach((v) => {
      v.units.forEach((u) => {
        if (!unitsMap.has(u.id)) {
          unitsMap.set(u.id, u);
        }
      });
    });
    return Array.from(unitsMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [variants]);

  const hasMultipleUnits = allUnits.length > 1;

  // Set default unit on mount
  useEffect(() => {
    if (allUnits.length > 0 && !selectedUnit) {
      const defaultUnit = allUnits.find((u) => u.isDefault) ?? allUnits[0];
      setSelectedUnit(defaultUnit);
    }
  }, [allUnits, selectedUnit]);

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  const isArabic = i18n.language === "ar";
  const isRTL = I18nManager.isRTL;

  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  const getVariantLabel = (variant: ProductVariant) =>
    isArabic ? variant.size : (variant.sizeEn ?? variant.size);

  // Total selected quantity and price
  const totalQuantity = useMemo(() => {
    return Object.values(variantQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [variantQuantities]);

  const totalPrice = useMemo(() => {
    if (!selectedUnit) return 0;
    return variants.reduce((sum, variant) => {
      const qty = variantQuantities[variant.id] || 0;
      const unit = variant.units.find((u) => u.id === selectedUnit.id);
      if (!unit || qty === 0) return sum;
      return sum + unit.price * qty;
    }, 0);
  }, [variants, variantQuantities, selectedUnit]);

  const handleVariantQuantityChange = useCallback(
    (variantId: string, delta: number) => {
      const variant = variants.find((v) => v.id === variantId);
      if (!variant) return;

      setVariantQuantities((prev) => {
        const currentQty = prev[variantId] || 0;
        const newQty = Math.max(0, Math.min(currentQty + delta, variant.stock));
        
        // If newQty is 0, remove from object; otherwise update
        if (newQty === 0) {
          const { [variantId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [variantId]: newQty };
      });
      Haptics.selectionAsync();
    },
    [variants],
  );

  const handleAddToCart = useCallback(() => {
    if (!product || totalQuantity === 0) return;
    
    requireAuth(async () => {
      // Add each variant with qty > 0 to cart
      const variantsToAdd = variants.filter(
        (v) => (variantQuantities[v.id] || 0) > 0
      );

      for (const variant of variantsToAdd) {
        const qty = variantQuantities[variant.id];
        await dispatch(
          addToCartAsync({
            product,
            quantity: qty,
            selectedUnit: selectedUnit ?? undefined,
            selectedVariant: variant,
          }),
        );
      }

      // Reset quantities after adding
      setVariantQuantities({});
    });
  }, [
    dispatch,
    product,
    variants,
    variantQuantities,
    selectedUnit,
    totalQuantity,
    requireAuth,
  ]);

  if (loadingDetail || !product) {
    return <Loader />;
  }

  const images = product.images?.length ? product.images : [null];

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Image Gallery */}
          <View style={styles.imageSection}>
            <FlatList
              ref={galleryRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActiveImageIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.imageWrapper}>
                  <Image
                    source={
                      item
                        ? { uri: item }
                        : require("@/assets/images/icon2.png")
                    }
                    style={styles.galleryImage}
                    contentFit="contain"
                    transition={300}
                  />
                </View>
              )}
            />

            {/* Favorite icon */}
            <View style={styles.favoriteButton}>
              <Ionicons
                name="heart-outline"
                size={26}
                color={Colors.textLight}
              />
            </View>

            {/* Back button overlay */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>

            {/* Pagination dots */}
            {images.length > 1 && (
              <View style={styles.dots}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === activeImageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Product Info Card */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.infoCard}
          >
            {/* Product Name */}
            <Text style={styles.name}>{product.name}</Text>

            {/* Category */}
            {product.categoryName && (
              <Text style={styles.categoryText}>{product.categoryName}</Text>
            )}

            {/* Unit / Packaging selector */}
            {hasMultipleUnits && (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectUnit")}
                </Text>
                <View style={styles.unitCardsRow}>
                  {allUnits.map((unit) => {
                    const isSelected = selectedUnit?.id === unit.id;
                    return (
                      <Pressable
                        key={unit.id}
                        style={[
                          styles.unitCard,
                          isSelected && styles.unitCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedUnit(unit);
                          Haptics.selectionAsync();
                        }}
                      >
                        <View style={styles.unitCardTop}>
                          <Ionicons
                            name="cube-outline"
                            size={20}
                            color={isSelected ? Colors.white : Colors.primary}
                          />
                          <Text
                            style={[
                              styles.unitCardLabel,
                              isSelected && styles.unitCardLabelSelected,
                            ]}
                          >
                            {getUnitLabel(unit)}
                          </Text>
                        </View>
                        {unit.piecesPerUnit > 1 && (
                          <Text
                            style={[
                              styles.unitCardSub,
                              isSelected && styles.unitCardSubSelected,
                            ]}
                          >
                            {unit.piecesPerUnit} {t("products.piecesCount", { count: unit.piecesPerUnit })}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Variant / Flavor / Size selector with per-variant quantity steppers */}
            {hasMultipleVariants ? (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectFlavor")}
                </Text>
                <View style={styles.flavorSteppersContainer}>
                  {variants.map((variant) => {
                    const variantOutOfStock = variant.stock === 0;
                    const quantity = variantQuantities[variant.id] || 0;
                    const unit = variant.units.find((u) => u.id === selectedUnit?.id);
                    const price = unit ? unit.price : 0;

                    return (
                      <View key={variant.id} style={styles.flavorRow}>
                        <View style={styles.flavorInfo}>
                          <Text style={styles.flavorLabel}>
                            {getVariantLabel(variant)}
                          </Text>
                          {!variantOutOfStock && price > 0 && (
                            <Text style={styles.flavorPrice}>
                              {isArabic ? "د.أ" : "JOD"} {price.toFixed(2)}
                            </Text>
                          )}
                          {variantOutOfStock && (
                            <Text style={styles.outOfStockLabel}>
                              {t("products.outOfStockOption")}
                            </Text>
                          )}
                        </View>
                        {!variantOutOfStock && (
                          <View style={styles.quantityStepper}>
                            <Pressable
                              style={[
                                styles.stepperBtn,
                                quantity === 0 && styles.stepperBtnDisabled,
                              ]}
                              onPress={() =>
                                handleVariantQuantityChange(variant.id, -1)
                              }
                              disabled={quantity === 0}
                            >
                              <Ionicons
                                name="remove"
                                size={18}
                                color={quantity === 0 ? Colors.textLight : Colors.white}
                              />
                            </Pressable>
                            <Text style={styles.stepperQty}>{quantity}</Text>
                            <Pressable
                              style={[
                                styles.stepperBtn,
                                quantity >= variant.stock && styles.stepperBtnDisabled,
                              ]}
                              onPress={() =>
                                handleVariantQuantityChange(variant.id, 1)
                              }
                              disabled={quantity >= variant.stock}
                            >
                              <Ionicons
                                name="add"
                                size={18}
                                color={
                                  quantity >= variant.stock
                                    ? Colors.textLight
                                    : Colors.white
                                }
                              />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Single variant: simple quantity selector */}
            {!hasMultipleVariants && variants.length === 1 && (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>{t("products.quantity")}</Text>
                <View style={styles.quantityStepper}>
                  <Pressable
                    style={[
                      styles.stepperBtn,
                      (variantQuantities[variants[0].id] || 0) === 0 &&
                        styles.stepperBtnDisabled,
                    ]}
                    onPress={() =>
                      handleVariantQuantityChange(variants[0].id, -1)
                    }
                    disabled={(variantQuantities[variants[0].id] || 0) === 0}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        (variantQuantities[variants[0].id] || 0) === 0
                          ? Colors.textLight
                          : Colors.white
                      }
                    />
                  </Pressable>
                  <Text style={styles.stepperQty}>
                    {variantQuantities[variants[0].id] || 0}
                  </Text>
                  <Pressable
                    style={[
                      styles.stepperBtn,
                      (variantQuantities[variants[0].id] || 0) >=
                        variants[0].stock && styles.stepperBtnDisabled,
                    ]}
                    onPress={() =>
                      handleVariantQuantityChange(variants[0].id, 1)
                    }
                    disabled={
                      (variantQuantities[variants[0].id] || 0) >= variants[0].stock
                    }
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        (variantQuantities[variants[0].id] || 0) >=
                        variants[0].stock
                          ? Colors.textLight
                          : Colors.white
                      }
                    />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={{ height: 120 }} />
          </Animated.View>
        </ScrollView>

        {/* Sticky Bottom Cart Summary Bar */}
        {totalQuantity > 0 && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <View style={styles.summaryInfo}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t("products.totalItems")}
                </Text>
                <Text style={styles.summaryValue}>{totalQuantity}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t("products.totalPrice")}
                </Text>
                <Text style={styles.summaryPrice}>
                  {isArabic ? "د.أ" : "JOD"} {totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={22} color={Colors.white} />
              <Text style={styles.addToCartText}>
                {t("products.stickyAddToCart")}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imageSection: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.xxxl + Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    ...Shadows.sm,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryImage: {
    width: SCREEN_WIDTH * 0.65,
    height: IMAGE_HEIGHT * 0.9,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  favoriteButton: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.md,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    ...Shadows.md,
  },
  backButton: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.md,
    left: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    ...Shadows.md,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xxl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  selectorSection: {
    marginTop: Spacing.lg,
  },
  selectorLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  unitCardsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  unitCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  unitCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  unitCardLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  unitCardLabelSelected: {
    color: Colors.white,
  },
  unitCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  unitCardSubSelected: {
    color: Colors.white,
    opacity: 0.9,
  },
  flavorSteppersContainer: {
    gap: Spacing.md,
  },
  flavorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
  },
  flavorInfo: {
    flex: 1,
  },
  flavorLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  flavorPrice: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "500",
  },
  outOfStockLabel: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: "600",
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnDisabled: {
    backgroundColor: Colors.border,
  },
  stepperQty: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 32,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    ...Shadows.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  summaryInfo: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  summaryPrice: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.primary,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addToCartText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
});
