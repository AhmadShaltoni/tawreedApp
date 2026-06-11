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
import { categoryService } from "@/src/services/category.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchCategories } from "@/src/store/slices/categories.slice";
import {
    fetchMoreProducts,
    fetchProducts,
    setFilters,
} from "@/src/store/slices/products.slice";
import type { Category, Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
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

/** Represents one level of chip filtering */
interface ChipLevel {
  categories: Category[];
  selectedId: string | null; // null means "الكل"
}

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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Multi-level hierarchical chip rows (used when entering from a specific category)
  const [chipLevels, setChipLevels] = useState<ChipLevel[]>([]);
  const chipLevelsInitialized = useRef(false);

  // Determine the effective categoryId for product fetching
  const effectiveCategoryId = useMemo(() => {
    if (chipLevels.length > 0) {
      // Find the deepest selected chip
      for (let i = chipLevels.length - 1; i >= 0; i--) {
        if (chipLevels[i].selectedId !== null) {
          return chipLevels[i].selectedId;
        }
      }
      // All sub-levels have "الكل" selected — use root parent
      return params.categoryId ?? selectedCategory ?? undefined;
    }
    return selectedCategory ?? undefined;
  }, [params.categoryId, chipLevels, selectedCategory]);

  const effectiveIncludeDescendants = useMemo(() => {
    if (params.categoryId) {
      return true;
    }
    // Include descendants when a root category with sub-levels is selected
    if (selectedCategory && chipLevels.length > 0) {
      return true;
    }
    return false;
  }, [params.categoryId, selectedCategory, chipLevels]);

  // Find the selected category object to check hasChildren
  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [categories, selectedCategory],
  );
  const selectedBrandObj = useMemo(
    () => brands.find((b) => b.id === selectedBrand),
    [brands, selectedBrand],
  );

  // Load initial data — root categories for filter chips
  useEffect(() => {
    dispatch(fetchCategories(undefined));
  }, [dispatch]);

  // Fetch first level of children when entering from a specific category
  useEffect(() => {
    if (params.categoryId && !chipLevelsInitialized.current) {
      chipLevelsInitialized.current = true;
      categoryService
        .getCategories(params.categoryId)
        .then((result) => {
          if (result.categories.length > 0) {
            setChipLevels([
              { categories: result.categories, selectedId: null },
            ]);
          }
        })
        .catch(() => {
          setChipLevels([]);
        });
    }
  }, [params.categoryId]);

  // Fetch children when a chip is selected (to build next level)
  const handleChipSelect = useCallback(
    (levelIndex: number, categoryId: string | null) => {
      setChipLevels((prev) => {
        // Update the selected chip at this level and remove all levels below
        const updated = prev.slice(0, levelIndex + 1);
        updated[levelIndex] = {
          ...updated[levelIndex],
          selectedId: categoryId,
        };
        return updated;
      });

      // If "الكل" is selected, we're done (no child level to show)
      if (categoryId === null) return;

      // Check if the selected category has children
      const level = chipLevels[levelIndex];
      const selectedCat = level?.categories.find((c) => c.id === categoryId);
      if (selectedCat?.hasChildren) {
        // Fetch children of the selected category
        categoryService
          .getCategories(categoryId)
          .then((result) => {
            if (result.categories.length > 0) {
              setChipLevels((prev) => {
                // Only add if we haven't already changed the selection
                if (prev[levelIndex]?.selectedId === categoryId) {
                  const newLevels = prev.slice(0, levelIndex + 1);
                  newLevels.push({
                    categories: result.categories,
                    selectedId: null,
                  });
                  return newLevels;
                }
                return prev;
              });
            }
          })
          .catch(() => {
            // Ignore — just don't show child level
          });
      }
    },
    [chipLevels],
  );

  useEffect(() => {
    dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: effectiveCategoryId ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants: effectiveIncludeDescendants || undefined,
        page: 1,
      }),
    );
  }, [
    dispatch,
    search,
    effectiveCategoryId,
    selectedBrand,
    selectedTag,
    effectiveIncludeDescendants,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      fetchProducts({
        ...filters,
        search: search || undefined,
        categoryId: effectiveCategoryId ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants: effectiveIncludeDescendants || undefined,
        page: 1,
      }),
    );
    setRefreshing(false);
  }, [
    dispatch,
    filters,
    search,
    effectiveCategoryId,
    selectedBrand,
    selectedTag,
    effectiveIncludeDescendants,
  ]);

  const loadMore = useCallback(() => {
    if (loadingMore || items.length >= total) return;
    dispatch(
      fetchMoreProducts({
        ...filters,
        search: search || undefined,
        categoryId: effectiveCategoryId ?? undefined,
        brandId: selectedBrand ?? undefined,
        tag: selectedTag ?? undefined,
        includeDescendants: effectiveIncludeDescendants || undefined,
        page: page + 1,
      }),
    );
  }, [
    dispatch,
    filters,
    search,
    effectiveCategoryId,
    selectedBrand,
    selectedTag,
    effectiveIncludeDescendants,
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

  const handleCategoryFilter = useCallback(
    (categoryId: string | null) => {
      setSelectedCategory(categoryId);
      setSelectedTag(null);

      if (categoryId === null) {
        setChipLevels([]);
        return;
      }

      // If the selected root category has children, fetch and show sub-level chips
      const selectedCat = categories.find((c) => c.id === categoryId);
      if (selectedCat?.hasChildren) {
        categoryService
          .getCategories(categoryId)
          .then((result) => {
            if (result.categories.length > 0) {
              setChipLevels([
                { categories: result.categories, selectedId: null },
              ]);
            } else {
              setChipLevels([]);
            }
          })
          .catch(() => {
            setChipLevels([]);
          });
      } else {
        setChipLevels([]);
      }
    },
    [categories],
  );

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

        {/* Root category chips (when browsing all products) */}
        {!params.categoryId && categories.length > 0 ? (
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

        {/* Multi-level hierarchical sub-category chip rows */}
        {chipLevels.length > 0
          ? chipLevels.map((level, levelIndex) => {
              const isSubLevel = !params.categoryId || levelIndex > 0;
              return (
                <ScrollView
                  key={`chip-level-${levelIndex}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.categoryFilters,
                    isSubLevel && styles.subLevelFilters,
                  ]}
                >
                  <Pressable
                    style={[
                      styles.categoryChip,
                      isSubLevel && styles.subLevelChip,
                      level.selectedId === null &&
                        (isSubLevel
                          ? styles.subLevelChipActive
                          : styles.categoryChipActive),
                    ]}
                    onPress={() => handleChipSelect(levelIndex, null)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        level.selectedId === null &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {t("products.allFilter")}
                    </Text>
                  </Pressable>
                  {level.categories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isSubLevel && styles.subLevelChip,
                        level.selectedId === cat.id &&
                          (isSubLevel
                            ? styles.subLevelChipActive
                            : styles.categoryChipActive),
                      ]}
                      onPress={() => handleChipSelect(levelIndex, cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          level.selectedId === cat.id &&
                            styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              );
            })
          : null}

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
      chipLevels,
      selectedCategory,
      total,
      handleSearchSubmit,
      handleCategoryFilter,
      handleChipSelect,
      selectedBrandObj,
      selectedCategoryObj,
      selectedTag,
      params.categoryId,
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
  subLevelFilters: {
    paddingBottom: Spacing.sm,
    paddingTop: 0,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  subLevelChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  subLevelChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
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
