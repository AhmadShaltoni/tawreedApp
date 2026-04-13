import EmptyState from "@/src/components/ui/EmptyState";
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
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "@/src/store/slices/notifications.slice";
import type { Notification, NotificationType } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  order_update: { icon: "receipt-outline", color: "#1e40af", bg: "#dbeafe" },
  new_product: { icon: "cube-outline", color: "#166534", bg: "#dcfce7" },
  promotion: { icon: "pricetag-outline", color: "#92400e", bg: "#fef3c7" },
  system: {
    icon: "information-circle-outline",
    color: "#6d28d9",
    bg: "#ede9fe",
  },
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading, unreadCount } = useAppSelector(
    (state) => state.notifications,
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Auto-mark all as read when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (items.length > 0) {
        dispatch(markAllNotificationsRead());
      }
    }, [dispatch, items.length]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  }, [dispatch]);

  const handlePress = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        dispatch(markNotificationRead(notification.id));
      }
      if (notification.type === "order_update" && notification.data?.orderId) {
        router.push(`/order/${notification.data.orderId}`);
      } else if (
        notification.type === "new_product" &&
        notification.data?.productId
      ) {
        router.push(`/product/${notification.data.productId}`);
      }
    },
    [dispatch, router],
  );

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  const formatTime = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1)
        return t("common.loading") === "جاري التحميل..." ? "الآن" : "now";
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return d.toLocaleDateString();
    },
    [t],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => {
      const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
      return (
        <Pressable
          style={[styles.notifItem, !item.read && styles.unread]}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </Pressable>
      );
    },
    [handlePress, formatTime],
  );

  if (loading && items.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <Pressable style={styles.markAllBar} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
          <Text style={styles.markAllText}>
            {t("notifications.markAllRead")}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          items.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title={t("notifications.empty")}
            message={t("notifications.emptyMessage")}
          />
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
  markAllBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  markAllText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  unread: {
    backgroundColor: Colors.primaryXLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
  },
});
