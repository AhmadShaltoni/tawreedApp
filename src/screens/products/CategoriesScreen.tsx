import CategoryCard from "@/src/components/CategoryCard";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import SearchBar from "@/src/components/ui/SearchBar";
import { Colors, Spacing } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { fetchCategories } from "@/src/store/slices/categories.slice";
import type { Category } from "@/src/types";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

const NUM_COLUMNS = 4;

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { items, loading } = useAppSelector((state) => state.categories);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchCategories());
    setRefreshing(false);
  }, [dispatch]);

  const filtered = search
    ? items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleCategoryPress = useCallback(
    (category: Category) => {
      router.push(`/products?categoryId=${category.id}`);
    },
    [router],
  );

  if (loading && !refreshing && items.length === 0) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("common.search")}
        />
      </View>

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
  searchContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
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
