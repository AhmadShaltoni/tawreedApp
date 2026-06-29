import ProductCard from "@/src/components/ProductCard";
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
import { fetchBrands } from "@/src/store/slices/brands.slice";
import {
    fetchMoreProducts,
    fetchProducts,
} from "@/src/store/slices/products.slice";
import type { Brand, Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const NUM_COLUMNS = 2;
const ALL_KEY = "__all__";

export default function BrandsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{ brandId?: string }>();

  const {
    items,
    loading,
    loadingMore,
    total,
    page,
    error: productsError,
  } = useAppSelector((state) => state.products);
  const { items: brands, loading: brandsLoading } = useAppSelector(
    (state) => state.brands,
  );

  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    params.brandId ?? null,
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchBrands());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        brandId: selectedBrand ?? undefined,
        page: 1,
        limit: 20,
      }),
    );
  }, [dispatch, selectedBrand]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchBrands()),
      dispatch(
        fetchProducts({
          brandId: selectedBrand ?? undefined,
          page: 1,
          limit: 20,
        }),
      ),
    ]);
    setRefreshing(false);
  }, [dispatch, selectedBrand]);

  const loadMore = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    dispatch(
      fetchMoreProducts({
        brandId: selectedBrand ?? undefined,
        page: page + 1,
        limit: 20,
      }),
    );
  }, [dispatch, selectedBrand, page, loadingMore, items.length, total]);

  const handleProductPress = useCallback(
    (product: Product) => router.push(`/product/${product.id}`),
    [router],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productWrapper}>
        <ProductCard product={item} onPress={handleProductPress} grid />
      </View>
    ),
    [handleProductPress],
  );

  const BrandChip = useCallback(
    (brand: Brand | null) => {
      const id = brand ? brand.id : ALL_KEY;
      const active = brand
        ? selectedBrand === brand.id
        : selectedBrand === null;
      return (
        <Pressable
          key={id}
          style={[styles.brandChip, active && styles.brandChipActive]}
          onPress={() => setSelectedBrand(brand ? brand.id : null)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
        >
          <View
            style={[styles.brandLogoWrap, active && styles.brandLogoWrapActive]}
          >
            {brand?.logo ? (
              <Image
                source={{ uri: brand.logo }}
                style={styles.brandLogo}
                contentFit="contain"
                transition={150}
                recyclingKey={brand.id}
              />
            ) : (
              <Ionicons
                name={brand ? "pricetag" : "apps"}
                size={22}
                color={active ? Colors.primary : Colors.textSecondary}
              />
            )}
          </View>
          <Text
            style={[styles.brandChipText, active && styles.brandChipTextActive]}
            numberOfLines={1}
          >
            {brand ? brand.name : t("products.allFilter")}
          </Text>
        </Pressable>
      );
    },
    [selectedBrand, t],
  );

  const Header = useMemo(
    () => (
      <View>
        <View style={styles.brandBarWrap}>
          {brandsLoading && brands.length === 0 ? (
            <View style={styles.brandBarSkeletonRow}>
              <View style={styles.brandSkeleton} />
              <View style={styles.brandSkeleton} />
              <View style={styles.brandSkeleton} />
              <View style={styles.brandSkeleton} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandBar}
            >
              {BrandChip(null)}
              {brands.map((b) => BrandChip(b))}
            </ScrollView>
          )}
        </View>
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>
            {total} {t("products.title")}
          </Text>
        </View>
      </View>
    ),
    [brands, brandsLoading, BrandChip, total, t],
  );

  if (loading && !refreshing && items.length === 0) {
    return (
      <View style={styles.container}>
        {Header}
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="cube-outline"
              title={t("products.noProducts")}
              message={t("products.noProductsMessage")}
            />
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
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
  brandBarWrap: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  brandBar: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  brandBarSkeletonRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  brandSkeleton: {
    width: 64,
    height: 84,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBackground,
  },
  brandChip: {
    alignItems: "center",
    width: 70,
  },
  brandChipActive: {},
  brandLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  brandLogoWrapActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryXLight,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
  },
  brandChipText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  brandChipTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  resultsRow: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  resultsCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  row: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  productWrapper: {
    flex: 1,
  },
  loadingMore: {
    paddingVertical: Spacing.xl,
  },
});
