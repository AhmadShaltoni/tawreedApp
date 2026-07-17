import ErrorScreen from "@/src/components/errors/ErrorScreen";
import OrderDeliveryCard from "@/src/components/OrderDeliveryCard";
import OrderPricingCard from "@/src/components/OrderPricingCard";
import OrderProductItem from "@/src/components/OrderProductItem";
import OrderStatusBadge, {
    STATUS_CONFIG,
    STATUS_TRANSLATION_KEY,
} from "@/src/components/OrderStatusBadge";
import OrderStatusTimeline from "@/src/components/OrderStatusTimeline";
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
    cancelOrderEditRequest,
    clearOrderDetail,
    fetchOrderDetail,
} from "@/src/store/slices/orders.slice";
import type { StatusHistoryEntry } from "@/src/types";
import { openWhatsApp } from "@/src/utils/whatsapp";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OrderDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAr = i18n.language === "ar";

  /** Show a short, readable order ID */
  const formatOrderId = (raw: string): string => {
    if (!raw) return "#—";
    if (raw.length <= 10) return `#${raw}`;
    return `#${raw.slice(-6).toUpperCase()}`;
  };
  const {
    selectedOrder: order,
    loadingDetail,
    updating,
    error: orderError,
  } = useAppSelector((state) => state.orders);

  // Fetch order detail when entering/focusing on this screen
  useFocusEffect(
    useCallback(() => {
      if (id) {
        dispatch(fetchOrderDetail(id));
      }
      return () => {
        dispatch(clearOrderDetail());
      };
    }, [dispatch, id]),
  );

  const hasPendingEdit = !!order?.pendingEditRequest;

  // Open the full editor (add/remove items, change quantities, delivery) for a
  // PENDING order. Confirmed orders can no longer be self-edited — offer to
  // reach out on WhatsApp instead.
  const handleEditPress = useCallback(() => {
    if (!order) return;
    if (order.status !== "PENDING") {
      Alert.alert(
        t("orders.cannotEdit"),
        t("orders.cannotEditMessage", {
          status: t(STATUS_TRANSLATION_KEY[order.status]),
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("orders.contactSupport"),
            onPress: () =>
              openWhatsApp(
                t("orders.whatsappEditMessage", {
                  orderNumber: order.orderNumber,
                }),
              ),
          },
        ],
      );
      return;
    }
    if (hasPendingEdit) {
      Alert.alert(t("orders.editPendingTitle"), t("orders.editPendingMessage"));
      return;
    }
    router.push(`/order/edit/${order.id}`);
  }, [order, hasPendingEdit, router, t]);

  const handleCancelEditRequest = useCallback(() => {
    if (!order) return;
    Alert.alert(
      t("orders.cancelEditTitle"),
      t("orders.cancelEditMessage"),
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: async () => {
            const result = await dispatch(cancelOrderEditRequest(order.id));
            if (cancelOrderEditRequest.fulfilled.match(result)) {
              dispatch(fetchOrderDetail(order.id));
            }
          },
        },
      ],
    );
  }, [order, dispatch, t]);

  if (loadingDetail || !order) {
    if (orderError && !loadingDetail) {
      return (
        <ErrorScreen
          type="generic"
          onRetry={() => {
            if (id) dispatch(fetchOrderDetail(id));
          }}
          errorMessage={orderError}
        />
      );
    }
    return <Loader />;
  }

  const isPending = order.status === "PENDING";

  // Loyalty reward applied on this order (for the "reward used" banner)
  const reward = order.redeemedReward;
  const rewardName = reward
    ? isAr
      ? reward.rewardName ?? reward.productName ?? reward.rewardNameEn
      : reward.rewardNameEn ??
        reward.rewardName ??
        reward.productNameEn ??
        reward.productName
    : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderHistoryEntry = (entry: StatusHistoryEntry, index: number) => {
    const entryConfig = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.PENDING;

    return (
      <View key={index} style={styles.historyEntry}>
        {index > 0 ? (
          <View
            style={[
              styles.historyConnector,
              { backgroundColor: entryConfig.color },
            ]}
          />
        ) : null}
        <View
          style={[styles.historyDot, { backgroundColor: entryConfig.color }]}
        />
        <View style={styles.historyContent}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyStatus, { color: entryConfig.color }]}>
              {t(
                STATUS_TRANSLATION_KEY[entry.status] ?? "orders.statusPending",
              )}
            </Text>
            <Text style={styles.historyDate}>
              {formatDate(entry.timestamp)}
            </Text>
          </View>
          {entry.note ? (
            <View style={styles.historyNoteBox}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={13}
                color={Colors.textSecondary}
              />
              <Text style={styles.historyNote}>{entry.note}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("orders.orderDetail")}</Text>
        {isPending && !hasPendingEdit ? (
          <Pressable onPress={handleEditPress} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
        ]}
      >
        {/* Section 1: Header Card — Order number, date, status */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardTop}>
            <View style={styles.headerCardInfo}>
              <Text style={styles.headerOrderNumber}>
                {formatOrderId(order.orderNumber)}
              </Text>
              <Text style={styles.headerOrderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <OrderStatusBadge status={order.status} size="md" />
          </View>
        </View>

        {/* Reward used banner — prominent */}
        {reward && rewardName ? (
          <View style={styles.rewardBanner}>
            <View style={styles.rewardBannerIcon}>
              <Ionicons name="gift" size={22} color={Colors.white} />
            </View>
            <View style={styles.rewardBannerTextWrap}>
              <Text style={styles.rewardBannerTitle}>
                {t("orders.rewardUsedTitle")}
              </Text>
              <Text style={styles.rewardBannerName}>{rewardName}</Text>
            </View>
          </View>
        ) : null}

        {/* Pending edit request banner */}
        {hasPendingEdit ? (
          <View style={styles.pendingEditBanner}>
            <View style={styles.pendingEditRow}>
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={Colors.secondary}
              />
              <View style={styles.pendingEditTextWrap}>
                <Text style={styles.pendingEditTitle}>
                  {t("orders.editPendingTitle")}
                </Text>
                <Text style={styles.pendingEditMessage}>
                  {t("orders.editPendingMessage")}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.pendingEditCancel,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleCancelEditRequest}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={Colors.error} size="small" />
              ) : (
                <Text style={styles.pendingEditCancelText}>
                  {t("orders.cancelEditRequest")}
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {/* Section 2: Products — what the user ordered */}
        {order.items && order.items.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("orders.items")} ({order.items.length})
            </Text>
            {order.items.map((item) => (
              <OrderProductItem key={item.id} item={item} />
            ))}
          </View>
        ) : null}

        {/* Section 3: Pricing — total is always visible */}
        <View style={styles.section}>
          <OrderPricingCard order={order} />
        </View>

        {/* Section 4: Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orders.timeline")}</Text>
          <OrderStatusTimeline currentStatus={order.status} />
        </View>

        {/* Section 5: Delivery Information */}
        {order.city || order.shippingAddress ? (
          <View style={styles.section}>
            <OrderDeliveryCard
              city={order.city}
              address={order.shippingAddress}
              notes={order.notes}
            />
          </View>
        ) : null}

        {/* Status History with admin notes */}
        {order.statusHistory && order.statusHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("orders.statusHistory")}</Text>
            <View style={styles.historyCard}>
              {[...order.statusHistory]
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
                )
                .map(renderHistoryEntry)}
            </View>
          </View>
        ) : null}

        {/* Edit Button — only for PENDING with no request awaiting review */}
        {isPending && !hasPendingEdit ? (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={20} color={Colors.white} />
              <Text style={styles.editButtonText}>{t("orders.editOrder")}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Contact support on WhatsApp — always available */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.whatsappButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() =>
              openWhatsApp(
                t("orders.whatsappEditMessage", {
                  orderNumber: order.orderNumber,
                }),
              )
            }
          >
            <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
            <Text style={styles.whatsappButtonText}>
              {t("orders.contactSupport")}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl + Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  // Section 1: Header Card
  headerCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  headerCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerCardInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerOrderNumber: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.text,
  },
  headerOrderDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Reward used banner
  rewardBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary + "14",
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
    ...Shadows.sm,
  },
  rewardBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
  },
  rewardBannerTextWrap: {
    flex: 1,
  },
  rewardBannerTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 2,
  },
  rewardBannerName: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.text,
  },
  // Sections
  section: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Status History
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  historyEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    position: "relative",
  },
  historyConnector: {
    position: "absolute",
    left: 5,
    top: -Spacing.lg,
    width: 2,
    height: Spacing.lg,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  historyContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyStatus: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  historyDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  historyNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    backgroundColor: Colors.inputBackground,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  historyNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  // Edit Button
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  // WhatsApp contact button
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.whatsapp,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  whatsappButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  // Pending edit request banner
  pendingEditBanner: {
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: Colors.secondary,
    gap: Spacing.md,
  },
  pendingEditRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  pendingEditTextWrap: {
    flex: 1,
  },
  pendingEditTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
  },
  pendingEditMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingEditCancel: {
    alignSelf: "flex-start",
    paddingVertical: Spacing.xs,
  },
  pendingEditCancelText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.error,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xxxl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  modalBody: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  fieldInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlignVertical: "top",
  },
  fieldInputRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "700",
  },
});
