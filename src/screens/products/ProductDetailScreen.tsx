import LoginRequiredModal from "@/src/components/LoginRequiredModal";
import Button from "@/src/components/ui/Button";
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
import type { ProductUnit } from "@/src/types";
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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.85;

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

  const units = useMemo(
    () =>
      product?.units && product.units.length > 0
        ? [...product.units].sort((a, b) => a.sortOrder - b.sortOrder)
        : null,
    [product?.units],
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

  useEffect(() => {
    if (id) dispatch(fetchProductDetail(id));
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [dispatch, id]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    requireAuth(() => {
      dispatch(
        addToCartAsync({
          product,
          quantity,
          selectedUnit: selectedUnit ?? undefined,
        }),
      );
    });
  }, [dispatch, product, quantity, selectedUnit, requireAuth]);

  const incrementQty = useCallback(() => {
    if (!product) return;
    setQuantity((q) => Math.min(q + 1, product.stock));
  }, [product]);

  const decrementQty = useCallback(() => {
    if (!product) return;
    setQuantity((q) => Math.max(q - 1, product.minOrder));
  }, [product]);

  useEffect(() => {
    if (product) {
      setQuantity(product.minOrder);
    }
  }, [product]);

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
  const savingsPerUnit =
    hasDiscount && originalPrice ? originalPrice - unitPrice : 0;
  const isArabic = i18n.language === "ar";
  const getUnitLabel = (unit: ProductUnit) =>
    isArabic ? unit.label : unit.labelEn;

  return (
    <>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Gallery */}
          <View>
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
                <Image
                  source={
                    item ? { uri: item } : require("@/assets/images/icon.png")
                  }
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={300}
                />
              )}
            />
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

            {/* Discount badge overlay */}
            {hasDiscount ? (
              <View style={styles.discountOverlay}>
                <Text style={styles.discountOverlayText}>
                  -{discountPercent}%
                </Text>
              </View>
            ) : null}

            {/* Back button overlay */}
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
          </View>

          {/* Product Info */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.infoContainer}
          >
            <Text style={styles.name}>{product.name}</Text>

            {product.categoryName ? (
              <View style={styles.categoryChip}>
                <Ionicons name="pricetag" size={12} color={Colors.primary} />
                <Text style={styles.categoryText}>{product.categoryName}</Text>
              </View>
            ) : null}

            {/* Unit selector */}
            {units ? (
              <View style={styles.unitSelectorSection}>
                <Text style={styles.unitSelectorLabel}>
                  {t("products.selectUnit")}
                </Text>
                <View style={styles.unitChipsRow}>
                  {units.map((unit) => {
                    const isSelected = selectedUnit?.id === unit.id;
                    const isDisabled = units.length === 1;
                    return (
                      <Pressable
                        key={unit.id}
                        style={[
                          styles.detailUnitChip,
                          isSelected && styles.detailUnitChipSelected,
                          isDisabled && styles.detailUnitChipDisabled,
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
                            styles.detailUnitChipLabel,
                            isSelected && styles.detailUnitChipLabelSelected,
                            isDisabled && styles.detailUnitChipLabelDisabled,
                          ]}
                        >
                          {getUnitLabel(unit)}
                        </Text>
                        <Text
                          style={[
                            styles.detailUnitChipPrice,
                            isSelected && styles.detailUnitChipPriceSelected,
                            isDisabled && styles.detailUnitChipPriceDisabled,
                          ]}
                        >
                          {unit.price.toFixed(2)} {t("common.currency")}
                        </Text>
                        {unit.piecesPerUnit > 1 ? (
                          <Text
                            style={[
                              styles.detailUnitChipPieces,
                              isDisabled && styles.detailUnitChipPiecesDisabled,
                            ]}
                          >
                            {t("products.piecesCount", {
                              count: unit.piecesPerUnit,
                            })}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.priceSection}>
              <Text style={styles.price}>
                {unitPrice.toFixed(2)} {t("common.currency")}
              </Text>
              {hasDiscount && originalPrice ? (
                <Text style={styles.originalPrice}>
                  {originalPrice.toFixed(2)} {t("common.currency")}
                </Text>
              ) : null}
              <Text style={styles.perUnit}>
                / {selectedUnit ? getUnitLabel(selectedUnit) : product.unit}
              </Text>
            </View>

            {/* Savings highlight */}
            {hasDiscount ? (
              <View style={styles.savingsRow}>
                <Ionicons
                  name="trending-down"
                  size={14}
                  color={Colors.success}
                />
                <Text style={styles.savingsText}>
                  {t("products.save")} {savingsPerUnit.toFixed(2)}{" "}
                  {t("common.currency")} /{" "}
                  {selectedUnit ? getUnitLabel(selectedUnit) : product.unit}
                </Text>
              </View>
            ) : null}

            {/* Stock indicator */}
            {product.stock <= 10 && product.stock > 0 ? (
              <View style={styles.stockWarning}>
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color={Colors.secondary}
                />
                <Text style={styles.stockWarningText}>
                  {product.stock} {product.unit} {t("products.inStock")}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t("products.sku")}</Text>
                <Text style={styles.metaValue}>{product.sku}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t("products.minOrder")}</Text>
                <Text style={styles.metaValue}>
                  {product.minOrder} {product.unit}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t("products.inStock")}</Text>
                <Text
                  style={[
                    styles.metaValue,
                    product.stock <= 10 && styles.lowStock,
                  ]}
                >
                  {product.stock} {product.unit}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>{t("products.description")}</Text>
            <Text style={styles.description}>{product.description}</Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          {/* Quantity Selector */}
          <View style={styles.quantitySelector}>
            <Pressable
              onPress={() => {
                decrementQty();
                Haptics.selectionAsync();
              }}
              style={styles.qtyButton}
              disabled={quantity <= product.minOrder}
            >
              <Ionicons
                name="remove"
                size={20}
                color={
                  quantity <= product.minOrder
                    ? Colors.textLight
                    : Colors.primary
                }
              />
            </Pressable>
            <Text style={styles.qtyText}>{quantity}</Text>
            <Pressable
              onPress={() => {
                incrementQty();
                Haptics.selectionAsync();
              }}
              style={styles.qtyButton}
              disabled={quantity >= product.stock}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  quantity >= product.stock ? Colors.textLight : Colors.primary
                }
              />
            </Pressable>
          </View>

          <Button
            title={`${t("products.addToCart")} · ${(unitPrice * quantity).toFixed(2)} ${t("common.currency")}`}
            onPress={handleAddToCart}
            variant="accent"
            style={styles.addButton}
            disabled={product.stock === 0}
          />
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
  galleryImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.inputBackground,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: Spacing.md,
    left: 0,
    right: 0,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 22,
  },
  discountOverlay: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  discountOverlayText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  backButton: {
    position: "absolute",
    top: Spacing.xxxl + Spacing.lg,
    left: Spacing.lg,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  infoContainer: {
    padding: Spacing.xxl,
    marginTop: -Spacing.lg,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 30,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryXLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "600",
  },
  unitSelectorSection: {
    marginTop: Spacing.lg,
  },
  unitSelectorLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  unitChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  detailUnitChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    minWidth: 80,
  },
  detailUnitChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  detailUnitChipLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  detailUnitChipLabelSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
  detailUnitChipPrice: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailUnitChipPriceSelected: {
    color: Colors.primary,
  },
  detailUnitChipPieces: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 1,
  },
  detailUnitChipDisabled: {
    opacity: 0.6,
  },
  detailUnitChipLabelDisabled: {
    color: Colors.textLight,
  },
  detailUnitChipPriceDisabled: {
    color: Colors.textLight,
  },
  detailUnitChipPiecesDisabled: {
    color: Colors.textLight,
    opacity: 0.5,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  price: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: FontSize.md,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  perUnit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  savingsText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.success,
  },
  stockWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  stockWarningText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.secondary,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  metaItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  metaLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  lowStock: {
    color: Colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
    gap: Spacing.md,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
    ...Shadows.sm,
  },
  qtyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  qtyText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 32,
    textAlign: "center",
  },
  addButton: {
    flex: 1,
  },
});
