import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ScreenWrapper from "@/src/components/ui/ScreenWrapper";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { couponService } from "@/src/services/coupon.service";
import { deliveryService } from "@/src/services/delivery.service";
import { locationService } from "@/src/services/location.service";
import { loyaltyService } from "@/src/services/loyalty.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { updateUserLocation } from "@/src/store/slices/auth.slice";
import { clearCart, fetchCart } from "@/src/store/slices/cart.slice";
import { fetchCoupons } from "@/src/store/slices/loyalty.slice";
import {
    createOrder,
    fetchLastDeliveryAddress,
    setLastDeliveryAddress,
    validateCartBeforeCheckout,
} from "@/src/store/slices/orders.slice";
import type {
    City,
    CouponValidateSuccess,
    DeliveryFeeResponse,
    DeliveryZone,
    InvalidCartItem,
} from "@/src/types";
import type { Coupon, ValidateCouponResponse } from "@/src/types/loyalty";
import { CouponStatus, RewardType } from "@/src/types/loyalty";
import { saveLocation } from "@/src/utils/locationStorage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormErrors {
  city?: string;
}

export default function CheckoutScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items } = useAppSelector((state) => state.cart);
  const { creating, error, loading, lastDeliveryAddress, loadingLastAddress } =
    useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);
  const isArabic = i18n.language === "ar";

  // Stock validation state
  const [validatingCart, setValidatingCart] = useState(false);
  const [invalidItems, setInvalidItems] = useState<InvalidCartItem[]>([]);
  const [showStockErrorModal, setShowStockErrorModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("📱 CheckoutScreen mounted");
    console.log("🛒 Cart items:", items);
    console.log("👤 User:", user);
    return () => {
      console.log("📱 CheckoutScreen unmounted");
    };
  }, [items, user]);

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] =
    useState<CouponValidateSuccess | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Loyalty reward coupon state
  const { coupons: loyaltyCoupons } = useAppSelector((state) => state.loyalty);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [appliedReward, setAppliedReward] = useState<{
    coupon: Coupon;
    validation: ValidateCouponResponse;
  } | null>(null);
  const [rewardLoadingId, setRewardLoadingId] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState<DeliveryFeeResponse | null>(
    null,
  );
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Delivery zone (for freeDeliveryThreshold)
  const [userZone, setUserZone] = useState<DeliveryZone | null>(null);

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const areas = selectedCity?.areas ?? [];
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  const getCityName = useCallback(
    (city: City) => (isArabic ? city.name : city.nameEn),
    [isArabic],
  );
  const getAreaName = useCallback(
    (area: { name: string; nameEn: string }) =>
      isArabic ? area.name : area.nameEn,
    [isArabic],
  );

  // Build display string for city field (city + area)
  const cityDisplayText = useMemo(() => {
    if (!selectedCity) return "";
    const name = getCityName(selectedCity);
    if (selectedArea) return `${name} - ${getAreaName(selectedArea)}`;
    return name;
  }, [selectedCity, selectedArea, getCityName, getAreaName]);

  // Fetch cities
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await locationService.getCities();
        if (!mounted) return;
        setCities(data);
      } catch {
        // silent — user can still type city manually
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch last delivery address on mount
  useEffect(() => {
    dispatch(fetchLastDeliveryAddress());
  }, [dispatch]);

  // Fetch user's loyalty coupons so active rewards can be applied at checkout
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCoupons());
    }
  }, [dispatch, isAuthenticated]);

  // Pre-fill the default delivery location. The profile location (user.cityId)
  // is kept in sync with the LAST place the customer chose to deliver to — it is
  // updated both when an order is placed and when the location is changed from
  // the location screen — so it is the correct default. For the very first order
  // it holds the registration location. Priority:
  //   1. Profile location (latest chosen delivery location / registration)
  //   2. Last order's delivery location (fallback if profile is missing)
  // Runs once; skipped after the user manually changes the selection here.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (cities.length === 0 || prefilled) return;
    // Wait for the last-address fetch so the address text / fallback are ready.
    if (loadingLastAddress) return;

    // Reuse last typed address text for convenience.
    if (lastDeliveryAddress?.address) {
      setAddress(lastDeliveryAddress.address);
    }

    const applyLocation = (cityId?: string | null, areaId?: string | null) => {
      if (!cityId) return false;
      if (!cities.some((c) => c.id === cityId)) return false;
      setSelectedCityId(cityId);
      setSelectedAreaId(areaId ?? null);
      return true;
    };

    // 1) Latest chosen delivery location (registration for the first order).
    if (applyLocation(user?.cityId, user?.areaId)) {
      setPrefilled(true);
      return;
    }

    // 2) Fall back to the last order's delivery location.
    if (applyLocation(lastDeliveryAddress?.cityId, lastDeliveryAddress?.areaId)) {
      setPrefilled(true);
    }
  }, [
    cities,
    prefilled,
    lastDeliveryAddress,
    loadingLastAddress,
    user?.cityId,
    user?.areaId,
  ]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      // Use selected unit price if available (for dozen/box/carton), otherwise use product price
          const price = item.selectedUnit
        ? item.selectedUnit.price
        : item.selectedOption?.priceOverride ??
          item.product.price;
      return sum + price * item.quantity;
    }, 0);
    return {
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  // Free delivery calculation (frontend logic, same as CartScreen)
  const freeDeliveryThreshold = userZone?.freeDeliveryThreshold ?? null;
  const isFreeDelivery =
    freeDeliveryThreshold != null && totals.subtotal >= freeDeliveryThreshold;
  const effectiveDeliveryFee = isFreeDelivery ? 0 : (deliveryFee?.fee ?? 0);
  const remainingForFree =
    freeDeliveryThreshold != null
      ? Math.max(0, freeDeliveryThreshold - totals.subtotal)
      : null;

  // Loyalty reward derived values
  const loyaltyDiscount = appliedReward?.validation.discountAmount ?? 0;
  const rewardFreeDelivery = appliedReward?.validation.freeDelivery === true;
  const rewardFreeProduct = appliedReward?.validation.freeProduct ?? null;
  const finalDeliveryFee = rewardFreeDelivery ? 0 : effectiveDeliveryFee;

  // The final total to display (discount code → loyalty reward → delivery fee)
  const displayTotal = useMemo(() => {
    const base = appliedCoupon ? appliedCoupon.finalTotal : totals.subtotal;
    const afterReward = Math.max(0, base - loyaltyDiscount);
    return afterReward + finalDeliveryFee;
  }, [appliedCoupon, totals.subtotal, loyaltyDiscount, finalDeliveryFee]);

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.replace(/\s/g, "").toUpperCase();
    if (!code) return;
    Keyboard.dismiss();
    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);
    try {
      const response = await couponService.validateCoupon({
        code,
        orderTotal: totals.subtotal,
      });
      if (response.valid) {
        setAppliedCoupon(response);
        setCouponCode(response.code);
      } else {
        const errorKey = response.error || "UNKNOWN";
        const translated = t(`checkout.couponError.${errorKey}`, {
          defaultValue: "",
        });
        setCouponError(translated || response.message);
      }
    } catch {
      setCouponError(t("checkout.couponError.UNKNOWN"));
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, totals.subtotal, t]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }, []);

  // ===== Loyalty reward coupons =====
  const activeRewardCoupons = useMemo(
    () =>
      loyaltyCoupons.items.filter(
        (c) => c.status === CouponStatus.ACTIVE,
      ),
    [loyaltyCoupons.items],
  );

  const handleApplyReward = useCallback(
    async (coupon: Coupon) => {
      setRewardError(null);
      setRewardLoadingId(coupon.id);
      try {
        const response = await loyaltyService.validateCoupon({
          couponCode: coupon.code,
          orderTotal: appliedCoupon ? appliedCoupon.finalTotal : totals.subtotal,
        });
        if (response.valid) {
          setAppliedReward({ coupon, validation: response });
        } else {
          setAppliedReward(null);
          setRewardError(response.error || t("checkout.rewardError"));
        }
      } catch (err: any) {
        setAppliedReward(null);
        const msg = err?.response?.data?.error || t("checkout.rewardError");
        setRewardError(msg);
      } finally {
        setRewardLoadingId(null);
      }
    },
    [appliedCoupon, totals.subtotal, t],
  );

  const handleRemoveReward = useCallback(() => {
    setAppliedReward(null);
    setRewardError(null);
  }, []);

  // Re-validate the applied reward when the base total changes
  // (e.g. discount code added/removed or cart total changed)
  useEffect(() => {
    if (!appliedReward) return;
    handleApplyReward(appliedReward.coupon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedCoupon?.finalTotal, totals.subtotal]);

  // Calculate delivery fee based on city and order total
  const calculateDeliveryFee = useCallback(
    async (cityId: string, orderTotal: number) => {
      if (!cityId) {
        setDeliveryFee(null);
        setDeliveryError(null);
        return;
      }
      try {
        setLoadingDeliveryFee(true);
        setDeliveryError(null);
        const fee = await deliveryService.getFee(cityId, orderTotal);
        setDeliveryFee(fee);
        console.log("✅ Delivery fee calculated:", fee);
      } catch (error) {
        console.error("❌ Error calculating delivery fee:", error);
        setDeliveryError(
          t("checkout.deliveryFeeError") || "خطأ في حساب رسوم التوصيل",
        );
        setDeliveryFee(null);
      } finally {
        setLoadingDeliveryFee(false);
      }
    },
    [t],
  );

  // Fetch delivery zones once to get freeDeliveryThreshold for user's city
  useEffect(() => {
    if (!selectedCityId) {
      setUserZone(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const zones = await deliveryService.getZones();
        if (!cancelled) {
          const zone = zones.find((z) => z.cityId === selectedCityId) ?? null;
          setUserZone(zone);
        }
      } catch {
        // silent — zone info is supplementary
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCityId]);

  // Recalculate delivery fee when city or items change
  // NOTE: Always use subtotal (products only), not finalTotal (after coupon discount)
  // This ensures free delivery threshold is consistent with CartScreen
  useEffect(() => {
    if (selectedCityId) {
      calculateDeliveryFee(selectedCityId, totals.subtotal);
    }
  }, [selectedCityId, totals.subtotal, calculateDeliveryFee]);

  const handleConfirm = useCallback(async () => {
    console.log("🔴 handleConfirm: Button pressed!");
    console.log("📋 Current state:", {
      address,
      selectedCityId,
      notes,
      cityDisplayText,
      itemsCount: items.length,
    });

    // Validate form
    const errors: FormErrors = {};
    if (!selectedCityId) {
      errors.city = t("checkout.cityRequired");
      console.warn("❌ Validation error: City is not selected");
    }

    console.log("🔍 Validation errors object:", errors);
    console.log("🔍 Errors count:", Object.keys(errors).length);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("⚠️ Form validation failed, showing errors to user");
      const errorMessages = Object.values(errors).join("\n");
      Alert.alert(t("common.error"), errorMessages);
      return;
    }

    console.log("✅ Form validation passed");

    // ===== NEW: Validate cart stock before creating order =====
    console.log("🔍 Starting cart stock validation...");
    setValidatingCart(true);
    setInvalidItems([]);

    const validationResult = await dispatch(validateCartBeforeCheckout());

    if (validateCartBeforeCheckout.fulfilled.match(validationResult)) {
      const response = validationResult.payload;

      if (
        !response.valid &&
        response.invalidItems &&
        response.invalidItems.length > 0
      ) {
        // ❌ Stock validation failed - show error modal
        console.error("❌ Cart validation failed:", response.invalidItems);
        setInvalidItems(response.invalidItems);
        setShowStockErrorModal(true);
        setValidatingCart(false);
        return;
      }
    } else if (validateCartBeforeCheckout.rejected.match(validationResult)) {
      // Backend validation failed
      console.error("❌ Validation request failed:", validationResult.payload);
      setValidatingCart(false);
      Alert.alert(
        t("common.error"),
        t("checkout.validationError") || (validationResult.payload as string),
      );
      return;
    }

    setValidatingCart(false);
    console.log("✅ Cart validation passed, proceeding with order creation");

    // ===== Proceed with order creation =====
    const orderPayload = {
      deliveryAddress: address.trim() || "No address provided",
      deliveryAddressDetails: address.trim() || undefined,
      deliveryCity: cityDisplayText,
      // Send the resolved IDs so the order records exactly which city/area was
      // chosen — this is what powers the "last delivery location" default.
      deliveryCityId: selectedCityId ?? undefined,
      deliveryAreaId: selectedAreaId ?? undefined,
      deliveryArea: selectedArea
        ? isArabic
          ? selectedArea.name
          : selectedArea.nameEn
        : undefined,
      buyerNotes: notes.trim() || undefined,
      notes: notes.trim() || undefined,
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      loyaltyCouponCode: appliedReward ? appliedReward.coupon.code : undefined,
      deliveryFee: finalDeliveryFee,
      deliveryEstimatedDays: deliveryFee?.estimatedDays ?? 0,
      itemNotes: items
        .filter((item) => item.note)
        .map((item) => ({
          cartItemId: item.cartItemId,
          note: item.note!,
        })),
    };

    console.log("📤 Dispatching createOrder with payload:", orderPayload);
    console.log("📤 Dispatch function exists:", !!dispatch);

    const result = await dispatch(createOrder(orderPayload));

    console.log("📥 handleConfirm: Order result received");
    console.log("📥 Result type:", typeof result);
    console.log("📥 Result keys:", Object.keys(result || {}));
    console.log("📥 Result:", result);

    if (createOrder.fulfilled.match(result)) {
      console.log("✅ SUCCESS: Order created successfully!");
      console.log("🎉 Order payload:", result.payload);

      // Save location to user profile (also persisted to device by the thunk)
      if (selectedCityId) {
        console.log("📍 Saving user location...");
        dispatch(
          updateUserLocation({
            cityId: selectedCityId,
            areaId: selectedAreaId ?? undefined,
          }),
        );
      }

      // Save delivery address for next checkout pre-fill (in-session Redux)
      dispatch(
        setLastDeliveryAddress({
          address: address.trim(),
          cityId: selectedCityId ?? undefined,
          areaId: selectedAreaId ?? undefined,
        }),
      );

      // Persist the chosen delivery location + address on the device so it
      // becomes the default next time and survives restarts/logout.
      void saveLocation({
        cityId: selectedCityId ?? null,
        areaId: selectedAreaId ?? null,
        address: address.trim() || null,
        city: selectedCity
          ? {
              id: selectedCity.id,
              name: selectedCity.name,
              nameEn: selectedCity.nameEn,
            }
          : null,
        area: selectedArea
          ? {
              id: selectedArea.id,
              name: selectedArea.name,
              nameEn: selectedArea.nameEn,
            }
          : null,
      });

      console.log("🗑️ Clearing cart...");
      dispatch(clearCart());

      console.log("✅ Showing success modal");
      setShowSuccessModal(true);
    } else if (createOrder.rejected.match(result)) {
      console.error("❌ FAILED: Order creation rejected!");
      console.error("❌ Error payload:", result.payload);

      // Check if error is about stock (409 Conflict)
      const errorMsg = result.payload as string;
      if (errorMsg && errorMsg.toLowerCase().includes("stock")) {
        // Stock issue during order creation (race condition)
        Alert.alert(
          t("checkout.outOfStockTitle") || t("common.error"),
          t("checkout.outOfStockMessage") ||
            "المخزون غير كافي. يرجى تحديث السلة والمحاولة مرة أخرى.",
          [
            {
              text: t("common.close"),
              onPress: () => dispatch(fetchCart()),
            },
          ],
        );
      } else {
        Alert.alert(t("common.error"), errorMsg);
      }
    } else {
      console.warn("⚠️ Unknown result status");
    }
  }, [
    dispatch,
    router,
    address,
    cityDisplayText,
    notes,
    t,
    selectedCityId,
    selectedAreaId,
    selectedArea,
    selectedCity,
    appliedCoupon,
    appliedReward,
    items,
    deliveryFee,
    effectiveDeliveryFee,
    finalDeliveryFee,
    isArabic,
  ]);

  return (
    <ScreenWrapper>
      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
        ]}
      >
        {/* Order Summary */}
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t("checkout.orderSummary")}</Text>
        </View>
        <View style={styles.summaryCard}>
          {items.map((item) => {
            // Use option priceOverride if available, then unit price, then product price
            const price = item.selectedUnit
              ? item.selectedUnit.price
              : item.selectedOption?.priceOverride ??
                item.product.price;
            const origPrice =
              item.selectedUnit?.compareAtPrice ??
              item.product.compareAtPrice ??
              null;
            const hasItemDiscount = origPrice != null && origPrice > price;
            // Use selected unit label if available, otherwise use product unit
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
            // Get available stock
            const availableStock = item.selectedOption
              ? item.selectedOption.stock
              : (item.variant?.stock ?? item.product.stock);
            return (
              <View key={item.cartItemId} style={styles.summaryItem}>
                <View style={styles.summaryItemDetails}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  {variantLabel ? (
                    <Text style={styles.summaryItemOption}>
                      {t("cart.size", { size: variantLabel })}
                    </Text>
                  ) : null}
                  {item.selectedOption ? (
                    <Text style={styles.summaryItemOption}>
                      {t("cart.flavor", {
                        flavor: isArabic
                          ? item.selectedOption.name
                          : (item.selectedOption.nameEn ??
                            item.selectedOption.name),
                      })}
                    </Text>
                  ) : null}
                  {unitLabel ? (
                    <Text style={styles.summaryItemOption}>
                      {t("cart.unit", { unit: unitLabel })}
                    </Text>
                  ) : null}
                  <Text style={styles.summaryItemQty}>
                    x{item.quantity} {unitLabel}
                  </Text>
                  {item.note ? (
                    <Text style={styles.summaryItemNote} numberOfLines={2}>
                      {t("checkout.productNote", { note: item.note })}
                    </Text>
                  ) : null}
                  {/* Stock Info */}
                  <Text
                    style={[
                      styles.summaryItemOption,
                      availableStock < item.quantity
                        ? styles.stockWarning
                        : styles.stockOk,
                    ]}
                  >
                    ✓ {t("checkout.availableStock", { count: availableStock })}
                  </Text>
                </View>
                <View style={styles.summaryPriceWrap}>
                  <Text style={styles.summaryItemPrice}>
                    {(price * item.quantity).toFixed(2)} {t("common.currency")}
                  </Text>
                  {hasItemDiscount && (
                    <Text style={styles.summaryOriginalPrice}>
                      {(origPrice! * item.quantity).toFixed(2)}{" "}
                      {t("common.currency")}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
          <View style={styles.divider} />
          {appliedCoupon ? (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>
                  {t("checkout.subtotal")} (
                  {t("checkout.itemsCount", { count: totals.itemCount })})
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {totals.subtotal.toFixed(2)} {t("common.currency")}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.discountLabel}>
                  {t("checkout.discount")} ({appliedCoupon.discountPercent}%)
                </Text>
                <Text style={styles.discountValue}>
                  -{appliedCoupon.discountAmount.toFixed(2)}{" "}
                  {t("common.currency")}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>
                  {t("checkout.totalAfterDiscount")}
                </Text>
                <Text style={styles.totalValue}>
                  {appliedCoupon.finalTotal.toFixed(2)} {t("common.currency")}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.summaryItem}>
              <Text style={styles.totalLabel}>
                {t("checkout.total")} (
                {t("checkout.itemsCount", { count: totals.itemCount })})
              </Text>
              <Text style={styles.totalValue}>
                {totals.subtotal.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          )}

          {/* Loyalty Reward Summary */}
          {appliedReward ? (
            <>
              {loyaltyDiscount > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.discountLabel}>
                    🎁 {t("checkout.rewardDiscount")}
                  </Text>
                  <Text style={styles.discountValue}>
                    -{loyaltyDiscount.toFixed(2)} {t("common.currency")}
                  </Text>
                </View>
              )}
              {rewardFreeProduct ? (
                <View style={[styles.summaryItem, styles.prizeRow]}>
                  <View style={styles.summaryItemDetails}>
                    <Text style={styles.summaryItemName} numberOfLines={2}>
                      🎁{" "}
                      {isArabic
                        ? (rewardFreeProduct.name ?? t("checkout.prize"))
                        : (rewardFreeProduct.nameEn ??
                          rewardFreeProduct.name ??
                          t("checkout.prize"))}
                    </Text>
                    <Text style={styles.prizeBadgeText}>
                      {t("checkout.prize")}
                    </Text>
                  </View>
                  <Text style={[styles.summaryItemPrice, styles.prizePrice]}>
                    0.00 {t("common.currency")}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {/* Delivery Fee Section */}
          {selectedCityId && (
            <>
              <View style={styles.divider} />
              {loadingDeliveryFee ? (
                <View style={styles.summaryItem}>
                  <Text style={styles.totalLabel}>
                    {t("checkout.deliveryFee")}
                  </Text>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : deliveryFee ? (
                <>
                  <View style={styles.summaryItem}>
                    <Text style={styles.totalLabel}>
                      {t("checkout.deliveryFee")}
                    </Text>
                    {isFreeDelivery || rewardFreeDelivery ? (
                      <Text
                        style={[
                          styles.summaryItemPrice,
                          styles.freeDeliveryText,
                        ]}
                      >
                        {t("checkout.free")}
                      </Text>
                    ) : (
                      <Text style={styles.summaryItemPrice}>
                        {finalDeliveryFee.toFixed(2)} {t("common.currency")}
                      </Text>
                    )}
                  </View>
                  {rewardFreeDelivery && (
                    <Text style={styles.freeDeliveryNote}>
                      🎁 {t("checkout.freeDeliveryReward")}
                    </Text>
                  )}
                  {isFreeDelivery && !rewardFreeDelivery && (
                    <Text style={styles.freeDeliveryNote}>
                      🎉 {t("checkout.freeDeliveryApplied")}
                    </Text>
                  )}
                  {!isFreeDelivery &&
                    !rewardFreeDelivery &&
                    remainingForFree != null &&
                    remainingForFree > 0 && (
                      <Text style={styles.deliveryThresholdNote}>
                        {t("checkout.freeDeliveryAt", {
                          amount: remainingForFree.toFixed(2),
                        })}
                      </Text>
                    )}
                </>
              ) : null}
            </>
          )}
        </View>

        {/* Final Total with Delivery */}
        {selectedCityId && (deliveryFee || deliveryError) && (
          <View style={styles.finalTotalCard}>
            <View style={styles.summaryItem}>
              <Text style={[styles.totalLabel, { fontSize: FontSize.lg }]}>
                {t("checkout.grandTotal")}
              </Text>
              <Text style={[styles.totalValue, { fontSize: FontSize.xl }]}>
                {displayTotal.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          </View>
        )}

        {/* Shipping Details */}
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>
            {t("checkout.shippingAddress")}
          </Text>
        </View>
        <View style={styles.shippingCard}>
          {/* City Selector */}
          <Text style={styles.fieldLabel}>{t("checkout.city")}</Text>
          <Pressable
            style={[
              styles.citySelector,
              formErrors.city ? styles.citySelectorError : undefined,
            ]}
            onPress={() => {
              setShowCityPicker(!showCityPicker);
              setShowAreaPicker(false);
            }}
          >
            <Text
              style={[styles.cityText, !selectedCity && styles.cityPlaceholder]}
            >
              {selectedCity
                ? getCityName(selectedCity)
                : t("location.selectCity")}
            </Text>
            <Ionicons
              name={showCityPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>
          {formErrors.city ? (
            <Text style={styles.errorText}>{formErrors.city}</Text>
          ) : null}

          {showCityPicker ? (
            <View style={styles.dropdownList}>
              {cities.map((c, index) => (
                <Pressable
                  key={c.id}
                  style={[
                    styles.dropdownItem,
                    selectedCityId === c.id && styles.dropdownItemActive,
                    index === cities.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => {
                    setSelectedCityId(c.id);
                    setSelectedAreaId(null);
                    setShowCityPicker(false);
                    if (formErrors.city)
                      setFormErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCityId === c.id && styles.dropdownItemTextActive,
                    ]}
                  >
                    {getCityName(c)}
                  </Text>
                  {selectedCityId === c.id ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.primary}
                    />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Area Selector — only if city is selected and has areas */}
          {selectedCity && areas.length > 0 ? (
            <>
              {/* <Text style={styles.fieldLabel}>{t("location.selectArea")}</Text> */}
              <Pressable
                style={styles.citySelector}
                onPress={() => {
                  setShowAreaPicker(!showAreaPicker);
                  setShowCityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.cityText,
                    !selectedArea && styles.cityPlaceholder,
                  ]}
                >
                  {selectedArea
                    ? getAreaName(selectedArea)
                    : t("location.selectArea")}
                </Text>
                <Ionicons
                  name={showAreaPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </Pressable>

              {showAreaPicker ? (
                <View style={styles.dropdownList}>
                  {areas.map((a, index) => (
                    <Pressable
                      key={a.id}
                      style={[
                        styles.dropdownItem,
                        selectedAreaId === a.id && styles.dropdownItemActive,
                        index === areas.length - 1 && styles.dropdownItemLast,
                      ]}
                      onPress={() => {
                        setSelectedAreaId(a.id);
                        setShowAreaPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedAreaId === a.id &&
                            styles.dropdownItemTextActive,
                        ]}
                      >
                        {getAreaName(a)}
                      </Text>
                      {selectedAreaId === a.id ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={Colors.primary}
                        />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
          <Input
            label=""
            placeholder={t("checkout.addressPlaceholder")}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.addressInput}
          />
          <Input
            label=""
            placeholder={t("checkout.notesPlaceholder")}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        {/* Discount Code */}
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t("checkout.discountCode")}</Text>
        </View>
        {appliedCoupon ? (
          <View style={styles.couponAppliedCard}>
            <View style={styles.couponAppliedRow}>
              <Text style={styles.couponAppliedText}>
                {t("checkout.couponApplied")}
              </Text>
              <Pressable onPress={handleRemoveCoupon} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.couponCodeText}>{appliedCoupon.code}</Text>
          </View>
        ) : (
          <>
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.couponInput, isArabic && styles.couponInputRTL]}
                placeholder={t("checkout.discountCodePlaceholder")}
                placeholderTextColor={Colors.textLight}
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  if (couponError) setCouponError(null);
                }}
                autoCapitalize="characters"
                editable={!couponLoading}
                returnKeyType="done"
                onSubmitEditing={handleApplyCoupon}
              />
              <Pressable
                style={[
                  styles.couponButton,
                  (!couponCode.trim() || couponLoading) &&
                    styles.couponButtonDisabled,
                ]}
                onPress={handleApplyCoupon}
                disabled={!couponCode.trim() || couponLoading}
              >
                {couponLoading ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.couponButtonText}>
                    {t("checkout.apply")}
                  </Text>
                )}
              </Pressable>
            </View>
            {couponError ? (
              <Text style={styles.couponErrorText}>{couponError}</Text>
            ) : null}
          </>
        )}

        {/* Loyalty Rewards (redeemed coupons) */}
        {isAuthenticated && (activeRewardCoupons.length > 0 || appliedReward) ? (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="gift-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                {t("checkout.yourRewards")}
              </Text>
            </View>

            {appliedReward ? (
              <View style={styles.rewardAppliedCard}>
                <View style={styles.couponAppliedRow}>
                  <Text style={styles.couponAppliedText}>
                    🎁 {t("checkout.rewardApplied")}
                  </Text>
                  <Pressable onPress={handleRemoveReward} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </Pressable>
                </View>
                <Text style={styles.couponCodeText}>
                  {isArabic
                    ? (appliedReward.coupon.rewardNameAr ??
                      appliedReward.coupon.rewardName)
                    : (appliedReward.coupon.rewardNameEn ??
                      appliedReward.coupon.rewardName)}{" "}
                  · {appliedReward.coupon.code}
                </Text>
              </View>
            ) : (
              <View style={styles.rewardsList}>
                {activeRewardCoupons.map((coupon) => {
                  const rewardName = isArabic
                    ? (coupon.rewardNameAr ?? coupon.rewardName)
                    : (coupon.rewardNameEn ?? coupon.rewardName);
                  const isLoading = rewardLoadingId === coupon.id;
                  const detail =
                    coupon.rewardType === RewardType.FREE_DELIVERY
                      ? `🚚 ${t("loyalty.freeDelivery")}`
                      : coupon.rewardType === RewardType.FREE_PRODUCT
                        ? `🎁 ${t("loyalty.freeProduct")}${
                            coupon.freeProduct?.name
                              ? `: ${
                                  isArabic
                                    ? coupon.freeProduct.name
                                    : (coupon.freeProduct.nameEn ??
                                      coupon.freeProduct.name)
                                }`
                              : ""
                          }`
                        : coupon.discountPercentage != null
                          ? `${t("loyalty.discount")} ${coupon.discountPercentage}%`
                          : coupon.discountValue != null
                            ? `${t("loyalty.discount")} ${coupon.discountValue} ${t("common.currency")}`
                            : "";
                  return (
                    <View key={coupon.id} style={styles.rewardCouponCard}>
                      <View style={styles.rewardCouponInfo}>
                        <Text
                          style={styles.rewardCouponName}
                          numberOfLines={1}
                        >
                          {rewardName}
                        </Text>
                        {detail ? (
                          <Text style={styles.rewardCouponDetail}>
                            {detail}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        style={[
                          styles.couponButton,
                          isLoading && styles.couponButtonDisabled,
                        ]}
                        onPress={() => handleApplyReward(coupon)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.surface}
                          />
                        ) : (
                          <Text style={styles.couponButtonText}>
                            {t("checkout.useReward")}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
            {rewardError ? (
              <Text style={styles.couponErrorText}>{rewardError}</Text>
            ) : null}
          </>
        ) : null}

        {error ? <Text style={styles.apiError}>{error}</Text> : null}

        <Button
          title={`${t("checkout.placeOrder")} · ${displayTotal.toFixed(2)} ${t("common.currency")}`}
          onPress={handleConfirm}
          variant="accent"
          loading={creating}
          disabled={items.length === 0}
          style={styles.confirmBtn}
        />
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={Colors.success}
              />
            </View>
            <Text style={styles.modalTitle}>{t("checkout.successTitle")}</Text>
            <Text style={styles.modalMessage}>
              {t("checkout.successMessage")}
            </Text>
            <Text style={styles.loyaltyHint}>
              {t("loyalty.orderSuccess.loyaltyHint")}
            </Text>
            <View style={styles.modalButtons}>
              <Button
                title={t("checkout.goToOrders")}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace("/(tabs)/orders");
                }}
                variant="primary"
                style={styles.modalButton}
              />
              <Button
                title={t("checkout.goToHome")}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.replace("/(tabs)");
                }}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Error Modal */}
      <Modal
        visible={showStockErrorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStockErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.stockErrorModal]}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>
              {t("checkout.insufficientStockTitle") || "المخزون غير كافي"}
            </Text>
            <Text style={styles.modalMessage}>
              {t("checkout.insufficientStockMessage") ||
                "بعض المنتجات غير متاحة بالكمية المطلوبة. يرجى تحديث السلة."}
            </Text>

            {/* List of invalid items */}
            {invalidItems.length > 0 && (
              <ScrollView
                style={styles.invalidItemsList}
                scrollEnabled={invalidItems.length > 2}
              >
                {invalidItems.map((item) => (
                  <View key={item.cartItemId} style={styles.invalidItemCard}>
                    <Ionicons
                      name="warning"
                      size={16}
                      color={Colors.error}
                      style={styles.invalidItemIcon}
                    />
                    <View style={styles.invalidItemDetails}>
                      <Text style={styles.invalidItemName} numberOfLines={2}>
                        {item.productName}
                        {item.variantSize ? ` - ${item.variantSize}` : ""}
                        {item.optionName ? ` (${item.optionName})` : ""}
                      </Text>
                      <Text style={styles.invalidItemStock}>
                        {t("checkout.requestedVsAvailable", {
                          requested: item.requestedQty,
                          available: item.availableQty,
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <Button
                title={t("checkout.backToCart") || "العودة للسلة"}
                onPress={() => {
                  setShowStockErrorModal(false);
                  setInvalidItems([]);
                  router.back();
                }}
                variant="primary"
                style={styles.modalButton}
              />
              <Button
                title={t("common.close")}
                onPress={() => {
                  setShowStockErrorModal(false);
                  setInvalidItems([]);
                }}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  summaryItemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  summaryItemName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  summaryItemQty: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryItemOption: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: 1,
  },
  summaryItemNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  summaryPriceWrap: {
    alignItems: "flex-end",
  },
  summaryOriginalPrice: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textDecorationLine: "line-through",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: Colors.primary,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  shippingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  addressInput: {
    minHeight: 70,
  },
  citySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    marginBottom: Spacing.xs,
  },
  citySelectorError: {
    borderColor: Colors.error,
  },
  cityText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  cityPlaceholder: {
    color: Colors.textLight,
  },
  dropdownList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryXLight,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  notesInput: {
    minHeight: 50,
  },
  apiError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginBottom: Spacing.lg,
  },
  confirmBtn: {
    marginTop: Spacing.lg,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  couponInput: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  couponInputRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  couponButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  couponButtonDisabled: {
    opacity: 0.5,
  },
  couponButtonText: {
    color: Colors.surface,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  couponErrorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  couponAppliedCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success,
    padding: Spacing.md,
  },
  couponAppliedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  couponAppliedText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  couponCodeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rewardAppliedCard: {
    backgroundColor: "#fff7ed",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#fb923c",
    padding: Spacing.md,
  },
  rewardsList: {
    gap: Spacing.sm,
  },
  rewardCouponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  rewardCouponInfo: {
    flex: 1,
  },
  rewardCouponName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  rewardCouponDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  prizeRow: {
    backgroundColor: "#fff7ed",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  prizeBadgeText: {
    fontSize: FontSize.xs,
    color: "#ea580c",
    fontWeight: "700",
    marginTop: 2,
  },
  prizePrice: {
    color: "#ea580c",
    fontWeight: "800",
  },
  discountLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.success,
  },
  discountValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  finalTotalCard: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.sm,
  },
  freeDeliveryText: {
    color: Colors.success,
    fontWeight: "700",
  },
  freeDeliveryNote: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: "600",
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  deliveryThresholdNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    alignItems: "center",
    ...Shadows.md,
  },
  modalIconContainer: {
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  loyaltyHint: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    textAlign: "center",
    marginBottom: Spacing.xl,
    fontWeight: "600",
  },
  modalButtons: {
    width: "100%",
    gap: Spacing.sm,
  },
  modalButton: {
    width: "100%",
  },
  // Stock validation styles
  stockOk: {
    color: Colors.success,
  },
  stockWarning: {
    color: Colors.error,
  },
  stockErrorModal: {
    maxHeight: "80%",
  },
  invalidItemsList: {
    maxHeight: 200,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "#fef2f2",
  },
  invalidItemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  invalidItemIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  invalidItemDetails: {
    flex: 1,
  },
  invalidItemName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  invalidItemStock: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
