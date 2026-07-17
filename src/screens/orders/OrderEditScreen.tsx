import Loader from "@/src/components/ui/Loader";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
    fetchOrderDetail,
    submitOrderEditRequest,
} from "@/src/store/slices/orders.slice";
import type {
    CreateOrderEditRequestPayload,
    OrderItem,
} from "@/src/types";
import { openWhatsApp } from "@/src/utils/whatsapp";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** A working copy of an editable order line. */
interface EditableLine {
  key: string;
  item: OrderItem;
  quantity: number;
  removed: boolean;
}

const makeKey = (item: OrderItem) =>
  `${item.variantId}|${item.variantOptionId ?? ""}|${item.productUnitId ?? ""}`;

export default function OrderEditScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { selectedOrder: order, updating } = useAppSelector(
    (state) => state.orders,
  );

  const [lines, setLines] = useState<EditableLine[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Ensure the order for this route is loaded.
  useEffect(() => {
    if (id && (!order || order.id !== id)) {
      dispatch(fetchOrderDetail(id));
    }
  }, [id, order, dispatch]);

  // Seed the working copy once the correct order is in the store.
  useEffect(() => {
    if (!initialized && order && order.id === id) {
      const editable = order.items
        .filter((it) => !it.isReward && it.variantId)
        .map((it) => ({
          key: makeKey(it),
          item: it,
          quantity: it.quantity,
          removed: false,
        }));
      setLines(editable);
      setAddress(order.shippingAddress ?? "");
      setCity(order.city ?? "");
      setNotes(order.notes ?? "");
      setInitialized(true);
    }
  }, [order, id, initialized]);

  // Some lines (legacy/RFQ orders) lack variant references and can't be re-priced.
  const hasUneditableItems = useMemo(
    () =>
      !!order &&
      order.items.some((it) => !it.isReward && !it.variantId),
    [order],
  );

  if (!order || order.id !== id || !initialized) {
    return <Loader />;
  }

  const activeLines = lines.filter((l) => !l.removed);
  const canSubmit = activeLines.length > 0 && !updating;

  const setQty = (key: string, delta: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? { ...l, quantity: Math.max(1, l.quantity + delta) }
          : l,
      ),
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, removed: true } : l)),
    );
  };

  const restoreLine = (key: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, removed: false } : l)),
    );
  };

  const handleSubmit = async () => {
    if (activeLines.length === 0) {
      Alert.alert(t("orders.editError"), t("orders.editNeedsItem"));
      return;
    }

    const payload: CreateOrderEditRequestPayload = {
      items: activeLines.map((l) => ({
        variantId: l.item.variantId as string,
        variantOptionId: l.item.variantOptionId ?? null,
        productUnitId: l.item.productUnitId ?? null,
        quantity: l.quantity,
        note: l.item.note ?? null,
      })),
      deliveryAddress: address.trim() || undefined,
      deliveryCity: city.trim() || undefined,
      buyerNotes: notes.trim() || undefined,
      buyerMessage: message.trim() || undefined,
    };

    const result = await dispatch(
      submitOrderEditRequest({ id: order.id, payload }),
    );

    if (submitOrderEditRequest.fulfilled.match(result)) {
      Alert.alert(
        t("orders.editSubmittedTitle"),
        t("orders.editSubmittedMessage"),
        [{ text: t("common.ok"), onPress: () => router.back() }],
      );
    } else {
      Alert.alert(
        t("orders.editError"),
        (result.payload as string) || t("orders.editErrorGeneric"),
      );
    }
  };

  const lineTitle = (item: OrderItem) => {
    const name = isAr ? item.productName : item.productNameEn ?? item.productName;
    const size = isAr ? item.variantSize : item.variantSizeEn ?? item.variantSize;
    const opt = isAr ? item.optionName : item.optionNameEn ?? item.optionName;
    return [name, size, opt].filter(Boolean).join(" · ");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("orders.editOrder")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.hint}>{t("orders.editHint")}</Text>

        {hasUneditableItems ? (
          <Pressable
            style={styles.warningBox}
            onPress={() =>
              openWhatsApp(
                t("orders.whatsappEditMessage", {
                  orderNumber: order.orderNumber,
                }),
              )
            }
          >
            <Ionicons name="alert-circle" size={18} color={Colors.secondary} />
            <Text style={styles.warningText}>{t("orders.editLegacyWarning")}</Text>
          </Pressable>
        ) : null}

        {/* Items */}
        <Text style={styles.sectionTitle}>{t("orders.items")}</Text>
        {lines.map((line) => {
          const displayImage =
            line.item.productImage || line.item.optionImage || undefined;
          return (
            <View
              key={line.key}
              style={[styles.lineCard, line.removed && styles.lineCardRemoved]}
            >
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  style={styles.lineImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.lineImage, styles.lineImagePlaceholder]}>
                  <Ionicons name="cube-outline" size={22} color={Colors.textLight} />
                </View>
              )}

              <View style={styles.lineInfo}>
                <Text
                  style={[
                    styles.lineTitle,
                    line.removed && styles.lineTitleRemoved,
                  ]}
                  numberOfLines={2}
                >
                  {lineTitle(line.item)}
                </Text>
                <Text style={styles.linePrice}>
                  {line.item.price.toFixed(2)} {t("common.currency")}
                </Text>

                {line.removed ? (
                  <Pressable onPress={() => restoreLine(line.key)}>
                    <Text style={styles.restoreText}>
                      {t("orders.restoreItem")}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.lineControls}>
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setQty(line.key, -1)}
                      >
                        <Ionicons name="remove" size={18} color={Colors.text} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{line.quantity}</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setQty(line.key, 1)}
                      >
                        <Ionicons name="add" size={18} color={Colors.text} />
                      </Pressable>
                    </View>
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => removeLine(line.key)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Delivery */}
        <Text style={styles.sectionTitle}>{t("orders.deliveryInfo")}</Text>
        <Text style={styles.fieldLabel}>{t("checkout.shippingAddress")}</Text>
        <TextInput
          style={[styles.input, isAr && styles.inputRTL]}
          value={address}
          onChangeText={setAddress}
          placeholder={t("checkout.addressPlaceholder")}
          placeholderTextColor={Colors.textLight}
          multiline
        />

        <Text style={styles.fieldLabel}>{t("checkout.city")}</Text>
        <TextInput
          style={[styles.input, isAr && styles.inputRTL]}
          value={city}
          onChangeText={setCity}
          placeholder={t("checkout.selectCity")}
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.fieldLabel}>{t("orders.buyerNotes")}</Text>
        <TextInput
          style={[styles.input, { minHeight: 70 }, isAr && styles.inputRTL]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("checkout.notesPlaceholder")}
          placeholderTextColor={Colors.textLight}
          multiline
        />

        <Text style={styles.fieldLabel}>{t("orders.editMessageLabel")}</Text>
        <TextInput
          style={[styles.input, { minHeight: 70 }, isAr && styles.inputRTL]}
          value={message}
          onChangeText={setMessage}
          placeholder={t("orders.editMessagePlaceholder")}
          placeholderTextColor={Colors.textLight}
          multiline
        />

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Submit bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.85 },
            !canSubmit && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {updating ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t("orders.submitEditRequest")}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  scrollContent: { padding: Spacing.xxl },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lineCard: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  lineCardRemoved: { opacity: 0.6 },
  lineImage: { width: 56, height: 56, borderRadius: BorderRadius.sm },
  lineImagePlaceholder: {
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  lineInfo: { flex: 1 },
  lineTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  lineTitleRemoved: { textDecorationLine: "line-through" },
  linePrice: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lineControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
  },
  stepperBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  stepperValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  removeBtn: { padding: Spacing.sm },
  restoreText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inputRTL: { textAlign: "right" },
  footer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
});
