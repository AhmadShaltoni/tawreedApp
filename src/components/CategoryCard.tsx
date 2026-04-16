import { Colors, FontSize, Shadows, Spacing } from "@/src/constants/theme";
import type { Category } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo } from "react";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
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
              : require("@/assets/images/icon.png")
          }
          accessibilityLabel={category.image?.alt || category.name}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {/* Gradient overlay for readability */}
        <View style={styles.overlay} />
        {/* Products count badge */}
        {category.productsCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category.productsCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
      {category.hasChildren ? (
        <View style={styles.childrenRow}>
          <Ionicons
            name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
            size={10}
            color={Colors.primary}
          />
          <Text style={styles.childrenCount}>{category.childrenCount}</Text>
        </View>
      ) : category.productsCount > 0 ? (
        <Text style={styles.count}>{category.productsCount}</Text>
      ) : null}
    </AnimatedPressable>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    width: 90,
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: Colors.primaryXLight,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 58, 138, 0.08)",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  childrenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  childrenCount: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: "600",
  },
  count: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 2,
  },
});
