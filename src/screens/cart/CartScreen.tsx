import LoginRequiredModal from "@/src/components/LoginRequiredModal";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { deliveryService } from "@/src/services/delivery.service";
import { locationService } from "@/src/services/location.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
    clearCartAsync,
    fetchCart,
    removeFromCartAsync,
    updateCartItemAsync,
} from "@/src/store/slices/cart.slice";
import type {
    Area,
    CartItem,
    City,
    DeliveryFeeResponse,
    DeliveryZone,
} from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CartScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";
  const { isAuthenticated, requireAuth, showLoginModal, setShowLoginModal } =
    useAuthGuard();
  const { items, loading, updating, error } = useAppSelector(
    (state) => state.cart,
  );
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Delivery state
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFeeResponse | null>(
    null,
  );
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Delivery zone (for freeDeliveryThreshold)
  const [userZone, setUserZone] = useState<DeliveryZone | null>(null);

  // User's selected city and area (auto-loaded from last order or registration)
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  // Free delivery celebration animation
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  const wasFreeRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchCart());
    setRefreshing(false);
  }, [dispatch]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.selectedOption?.priceOverride
        ? item.selectedOption.priceOverride
        : item.selectedUnit
          ? item.selectedUnit.price
          : item.product.price;
      return sum + price * item.quantity;
    }, 0);
    return { subtotal, itemCount: items.length };
  }, [items]);

  // Free delivery threshold from zones API (not from fee API)
  const freeDeliveryThreshold = userZone?.freeDeliveryThreshold ?? null;
  const isFreeDelivery =
    freeDeliveryThreshold != null && totals.subtotal >= freeDeliveryThreshold;
  const effectiveDeliveryFee = isFreeDelivery ? 0 : (deliveryInfo?.fee ?? 0);
  const grandTotal = totals.subtotal + effectiveDeliveryFee;
  const remainingForFree =
    freeDeliveryThreshold != null
      ? Math.max(0, freeDeliveryThreshold - totals.subtotal)
      : null;
  const freeDeliveryProgress =
    freeDeliveryThreshold != null && freeDeliveryThreshold > 0
      ? Math.min(1, totals.subtotal / freeDeliveryThreshold)
      : null;

  // Auto-load user's city and area from last order or registration data
  useEffect(() => {
    if (!user?.cityId) {
      setSelectedCity(null);
      setSelectedArea(null);
      return;
    }

    // If city object already exists in user data, use it directly (already loaded from last order)
    if (user.city) {
      setSelectedCity({
        id: user.city.id,
        name: user.city.name,
        nameEn: user.city.nameEn,
        areas: user.area ? [user.area] : [],
      });
      if (user.area) {
        setSelectedArea(user.area);
      }
      return;
    }

    // If city object is not in user data, fetch all cities and find the matching one
    let cancelled = false;
    (async () => {
      try {
        const allCities = await locationService.getCities();
        if (!cancelled) {
          const matchedCity = allCities.find((c) => c.id === user.cityId);
          if (matchedCity) {
            setSelectedCity(matchedCity);
            // Find and set the area if user has areaId
            if (user.areaId && matchedCity.areas) {
              const matchedArea = matchedCity.areas.find(
                (a) => a.id === user.areaId,
              );
              if (matchedArea) {
                setSelectedArea(matchedArea);
              }
            }
          }
        }
      } catch {
        // silent — location auto-loading is non-critical
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.cityId, user?.city, user?.area, user?.areaId]);

  // Fetch delivery zones once to get freeDeliveryThreshold for user's city
  useEffect(() => {
    if (!user?.cityId) {
      setUserZone(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const zones = await deliveryService.getZones();
        if (!cancelled) {
          const zone = zones.find((z) => z.cityId === user.cityId) ?? null;
          setUserZone(zone);
        }
      } catch {
        // silent — zone info is supplementary
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.cityId]);

  // Fetch delivery fee when user's city is available and subtotal changes
  useEffect(() => {
    if (!user?.cityId || items.length === 0) {
      setDeliveryInfo(null);
      return;
    }
    let cancelled = false;
    const fetchFee = async () => {
      setDeliveryLoading(true);
      setDeliveryError(null);
      try {
        const data = await deliveryService.getFee(
          user.cityId!,
          totals.subtotal,
        );
        if (!cancelled) setDeliveryInfo(data);
      } catch {
        if (!cancelled) setDeliveryError(t("delivery.feeError"));
      } finally {
        if (!cancelled) setDeliveryLoading(false);
      }
    };
    fetchFee();
    return () => {
      cancelled = true;
    };
  }, [user?.cityId, totals.subtotal, items.length, t]);

  // Free delivery celebration animation trigger
  useEffect(() => {
    if (isFreeDelivery && !wasFreeRef.current && userZone) {
      // Transition from paid to free
      setShowCelebration(true);
      celebrationAnim.setValue(0);
      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCelebration(false));
    }
    wasFreeRef.current = isFreeDelivery;
  }, [isFreeDelivery, userZone, celebrationAnim]);

  // Format estimated days
  const formatEstimatedDays = useCallback(
    (days: number) => {
      if (days === 1) return t("delivery.oneDay");
      if (days === 2) return t("delivery.twoDays");
      return t("delivery.days", { count: days });
    },
    [t],
  );

  // Get user's city/area display (auto-loaded from last order or registration)
  const userLocationText = useMemo(() => {
    if (!selectedCity) return null;
    const cityName = isArabic ? selectedCity.name : selectedCity.nameEn;
    if (selectedArea) {
      const areaName = isArabic ? selectedArea.name : selectedArea.nameEn;
      return `${cityName} - ${areaName}`;
    }
    return cityName;
  }, [selectedCity, selectedArea, isArabic]);

  const handleIncrement = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        // Use option stock if option is selected, otherwise variant/product stock
        const stockSource = item.selectedOption
          ? item.selectedOption.stock
          : (item.variant?.stock ?? item.product.stock);

        // Sum quantities of all cart items sharing the same product+variant+option
        const totalInCart = items
          .filter((ci) => {
            if (ci.product.id !== item.product.id) return false;
            if (ci.variant?.id !== item.variant?.id) return false;
            if (
              item.selectedOption &&
              ci.selectedOption?.id !== item.selectedOption.id
            )
              return false;
            if (!item.selectedOption && ci.selectedOption) return false;
            return true;
          })
          .reduce((sum, ci) => sum + ci.quantity, 0);

        if (totalInCart < stockSource) {
          dispatch(
            updateCartItemAsync({
              cartItemId: item.cartItemId,
              quantity: item.quantity + 1,
            }),
          );
        } else {
          Alert.alert(
            "",
            t("products.stockExceeded", {
              requested: item.quantity + 1,
              available: stockSource,
              inCart: totalInCart,
            }),
          );
        }
      });
    },
    [dispatch, requireAuth, items, t],
  );

  const handleDecrement = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        const minQty = item.variant?.minOrderQuantity ?? item.product.minOrder;
        if (item.quantity > minQty) {
          dispatch(
            updateCartItemAsync({
              cartItemId: item.cartItemId,
              quantity: item.quantity - 1,
            }),
          );
        }
      });
    },
    [dispatch, requireAuth],
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        Alert.alert(
          t("cart.removeItem"),
          t("cart.removeItemMessage", { name: item.product.name }),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("common.remove"),
              style: "destructive",
              onPress: () => dispatch(removeFromCartAsync(item.cartItemId)),
            },
          ],
        );
      });
    },
    [dispatch, t, requireAuth],
  );

  const handleClearCart = useCallback(() => {
    requireAuth(() => {
      Alert.alert(t("cart.clearCartTitle"), t("cart.clearCartMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.clear"),
          style: "destructive",
          onPress: () => dispatch(clearCartAsync()),
        },
      ]);
    });
  }, [dispatch, t, requireAuth]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      const unitPrice = item.selectedOption?.priceOverride
        ? item.selectedOption.priceOverride
        : item.selectedUnit
          ? item.selectedUnit.price
          : item.product.price;
      const originalUnitPrice =
        item.selectedUnit?.compareAtPrice ??
        item.product.compareAtPrice ??
        null;
      const hasItemDiscount =
        originalUnitPrice != null && originalUnitPrice > unitPrice;
      const lineTotal = unitPrice * item.quantity;
      const isUpdating = updating[item.cartItemId];
      const isArabic = i18n.language === "ar";
      const unitLabel = item.selectedUnit
        ? isArabic
          ? item.selectedUnit.label
          : item.selectedUnit.labelEn
        : item.product.unit;
      const variantSize = item.variant?.size;
      const variantLabel = variantSize
        ? isArabic
          ? variantSize
          : (item.variant?.sizeEn ?? variantSize)
        : null;
      const maxStock = item.selectedOption
        ? item.selectedOption.stock
        : (item.variant?.stock ?? item.product.stock);
      const minQty = item.variant?.minOrderQuantity ?? item.product.minOrder;

      // Calculate total quantity in cart for same product+variant+option
      const totalInCart = items
        .filter((ci) => {
          if (ci.product.id !== item.product.id) return false;
          if (ci.variant?.id !== item.variant?.id) return false;
          if (
            item.selectedOption &&
            ci.selectedOption?.id !== item.selectedOption.id
          )
            return false;
          if (!item.selectedOption && ci.selectedOption) return false;
          return true;
        })
        .reduce((sum, ci) => sum + ci.quantity, 0);
      const atStockLimit = totalInCart >= maxStock;

      return (
        <View style={[styles.cartItem, isUpdating && styles.itemUpdating]}>
          <Image
            source={
              item.selectedOption?.image || item.variant?.image
                ? { uri: (item.selectedOption?.image || item.variant?.image)! }
                : item.product.images?.[0]
                  ? { uri: item.product.images[0] }
                  : require("@/assets/images/icon2.png")
            }
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            {variantLabel ? (
              <Text style={styles.itemVariant}>
                {t("cart.size", { size: variantLabel })}
              </Text>
            ) : null}
            {item.selectedOption ? (
              <Text style={styles.itemVariant}>
                {t("cart.flavor", {
                  flavor:
                    i18n.language === "ar"
                      ? item.selectedOption.name
                      : (item.selectedOption.nameEn ??
                        item.selectedOption.name),
                })}
              </Text>
            ) : null}
            {unitLabel ? (
              <Text style={styles.itemVariant}>
                {t("cart.unit", { unit: unitLabel })}
              </Text>
            ) : null}
            {item.note ? (
              <Text style={styles.itemNote} numberOfLines={2}>
                {t("cart.itemNote", { note: item.note })}
              </Text>
            ) : null}
            <View style={styles.itemPriceRow}>
              <Text style={styles.itemPrice}>
                {unitPrice.toFixed(2)} {t("common.currency")} / {unitLabel}
              </Text>
              {hasItemDiscount && (
                <Text style={styles.itemOriginalPrice}>
                  {originalUnitPrice!.toFixed(2)} {t("common.currency")}
                </Text>
              )}
            </View>
            <View style={styles.itemActions}>
              <View style={styles.qtySelector}>
                <Pressable
                  onPress={() => handleDecrement(item)}
                  style={styles.qtyBtn}
                  disabled={item.quantity <= minQty || isUpdating}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={
                      item.quantity <= minQty
                        ? Colors.textLight
                        : Colors.primary
                    }
                  />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable
                  onPress={() => handleIncrement(item)}
                  style={styles.qtyBtn}
                  disabled={atStockLimit || isUpdating}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={atStockLimit ? Colors.textLight : Colors.primary}
                  />
                </Pressable>
              </View>
              <View style={styles.lineTotalWrap}>
                <Text style={styles.lineTotal}>
                  {lineTotal.toFixed(2)} {t("common.currency")}
                </Text>
                {hasItemDiscount && (
                  <Text style={styles.lineOriginalTotal}>
                    {(originalUnitPrice! * item.quantity).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          <Pressable
            onPress={() => handleRemove(item)}
            style={styles.removeBtn}
            hitSlop={8}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </Pressable>
        </View>
      );
    },
    [
      updating,
      handleIncrement,
      handleDecrement,
      handleRemove,
      items,
      t,
      i18n.language,
    ],
  );

  if (loading && items.length === 0) {
    return <Loader />;
  }

  if (items.length === 0) {
    if (!isAuthenticated && items.length === 0) {
      return (
        <EmptyState
          icon="cart-outline"
          title={t("cart.empty")}
          message={t("cart.emptyMessage")}
          actionLabel={t("auth.goToLogin")}
          onAction={() => router.push("/(auth)/login")}
        />
      );
    }

    return (
      <EmptyState
        icon="cart-outline"
        title={t("cart.empty")}
        message={t("cart.emptyMessage")}
        actionLabel={t("cart.browseProducts")}
        onAction={() => router.push("/products")}
      />
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>
            {totals.itemCount} item{totals.itemCount !== 1 ? "s" : ""}
          </Text>
          <Pressable onPress={handleClearCart} hitSlop={8}>
            <Text style={styles.clearText}>{t("cart.clearAll")}</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.cartItemId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />

        {/* Bottom summary with delivery */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          {/* Delivery Address Card */}
          {userLocationText ? (
            <View style={styles.deliveryAddressCard}>
              <View style={styles.deliveryAddressRow}>
                <Ionicons name="location" size={18} color={Colors.primary} />
                <View style={styles.deliveryAddressInfo}>
                  <Text style={styles.deliveryAddressLabel}>
                    {t("delivery.title")}
                  </Text>
                  <Text style={styles.deliveryAddressText}>
                    {userLocationText}
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/location")} hitSlop={8}>
                  <Text style={styles.changeLocationText}>
                    {t("delivery.changeLocation")}
                  </Text>
                </Pressable>
              </View>
              {/* Estimated delivery days */}
              {deliveryInfo && deliveryInfo.available && !deliveryLoading ? (
                <View style={styles.estimatedDaysRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.estimatedDaysText}>
                    {t("delivery.estimatedDays")}:{" "}
                    {formatEstimatedDays(deliveryInfo.estimatedDays)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Pressable
              style={styles.selectCityCard}
              onPress={() => router.push("/location")}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.selectCityText}>
                {t("delivery.selectCityForDelivery")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textSecondary}
              />
            </Pressable>
          )}

          {/* Free Delivery Progress Banner */}
          {freeDeliveryThreshold != null &&
          !isFreeDelivery &&
          remainingForFree != null &&
          remainingForFree > 0 &&
          deliveryInfo?.available ? (
            <View style={styles.freeDeliveryBanner}>
              <Text style={styles.freeDeliveryBannerText}>
                🚚{" "}
                {t("delivery.addMoreForFree", {
                  amount: remainingForFree.toFixed(2),
                  currency: t("common.currency"),
                })}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(freeDeliveryProgress ?? 0) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {totals.subtotal.toFixed(2)} /{" "}
                {freeDeliveryThreshold.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          ) : null}

          {/* Free Delivery Achieved Banner */}
          {isFreeDelivery && deliveryInfo?.available ? (
            <View style={styles.freeDeliveryAchievedBanner}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.success}
              />
              <Text style={styles.freeDeliveryAchievedText}>
                🎉 {t("delivery.congratsFree")}
              </Text>
            </View>
          ) : null}

          {/* Celebration Animation Overlay */}
          {showCelebration ? (
            <Animated.View
              style={[
                styles.celebrationOverlay,
                {
                  opacity: celebrationAnim,
                  transform: [
                    {
                      scale: celebrationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationText}>
                🎉 {t("delivery.congratsFree")} 🎉
              </Text>
            </Animated.View>
          ) : null}

          {/* Delivery not available warning */}
          {deliveryInfo && !deliveryInfo.available ? (
            <View style={styles.deliveryNotAvailableBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={Colors.warning}
              />
              <Text style={styles.deliveryNotAvailableText}>
                {t("delivery.notAvailableShort")}
              </Text>
            </View>
          ) : null}

          {/* Price Summary */}
          <View style={styles.totalRow}>
            <Text style={styles.summaryLabel}>
              {t("delivery.productSubtotal")}
            </Text>
            <Text style={styles.summaryValue}>
              {totals.subtotal.toFixed(2)} {t("common.currency")}
            </Text>
          </View>

          {/* Delivery Fee Row */}
          {deliveryLoading ? (
            <View style={styles.totalRow}>
              <Text style={styles.summaryLabel}>
                {t("delivery.deliveryFee")}
              </Text>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : deliveryInfo?.available ? (
            <View style={styles.totalRow}>
              <Text style={styles.summaryLabel}>
                {t("delivery.deliveryFee")}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  isFreeDelivery && styles.freeDeliveryFeeText,
                ]}
              >
                {isFreeDelivery
                  ? t("delivery.free")
                  : `${effectiveDeliveryFee.toFixed(2)} ${t("common.currency")}`}
              </Text>
            </View>
          ) : null}

          {deliveryError ? (
            <Text style={styles.deliveryErrorText}>{deliveryError}</Text>
          ) : null}

          {/* Divider */}
          <View style={styles.summaryDivider} />

          {/* Grand Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("delivery.grandTotal")}</Text>
            <Text style={styles.totalValue}>
              {grandTotal.toFixed(2)} {t("common.currency")}
            </Text>
          </View>

          <Button
            title={t("cart.proceedToCheckout")}
            onPress={() => requireAuth(() => router.push("/checkout"))}
            variant="accent"
            style={styles.checkoutBtn}
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
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.error,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    flex: 1,
  },
  listContent: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  itemUpdating: {
    opacity: 0.6,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  itemVariant: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 1,
  },
  itemNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
  },
  qtyBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
  },
  qtyText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  lineTotalWrap: {
    alignItems: "flex-end",
  },
  lineTotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  lineOriginalTotal: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  itemOriginalPrice: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  removeBtn: {
    paddingLeft: Spacing.sm,
    justifyContent: "center",
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
  },
  deliveryAddressCard: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  deliveryAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deliveryAddressInfo: {
    flex: 1,
  },
  deliveryAddressLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  deliveryAddressText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "700",
    marginTop: 1,
  },
  changeLocationText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "600",
  },
  estimatedDaysRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  estimatedDaysText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  selectCityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectCityText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  freeDeliveryBanner: {
    backgroundColor: "#ecfdf5",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  freeDeliveryBannerText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#d1fae5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  freeDeliveryAchievedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#ecfdf5",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  freeDeliveryAchievedText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "700",
  },
  celebrationOverlay: {
    position: "absolute",
    top: -50,
    left: Spacing.xxl,
    right: Spacing.xxl,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    zIndex: 10,
    ...Shadows.md,
  },
  celebrationText: {
    fontSize: FontSize.md,
    color: Colors.white,
    fontWeight: "800",
  },
  deliveryNotAvailableBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fffbeb",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  deliveryNotAvailableText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: "600",
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  freeDeliveryFeeText: {
    color: Colors.success,
    fontWeight: "700",
  },
  deliveryErrorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.primary,
  },
  checkoutBtn: {
    width: "100%",
  },
});
