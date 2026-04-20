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
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.75;

export default function ProductDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const { selectedProduct: product, loadingDetail } = useAppSelector(
    (state) => state.products,
  );
  const galleryRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const variantScrollRef = useRef<ScrollView>(null);

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

  const defaultVariant = useMemo(
    () => variants.find((v) => v.isDefault) ?? variants[0] ?? null,
    [variants],
  );

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(null);

  useEffect(() => {
    if (defaultVariant && !selectedVariant) {
      setSelectedVariant(defaultVariant);
    }
  }, [defaultVariant, selectedVariant]);

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

  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  useEffect(() => {
    if (defaultUnit && !selectedUnit) {
      setSelectedUnit(defaultUnit);
    }
  }, [defaultUnit, selectedUnit]);

  // When variant changes, reset unit selection
  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    const newUnits = [...variant.units].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const newDefault =
      newUnits.find((u) => u.isDefault) ?? newUnits[0] ?? null;
    setSelectedUnit(newDefault);
    setQuantity(variant.minOrderQuantity);
    Haptics.selectionAsync();
  }, []);

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  // Stock & min order from selected variant
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;
  const currentMinOrder =
    selectedVariant?.minOrderQuantity ?? product?.minOrder ?? 1;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    requireAuth(() => {
      dispatch(
        addToCartAsync({
          product,
          quantity,
          selectedUnit: selectedUnit ?? undefined,
          selectedVariant: selectedVariant ?? undefined,
        }),
      );
    });
  }, [dispatch, product, quantity, selectedUnit, selectedVariant, requireAuth]);

  const incrementQty = useCallback(() => {
    if (!product) return;
    setQuantity((q) => Math.min(q + 1, currentStock));
  }, [product, currentStock]);

  const decrementQty = useCallback(() => {
    if (!product) return;
    setQuantity((q) => Math.max(q - 1, currentMinOrder));
  }, [product, currentMinOrder]);

  useEffect(() => {
    if (product) {
      setQuantity(currentMinOrder);
    }
  }, [product, currentMinOrder]);

  if (loadingDetail || !product) {
    return <Loader />;
  }

  const hasDiscount = selectedUnit
    ? selectedUnit.compareAtPrice != null &&
      selectedUnit.compareAtPrice > selectedUnit.price
    : product.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? selectedUnit
      ? Math.round(
          ((selectedUnit.compareAtPrice! - selectedUnit.price) /
            selectedUnit.compareAtPrice!) *
            100,
        )
      : Math.round(
          ((product.price - product.discountPrice!) / product.price) * 100,
        )
    : 0;
  const images = product.images?.length ? product.images : [null];
  const unitPrice = selectedUnit
    ? selectedUnit.price
    : hasDiscount
      ? product.discountPrice!
      : product.price;
  const originalPrice = selectedUnit
    ? selectedUnit.compareAtPrice
    : hasDiscount
      ? product.price
      : null;
  const isArabic = i18n.language === "ar";
  const isRTL = I18nManager.isRTL;
  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;
  const getVariantLabel = (variant: ProductVariant) =>
    isArabic ? variant.size : (variant.sizeEn ?? variant.size);
  const isOutOfStock = currentStock === 0;

  const scrollVariants = (direction: "left" | "right") => {
    variantScrollRef.current?.scrollTo({ x: direction === "right" ? 200 : 0, animated: true });
  };

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
                      item ? { uri: item } : require("@/assets/images/icon.png")
                    }
                    style={styles.galleryImage}
                    contentFit="contain"
                    transition={300}
                  />
                </View>
              )}
            />

            {/* Discount badge overlay */}
            {hasDiscount ? (
              <View style={styles.discountOverlay}>
                <Text style={styles.discountOverlayText}>
                  -{discountPercent}%
                </Text>
              </View>
            ) : null}

            {/* Favorite icon */}
            <View style={styles.favoriteButton}>
              <Ionicons name="heart-outline" size={26} color={Colors.textLight} />
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
            {images.length > 1 ? (
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
            ) : null}
          </View>

          {/* Product Info Card */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.infoCard}
          >
            {/* Product Name */}
            <Text style={styles.name}>{product.name}</Text>

            {/* Category */}
            {product.categoryName ? (
              <Text style={styles.categoryText}>{product.categoryName}</Text>
            ) : null}

            {/* Most Ordered Badge */}
            {product.featured ? (
              <View style={styles.mostOrderedBadge}>
                <Text style={styles.mostOrderedText}>
                  {t("products.mostOrdered")}
                </Text>
              </View>
            ) : null}

            {/* Variant (size) selector */}
            {hasMultipleVariants ? (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectSize")}
                </Text>
                <View style={styles.variantScrollContainer}>
                  <Pressable
                    style={styles.scrollArrow}
                    onPress={() => scrollVariants(isRTL ? "right" : "left")}
                    hitSlop={8}
                  >
                    <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={20} color={Colors.textSecondary} />
                  </Pressable>
                  <ScrollView
                    ref={variantScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.variantChipsScroll}
                  >
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantOutOfStock = variant.stock === 0;
                      return (
                        <Pressable
                          key={variant.id}
                          style={[
                            styles.variantChip,
                            isSelected && styles.variantChipSelected,
                            variantOutOfStock && styles.variantChipDisabled,
                          ]}
                          onPress={() => {
                            if (!variantOutOfStock) {
                              handleVariantChange(variant);
                            }
                          }}
                          disabled={variantOutOfStock}
                        >
                          <Text
                            style={[
                              styles.variantChipLabel,
                              isSelected && styles.variantChipLabelSelected,
                              variantOutOfStock && styles.variantChipLabelDisabled,
                            ]}
                          >
                            {getVariantLabel(variant)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Pressable
                    style={styles.scrollArrow}
                    onPress={() => scrollVariants(isRTL ? "left" : "right")}
                    hitSlop={8}
                  >
                    <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={Colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Unit / Sale Type selector */}
            {units && units.length > 1 ? (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectUnit")}
                </Text>
                <View style={styles.unitCardsRow}>
                  {units.map((unit) => {
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
                        <Text
                          style={[
                            styles.unitCardSub,
                            isSelected && styles.unitCardSubSelected,
                          ]}
                        >
                          {t("products.pricePerUnit", { unit: getUnitLabel(unit) })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Price comparison card */}
            {units && units.length > 1 ? (
              <View style={styles.priceComparisonCard}>
                {units.map((unit, idx) => (
                  <React.Fragment key={unit.id}>
                    {idx > 0 ? <View style={styles.priceDivider} /> : null}
                    <View style={styles.priceComparisonCol}>
                      <Text style={styles.priceComparisonLabel}>
                        {unit.piecesPerUnit > 1
                          ? t("products.pricePerUnitCount", {
                              unit: getUnitLabel(unit),
                              count: unit.piecesPerUnit,
                            })
                          : t("products.pricePerUnit", { unit: getUnitLabel(unit) })}
                      </Text>
                      <Text style={styles.priceComparisonValue}>
                        {unit.price.toFixed(2)} {t("common.currency")}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            ) : (
              /* Single unit price display */
              <View style={styles.singlePriceSection}>
                <Text style={styles.singlePrice}>
                  {unitPrice.toFixed(2)} {t("common.currency")}
                </Text>
                {hasDiscount && originalPrice ? (
                  <Text style={styles.originalPrice}>
                    {originalPrice.toFixed(2)} {t("common.currency")}
                  </Text>
                ) : null}
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.selectorLabel}>
                {t("products.quantity")}
              </Text>
              <View style={styles.quantityPill}>
                <Pressable
                  onPress={() => {
                    decrementQty();
                    Haptics.selectionAsync();
                  }}
                  style={[styles.qtyButton, quantity <= currentMinOrder && styles.qtyButtonDisabled]}
                  disabled={quantity <= currentMinOrder}
                >
                  <Ionicons
                    name="remove"
                    size={22}
                    color={Colors.white}
                  />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable
                  onPress={() => {
                    incrementQty();
                    Haptics.selectionAsync();
                  }}
                  style={[styles.qtyButton, quantity >= currentStock && styles.qtyButtonDisabled]}
                  disabled={quantity >= currentStock}
                >
                  <Ionicons
                    name="add"
                    size={22}
                    color={Colors.white}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Add to Cart Button */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.addToCartButton, isOutOfStock && styles.addToCartDisabled]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={22} color={Colors.white} />
            <Text style={styles.addToCartText}>
              {t("products.addToCart")}
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
    marginTop: Spacing.md,
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
    width: 22,
  },
  discountOverlay: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.sm,
    left: Spacing.lg,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    minWidth: 56,
    alignItems: "center",
  },
  discountOverlayText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "800",
  },
  favoriteButton: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.sm,
    right: Spacing.lg,
  },
  backButton: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.sm,
    left: Spacing.lg,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    ...Shadows.md,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 34,
  },
  categoryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  mostOrderedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  mostOrderedText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.success,
  },
  selectorSection: {
    marginTop: Spacing.xl,
  },
  selectorLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "right",
    marginBottom: Spacing.sm,
  },
  // Variant (size) horizontal scroll with arrows
  variantScrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scrollArrow: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  variantChipsScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  variantChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    minWidth: 80,
  },
  variantChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  variantChipDisabled: {
    opacity: 0.35,
  },
  variantChipLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  variantChipLabelSelected: {
    color: Colors.white,
    fontWeight: "700",
  },
  variantChipLabelDisabled: {
    textDecorationLine: "line-through",
    color: Colors.textLight,
  },
  // Unit selector cards
  unitCardsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  unitCard: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  unitCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unitCardLabel: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.text,
  },
  unitCardLabelSelected: {
    color: Colors.white,
  },
  unitCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  unitCardSubSelected: {
    color: "rgba(255,255,255,0.8)",
  },
  // Price comparison card
  priceComparisonCard: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  priceComparisonCol: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  priceDivider: {
    width: 1.5,
    backgroundColor: Colors.border,
  },
  priceComparisonLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  priceComparisonValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.primary,
  },
  // Single price display
  singlePriceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  singlePrice: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  // Quantity selector
  quantitySection: {
    marginTop: Spacing.xxl,
    alignItems: "center",
  },
  quantityPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    ...Shadows.sm,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  qtyButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
  qtyText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 48,
    textAlign: "center",
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg + 2,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  addToCartDisabled: {
    backgroundColor: Colors.textLight,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "700",
  },
});
