import { Colors, FontSize, Shadows, Spacing } from "@/src/constants/theme";
import type { Category } from "@/src/types";
import { Image } from "expo-image";
import React, { memo } from "react";
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
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
      {category.productCount != null ? (
        <Text style={styles.count}>{category.productCount} products</Text>
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
  name: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  count: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 2,
  },
});
