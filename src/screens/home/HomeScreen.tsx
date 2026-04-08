import CategoryCard from "@/src/components/CategoryCard";
import { NoticeCarousel } from "@/src/components/NoticeCarousel";
import ProductCard from "@/src/components/ProductCard";
import SectionHeader from "@/src/components/SectionHeader";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchCategories } from "@/src/store/slices/categories.slice";
import { fetchNotifications } from "@/src/store/slices/notifications.slice";
import { fetchNotices, nextNotice } from "@/src/store/slices/notices.slice";
import { fetchFeaturedProducts } from "@/src/store/slices/products.slice";
import type { Category, Order, Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  I18nManager,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { featured, loading: productsLoading } = useAppSelector(
    (state) => state.products,
  );
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: notices, currentIndex } = useAppSelector(
    (state) => state.notices,
  );
  const unreadCount = useAppSelector(
    (state) => state.notifications.unreadCount,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [recentOrders] = useState<Order[]>([]);

  // Quick action buttons for the home screen
  const QUICK_ACTIONS = [
    {
      icon: "grid-outline" as const,
      label: t("quickActions.categories"),
      route: "/categories",
      bg: Colors.primaryXLight,
      color: Colors.primary,
    },
    {
      icon: "pricetag-outline" as const,
      label: t("quickActions.products"),
      route: "/products",
      bg: Colors.secondaryLight,
      color: Colors.secondary,
    },
    {
      icon: "receipt-outline" as const,
      label: t("quickActions.orders"),
      route: "/(tabs)/orders",
      bg: "#f0fdf4",
      color: Colors.success,
    },
    {
      icon: "cart-outline" as const,
      label: t("quickActions.cart"),
      route: "/(tabs)/cart",
      bg: "#faf5ff",
      color: "#7c3aed",
    },
  ];

  const loadData = useCallback(
    (force = false) => {
      dispatch(fetchNotices());
      dispatch(fetchFeaturedProducts({ force }));
      dispatch(fetchCategories());
      if (isAuthenticated) {
        dispatch(fetchNotifications());
      }
    },
    [dispatch, isAuthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchNotices()),
      dispatch(fetchFeaturedProducts({ force: true })),
      dispatch(fetchCategories()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}`);
    },
    [router],
  );

  const handleCategoryPress = useCallback(
    (category: Category) => {
      router.push(`/products?categoryId=${category.id}`);
    },
    [router],
  );

  if (productsLoading && !refreshing && featured.length === 0) {
    return <Loader />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Notice Banner */}
      {notices.length > 0 && (
        <NoticeCarousel
          notices={notices}
          currentIndex={currentIndex}
          onNextNotice={() => dispatch(nextNotice())}
        />
      )}

      {/* Welcome Header */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(50)}
        style={styles.header}
      >
        <View style={{ flex: 1 }}>
          {isAuthenticated && (
            <Text style={styles.greeting}>
              {t("home.welcomeBack")} {user?.storeName ?? user?.username}
            </Text>
          )}
          <Text style={styles.storeName}>
            {isAuthenticated
              ? (user?.storeName ?? user?.username)
              : t("home.browseAsGuest")}
          </Text>
          {!isAuthenticated && (
            <Text style={styles.browseAsGuestSubtitle}>
              {t("home.browseAsGuestSubtitle")}
            </Text>
          )}
        </View>
        <View style={styles.headerActionsContainer}>
          {!isAuthenticated && (
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push("/(auth)/login")}
              hitSlop={8}
            >
              <Ionicons name="log-in-outline" size={22} color={Colors.text} />
            </Pressable>
          )}
          <Pressable
            style={styles.notifButton}
            onPress={() => router.push("/notifications")}
            hitSlop={8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.text}
            />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* Hero Banner */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.heroBanner}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTag}>{t("home.featuredProducts")}</Text>
          <Text style={styles.heroTitle}>{t("quickActions.products")}</Text>
          <Pressable
            style={styles.heroButton}
            onPress={() => router.push("/products")}
          >
            <Text style={styles.heroButtonText}>{t("common.viewAll")}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.white} />
          </Pressable>
        </View>
        <View style={styles.heroBg}>
          <Ionicons
            name="storefront"
            size={80}
            color="rgba(255,255,255,0.15)"
          />
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(200)}
        style={styles.quickActions}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <QuickActionTile
            key={action.label}
            action={action}
            index={i}
            router={router}
          />
        ))}
      </Animated.View>

      {/* Categories */}
      {categories.length > 0 ? (
        <>
          <SectionHeader
            title={t("home.categories")}
            actionLabel={t("common.seeAll")}
            onAction={() => router.push("/categories")}
          />
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CategoryCard category={item} onPress={handleCategoryPress} />
            )}
          />
        </>
      ) : null}

      {/* Featured Products */}
      {featured.length > 0 ? (
        <>
          <SectionHeader
            title={t("home.featuredProducts")}
            actionLabel={t("common.viewAll")}
            onAction={() => router.push("/products")}
          />
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={handleProductPress} />
            )}
          />
        </>
      ) : null}

      {/* Recent Orders */}
      <SectionHeader
        title={t("home.recentOrders")}
        actionLabel={t("home.allOrders")}
        onAction={() => router.push("/(tabs)/orders")}
      />
      {recentOrders.length > 0 ? (
        recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  order.status === "delivered" && styles.statusDelivered,
                  order.status === "cancelled" && styles.statusCancelled,
                ]}
              >
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
            <Text style={styles.orderInfo}>
              {order.itemCount} items · {order.total.toFixed(2)}{" "}
              {t("common.currency")}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyOrders}>
          <Ionicons name="receipt-outline" size={28} color={Colors.textLight} />
          <Text style={styles.emptyText}>{t("home.noRecentOrders")}</Text>
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

/** Quick action tile with animated press */
function QuickActionTile({
  action,
  index,
  router,
}: {
  action: any;
  index: number;
  router: any;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.quickAction, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.94, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={() => router.push(action.route as any)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
        <Ionicons name={action.icon} size={22} color={action.color} />
      </View>
      <Text style={styles.quickActionLabel}>{action.label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginLeft: I18nManager.isRTL ? 0 : Spacing.md,
    marginRight: I18nManager.isRTL ? Spacing.md : 0,
  },
  loginButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  browseAsGuestSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  greeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  storeName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 2,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  notifBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  /* Hero banner */
  heroBanner: {
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    overflow: "hidden",
    minHeight: 130,
    justifyContent: "center",
  },
  heroContent: {
    zIndex: 1,
  },
  heroTag: {
    fontSize: FontSize.xxs,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  heroButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  heroBg: {
    position: "absolute",
    right: 16,
    bottom: 10,
    opacity: 0.6,
  },
  /* Quick actions */
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  quickActionLabel: {
    fontSize: FontSize.xxs,
    fontWeight: "600",
    color: Colors.text,
  },
  horizontalList: {
    paddingHorizontal: Spacing.xxl,
  },
  /* Orders */
  orderCard: {
    marginHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: "#fef3c7",
  },
  statusDelivered: {
    backgroundColor: "#dcfce7",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
    color: Colors.text,
  },
  orderInfo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyOrders: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
