import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { notificationNavigationService } from "@/src/services/notifications/notification-navigation";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/store/slices/notifications.slice";
import type { Notification, NotificationType } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type IconConfig = { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string };

const TYPE_CONFIG: Record<NotificationType, IconConfig> = {
  order_update: { icon: "receipt-outline", color: "#1e40af", bg: "#dbeafe" },
  new_product: { icon: "cube-outline", color: "#166534", bg: "#dcfce7" },
  promotion: { icon: "pricetag-outline", color: "#92400e", bg: "#fef3c7" },
  system: {
    icon: "information-circle-outline",
    color: "#6d28d9",
    bg: "#ede9fe",
  },
};

// Icon by destination target type, takes priority over TYPE_CONFIG since
// admin-composed notifications are always stored with the generic "system"
// backend type but carry a more specific `data.targetType`.
const TARGET_TYPE_ICON_CONFIG: Record<string, IconConfig> = {
  PRODUCT: { icon: "cube-outline", color: "#166534", bg: "#dcfce7" },
  CATEGORY: { icon: "pricetag-outline", color: "#92400e", bg: "#fef3c7" },
  BRAND: { icon: "ribbon-outline", color: "#92400e", bg: "#fef3c7" },
  COLLECTION: { icon: "grid-outline", color: "#92400e", bg: "#fef3c7" },
  ORDER: { icon: "receipt-outline", color: "#1e40af", bg: "#dbeafe" },
  URL: { icon: "link-outline", color: "#6d28d9", bg: "#ede9fe" },
};

function getIconConfig(item: Notification): IconConfig {
  const targetType = item.data?.targetType;
  if (targetType && TARGET_TYPE_ICON_CONFIG[targetType]) {
    return TARGET_TYPE_ICON_CONFIG[targetType];
  }
  return TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const dispatch = useAppDispatch();
  const { items, loading, unreadCount } = useAppSelector(
    (state) => state.notifications,
  );
  const [refreshing, setRefreshing] = useState(false);

  // Keep the latest unread count available inside the blur cleanup closure
  // without re-subscribing the focus effect on every count change.
  const unreadRef = useRef(unreadCount);
  useEffect(() => {
    unreadRef.current = unreadCount;
  }, [unreadCount]);

  // السلوك المطلوب: عند فتح الشاشة تُجلب الإشعارات وتظهر غير المقروءة بلون مميز،
  // وعند مغادرة الشاشة (إغلاقها) تُعلّم جميعها كمقروءة تلقائيًا — مثل صندوق الوارد.
  // زر "تحديد الكل كمقروء" يبقى متاحًا كإجراء يدوي فوري.
  useFocusEffect(
    useCallback(() => {
      // على الفتح: جلب الإشعارات الحديثة (تبقى غير المقروءة مميّزة أثناء العرض)
      dispatch(fetchNotifications());

      return () => {
        // على الإغلاق: اعتبر ما شاهده المستخدم مقروءًا
        if (unreadRef.current > 0) {
          dispatch(markAllNotificationsRead());
        }
      };
    }, [dispatch]),
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
      notificationNavigationService.navigate(
        notification.linkUrl ?? "",
        notification.data,
      );
    },
    [dispatch],
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
      const config = getIconConfig(item);
      const unread = !item.read;
      return (
        <Pressable
          android_ripple={{ color: Colors.primaryXLight }}
          style={({ pressed }) => [
            styles.notifItem,
            unread && styles.unread,
            pressed && styles.pressed,
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
            {unread && <View style={styles.iconBadge} />}
          </View>
          <View style={styles.notifContent}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.notifTitle, unread && styles.notifTitleUnread]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {unread && (
                <View style={styles.newPill}>
                  <Text style={styles.newPillText}>{t("notifications.new")}</Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.notifMessage, unread && styles.notifMessageUnread]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
          </View>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={16}
            color={Colors.textLight}
            style={styles.chevron}
          />
        </Pressable>
      );
    },
    [handlePress, formatTime, isRTL, t],
  );

  if (loading && items.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.markAllBar}>
          <View style={styles.unreadSummary}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
            <Text style={styles.unreadSummaryText}>
              {t("notifications.unreadSummary")}
            </Text>
          </View>
          <Pressable style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
            <Text style={styles.markAllText}>
              {t("notifications.markAllRead")}
            </Text>
          </Pressable>
        </View>
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
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  unreadSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 1,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "800",
    color: "#ffffff",
  },
  unreadSummaryText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    flexShrink: 1,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryXLight,
  },
  markAllText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
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
    borderStartWidth: 4,
    borderStartColor: "transparent",
    ...Shadows.sm,
  },
  unread: {
    backgroundColor: "#eef4ff",
    borderStartColor: Colors.primary,
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  notifContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  notifTitle: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  notifTitleUnread: {
    fontWeight: "800",
    color: Colors.text,
  },
  newPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  newPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  notifMessage: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  notifMessageUnread: {
    color: Colors.textSecondary,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  chevron: {
    alignSelf: "center",
  },
});
