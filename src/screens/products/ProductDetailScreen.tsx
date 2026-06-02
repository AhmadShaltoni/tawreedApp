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
import { addToCartAsync, fetchCart } from "@/src/store/slices/cart.slice";
import {
  clearSelectedProduct,
  fetchProductDetail,
} from "@/src/store/slices/products.slice";
import type { ProductUnit, ProductVariant, VariantOption } from "@/src/types";
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
  Alert,
  Dimensions,
  FlatList,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
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
  const cartItems = useAppSelector((state) => state.cart.items);
  const galleryRef = useRef<FlatList>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");
  const [showAddedToCart, setShowAddedToCart] = useState(false);

  // --- Variants (Sizes) ---
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

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  useEffect(() => {
    if (defaultVariant && !selectedVariant) {
      setSelectedVariant(defaultVariant);
    }
  }, [defaultVariant, selectedVariant]);

  const hasMultipleVariants = variants.length > 1;

  // --- Options (Flavors) for selected variant ---
  const options = useMemo(
    () =>
      selectedVariant?.options && selectedVariant.options.length > 0
        ? [...selectedVariant.options]
            .filter((o) => o.isActive !== false)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [selectedVariant?.options],
  );

  const hasOptions = options.length > 0;

  const [selectedOption, setSelectedOption] = useState<VariantOption | null>(
    null,
  );

  // Auto-select first available option when variant changes
  useEffect(() => {
    if (hasOptions) {
      const availableOpt = options.find((o) => o.stock > 0) ?? options[0];
      setSelectedOption(availableOpt);
    } else {
      setSelectedOption(null);
    }
  }, [hasOptions, options]);

  // --- Units from selected variant ---
  const units = useMemo(
    () =>
      selectedVariant && selectedVariant.units.length > 0
        ? [...selectedVariant.units].sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [selectedVariant],
  );

  const defaultUnit = useMemo(
    () => units.find((u) => u.isDefault) ?? units[0] ?? null,
    [units],
  );

  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);

  useEffect(() => {
    if (
      defaultUnit &&
      (!selectedUnit || !units.find((u) => u.id === selectedUnit.id))
    ) {
      setSelectedUnit(defaultUnit);
    }
  }, [defaultUnit, units, selectedUnit]);

  const hasMultipleUnits = units.length > 1;

  // When variant changes, reset unit, option, and quantity
  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    const newUnits = [...variant.units].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const newDefault = newUnits.find((u) => u.isDefault) ?? newUnits[0] ?? null;
    setSelectedUnit(newDefault);
    setQuantity(variant.minOrderQuantity || 1);
    Haptics.selectionAsync();
  }, []);

  // When option changes
  const handleOptionChange = useCallback((option: VariantOption) => {
    if (option.stock === 0) return;
    setSelectedOption(option);
    setActiveImageIndex(0);
    galleryRef.current?.scrollToOffset({ offset: 0, animated: false });
    Haptics.selectionAsync();
  }, []);

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  // Stock & min order
  const currentStock = selectedOption
    ? selectedOption.stock
    : (selectedVariant?.stock ?? product?.stock ?? 0);
  const currentMinOrder =
    selectedVariant?.minOrderQuantity ?? product?.minOrder ?? 1;

  // Calculate how many of this exact product/variant/option are already in cart
  const quantityInCart = useMemo(() => {
    if (!product || !selectedVariant) return 0;
    return cartItems
      .filter((item) => {
        if (item.product.id !== product.id) return false;
        if (item.variant?.id !== selectedVariant.id) return false;
        if (selectedOption && item.selectedOption?.id !== selectedOption.id)
          return false;
        if (!selectedOption && item.selectedOption) return false;
        return true;
      })
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product, selectedVariant, selectedOption]);

  // Available stock considering what's already in cart
  const availableStock = Math.max(0, currentStock - quantityInCart);
  const isLowStock = currentStock > 0 && currentStock < 5;

  useEffect(() => {
    if (product) {
      setQuantity(Math.min(currentMinOrder, availableStock || currentMinOrder));
    }
  }, [product, currentMinOrder, availableStock]);

  const isArabic = i18n.language === "ar";
  const isRTL = I18nManager.isRTL;

  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  const getVariantLabel = (variant: ProductVariant) =>
    isArabic ? variant.size : (variant.sizeEn ?? variant.size);

  const getOptionLabel = (option: VariantOption) =>
    isArabic ? option.name : (option.nameEn ?? option.name);

  // Price calculation considering option.priceOverride
  const unitPrice = useMemo(() => {
    if (!selectedUnit) return 0;
    if (selectedOption?.priceOverride) {
      return selectedOption.priceOverride;
    }
    return selectedUnit.price;
  }, [selectedUnit, selectedOption]);

  const totalPrice = unitPrice * quantity;

  const hasDiscount = selectedUnit
    ? selectedUnit.compareAtPrice != null &&
      selectedUnit.compareAtPrice > selectedUnit.price
    : false;
  const originalPrice =
    hasDiscount && selectedUnit ? selectedUnit.compareAtPrice : null;

  const isOutOfStock = currentStock === 0;
  const cannotAddToCart = isOutOfStock || availableStock <= 0;

  const incrementQty = useCallback(() => {
    setQuantity((q) => Math.min(q + 1, availableStock));
    Haptics.selectionAsync();
  }, [availableStock]);

  const decrementQty = useCallback(() => {
    setQuantity((q) => Math.max(q - 1, currentMinOrder));
    Haptics.selectionAsync();
  }, [currentMinOrder]);

  const handleAddToCart = useCallback(() => {
    if (!product || isOutOfStock) return;

    if (availableStock <= 0) {
      Alert.alert(
        "",
        t("products.stockExceeded", {
          requested: quantity,
          available: currentStock,
          inCart: quantityInCart,
        }),
      );
      return;
    }

    // Check if adding this quantity would exceed available stock
    if (quantity > availableStock) {
      Alert.alert(
        "",
        t("products.stockExceeded", {
          requested: quantity,
          available: currentStock,
          inCart: quantityInCart,
        }),
      );
      return;
    }

    requireAuth(() => {
      dispatch(
        addToCartAsync({
          product,
          quantity,
          selectedUnit: selectedUnit ?? undefined,
          selectedVariant: selectedVariant ?? undefined,
          selectedOption: selectedOption ?? undefined,
          note: itemNote.trim() || undefined,
        }),
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          setShowAddedToCart(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => setShowAddedToCart(false), 1800);
        } else {
          const message =
            typeof result.payload === "string"
              ? result.payload
              : t("cart.validationError");
          Alert.alert("", message);
          dispatch(fetchCart());
        }
      });
      setItemNote("");
    });
  }, [
    dispatch,
    product,
    quantity,
    selectedUnit,
    selectedVariant,
    selectedOption,
    itemNote,
    isOutOfStock,
    requireAuth,
    availableStock,
    currentStock,
    quantityInCart,
    t,
  ]);

  if (loadingDetail || !product) {
    return <Loader />;
  }

  const images = product.images?.length ? product.images : [null];

  // Image priority: option > variant > first option in variant > product main image
  const firstImageInSelectedVariant =
    selectedVariant?.options?.find((o) => o.image)?.image;

  const displayImage =
    selectedOption?.image ||
    selectedVariant?.image ||
    firstImageInSelectedVariant ||
    product.images?.[0] ||
    null;

  const displayImages = displayImage ? [displayImage] : images;

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Image Gallery */}
          <View style={styles.imageSection}>
            <FlatList
              ref={galleryRef}
              data={displayImages}
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
            {displayImages.length > 1 && (
              <View style={styles.dots}>
                {displayImages.map((_, i) => (
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

            {/* Variant / Size selector */}
            {hasMultipleVariants && (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectVariant")}
                </Text>
                <View style={styles.chipRow}>
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantOutOfStock = variant.stock === 0;
                    return (
                      <Pressable
                        key={variant.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                          variantOutOfStock && styles.chipDisabled,
                        ]}
                        onPress={() =>
                          !variantOutOfStock && handleVariantChange(variant)
                        }
                        disabled={variantOutOfStock}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                            variantOutOfStock && styles.chipTextDisabled,
                          ]}
                        >
                          {getVariantLabel(variant)}
                        </Text>
                        {variantOutOfStock && (
                          <Text style={styles.chipSubDisabled}>
                            {t("products.outOfStockOption")}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Options / Flavor selector */}
            {hasOptions && (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.selectFlavor")}
                </Text>
                <View style={styles.optionsContainer}>
                  {options.map((option) => {
                    const isSelected = selectedOption?.id === option.id;
                    const optOutOfStock = option.stock === 0;
                    return (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                          optOutOfStock && styles.optionRowDisabled,
                        ]}
                        onPress={() => handleOptionChange(option)}
                        disabled={optOutOfStock}
                      >
                        <View style={styles.optionInfo}>
                          <View style={styles.optionNameRow}>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color={Colors.primary}
                                style={{ marginEnd: Spacing.xs }}
                              />
                            )}
                            <Text
                              style={[
                                styles.optionLabel,
                                isSelected && styles.optionLabelSelected,
                                optOutOfStock && styles.optionLabelDisabled,
                              ]}
                            >
                              {getOptionLabel(option)}
                            </Text>
                          </View>
                          {optOutOfStock && (
                            <Text style={styles.optionOutOfStock}>
                              {t("products.optionOutOfStock")}
                            </Text>
                          )}
                          {!optOutOfStock &&
                            option.priceOverride != null &&
                            option.priceOverride > 0 && (
                              <Text style={styles.optionPrice}>
                                {isArabic ? "\u062f.\u0623" : "JOD"}{" "}
                                {option.priceOverride.toFixed(2)}{" "}
                                <Text style={styles.optionPriceLabel}>
                                  ({t("products.specialPrice")})
                                </Text>
                              </Text>
                            )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Unit / Packaging selector */}
            {hasMultipleUnits ? (
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
                        {unit.piecesPerUnit > 1 && (
                          <Text
                            style={[
                              styles.unitCardSub,
                              isSelected && styles.unitCardSubSelected,
                            ]}
                          >
                            {unit.piecesPerUnit}{" "}
                            {t("products.piecesCount", {
                              count: unit.piecesPerUnit,
                            })}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : selectedUnit ? (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.unitType")}
                </Text>
                <View style={styles.unitInfoRow}>
                  <View style={styles.unitInfoCard}>
                    <Ionicons
                      name="cube-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.unitInfoLabel}>
                      {getUnitLabel(selectedUnit)}
                    </Text>
                  </View>
                  {selectedUnit.piecesPerUnit > 1 && (
                    <View style={styles.unitInfoCard}>
                      <Ionicons
                        name="layers-outline"
                        size={20}
                        color={Colors.primary}
                      />
                      <Text style={styles.unitInfoLabel}>
                        {t("products.piecesCount", {
                          count: selectedUnit.piecesPerUnit,
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* Quantity selector */}
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>{t("products.quantity")}</Text>
              <View style={styles.quantityStepper}>
                <Pressable
                  style={[
                    styles.stepperBtn,
                    quantity <= currentMinOrder && styles.stepperBtnDisabled,
                  ]}
                  onPress={decrementQty}
                  disabled={quantity <= currentMinOrder}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={
                      quantity <= currentMinOrder
                        ? Colors.textLight
                        : Colors.white
                    }
                  />
                </Pressable>
                <Text style={styles.stepperQty}>{quantity}</Text>
                <Pressable
                  style={[
                    styles.stepperBtn,
                    quantity >= availableStock && styles.stepperBtnDisabled,
                  ]}
                  onPress={incrementQty}
                  disabled={quantity >= availableStock || isOutOfStock}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      quantity >= availableStock
                        ? Colors.textLight
                        : Colors.white
                    }
                  />
                </Pressable>
              </View>
            </View>
            {/* Low stock warning */}
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.lowStockText}>
                  {t("products.lowStockWarning", { count: currentStock })}
                </Text>
              </View>
            )}
            {/* Per-product note */}
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>{t("products.itemNote")}</Text>
              <TextInput
                style={styles.noteInput}
                placeholder={t("products.itemNotePlaceholder")}
                placeholderTextColor={Colors.textLight}
                value={itemNote}
                onChangeText={setItemNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* Product Description */}
            {product.description ? (
              <View style={styles.selectorSection}>
                <Text style={styles.selectorLabel}>
                  {t("products.description")}
                </Text>
                <Text style={styles.descriptionText}>
                  {product.description}
                </Text>
              </View>
            ) : null}

            <View style={{ height: 140 }} />
          </Animated.View>
        </ScrollView>

        {/* Sticky Bottom Cart Bar */}
        <Animated.View
          entering={FadeInUp.duration(300)}
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          <View style={styles.summaryInfo}>
            {/* Price row */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("products.totalPrice")}
              </Text>
              <View style={styles.priceRow}>
                {originalPrice != null && (
                  <Text style={styles.originalPrice}>
                    {isArabic ? "\u062f.\u0623" : "JOD"}{" "}
                    {originalPrice.toFixed(2)}
                  </Text>
                )}
                <Text style={styles.summaryPrice}>
                  {isArabic ? "\u062f.\u0623" : "JOD"} {totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            style={[
              styles.addToCartButton,
              cannotAddToCart && styles.addToCartButtonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={cannotAddToCart}
          >
            <Ionicons name="cart-outline" size={22} color={Colors.white} />
            <Text style={styles.addToCartText}>
              {cannotAddToCart
                ? t("products.outOfStock")
                : t("products.stickyAddToCart")}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Added to Cart Toast */}
        {showAddedToCart && (
          <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(250)}
            style={styles.addedToCartToast}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.addedToCartToastText}>
              {t("products.addedToCartAnim")}
            </Text>
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
  lowStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.error + "12",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    alignSelf: "flex-start",
  },
  lowStockText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.error,
  },
  selectorSection: {
    marginTop: Spacing.lg,
  },
  selectorLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  descriptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Chips (for variants/sizes)
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.primary,
  },
  chipTextDisabled: {
    color: Colors.textLight,
  },
  chipSubDisabled: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 2,
  },
  // Options (flavors)
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionInfo: {
    flex: 1,
  },
  optionNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionLabelDisabled: {
    color: Colors.textLight,
  },
  optionOutOfStock: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: "600",
    marginTop: 2,
  },
  optionPrice: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 2,
  },
  optionPriceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "400",
  },
  // Units
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
  // Unit info (single unit display)
  unitInfoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  unitInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary + "10",
    borderWidth: 1.5,
    borderColor: Colors.primary + "30",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  unitInfoLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  // Quantity
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
  // Note input
  noteInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
  },
  // Bottom bar
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  originalPrice: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textDecorationLine: "line-through",
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
  addToCartButtonDisabled: {
    backgroundColor: Colors.border,
  },
  addToCartText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  addedToCartToast: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(34,197,94,0.92)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  addedToCartToastText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.white,
  },
});
