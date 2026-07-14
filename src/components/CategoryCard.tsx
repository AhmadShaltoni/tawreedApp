import { BorderRadius, Colors, FontSize, Shadows, Spacing } from "@/src/constants/theme";
import type { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={() => onPress(category)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            category.image?.url
              ? { uri: category.image.url }
              : require("@/assets/images/icon2.png")
          }
          accessibilityLabel={category.image?.alt || category.name}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {category.name}
      </Text>
      {category.productsCount > 0 ? (
        <Text style={styles.count} numberOfLines={1}>
          {t("categories.productCount", { count: category.productsCount })}
        </Text>
      ) : category.hasChildren ? (
        <View style={styles.childrenRow}>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={10}
            color={Colors.primary}
          />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    width: "100%",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  count: {
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  childrenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
});
