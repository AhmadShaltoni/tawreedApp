import CategoryCard from "@/src/components/CategoryCard";
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
import type { BreadcrumbItem, Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

const NUM_COLUMNS = 4;

export default function CategoriesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { parentId: initialParentId } = useLocalSearchParams<{ parentId?: string }>();
  const isArabic = i18n.language === "ar";

  const [categories, setCategories] = useState<Category[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  // Track the category we drilled into (to know its productsCount)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = useCallback(
    async (parentId: string | null, isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const result = await categoryService.getCategories(
          parentId ?? undefined,
        );
        setCategories(result.categories);
        if (result.breadcrumb.length > 0) {
          setBreadcrumb(result.breadcrumb);
        } else if (!parentId) {
          setBreadcrumb([]);
        }
      } catch {
        // Keep current items on error
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (initialParentId) {
      setCurrentParentId(initialParentId);
      loadCategories(initialParentId);
    } else {
      loadCategories(null);
    }
  }, [loadCategories, initialParentId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories(currentParentId, true);
    setRefreshing(false);
  }, [loadCategories, currentParentId]);

  const filtered = search
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  const handleCategoryPress = useCallback(
    (category: Category) => {
      if (category.hasChildren) {
        // Drill into children
        setSearch("");
        setCurrentParentId(category.id);
        setCurrentCategory(category);
        loadCategories(category.id);
      } else {
        // Leaf category → show products
        router.push(`/products?categoryId=${category.id}`);
      }
    },
    [router, loadCategories],
  );

  const handleBreadcrumbPress = useCallback(
    (crumb: BreadcrumbItem | null) => {
      setSearch("");
      if (crumb === null) {
        // Go to root
        setCurrentParentId(null);
        setCurrentCategory(null);
        setBreadcrumb([]);
        loadCategories(null);
      } else {
        setCurrentParentId(crumb.id);
        // Reconstruct a partial Category from breadcrumb data
        setCurrentCategory({
          id: crumb.id,
          name: crumb.name,
          nameEn: crumb.nameEn,
          slug: crumb.slug,
          parentId: null,
          depth: crumb.depth ?? 0,
          hasChildren: crumb.hasChildren ?? true,
          childrenCount: crumb.childrenCount ?? 0,
          productsCount: crumb.productsCount ?? 0,
        });
        loadCategories(crumb.id);
      }
    },
    [loadCategories],
  );

  /** Navigate to products page for the current parent category */
  const handleViewProducts = useCallback(
    (withDescendants: boolean) => {
      if (!currentParentId) return;
      router.push({
        pathname: "/products",
        params: {
          categoryId: currentParentId,
          ...(withDescendants ? { includeDescendants: "true" } : {}),
        },
      });
    },
    [router, currentParentId],
  );

  if (loading && !refreshing && categories.length === 0) {
    return <Loader />;
  }

  // Does the current parent category have direct products?
  const parentHasProducts = (currentCategory?.productsCount ?? 0) > 0;

  return (
    <View style={styles.container}>
      {/* Breadcrumb bar */}
      {breadcrumb.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.breadcrumbContainer}
        >
          <Pressable
            style={styles.breadcrumbItem}
            onPress={() => handleBreadcrumbPress(null)}
          >
            <Ionicons name="home-outline" size={14} color={Colors.primary} />
            <Text style={styles.breadcrumbText}>{t("categories.root")}</Text>
          </Pressable>
          {breadcrumb.map((crumb, index) => (
            <View key={crumb.id} style={styles.breadcrumbItem}>
              <Ionicons
                name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                size={12}
                color={Colors.textLight}
              />
              <Pressable onPress={() => handleBreadcrumbPress(crumb)}>
                <Text
                  style={[
                    styles.breadcrumbText,
                    index === breadcrumb.length - 1 &&
                      styles.breadcrumbTextActive,
                  ]}
                >
                  {isArabic ? crumb.name : crumb.nameEn || crumb.name}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("common.search")}
        />
      </View>

      {/* Products buttons — when current parent has direct products */}
      {currentParentId && parentHasProducts && !search && (
        <View style={styles.productsActions}>
          <Pressable
            style={styles.viewProductsBtn}
            onPress={() => handleViewProducts(false)}
          >
            <Ionicons name="cube-outline" size={16} color={Colors.primary} />
            <Text style={styles.viewProductsBtnText}>
              {t("categories.viewProducts", {
                count: currentCategory?.productsCount ?? 0,
              })}
            </Text>
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={14}
              color={Colors.primary}
            />
          </Pressable>

          <Pressable
            style={styles.viewAllProductsBtn}
            onPress={() => handleViewProducts(true)}
          >
            <Ionicons name="layers-outline" size={16} color={Colors.white} />
            <Text style={styles.viewAllProductsBtnText}>
              {t("categories.viewAllProducts")}
            </Text>
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={14}
              color={Colors.white}
            />
          </Pressable>
        </View>
      )}

      <FlatList
        data={filtered}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryWrapper}>
            <CategoryCard category={item} onPress={handleCategoryPress} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="grid-outline"
            title={t("categories.noCategories")}
            message={search ? t("common.noResults") : undefined}
          />
        }
        contentContainerStyle={styles.listContent}
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
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  breadcrumbText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "500",
  },
  breadcrumbTextActive: {
    color: Colors.text,
    fontWeight: "700",
  },
  searchContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  productsActions: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  viewProductsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewProductsBtnText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  viewAllProductsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  viewAllProductsBtnText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  categoryWrapper: {
    flex: 1,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
});
