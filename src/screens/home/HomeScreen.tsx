import { NoticeCarousel } from "@/src/components/NoticeCarousel";
import ProductCard from "@/src/components/ProductCard";
import SectionHeader from "@/src/components/SectionHeader";
import SideMenuSheet from "@/src/components/SideMenuSheet";
import WhatsAppFAB from "@/src/components/WhatsAppFAB";
import ErrorScreen from "@/src/components/errors/ErrorScreen";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchBrands } from "@/src/store/slices/brands.slice";
import { fetchCategories } from "@/src/store/slices/categories.slice";
import { fetchHomeSections } from "@/src/store/slices/marketingSections.slice";
import { fetchNotices, nextNotice } from "@/src/store/slices/notices.slice";
import { fetchNotifications } from "@/src/store/slices/notifications.slice";
import { fetchFeaturedProducts } from "@/src/store/slices/products.slice";
import type { Brand, Category, MarketingSection, Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
  ViewStyle,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    featured,
    loading: productsLoading,
    error: productsError,
  } = useAppSelector((state) => state.products);
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: brands, loading: brandsLoading } = useAppSelector(
    (state) => state.brands,
  );
  const { items: notices, currentIndex } = useAppSelector(
    (state) => state.notices,
  );
  const { homeSections } = useAppSelector((state) => state.marketingSections);
  const unreadCount = useAppSelector(
    (state) => state.notifications.unreadCount,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [displayedFeaturedCount, setDisplayedFeaturedCount] = useState(4);
  const [menuVisible, setMenuVisible] = useState(false);

  // Dynamic RTL styles
  const isRTL = i18n.language === "ar";
  const dynamicNotifBadgeStyle = useMemo<ViewStyle>(
    () => ({
      ...(isRTL ? { left: -2 } : { right: -2 }),
    }),
    [isRTL],
  );
  const dynamicHeaderSearchBarStyle = useMemo<ViewStyle>(
    () => ({
      // Correct start side when app language changes before a full RTL restart.
      flexDirection: isRTL !== I18nManager.isRTL ? "row-reverse" : "row",
    }),
    [isRTL],
  );
  const dynamicHeaderSearchPlaceholderStyle = useMemo(
    () => ({
      textAlign: isRTL ? ("right" as const) : ("left" as const),
      writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
    }),
    [isRTL],
  );

  const loadData = useCallback(
    (force = false) => {
      dispatch(fetchNotices());
      dispatch(fetchBrands());
      dispatch(fetchHomeSections());
      dispatch(fetchFeaturedProducts({ force }));
      dispatch(fetchCategories(undefined));
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
      dispatch(fetchBrands()),
      dispatch(fetchHomeSections()),
      dispatch(fetchFeaturedProducts({ force: true })),
      dispatch(fetchCategories(undefined)),
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
      router.push({
        pathname: "/products",
        params: {
          categoryId: category.id,
          includeDescendants: "true",
        },
      });
    },
    [router],
  );

  const handleBrandPress = useCallback(
    (brand: Brand) => {
      router.push(`/products?brandId=${brand.id}`);
    },
    [router],
  );

  const handleSectionPress = useCallback(
    (section: MarketingSection) => {
      router.push(`/marketing-section/${section.slug}`);
    },
    [router],
  );

  if (productsLoading && !refreshing && featured.length === 0) {
    return <Loader />;
  }

  if (productsError && featured.length === 0) {
    const errorType =
      productsError.includes("Network") || productsError.includes("اتصال")
        ? ("network" as const)
        : productsError.includes("timeout") || productsError.includes("مهلة")
          ? ("timeout" as const)
          : productsError.includes("500") || productsError.includes("خادم")
            ? ("server" as const)
            : ("generic" as const);
    return (
      <ErrorScreen
        type={errorType}
        onRetry={() => loadData(true)}
        errorMessage={productsError}
      />
    );
  }
  console.log("HOME SECTIONS STATE", homeSections);
  console.log("HOME SECTIONS LENGTH", homeSections.length);
  return (
    <View style={styles.container}>
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
        {/* ===== NEW HEADER ===== */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
          {/* Top Row: Menu - Title - Actions */}
          <View style={styles.headerTopRow}>
            {/* Right side (RTL): Menu button */}
            <Pressable
              style={styles.headerIconButton}
              onPress={() => setMenuVisible(true)}
              hitSlop={8}
            >
              <Ionicons name="menu-outline" size={26} color={Colors.white} />
            </Pressable>

            {/* Center: App logo */}
            <Image
              source={require("@/assets/images/TawreedHeaderLogo.png")}
              style={styles.headerLogo}
              contentFit="contain"
            />

            {/* Left side (RTL): Notifications + Login */}
            <View style={styles.headerRightActions}>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => router.push("/notifications")}
                hitSlop={8}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={Colors.white}
                />
                {unreadCount > 0 && (
                  <View
                    style={[styles.headerNotifBadge, dynamicNotifBadgeStyle]}
                  >
                    <Text style={styles.headerNotifBadgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
              {!isAuthenticated && (
                <Pressable
                  style={styles.headerIconButton}
                  onPress={() => router.push("/(auth)/login")}
                  hitSlop={8}
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={26}
                    color={Colors.white}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Search Bar */}
          <Pressable
            style={[styles.headerSearchBar, dynamicHeaderSearchBarStyle]}
            onPress={() => router.push("/products")}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={Colors.textLight}
            />
            <Text
              style={[
                styles.headerSearchPlaceholder,
                dynamicHeaderSearchPlaceholderStyle,
              ]}
            >
              {t("home.searchPlaceholder")}
            </Text>
          </Pressable>
        </View>

        {/* Location / Guest Bar */}
        <View style={styles.locationBar}>
          {isAuthenticated ? (
            <Pressable
              style={styles.locationContent}
              onPress={() => router.push("/location")}
            >
              <Ionicons
                name="location-sharp"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {user?.city?.name
                  ? `${user.city.name}${user?.area?.name ? ` - ${user.area.name}` : ""}`
                  : t("home.yourLocation")}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.primary} />
            </Pressable>
          ) : (
            <Pressable
              style={styles.guestBar}
              onPress={() => router.push("/(auth)/login")}
            >
              <View style={styles.guestBarIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestBarTitle}>
                  {t("home.browseAsGuest")}
                </Text>
                <Text style={styles.guestBarSubtitle}>
                  {t("home.browseAsGuestSubtitle")}
                </Text>
              </View>
              <Ionicons
                name="log-in-outline"
                size={22}
                color={Colors.primary}
              />
            </Pressable>
          )}
        </View>

        {/* Top: Categories & Brands directly under location/guest */}
        <View style={styles.topSectionsContainer}>
          {categories.length > 0 ? (
            <View style={styles.topSectionCard}>
              <View style={styles.topSectionHeader}>
                <View style={styles.topSectionTitleRow}>
                  <View style={styles.topSectionAccent} />
                  <Text style={styles.topSectionTitle}>
                    {t("home.categories")}
                  </Text>
                </View>
                <Pressable
                  style={styles.topSectionAction}
                  onPress={() => router.push("/categories")}
                >
                  <Text style={styles.topSectionActionText}>
                    {t("common.viewAll")}
                  </Text>
                  <Ionicons
                    name={isRTL ? "chevron-back" : "chevron-forward"}
                    size={14}
                    color={Colors.secondary}
                  />
                </Pressable>
              </View>

              <FlatList
                data={categories.slice(0, 8)}
                horizontal
                showsHorizontalScrollIndicator={false}
                removeClippedSubviews={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.topSectionList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.topCategoryItem}
                    onPress={() => handleCategoryPress(item)}
                  >
                    <View style={styles.topCategoryImageWrap}>
                      <Image
                        source={
                          item.image?.url
                            ? { uri: item.image.url }
                            : require("@/assets/images/icon2.png")
                        }
                        accessibilityLabel={item.image?.alt || item.name}
                        style={styles.topCategoryImage}
                        contentFit="contain"
                        transition={200}
                        recyclingKey={`${item.id}-${item.image?.url ?? "fallback"}`}
                      />
                    </View>
                    <Text style={styles.topSectionItemLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
                ListFooterComponent={
                  <Pressable
                    style={styles.topMoreItem}
                    onPress={() => router.push("/categories")}
                  >
                    <View style={styles.topMoreThumb}>
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.topSectionItemLabel} numberOfLines={1}>
                      {t("common.viewMore")}
                    </Text>
                  </Pressable>
                }
              />
            </View>
          ) : null}

          {brands.length > 0 || brandsLoading ? (
            <View style={styles.topSectionCard}>
              <View style={styles.topSectionHeader}>
                <View style={styles.topSectionTitleRow}>
                  <View style={styles.topSectionAccent} />
                  <Text style={styles.topSectionTitle}>
                    {t("brands.title")}
                  </Text>
                </View>
                <Pressable
                  style={styles.topSectionAction}
                  onPress={() => router.push("/brands")}
                >
                  <Text style={styles.topSectionActionText}>
                    {t("common.viewAll")}
                  </Text>
                  <Ionicons
                    name={isRTL ? "chevron-back" : "chevron-forward"}
                    size={14}
                    color={Colors.secondary}
                  />
                </Pressable>
              </View>

              {brandsLoading && brands.length === 0 ? (
                <View style={styles.brandSkeletonRow}>
                  <View style={styles.brandSkeletonItem} />
                  <View style={styles.brandSkeletonItem} />
                  <View style={styles.brandSkeletonItem} />
                </View>
              ) : (
                <FlatList
                  data={brands.slice(0, 8)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.topSectionList}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.topBrandItem}
                      onPress={() => handleBrandPress(item)}
                    >
                      <View style={styles.topBrandLogoWrap}>
                        {item.logo ? (
                          <Image
                            source={{ uri: item.logo }}
                            style={styles.topBrandLogo}
                            contentFit="contain"
                            transition={200}
                            recyclingKey={`${item.id}-${item.logo ?? "fallback"}`}
                          />
                        ) : (
                          <Text style={styles.topBrandFallback}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={styles.topSectionItemLabel}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  )}
                  ListFooterComponent={
                    <Pressable
                      style={styles.topMoreItem}
                      onPress={() => router.push("/brands")}
                    >
                      <View style={styles.topMoreThumb}>
                        <Text style={styles.topMoreText}>
                          {t("common.viewMore")}
                        </Text>
                      </View>
                      <Text
                        style={styles.topSectionItemLabel}
                        numberOfLines={1}
                      >
                        {t("common.viewMore")}
                      </Text>
                    </Pressable>
                  }
                />
              )}
            </View>
          ) : null}
        </View>

        {/* Notice Banner */}
        {notices.length > 0 && (
          <NoticeCarousel
            notices={notices}
            currentIndex={currentIndex}
            onNextNotice={() => dispatch(nextNotice())}
          />
        )}

        {/* Marketing Sections Cards */}
        {homeSections.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.marketingRow}
          >
            {homeSections.slice(0, 2).map((section) => (
              <Pressable
                key={section.id}
                style={styles.marketingCard}
                onPress={() => handleSectionPress(section)}
              >
                <Image
                  source={
                    section.image
                      ? { uri: section.image }
                      : require("@/assets/images/icon2.png")
                  }
                  style={styles.marketingImage}
                  contentFit="contain"
                  transition={200}
                  recyclingKey={`ms-${section.id}`}
                />
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Featured Products - 2 Column Grid */}
        {featured.length > 0 ? (
          <>
            <SectionHeader
              title={t("home.featuredProducts")}
              actionLabel={t("common.viewAll")}
              onAction={() => router.push("/products")}
            />
            <View style={styles.gridContainer}>
              <FlatList
                data={featured.slice(0, displayedFeaturedCount)}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gridContent}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={handleProductPress}
                    grid={true}
                  />
                )}
              />
            </View>
            {displayedFeaturedCount < featured.length && (
              <View style={styles.gridButtonContainer}>
                <Pressable
                  style={styles.viewMoreButton}
                  onPress={() =>
                    setDisplayedFeaturedCount((prev) =>
                      Math.min(prev + 4, featured.length),
                    )
                  }
                >
                  <Text style={styles.viewMoreButtonText}>
                    {t("common.viewMore")}
                  </Text>
                  <Ionicons
                    name="arrow-down"
                    size={16}
                    color={Colors.primary}
                    style={{ marginStart: 8 }}
                  />
                </Pressable>
              </View>
            )}
            {displayedFeaturedCount === featured.length &&
              featured.length > 4 && (
                <View style={styles.gridButtonContainer}>
                  <Pressable
                    style={styles.viewAllButton}
                    onPress={() => router.push("/products")}
                  >
                    <Text style={styles.viewAllButtonText}>
                      {t("common.viewAll")}
                    </Text>
                    <Ionicons
                      name={isRTL ? "arrow-back" : "arrow-forward"}
                      size={16}
                      color={Colors.white}
                      style={{ marginStart: 8 }}
                    />
                  </Pressable>
                </View>
              )}
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      <WhatsAppFAB />
      <SideMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  /* ===== NEW HEADER STYLES ===== */
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    position: "relative",
  },
  headerLogo: {
    width: 100,
    height: 36,
    position: "absolute",
    left: "50%",
    marginLeft: -50,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerNotifBadge: {
    position: "absolute",
    top: 2,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  headerNotifBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  headerSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 48,
    gap: Spacing.sm,
  },
  headerSearchPlaceholder: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textAlign: "right",
    writingDirection: "rtl",
  },
  /* Location / Guest Bar */
  locationBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: "center",
    maxWidth: "95%",
  },
  locationText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
  },
  guestBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(30, 58, 138, 0.1)",
  },
  guestBarIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  guestBarTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
  },
  guestBarSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topSectionsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  topSectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  topSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  topSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  topSectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  topSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  topSectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  topSectionActionText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
  },
  topSectionList: {
    paddingHorizontal: Spacing.md,
  },
  topCategoryItem: {
    width: 96,
    marginEnd: Spacing.sm,
    alignItems: "center",
  },
  topCategoryImageWrap: {
    width: 86,
    height: 74,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  topCategoryImage: {
    width: "100%",
    height: "100%",
  },
  topBrandItem: {
    width: 96,
    marginEnd: Spacing.sm,
    alignItems: "center",
  },
  topBrandLogoWrap: {
    width: 86,
    height: 74,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  topBrandLogo: {
    width: "92%",
    height: "92%",
  },
  topBrandFallback: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.primary,
  },
  topSectionItemLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  topMoreItem: {
    width: 96,
    marginEnd: Spacing.sm,
    alignItems: "center",
  },
  topMoreThumb: {
    width: 86,
    height: 74,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  topMoreText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  brandSkeletonRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  brandSkeletonItem: {
    width: 86,
    height: 74,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
  },
  /* Marketing Sections */
  marketingRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  marketingCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.surface,
  },
  marketingImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  horizontalList: {
    paddingHorizontal: Spacing.xxl,
  },
  /* Grid Layout */
  gridContainer: {
    paddingHorizontal: Spacing.lg,
  },
  gridContent: {
    paddingBottom: Spacing.sm,
  },
  gridRow: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  gridButtonContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  viewMoreButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  viewAllButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  /* Orders */
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
