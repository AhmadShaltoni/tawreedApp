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
import { locationService } from "@/src/services/location.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { updateUserLocation } from "@/src/store/slices/auth.slice";
import { clearCart } from "@/src/store/slices/cart.slice";
import { createOrder } from "@/src/store/slices/orders.slice";
import type { City, CouponValidateSuccess } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface FormErrors {
  address?: string;
  city?: string;
}

export default function CheckoutScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items } = useAppSelector((state) => state.cart);
  const { creating, error } = useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);
  const isArabic = i18n.language === "ar";

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

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const areas = selectedCity?.areas ?? [];
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  const getCityName = (city: City) => (isArabic ? city.name : city.nameEn);
  const getAreaName = (area: { name: string; nameEn: string }) =>
    isArabic ? area.name : area.nameEn;

  // Build display string for city field (city + area)
  const cityDisplayText = useMemo(() => {
    if (!selectedCity) return "";
    const name = getCityName(selectedCity);
    if (selectedArea) return `${name} - ${getAreaName(selectedArea)}`;
    return name;
  }, [selectedCity, selectedArea, isArabic]);

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

  // Pre-fill from user's saved location after cities are loaded
  useEffect(() => {
    if (cities.length > 0 && user?.cityId) {
      // Check if the city exists in the loaded cities
      const cityExists = cities.some((c) => c.id === user.cityId);
      if (cityExists) {
        setSelectedCityId(user.cityId);
        if (user.areaId) {
          setSelectedAreaId(user.areaId);
        }
      }
    }
  }, [cities, user?.cityId, user?.areaId]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);
    return {
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  // The final total to display (with or without coupon)
  const displayTotal = appliedCoupon
    ? appliedCoupon.finalTotal
    : totals.subtotal;

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
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
        setCouponError(response.message);
      }
    } catch {
      setCouponError(t("common.error"));
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, totals.subtotal, t]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }, []);

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};
    if (!address.trim()) errors.address = t("checkout.addressRequired");
    if (!selectedCityId) errors.city = t("checkout.cityRequired");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [address, selectedCityId, t]);

  const handleConfirm = useCallback(async () => {
    if (!validate()) return;

    const result = await dispatch(
      createOrder({
        deliveryAddress: address.trim(),
        deliveryCity: cityDisplayText,
        buyerNotes: notes.trim() || undefined,
      }),
    );

    if (createOrder.fulfilled.match(result)) {
      // Confirm coupon usage (fire-and-forget)
      if (appliedCoupon) {
        couponService
          .confirmCoupon({
            code: appliedCoupon.code,
            orderId: result.payload.id,
            orderTotal: totals.subtotal,
          })
          .catch(() => {});
      }

      // Save location to user profile
      if (selectedCityId) {
        dispatch(
          updateUserLocation({
            cityId: selectedCityId,
            areaId: selectedAreaId ?? undefined,
          }),
        );
      }

      dispatch(clearCart());
      Alert.alert(
        "Order Placed!",
        `Order #${result.payload.orderNumber} has been placed successfully.`,
        [
          {
            text: "View Order",
            onPress: () => router.replace(`/order/${result.payload.id}`),
          },
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/orders"),
          },
        ],
      );
    } else if (createOrder.rejected.match(result)) {
      Alert.alert(t("common.error"), result.payload as string);
    }
  }, [
    dispatch,
    router,
    address,
    cityDisplayText,
    notes,
    validate,
    t,
    selectedCityId,
    selectedAreaId,
    appliedCoupon,
    totals.subtotal,
  ]);

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        {/* Order Summary */}
        <Text style={styles.sectionTitle}>{t("checkout.orderSummary")}</Text>
        <View style={styles.summaryCard}>
          {items.map((item) => {
            const price = item.product.discountPrice ?? item.product.price;
            return (
              <View key={item.cartItemId} style={styles.summaryItem}>
                <View style={styles.summaryItemDetails}>
                  <Text style={styles.summaryItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.summaryItemQty}>
                    x{item.quantity} {item.product.unit}
                  </Text>
                </View>
                <Text style={styles.summaryItemPrice}>
                  {(price * item.quantity).toFixed(2)} {t("common.currency")}
                </Text>
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
        </View>

        {/* Shipping Details */}
        <Text style={styles.sectionTitle}>{t("checkout.shippingAddress")}</Text>

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
          <View style={styles.cityList}>
            {cities.map((c) => (
              <Text
                key={c.id}
                style={[
                  styles.cityOption,
                  selectedCityId === c.id && styles.cityOptionActive,
                ]}
                onPress={() => {
                  setSelectedCityId(c.id);
                  setSelectedAreaId(null);
                  setShowCityPicker(false);
                  if (formErrors.city)
                    setFormErrors((prev) => ({ ...prev, city: undefined }));
                }}
              >
                {getCityName(c)}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Area Selector — only if city is selected and has areas */}
        {selectedCity && areas.length > 0 ? (
          <>
            <Text style={styles.fieldLabel}>{t("location.selectArea")}</Text>
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
              <View style={styles.cityList}>
                {areas.map((a) => (
                  <Text
                    key={a.id}
                    style={[
                      styles.cityOption,
                      selectedAreaId === a.id && styles.cityOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedAreaId(a.id);
                      setShowAreaPicker(false);
                    }}
                  >
                    {getAreaName(a)}
                  </Text>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        <Input
          label={t("checkout.shippingAddress")}
          placeholder={t("checkout.addressPlaceholder")}
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (formErrors.address)
              setFormErrors((prev) => ({ ...prev, address: undefined }));
          }}
          // error={formErrors.address}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={styles.addressInput}
        />
        <Input
          label={t("checkout.notes")}
          placeholder={t("checkout.notesPlaceholder")}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          style={styles.notesInput}
        />

        {/* Discount Code */}
        <Text style={styles.sectionTitle}>{t("checkout.discountCode")}</Text>
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
                style={styles.couponInput}
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
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
  summaryItemPrice: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
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
  cityList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    maxHeight: 200,
    overflow: "hidden",
    ...Shadows.md,
  },
  cityOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityOptionActive: {
    backgroundColor: Colors.primaryXLight,
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
});
