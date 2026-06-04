import { BorderRadius, Colors, FontSize, Shadows } from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { addToCartAsync, fetchCart } from "@/src/store/slices/cart.slice";
import type {
    Product,
    ProductUnit,
    ProductVariant,
    VariantOption,
} from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
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
    Animated,
    Dimensions,
    I18nManager,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoginRequiredModal from "./LoginRequiredModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_SIZE = 110;
const SWIPE_THRESHOLD = 120;

interface ProductOptionsBottomSheetProps {
  visible: boolean;
  product: Product;
  initialVariant?: ProductVariant | null;
  initialUnit?: ProductUnit | null;
  onClose: () => void;
  onAdded?: () => void;
}

export default function ProductOptionsBottomSheet({
  visible,
  product,
  initialVariant,
  initialUnit,
  onClose,
  onAdded,
}: ProductOptionsBottomSheetProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { requireAuth, showLoginModal, setShowLoginModal } = useAuthGuard();
  const cartItems = useAppSelector((s) => s.cart.items);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

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
    () =>
      initialVariant ??
      variants.find((v) => v.isDefault) ??
      variants[0] ??
      null,
    [variants, initialVariant],
  );

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    defaultVariant,
  );

  const hasMultipleVariants = variants.length > 1;

  // --- Options (flavors, etc.) ---
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

  // Auto-select first option when variant changes
  useEffect(() => {
    if (hasOptions) {
      const availableOpt = options.find((o) => o.stock > 0) ?? options[0];
      setSelectedOption(availableOpt);
    } else {
      setSelectedOption(null);
    }
  }, [hasOptions, options]);

  // --- Units ---
  const units = useMemo(
    () =>
      selectedVariant && selectedVariant.units.length > 0
        ? [...selectedVariant.units].sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    [selectedVariant],
  );

  const defaultUnit = useMemo(
    () =>
      (initialUnit && units.find((u) => u.id === initialUnit.id)
        ? initialUnit
        : null) ??
      units.find((u) => u.isDefault) ??
      units[0] ??
      null,
    [units, initialUnit],
  );

  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(
    defaultUnit,
  );

  const hasMultipleUnits = units.length > 1;

  // --- Quantity & Note ---
  const [quantity, setQuantity] = useState(1);
  const [itemNote, setItemNote] = useState("");

  // --- Stock ---
  const currentStock = selectedOption
    ? selectedOption.stock
    : (selectedVariant?.stock ?? product.stock);
  const isOutOfStock = currentStock === 0;

  const quantityInCart = useMemo(() => {
    if (!selectedVariant) return 0;
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
  }, [cartItems, product.id, selectedVariant, selectedOption]);

  const availableStock = Math.max(0, currentStock - quantityInCart);

  // --- Pricing ---
  const unitPrice = useMemo(() => {
    if (!selectedUnit) return product.price;
    if (selectedOption?.priceOverride) {
      return selectedOption.priceOverride;
    }
    return selectedUnit.price;
  }, [selectedUnit, selectedOption, product.price]);

  const totalPrice = unitPrice * quantity;

  const hasDiscount = selectedUnit
    ? selectedUnit.compareAtPrice != null &&
      selectedUnit.compareAtPrice > selectedUnit.price
    : false;

  const comparePrice = hasDiscount ? selectedUnit!.compareAtPrice : null;

  const currency = isArabic ? "د.أ" : "JOD";

  // --- Labels ---
  const getVariantLabel = (variant: ProductVariant) =>
    isArabic ? variant.size : (variant.sizeEn ?? variant.size);

  const getOptionLabel = (option: VariantOption) =>
    isArabic ? option.name : (option.nameEn ?? option.name);

  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  const getVariantPrice = (variant: ProductVariant): number => {
    const vUnits = [...variant.units].sort((a, b) => a.sortOrder - b.sortOrder);
    const vDefault = vUnits.find((u) => u.isDefault) ?? vUnits[0];
    return vDefault ? vDefault.price : product.price;
  };

  // --- Handlers ---
  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    const newUnits = [...variant.units].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const newDefault = newUnits.find((u) => u.isDefault) ?? newUnits[0] ?? null;
    setSelectedUnit(newDefault);
    setQuantity(1);
    Haptics.selectionAsync();
  }, []);

  const handleOptionChange = useCallback((option: VariantOption) => {
    if (option.stock === 0) return;
    setSelectedOption(option);
    Haptics.selectionAsync();
  }, []);

  // --- Animation ---
  const animateIn = useCallback(() => {
    setModalVisible(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [backdropAnim, slideAnim]);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        callback?.();
      });
    },
    [backdropAnim, slideAnim],
  );

  useEffect(() => {
    if (visible) {
      // Reset state
      setSelectedVariant(defaultVariant);
      setSelectedUnit(defaultUnit);
      setSelectedOption(null);
      setQuantity(1);
      setItemNote("");
      setShowSuccess(false);
      animateIn();
    } else if (modalVisible) {
      animateOut();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateOut(onClose);
  }, [animateOut, onClose]);

  // --- Pan responder for swipe-to-dismiss ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          slideAnim.setValue(g.dy);
          backdropAnim.setValue(Math.max(0, 1 - g.dy / 400));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_THRESHOLD || g.vy > 0.5) {
          handleClose();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  // --- Add to cart ---
  const handleAddToCart = useCallback(() => {
    if (isOutOfStock || availableStock <= 0) return;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          // Show success
          setShowSuccess(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(successAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            successAnim.setValue(0);
            setShowSuccess(false);
            animateOut(() => {
              onClose();
              onAdded?.();
            });
          }, 1200);
        } else {
          const message =
            typeof result.payload === "string"
              ? result.payload
              : t("cart.validationError");
          Alert.alert("", message);
          dispatch(fetchCart());
        }
      });
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
    availableStock,
    currentStock,
    quantityInCart,
    requireAuth,
    animateOut,
    onClose,
    onAdded,
    successAnim,
    t,
  ]);

  if (!modalVisible) return null;

  const productDescription = isArabic
    ? (product.descriptionAr ?? product.description)
    : product.description;

  return (
    <>
      <Modal
        transparent
        visible={modalVisible}
        statusBarTranslucent
        animationType="none"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [{ translateY: slideAnim }],
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.handleArea} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Close Button */}
            <Pressable
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={12}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </Pressable>

            {/* Product Image — Circular, overlapping top */}
            <View style={styles.imageContainer}>
              <View style={styles.imageRing}>
                <Image
                  source={
                    selectedOption?.image ||
                    selectedVariant?.image ||
                    selectedVariant?.options?.find((o) => o.image)?.image ||
                    product.images?.[0]
                      ? {
                          uri: (selectedOption?.image ||
                            selectedVariant?.image ||
                            selectedVariant?.options?.find((o) => o.image)
                              ?.image ||
                            product.images?.[0])!,
                        }
                      : require("@/assets/images/icon2.png")
                  }
                  style={styles.productImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                {productDescription ? (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {productDescription}
                  </Text>
                ) : null}
                <View style={styles.priceRow}>
                  <Text style={styles.basePrice}>
                    {currency} {unitPrice.toFixed(2)}
                  </Text>
                  {hasDiscount && comparePrice != null && (
                    <Text style={styles.comparePrice}>
                      {currency} {comparePrice.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Variant Selector */}
              {hasMultipleVariants && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="pricetag-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>
                      {t("products.selectSize")}
                    </Text>
                  </View>
                  <View style={styles.optionsGrid}>
                    {variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantOutOfStock = variant.stock === 0;
                      const variantPrice = getVariantPrice(variant);
                      return (
                        <Pressable
                          key={variant.id}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipSelected,
                            variantOutOfStock && styles.optionChipDisabled,
                          ]}
                          onPress={() => {
                            if (!variantOutOfStock)
                              handleVariantChange(variant);
                          }}
                          disabled={variantOutOfStock}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              isSelected && styles.optionChipTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {getVariantLabel(variant)}
                          </Text>
                          <Text
                            style={[
                              styles.optionChipPrice,
                              isSelected && styles.optionChipPriceSelected,
                            ]}
                          >
                            {currency} {variantPrice.toFixed(2)}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Ionicons
                                name="checkmark"
                                size={10}
                                color={Colors.white}
                              />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Options Selector (Flavors, etc.) */}
              {hasOptions && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="color-palette-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>
                      {t("products.selectFlavor")}
                    </Text>
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>
                        {isArabic ? "مطلوب" : "Required"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.optionsGrid}>
                    {options.map((option) => {
                      const isSelected = selectedOption?.id === option.id;
                      const optionOutOfStock = option.stock === 0;
                      return (
                        <Pressable
                          key={option.id}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipSelected,
                            optionOutOfStock && styles.optionChipDisabled,
                          ]}
                          onPress={() => handleOptionChange(option)}
                          disabled={optionOutOfStock}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              isSelected && styles.optionChipTextSelected,
                              optionOutOfStock && styles.optionChipTextDisabled,
                            ]}
                            numberOfLines={1}
                          >
                            {getOptionLabel(option)}
                          </Text>
                          {option.priceOverride != null && (
                            <Text
                              style={[
                                styles.optionChipPrice,
                                isSelected && styles.optionChipPriceSelected,
                              ]}
                            >
                              {currency} {option.priceOverride.toFixed(2)}
                            </Text>
                          )}
                          {optionOutOfStock && (
                            <Text style={styles.optionOutOfStock}>
                              {t("products.outOfStockOption")}
                            </Text>
                          )}
                          {isSelected && !optionOutOfStock && (
                            <View style={styles.selectedBadge}>
                              <Ionicons
                                name="checkmark"
                                size={10}
                                color={Colors.white}
                              />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Unit Selector */}
              {hasMultipleUnits && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="cube-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.sectionTitle}>
                      {t("products.selectUnit")}
                    </Text>
                  </View>
                  <View style={styles.optionsGrid}>
                    {units.map((unit) => {
                      const isSelected = selectedUnit?.id === unit.id;
                      return (
                        <Pressable
                          key={unit.id}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipSelected,
                          ]}
                          onPress={() => {
                            setSelectedUnit(unit);
                            Haptics.selectionAsync();
                          }}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              isSelected && styles.optionChipTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {getUnitLabel(unit)}
                          </Text>
                          {unit.piecesPerUnit > 1 && (
                            <Text
                              style={[
                                styles.optionChipSub,
                                isSelected && styles.optionChipSubSelected,
                              ]}
                            >
                              ({unit.piecesPerUnit} {isArabic ? "قطعة" : "pcs"})
                            </Text>
                          )}
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Ionicons
                                name="checkmark"
                                size={10}
                                color={Colors.white}
                              />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Note Input */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    {t("products.itemNote")}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.noteInput,
                    { textAlign: I18nManager.isRTL ? "right" : "left" },
                  ]}
                  placeholder={t("products.itemNotePlaceholder")}
                  placeholderTextColor={Colors.textLight}
                  value={itemNote}
                  onChangeText={setItemNote}
                  multiline
                  maxLength={200}
                  numberOfLines={2}
                />
              </View>

              {/* Quantity Selector */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="layers-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    {t("products.quantity")}
                  </Text>
                </View>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={[
                      styles.qtyButton,
                      quantity <= 1 && styles.qtyButtonDisabled,
                    ]}
                    onPress={() => {
                      setQuantity((q) => Math.max(1, q - 1));
                      Haptics.selectionAsync();
                    }}
                    disabled={quantity <= 1}
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={quantity <= 1 ? Colors.textLight : Colors.primary}
                    />
                  </Pressable>
                  <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyNumber}>{quantity}</Text>
                  </View>
                  <Pressable
                    style={[
                      styles.qtyButton,
                      quantity >= availableStock && styles.qtyButtonDisabled,
                    ]}
                    onPress={() => {
                      setQuantity((q) =>
                        Math.min(q + 1, Math.max(1, availableStock)),
                      );
                      Haptics.selectionAsync();
                    }}
                    disabled={quantity >= availableStock}
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={
                        quantity >= availableStock
                          ? Colors.textLight
                          : Colors.primary
                      }
                    />
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.addToCartBtn,
                  pressed && styles.addToCartBtnPressed,
                  (isOutOfStock || availableStock <= 0) &&
                    styles.addToCartBtnDisabled,
                ]}
                onPress={handleAddToCart}
                disabled={isOutOfStock || availableStock <= 0}
              >
                <Ionicons name="cart" size={20} color={Colors.white} />
                <Text style={styles.addToCartText}>
                  {isOutOfStock
                    ? t("products.outOfStock")
                    : `${t("products.addToCart")} - ${currency} ${totalPrice.toFixed(2)}`}
                </Text>
              </Pressable>
            </View>

            {/* Success Overlay */}
            {showSuccess && (
              <Animated.View
                style={[
                  styles.successOverlay,
                  {
                    opacity: successAnim,
                    transform: [
                      {
                        scale: successAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.successCircle}>
                  <Ionicons
                    name="checkmark-circle"
                    size={56}
                    color={Colors.success}
                  />
                </View>
                <Text style={styles.successText}>
                  {t("products.addedToCartAnim")}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </Modal>
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  /* ── Sheet ── */
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Shadows.lg,
    shadowOpacity: 0.15,
    elevation: 20,
  },

  /* ── Handle ── */
  handleArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },

  /* ── Close ── */
  closeBtn: {
    position: "absolute",
    top: 14,
    left: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Image ── */
  imageContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  imageRing: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.primaryXLight,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  productImage: {
    width: IMAGE_SIZE - 16,
    height: IMAGE_SIZE - 16,
    borderRadius: (IMAGE_SIZE - 16) / 2,
  },

  /* ── Scroll ── */
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  /* ── Product Info ── */
  productInfo: {
    alignItems: "center",
    paddingVertical: 12,
  },
  productName: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 26,
  },
  productDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  basePrice: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.primary,
  },
  comparePrice: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },

  /* ── Divider ── */
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  /* ── Section ── */
  section: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: Colors.secondary + "18",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.secondary,
  },

  /* ── Option Chips ── */
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    position: "relative",
  },
  optionChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXLight,
  },
  optionChipDisabled: {
    opacity: 0.4,
    backgroundColor: Colors.inputBackground,
  },
  optionChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  optionChipTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  optionChipTextDisabled: {
    color: Colors.textLight,
  },
  optionChipPrice: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textLight,
    marginTop: 2,
  },
  optionChipPriceSelected: {
    color: Colors.primary,
  },
  optionChipSub: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textLight,
    marginTop: 1,
  },
  optionChipSubSelected: {
    color: Colors.primary,
  },
  optionOutOfStock: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.error,
    marginTop: 2,
  },
  selectedBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },

  /* ── Note ── */
  noteInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: FontSize.sm,
    color: Colors.text,
    minHeight: 50,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* ── Quantity ── */
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXLight,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
  },
  qtyDisplay: {
    minWidth: 50,
    alignItems: "center",
  },
  qtyNumber: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
  },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    gap: 8,
    ...Shadows.md,
  },
  addToCartBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addToCartBtnDisabled: {
    backgroundColor: Colors.textLight,
  },
  addToCartText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "800",
  },

  /* ── Success ── */
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  successCircle: {
    marginBottom: 12,
  },
  successText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.success,
    textAlign: "center",
  },
});
