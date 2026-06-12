import ProductCard from "@/src/components/ProductCard";
import ErrorScreen from "@/src/components/errors/ErrorScreen";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import { BorderRadius, Colors, FontSize, Spacing } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
    clearSelectedSection,
    fetchSectionBySlug,
} from "@/src/store/slices/marketingSections.slice";
import type { Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const NUM_COLUMNS = 2;

export default function MarketingSectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === "ar";

  const { selectedSection, loadingDetail, error } = useAppSelector(
    (state) => state.marketingSections,
  );

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (slug) {
      dispatch(fetchSectionBySlug(slug));
    }
    return () => {
      dispatch(clearSelectedSection());
    };
  }, [dispatch, slug]);

  const onRefresh = useCallback(async () => {
    if (!slug) return;
    setRefreshing(true);
    await dispatch(fetchSectionBySlug(slug));
    setRefreshing(false);
  }, [dispatch, slug]);

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/product/${product.id}`);
    },
    [router],
  );

  const sectionName = isRTL
    ? selectedSection?.name
    : selectedSection?.nameEn || selectedSection?.name;

  if (loadingDetail && !selectedSection) {
    return <Loader />;
  }

  if (error && !selectedSection) {
    const errorType = error.includes("Network")
      ? ("network" as const)
      : ("generic" as const);
    return (
      <ErrorScreen
        type={errorType}
        onRetry={() => slug && dispatch(fetchSectionBySlug(slug))}
        errorMessage={error}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={Colors.white}
          />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sectionName || ""}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Section Image Banner */}
      {selectedSection?.image && (
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: selectedSection.image }}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
        </View>
      )}

      {/* Products Grid */}
      <FlatList
        data={selectedSection?.products ?? []}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.gridRow}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={handleProductPress} grid />
        )}
        ListEmptyComponent={
          !loadingDetail ? (
            <EmptyState
              icon="cube-outline"
              title={t("marketingSections.noProducts")}
              message={t("marketingSections.noProductsMessage")}
            />
          ) : null
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
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  bannerContainer: {
    height: 180,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  gridContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  gridRow: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
});
