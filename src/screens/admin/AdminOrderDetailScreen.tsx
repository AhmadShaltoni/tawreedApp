import OrderStatusBadge, {
  STATUS_TRANSLATION_KEY,
} from "@/src/components/OrderStatusBadge";
import ErrorScreen from "@/src/components/errors/ErrorScreen";
import Button from "@/src/components/ui/Button";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import {
  adminOrderService,
  type AdminOrderDetail,
  type AdminOrderItem,
  type EditDiffLine,
} from "@/src/services/adminOrder.service";
import type { OrderStatus } from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DELIVERY_PHONE_KEY = "tawreed_admin_delivery_phone";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** Normalize a locally-typed phone to WhatsApp digits (Jordan default code). */
function normalizeWhatsAppPhone(raw: string, defaultCountryCode = "962"): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return defaultCountryCode + digits.slice(1);
  if (digits.startsWith(defaultCountryCode)) return digits;
  return defaultCountryCode + digits;
}

function itemDetails(item: AdminOrderItem, isAr: boolean): string {
  const parts: string[] = [];
  const size = isAr ? item.variantSize : item.variantSizeEn || item.variantSize;
  const option = isAr
    ? item.variantOptionName
    : item.variantOptionNameEn || item.variantOptionName;
  const unit = isAr ? item.unitLabel : item.unitLabelEn || item.unitLabel;
  if (size) parts.push(size);
  if (option) parts.push(option);
  if (unit) parts.push(unit);
  return parts.join(" · ");
}

function diffLineLabel(line: EditDiffLine): string {
  const parts = [line.productName];
  if (line.variantSize) parts.push(line.variantSize);
  if (line.variantOptionName) parts.push(line.variantOptionName);
  if (line.unitLabel) parts.push(line.unitLabel);
  return parts.join(" · ");
}

