import ProductCard from "@/src/components/ProductCard";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import SearchBar from "@/src/components/ui/SearchBar";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchCategories } from "@/src/store/slices/categories.slice";
import {
  fetchMoreProducts,
  fetchProducts,
  setFilters,
} from "@/src/store/slices/products.slice";
import type { Product } from "@/src/types";
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

export default function ProductsListScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();

  const { items, loading, loadingMore, total, page, filters } = useAppSelector(
    (state) => state.products,
  );
  const { items: categories } = useAppSelector((state) => state.categories);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.categoryId ?? null,
  );
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        page: 1,
      }),
    );
  }, [dispatch, search, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        page: 1,
      }),
    );
    setRefreshing(false);
  }, [dispatch, filters, search, selectedCategory]);

  const loadMore = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    dispatch(
      fetchMoreProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        page: page + 1,
      }),
    );
  }, [
    dispatch,
    filters,
    search,
    selectedCategory,
    page,
    loadingMore,
    items.length,
    total,
  ]);

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}`);
    },
    [router],
  );

  const handleSearchSubmit = useCallback(() => {
    dispatch(setFilters({ search: search || undefined }));
  }, [dispatch, search]);

  const handleCategoryFilter = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
  }, []);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productWrapper}>
        <ProductCard product={item} onPress={handleProductPress} grid />
      </View>
    ),
    [handleProductPress],
  );

  const Header = useMemo(
    () => (
      <View>
        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>

        {/* Category filters */}
        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilters}
          >
            <Pressable
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryFilter(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryFilter(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultsCount}>
            {total} {t("products.title")}
          </Text>
        </View>
      </View>
    ),
    [
      search,
      categories,
      selectedCategory,
      total,
      handleSearchSubmit,
      handleCategoryFilter,
      t,
    ],
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
          <EmptyState
            icon="cube-outline"
            title={t("products.noProducts")}
            message={t("products.noProductsMessage")}
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch("");
              setSelectedCategory(null);
            }}
          />
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
  searchContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoryFilters: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  resultsRow: {
    paddingHorizontal: Spacing.xxl,
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
