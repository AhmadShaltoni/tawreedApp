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
    clearOrderDetail,
    fetchOrderDetail,
    updateOrder,
} from "@/src/store/slices/orders.slice";
import type { EditOrderPayload, StatusHistoryEntry } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

export default function OrderDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
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
  } = useAppSelector((state) => state.orders);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNotes, setEditNotes] = useState("");

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
  const isPending = order.status === "PENDING";

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
        {isPending ? (
          <Pressable onPress={openEditModal} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </Pressable>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
