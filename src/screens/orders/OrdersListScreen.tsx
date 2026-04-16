import OrderCard from "@/src/components/OrderCard";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchOrders } from "@/src/store/slices/orders.slice";
import type { Order } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

export default function OrdersListScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuthGuard();
  const { items, loading, error } = useAppSelector((state) => state.orders);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchOrders());
      }
    }, [dispatch, isAuthenticated]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchOrders());
    setRefreshing(false);
  }, [dispatch]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => (
      <OrderCard
        order={item}
        onPress={() => router.push(`/order/${item.id}`)}
      />
    ),
    [router],
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
        keyExtractor={(item, index) => item.id ?? `order-${index}`}
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
});