export default function AdminOrderDetailScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolvingEdit, setResolvingEdit] = useState<"approve" | "reject" | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminOrderService.getOrderDetail(
        id,
        isAr ? "ar" : "en",
      );
      setOrder(data.order);
      setWhatsappMessage(data.whatsappMessage);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id, isAr]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  // Remember the last driver number typed — usually the same person.
  useEffect(() => {
    AsyncStorage.getItem(DELIVERY_PHONE_KEY)
      .then((saved) => {
        if (saved) setDeliveryPhone(saved);
      })
      .catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleWhatsApp = useCallback(async () => {
    const trimmed = deliveryPhone.trim();
    if (!trimmed) {
      setPhoneError(t("adminOrders.deliveryPhoneRequired"));
      return;
    }
    setPhoneError(null);
    AsyncStorage.setItem(DELIVERY_PHONE_KEY, trimmed).catch(() => {});
    const number = normalizeWhatsAppPhone(trimmed);
    const url = `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("common.error"), t("adminOrders.whatsappFailed"));
    }
  }, [deliveryPhone, whatsappMessage, t]);

  const handleStatusUpdate = useCallback(
    (status: OrderStatus) => {
      if (!order) return;
      Alert.alert(
        t("adminOrders.confirmStatusTitle"),
        t("adminOrders.confirmStatusMessage", {
          status: t(STATUS_TRANSLATION_KEY[status]),
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.confirm"),
            style: status === "CANCELLED" ? "destructive" : "default",
            onPress: async () => {
              setUpdatingStatus(status);
              try {
                await adminOrderService.updateOrderStatus(
                  order.id,
                  status,
                  statusNote,
                );
                setStatusNote("");
                await load();
              } catch (err) {
                Alert.alert(t("common.error"), getErrorMessage(err));
              } finally {
                setUpdatingStatus(null);
              }
            },
          },
        ],
      );
    },
    [order, statusNote, load, t],
  );

  const handleResolveEdit = useCallback(
    (action: "approve" | "reject") => {
      const editRequest = order?.pendingEditRequest;
      if (!editRequest) return;
      Alert.alert(
        t(
          action === "approve"
            ? "adminOrders.confirmApproveTitle"
            : "adminOrders.confirmRejectTitle",
        ),
        t(
          action === "approve"
            ? "adminOrders.confirmApproveMessage"
            : "adminOrders.confirmRejectMessage",
        ),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("common.confirm"),
            style: action === "reject" ? "destructive" : "default",
            onPress: async () => {
              setResolvingEdit(action);
              try {
                await adminOrderService.resolveEditRequest(
                  editRequest.id,
                  action,
                  adminNote,
                );
                setAdminNote("");
                await load();
                Alert.alert("", t("adminOrders.editResolved"));
              } catch (err) {
                Alert.alert(t("common.error"), getErrorMessage(err));
              } finally {
                setResolvingEdit(null);
              }
            },
          },
        ],
      );
    },
    [order, adminNote, load, t],
  );

  if (loading) return <Loader />;

  if (error || !order) {
    return (
      <ErrorScreen
        type="generic"
        onRetry={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
        errorMessage={error ?? undefined}
      />
    );
  }

  const customer = order.buyer.storeName || order.buyer.username;
  const date = new Date(order.createdAt).toLocaleDateString(
    isAr ? "ar-EG" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const editRequest = order.pendingEditRequest;
  const diff = editRequest?.diff ?? null;
  const canUpdateStatus =
    order.status !== "DELIVERED" && order.status !== "CANCELLED";

  const renderDiffLine = (
    line: EditDiffLine,
    kind: "added" | "removed",
    key: string,
  ) => (
    <View key={key} style={styles.diffLine}>
      <Ionicons
        name={kind === "added" ? "add-circle" : "remove-circle"}
        size={16}
        color={kind === "added" ? Colors.success : Colors.error}
      />
      <Text style={styles.diffLineText} numberOfLines={2}>
        {diffLineLabel(line)}
      </Text>
      <Text
        style={[
          styles.diffQty,
          { color: kind === "added" ? Colors.success : Colors.error },
        ]}
      >
        ×{line.quantity}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Order header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <OrderStatusBadge status={order.status} size="md" />
          <Text style={styles.orderNumber}>
            #{order.orderNumber.slice(-8).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* Pending edit request */}
      {editRequest ? (
        <View style={[styles.card, styles.editCard]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="create" size={18} color={Colors.secondaryDark} />
            <Text style={[styles.sectionTitle, styles.editTitle]}>
              {t("adminOrders.editRequest")}
            </Text>
          </View>

          {editRequest.buyerMessage ? (
            <View style={styles.buyerMessageBox}>
              <Text style={styles.buyerMessageLabel}>
                {t("adminOrders.editRequestMessage")}
              </Text>
              <Text style={styles.buyerMessageText}>
                {editRequest.buyerMessage}
              </Text>
            </View>
          ) : null}

          {diff ? (
            <>
              {diff.added.length > 0 ? (
                <View style={styles.diffGroup}>
                  <Text style={styles.diffGroupTitle}>
                    {t("adminOrders.added")}
                  </Text>
                  {diff.added.map((line, i) =>
                    renderDiffLine(line, "added", `a-${i}`),
                  )}
                </View>
              ) : null}
              {diff.removed.length > 0 ? (
                <View style={styles.diffGroup}>
                  <Text style={styles.diffGroupTitle}>
                    {t("adminOrders.removed")}
                  </Text>
                  {diff.removed.map((line, i) =>
                    renderDiffLine(line, "removed", `r-${i}`),
                  )}
                </View>
              ) : null}
              {diff.changed.length > 0 ? (
                <View style={styles.diffGroup}>
                  <Text style={styles.diffGroupTitle}>
                    {t("adminOrders.changed")}
                  </Text>
                  {diff.changed.map((change, i) => (
                    <View key={`c-${i}`} style={styles.diffLine}>
                      <Ionicons
                        name="swap-horizontal"
                        size={16}
                        color={Colors.info}
                      />
                      <Text style={styles.diffLineText} numberOfLines={2}>
                        {diffLineLabel(change.after)}
                      </Text>
                      <Text style={styles.diffQtyChange}>
                        ×{change.before.quantity} ← ×{change.after.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {Object.entries(diff.delivery).length > 0 ? (
                <View style={styles.diffGroup}>
                  <Text style={styles.diffGroupTitle}>
                    {t("adminOrders.deliveryChanges")}
                  </Text>
                  {Object.entries(diff.delivery).map(([field, change]) =>
                    change ? (
                      <View key={field} style={styles.deliveryChange}>
                        <Text style={styles.deliveryChangeBefore}>
                          {change.before ?? "—"}
                        </Text>
                        <Ionicons
                          name={isAr ? "arrow-back" : "arrow-forward"}
                          size={13}
                          color={Colors.textLight}
                        />
                        <Text style={styles.deliveryChangeAfter}>
                          {change.after ?? "—"}
                        </Text>
                      </View>
                    ) : null,
                  )}
                </View>
              ) : null}
              <View style={styles.diffTotalsRow}>
                <View style={styles.diffTotalBox}>
                  <Text style={styles.diffTotalLabel}>
                    {t("adminOrders.totalBefore")}
                  </Text>
                  <Text style={styles.diffTotalValue}>
                    {diff.totals.before.grandTotal.toFixed(2)}{" "}
                    {t("common.currency")}
                  </Text>
                </View>
                <View style={[styles.diffTotalBox, styles.diffTotalBoxAfter]}>
                  <Text style={styles.diffTotalLabel}>
                    {t("adminOrders.totalAfter")}
                  </Text>
                  <Text style={[styles.diffTotalValue, styles.diffTotalAfter]}>
                    {diff.totals.after.grandTotal.toFixed(2)}{" "}
                    {t("common.currency")}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          <TextInput
            style={styles.noteInput}
            value={adminNote}
            onChangeText={setAdminNote}
            placeholder={t("adminOrders.adminNote")}
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <View style={styles.editActions}>
            <View style={styles.editActionButton}>
              <Button
                title={t("adminOrders.approve")}
                onPress={() => handleResolveEdit("approve")}
                loading={resolvingEdit === "approve"}
                disabled={resolvingEdit !== null}
                size="sm"
              />
            </View>
            <View style={styles.editActionButton}>
              <Button
                title={t("adminOrders.reject")}
                onPress={() => handleResolveEdit("reject")}
                loading={resolvingEdit === "reject"}
                disabled={resolvingEdit !== null}
                variant="outline"
                size="sm"
              />
            </View>
          </View>
        </View>
      ) : null}

      {/* Customer */}
      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="storefront" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t("adminOrders.customer")}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t("adminOrders.storeName")}</Text>
          <Text style={styles.fieldValue}>{customer}</Text>
        </View>
        {order.buyer.phone ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t("adminOrders.phone")}</Text>
            <Pressable
              style={styles.phoneRow}
              onPress={() =>
                Linking.openURL(`tel:${order.buyer.phone}`).catch(() => {})
              }
            >
              <Ionicons name="call" size={14} color={Colors.primary} />
              <Text style={[styles.fieldValue, styles.phoneValue]}>
                {order.buyer.phone}
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t("adminOrders.city")}</Text>
          <Text style={styles.fieldValue}>{order.deliveryCity}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{t("adminOrders.address")}</Text>
          <Text style={styles.fieldValue}>{order.deliveryAddress}</Text>
        </View>
        {order.deliveryAddressDetails ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              {t("adminOrders.addressDetails")}
            </Text>
            <Text style={styles.fieldValue}>
              {order.deliveryAddressDetails}
            </Text>
          </View>
        ) : null}
        {order.buyerNotes ? (
          <View style={styles.customerNoteBox}>
            <Ionicons name="warning" size={14} color={Colors.error} />
            <Text style={styles.customerNoteText}>
              {t("adminOrders.customerNote")}: {order.buyerNotes}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Items */}
      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="cart" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>
            {t("adminOrders.items")} ({order.items.length})
          </Text>
        </View>
        {order.items.map((item) => {
          const details = itemDetails(item, isAr);
          return (
            <View key={item.id} style={styles.itemRow}>
              {item.productImage ? (
                <Image
                  source={{ uri: item.productImage }}
                  style={styles.itemImage}
                  contentFit="cover"
                  recyclingKey={item.id}
                />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons
                    name={item.isReward ? "gift" : "cube-outline"}
                    size={22}
                    color={Colors.textLight}
                  />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {isAr ? item.productName : item.productNameEn || item.productName}
                </Text>
                {details ? (
                  <Text style={styles.itemDetails} numberOfLines={1}>
                    {details}
                  </Text>
                ) : null}
                <Text style={styles.itemPrice}>
                  {item.isReward
                    ? `🎁 ${t("adminOrders.free")}`
                    : item.quantity > 1
                      ? `${item.pricePerUnit.toFixed(2)} × ${item.quantity} = ${item.totalPrice.toFixed(2)} ${t("common.currency")}`
                      : `${item.totalPrice.toFixed(2)} ${t("common.currency")}`}
                </Text>
                {item.note ? (
                  <View style={styles.itemNoteBox}>
                    <Text style={styles.itemNoteText}>
                      ⚠️ {t("adminOrders.itemNote")}: {item.note}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>×{item.quantity}</Text>
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={styles.summary}>
          {order.deliveryFee > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("adminOrders.deliveryFee")}
              </Text>
              <Text style={styles.summaryValue}>
                {order.deliveryFee.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("adminOrders.total")}</Text>
            <Text style={styles.totalValue}>
              {order.totalPrice.toFixed(2)} {t("common.currency")}
            </Text>
          </View>
        </View>
      </View>

      {/* Send to delivery via WhatsApp */}
      <View style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="logo-whatsapp" size={18} color={Colors.whatsapp} />
          <Text style={styles.sectionTitle}>
            {t("adminOrders.sendToDelivery")}
          </Text>
        </View>
        <Text style={styles.fieldLabel}>{t("adminOrders.deliveryPhone")}</Text>
        <TextInput
          style={[styles.phoneInput, phoneError ? styles.inputError : null]}
          value={deliveryPhone}
          onChangeText={(v) => {
            setDeliveryPhone(v);
            if (phoneError) setPhoneError(null);
          }}
          placeholder={t("adminOrders.deliveryPhonePlaceholder")}
          placeholderTextColor={Colors.textLight}
          keyboardType="phone-pad"
          textAlign="left"
        />
        {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
        <Pressable style={styles.whatsappButton} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
          <Text style={styles.whatsappButtonText}>
            {t("adminOrders.openWhatsApp")}
          </Text>
        </Pressable>
      </View>

      {/* Update status */}
      {canUpdateStatus ? (
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sync" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              {t("adminOrders.updateStatus")}
            </Text>
          </View>
          <TextInput
            style={styles.noteInput}
            value={statusNote}
            onChangeText={setStatusNote}
            placeholder={t("adminOrders.statusNote")}
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <View style={styles.statusButtons}>
            {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.statusButton,
                  s === "CANCELLED" && styles.statusButtonDanger,
                  updatingStatus !== null && styles.statusButtonDisabled,
                ]}
                disabled={updatingStatus !== null}
                onPress={() => handleStatusUpdate(s)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    s === "CANCELLED" && styles.statusButtonTextDanger,
                  ]}
                >
                  {updatingStatus === s
                    ? "..."
                    : t(STATUS_TRANSLATION_KEY[s])}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderNumber: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.text,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "left",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    minWidth: 90,
    textAlign: "left",
  },
  fieldValue: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "left",
  },
  phoneRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  phoneValue: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  customerNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.errorSurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  customerNoteText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "#b91c1c",
    textAlign: "left",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "left",
  },
  itemDetails: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "left",
  },
  itemPrice: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "left",
  },
  itemNoteBox: {
    backgroundColor: Colors.errorSurface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
  },
  itemNoteText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    color: "#b91c1c",
  },
  qtyBadge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 44,
    alignItems: "center",
  },
  qtyText: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.white,
  },
  summary: {
    marginTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.error,
  },
  editCard: {
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryLight,
  },
  editTitle: {
    color: Colors.secondaryDark,
  },
  buyerMessageBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  buyerMessageLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    marginBottom: 2,
    textAlign: "left",
  },
  buyerMessageText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "left",
  },
  diffGroup: {
    marginBottom: Spacing.md,
  },
  diffGroupTitle: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: "left",
  },
  diffLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  diffLineText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
    textAlign: "left",
  },
  diffQty: {
    fontSize: FontSize.xs,
    fontWeight: "800",
  },
  diffQtyChange: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: Colors.info,
  },
  deliveryChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  deliveryChangeBefore: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  deliveryChangeAfter: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.text,
    flexShrink: 1,
  },
  diffTotalsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  diffTotalBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  diffTotalBoxAfter: {
    borderWidth: 1,
    borderColor: Colors.success,
  },
  diffTotalLabel: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
  },
  diffTotalValue: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 2,
  },
  diffTotalAfter: {
    color: Colors.success,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.text,
    minHeight: 44,
    textAlign: "right",
    marginBottom: Spacing.md,
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  editActionButton: {
    flex: 1,
  },
  phoneInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  inputError: {
    borderColor: Colors.error,
  },
  phoneError: {
    fontSize: FontSize.xxs,
    color: Colors.error,
    marginTop: Spacing.xs,
    textAlign: "left",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.whatsapp,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  whatsappButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusButton: {
    flexGrow: 1,
    flexBasis: "30%",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statusButtonDanger: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.text,
  },
  statusButtonTextDanger: {
    color: Colors.error,
  },
});
