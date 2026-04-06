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
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchOrders } from "@/src/store/slices/orders.slice";
import type { Order, OrderStatus } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { color: "#92400e", bg: "#fef3c7", icon: "time-outline" },
  confirmed: {
    color: "#1e40af",
    bg: "#dbeafe",
    icon: "checkmark-circle-outline",
  },
  processing: { color: "#6d28d9", bg: "#ede9fe", icon: "cog-outline" },
  shipped: { color: "#0369a1", bg: "#e0f2fe", icon: "airplane-outline" },
  delivered: {
    color: "#166534",
    bg: "#dcfce7",
    icon: "checkmark-done-outline",
  },
  cancelled: { color: "#991b1b", bg: "#fee2e2", icon: "close-circle-outline" },
};

export default function OrdersListScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const { items, loading, error } = useAppSelector((state) => state.orders);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchOrders());
    setRefreshing(false);
  }, [dispatch]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => {
      const config = STATUS_CONFIG[item.status];

      return (
        <Pressable
          style={({ pressed }) => [
            styles.orderCard,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push(`/order/${item.id}`)}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderItems}>
              {item.itemCount} item{item.itemCount !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.orderTotal}>
              {item.total.toFixed(2)} {t("common.currency")}
            </Text>
          </View>
          <View style={styles.chevron}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textLight}
            />
          </View>
        </Pressable>
      );
    },
    [router, t],
  );

  if (loading && !refreshing && items.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          !isAuthenticated ? (
            <EmptyState
              icon="receipt-outline"
              title={t("orders.noOrders")}
              message={t("profile.loginForMore")}
              actionLabel={t("auth.goToLogin")}
              onAction={() => router.push("/(auth)/login")}
            />
          ) : (
            <EmptyState
              icon="receipt-outline"
              title={t("orders.noOrders")}
              message={t("orders.noOrdersMessage")}
              actionLabel={t("orders.browseProducts")}
              onAction={() => router.push("/products")}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  },
  emptyContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    position: "relative",
  },
  cardPressed: {
    opacity: 0.9,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  orderNumber: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  orderDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItems: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  orderTotal: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  chevron: {
    position: "absolute",
    right: Spacing.lg,
    top: "50%",
  },
});
