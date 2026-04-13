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
  clearOrderDetail,
  fetchOrderDetail,
  updateOrder,
} from "@/src/store/slices/orders.slice";
import type {
  EditOrderPayload,
  OrderStatus,
  StatusHistoryEntry,
} from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    color: string;
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
> = {
  PENDING: {
    color: "#92400e",
    bg: "#fef3c7",
    icon: "time-outline",
  },
  PROCESSING: {
    color: "#1e40af",
    bg: "#dbeafe",
    icon: "cog-outline",
  },
  SHIPPED: {
    color: "#6d28d9",
    bg: "#ede9fe",
    icon: "airplane-outline",
  },
  DELIVERED: {
    color: "#166534",
    bg: "#dcfce7",
    icon: "checkmark-done-outline",
  },
  CANCELLED: {
    color: "#991b1b",
    bg: "#fee2e2",
    icon: "close-circle-outline",
  },
};

const STATUS_TRANSLATION_KEY: Record<OrderStatus, string> = {
  PENDING: "orders.statusPending",
  PROCESSING: "orders.statusProcessing",
  SHIPPED: "orders.statusShipped",
  DELIVERED: "orders.statusDelivered",
  CANCELLED: "orders.statusCancelled",
};

export default function OrderDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    selectedOrder: order,
    loadingDetail,
    updating,
  } = useAppSelector((state) => state.orders);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (id) dispatch(fetchOrderDetail(id));
    return () => {
      dispatch(clearOrderDetail());
    };
  }, [dispatch, id]);

  const openEditModal = useCallback(() => {
    if (!order) return;
    if (order.status !== "PENDING") {
      Alert.alert(
        t("orders.cannotEdit"),
        t("orders.cannotEditMessage", {
          status: t(STATUS_TRANSLATION_KEY[order.status]),
        }),
      );
      return;
    }
    setEditAddress(order.shippingAddress ?? "");
    setEditCity(order.city ?? "");
    setEditNotes(order.notes ?? "");
    setEditModalVisible(true);
  }, [order, t]);

  const handleEditSubmit = useCallback(async () => {
    if (!order) return;
    const payload: EditOrderPayload = {};
    if (editAddress !== (order.shippingAddress ?? ""))
      payload.deliveryAddress = editAddress;
    if (editCity !== (order.city ?? "")) payload.deliveryCity = editCity;
    if (editNotes !== (order.notes ?? "")) payload.buyerNotes = editNotes;

    if (Object.keys(payload).length === 0) {
      setEditModalVisible(false);
      return;
    }

    const result = await dispatch(updateOrder({ id: order.id, payload }));
    if (updateOrder.fulfilled.match(result)) {
      setEditModalVisible(false);
      dispatch(fetchOrderDetail(order.id));
    }
  }, [order, editAddress, editCity, editNotes, dispatch]);

  if (loadingDetail || !order) {
    return <Loader />;
  }

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const isCancelled = order.status === "CANCELLED";
  const isPending = order.status === "PENDING";

  const currentStepIndex = isCancelled
    ? -1
    : ALL_STATUSES.indexOf(order.status);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
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
        <Text style={styles.headerTitle}>
          {t("orders.orderDetail")} #{order.orderNumber}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={28} color={config.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {t(STATUS_TRANSLATION_KEY[order.status])}
            </Text>
            <Text style={styles.statusDate}>
              {formatDate(order.updatedAt ?? order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Status Timeline (visual progress) */}
        {!isCancelled ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("orders.timeline")}</Text>
            <View style={styles.timeline}>
              {ALL_STATUSES.map((status, index) => {
                const stepConfig = STATUS_CONFIG[status];
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <View key={status} style={styles.timelineStep}>
                    {index > 0 ? (
                      <View
                        style={[
                          styles.connector,
                          isCompleted && styles.connectorActive,
                        ]}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && {
                          backgroundColor: stepConfig.color,
                          borderColor: stepConfig.color,
                        },
                        isCurrent && styles.stepCircleCurrent,
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons
                          name={isCurrent ? stepConfig.icon : "checkmark"}
                          size={isCurrent ? 14 : 12}
                          color={Colors.white}
                        />
                      ) : (
                        <View style={styles.stepDot} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelActive,
                        isCurrent && {
                          color: stepConfig.color,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {t(STATUS_TRANSLATION_KEY[status])}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.cancelledBanner}>
              <Ionicons
                name="close-circle"
                size={20}
                color={STATUS_CONFIG.CANCELLED.color}
              />
              <Text style={styles.cancelledText}>
                {t("orders.statusCancelled")}
              </Text>
            </View>
          </View>
        )}

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

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("orders.items")} ({order.items?.length ?? 0})
          </Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={
                  item.productImage
                    ? { uri: item.productImage }
                    : require("@/assets/images/icon.png")
                }
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.price.toFixed(2)} {t("common.currency")} x{" "}
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>
                {item.subtotal.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("orders.shippingInfo")}</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("orders.address")}</Text>
                <Text style={styles.detailValue}>{order.shippingAddress}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="business-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t("checkout.city")}</Text>
                <Text style={styles.detailValue}>{order.city}</Text>
              </View>
            </View>
            {order.notes ? (
              <View style={styles.detailRow}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={Colors.textSecondary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {t("orders.buyerNotes")}
                  </Text>
                  <Text style={styles.detailValue}>{order.notes}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("checkout.total")}</Text>
              <Text style={styles.totalValue}>
                {(order.total ?? 0).toFixed(2)} {t("common.currency")}
              </Text>
            </View>
            <Text style={styles.orderDate}>
              {t("orders.placedOn")} {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* Edit Button — only for PENDING */}
        {isPending ? (
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              onPress={openEditModal}
            >
              <Ionicons name="create-outline" size={20} color={Colors.white} />
              <Text style={styles.editButtonText}>{t("orders.editOrder")}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>

      {/* Edit Order Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("orders.editOrder")}</Text>
              <Pressable onPress={() => setEditModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>
                {t("checkout.shippingAddress")}
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder={t("checkout.addressPlaceholder")}
                placeholderTextColor={Colors.textLight}
                multiline
              />

              <Text style={styles.fieldLabel}>{t("checkout.city")}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder={t("checkout.selectCity")}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.fieldLabel}>{t("orders.buyerNotes")}</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 80 }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder={t("checkout.notesPlaceholder")}
                placeholderTextColor={Colors.textLight}
                multiline
              />
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                updating && styles.submitButtonDisabled,
              ]}
              onPress={handleEditSubmit}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{t("common.save")}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
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
  // Timeline
  timeline: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: 13,
    top: -Spacing.lg,
    width: 2,
    height: Spacing.lg,
    backgroundColor: Colors.border,
  },
  connectorActive: {
    backgroundColor: Colors.success,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleCurrent: {
    transform: [{ scale: 1.1 }],
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textLight,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: Colors.text,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fee2e2",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  cancelledText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "#991b1b",
  },
  // Items
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  // Shipping details
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
    gap: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  // Total
  totalCard: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  orderDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
