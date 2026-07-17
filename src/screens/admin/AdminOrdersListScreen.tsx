import OrderStatusBadge, {
  STATUS_TRANSLATION_KEY,
} from "@/src/components/OrderStatusBadge";
import EmptyState from "@/src/components/ui/EmptyState";
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
  type AdminOrderListItem,
} from "@/src/services/adminOrder.service";
import type { OrderStatus } from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const STATUS_FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** Show a short, readable order ID (last 6 chars uppercased) */
function formatOrderId(raw: string): string {
  if (!raw) return "#—";
  if (raw.length <= 10) return `#${raw}`;
  return `#${raw.slice(-6).toUpperCase()}`;
}

function AdminOrderCard({
  order,
  onPress,
}: {
  order: AdminOrderListItem;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const date = new Date(order.createdAt).toLocaleDateString(
    isAr ? "ar-EG" : "en-US",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );
  const customer = order.buyer.storeName || order.buyer.username;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTopRow}>
        <OrderStatusBadge status={order.status} size="sm" />
        {order.pendingEditCount > 0 ? (
          <View style={styles.editBadge}>
            <Ionicons name="create-outline" size={12} color={Colors.white} />
            <Text style={styles.editBadgeText}>
              {t("adminOrders.pendingEditBadge")}
            </Text>
          </View>
        ) : null}
        <Text style={styles.cardDate}>{date}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={20} color={Colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.customerName} numberOfLines={1}>
            {customer}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {formatOrderId(order.orderNumber)} · {order.itemCount}{" "}
            {t("adminOrders.items")}
            {order.buyer.city ? ` · ${order.buyer.city}` : ""}
          </Text>
        </View>
        <View style={styles.cardTotalBox}>
          <Text style={styles.cardTotal}>{order.totalPrice.toFixed(2)}</Text>
          <Text style={styles.cardCurrency}>{t("common.currency")}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AdminOrdersListScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const pagesRef = useRef(1);
  // Monotonic id so a stale slow response never overwrites a newer one
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (opts: {
      page: number;
      status: OrderStatus | "ALL";
      search: string;
      append?: boolean;
    }) => {
      const requestId = ++requestIdRef.current;
      try {
        const data = await adminOrderService.getOrders({
          page: opts.page,
          limit: 20,
          ...(opts.status !== "ALL" ? { status: opts.status } : {}),
          ...(opts.search.trim() ? { search: opts.search.trim() } : {}),
        });
        if (requestId !== requestIdRef.current) return;
        pageRef.current = data.page;
        pagesRef.current = data.pages;
        setStatusCounts(data.statusCounts);
        setOrders((prev) =>
          opts.append ? [...prev, ...data.orders] : data.orders,
        );
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getErrorMessage(err));
      }
    },
    [],
  );

  // Initial load + reload on focus (fresh data after returning from detail)
  useFocusEffect(
    useCallback(() => {
      load({ page: 1, status: statusFilter, search }).finally(() =>
        setLoading(false),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, statusFilter]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load({ page: 1, status: statusFilter, search });
    setRefreshing(false);
  }, [load, statusFilter, search]);

  const onSearchSubmit = useCallback(() => {
    setLoading(true);
    load({ page: 1, status: statusFilter, search }).finally(() =>
      setLoading(false),
    );
  }, [load, statusFilter, search]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || loading || pageRef.current >= pagesRef.current) return;
    setLoadingMore(true);
    await load({
      page: pageRef.current + 1,
      status: statusFilter,
      search,
      append: true,
    });
    setLoadingMore(false);
  }, [load, loading, loadingMore, statusFilter, search]);

  const totalAll = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  const renderFilterChip = (value: OrderStatus | "ALL") => {
    const active = statusFilter === value;
    const count = value === "ALL" ? totalAll : (statusCounts[value] ?? 0);
    const label =
      value === "ALL" ? t("adminOrders.all") : t(STATUS_TRANSLATION_KEY[value]);
    return (
      <Pressable
        key={value}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => {
          if (statusFilter !== value) {
            setLoading(true);
            setStatusFilter(value);
          }
        }}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
        <View style={[styles.chipCount, active && styles.chipCountActive]}>
          <Text
            style={[styles.chipCountText, active && styles.chipCountTextActive]}
          >
            {count}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t("adminOrders.searchPlaceholder")}
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
          onSubmitEditing={onSearchSubmit}
        />
        {search.length > 0 ? (
          <Pressable
            onPress={() => {
              setSearch("");
              setLoading(true);
              load({ page: 1, status: statusFilter, search: "" }).finally(() =>
                setLoading(false),
              );
            }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.textLight}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {STATUS_FILTERS.map(renderFilterChip)}
      </ScrollView>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <Loader />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AdminOrderCard
              order={item}
              onPress={() => router.push(`/admin/order/${item.id}`)}
            />
          )}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={t("adminOrders.noOrders")}
              message={t("adminOrders.noOrdersMessage")}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: "right",
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  chipCount: {
    minWidth: 20,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.inputBackground,
    alignItems: "center",
  },
  chipCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  chipCountText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  chipCountTextActive: {
    color: Colors.white,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.errorSurface,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  editBadgeText: {
    fontSize: FontSize.xxs,
    fontWeight: "700",
    color: Colors.white,
  },
  cardDate: {
    fontSize: FontSize.xxs,
    color: Colors.textLight,
    marginStart: "auto",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryXLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "left",
  },
  cardMeta: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "left",
  },
  cardTotalBox: {
    alignItems: "flex-end",
  },
  cardTotal: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.primary,
  },
  cardCurrency: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
  },
});
