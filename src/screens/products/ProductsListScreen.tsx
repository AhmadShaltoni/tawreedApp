import ProductCard from "@/src/components/ProductCard";
import { TagFilterBar } from "@/src/components/TagFilterBar";
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
import { Ionicons } from "@expo/vector-icons";
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
    Switch,
    Text,
    View,
} from "react-native";

const NUM_COLUMNS = 2;

export default function ProductsListScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{
    categoryId?: string;
    brandId?: string;
    includeDescendants?: string;
  }>();

  const { items, loading, loadingMore, total, page, filters } = useAppSelector(
    (state) => state.products,
  );
  const { items: categories } = useAppSelector((state) => state.categories);
  const { items: brands } = useAppSelector((state) => state.brands);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.categoryId ?? null,
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    params.brandId ?? null,
  );
  const [includeDescendants, setIncludeDescendants] = useState(
    params.includeDescendants === "true",
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Find the selected category object to check hasChildren
  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [categories, selectedCategory],
  );
  const selectedBrandObj = useMemo(
    () => brands.find((b) => b.id === selectedBrand),
    [brands, selectedBrand],
  );
  const showDescendantsToggle = selectedCategoryObj?.hasChildren === true;

  // Load initial data — root categories for filter chips
  useEffect(() => {
    dispatch(fetchCategories(undefined));
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants:
          selectedCategory && includeDescendants ? true : undefined,
        page: 1,
      }),
    );
  }, [
    dispatch,
    search,
    selectedCategory,
    selectedBrand,
    selectedTag,
    includeDescendants,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants:
          selectedCategory && includeDescendants ? true : undefined,
        page: 1,
      }),
    );
    setRefreshing(false);
  }, [
    dispatch,
    filters,
    search,
    selectedCategory,
    selectedBrand,
    selectedTag,
    includeDescendants,
  ]);

  const loadMore = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    dispatch(
      fetchMoreProducts({
        ...filters,
        search: search || undefined,
        categoryId: selectedCategory ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants:
          selectedCategory && includeDescendants ? true : undefined,
        page: page + 1,
      }),
    );
  }, [
    dispatch,
    filters,
    search,
    selectedCategory,
    selectedBrand,
    selectedTag,
    includeDescendants,
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
    setIncludeDescendants(false);
    setSelectedTag(null); // Reset tag when category changes
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

        {/* Brand filter indicator */}
        {selectedBrandObj ? (
          <View style={styles.brandFilterContainer}>
            <View style={styles.brandFilterBadge}>
              <Text style={styles.brandFilterText}>
                {t("brands.title")}: {selectedBrandObj.name}
              </Text>
              <Pressable
                onPress={() => setSelectedBrand(null)}
                hitSlop={8}
                style={styles.brandFilterClose}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={Colors.primary}
                />
              </Pressable>
            </View>
          </View>
        ) : null}

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
                {t("categories.all")}
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

        {/* Tag filters - shown when a category is selected */}
        {selectedCategoryObj &&
        selectedCategoryObj.tags &&
        selectedCategoryObj.tags.length > 0 ? (
          <TagFilterBar
            tags={selectedCategoryObj.tags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            allLabel={t("products.allFilter")}
          />
        ) : null}

        {/* Include descendants toggle */}
        {showDescendantsToggle ? (
          <View style={styles.descendantsRow}>
            <Ionicons name="layers-outline" size={16} color={Colors.primary} />
            <Text style={styles.descendantsLabel}>
              {t("products.showAllDescendants")}
            </Text>
            <Switch
              value={includeDescendants}
              onValueChange={setIncludeDescendants}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={
                includeDescendants ? Colors.primary : Colors.textLight
              }
            />
          </View>
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
      showDescendantsToggle,
      includeDescendants,
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
  brandFilterContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.sm,
  },
  brandFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryXLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  brandFilterText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  brandFilterClose: {
    padding: 2,
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
  descendantsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  descendantsLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
    fontWeight: "500",
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
