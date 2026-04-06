/**
 * Modern Skeleton Loader Component
 * Shimmer animation instead of spinners - feels faster to users
 * Reduces perceived wait time and maintains visual consistency
 */

import { BorderRadius, Colors, Spacing } from "@/src/constants/theme-modern";
import React, { useEffect } from "react";
import {
    Animated,
    StyleSheet,
    View,
    ViewStyle
} from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  count?: number; // For multiple skeleton items
  direction?: "row" | "column";
}

export function SkeletonLoader({
  width = "100%",
  height = 100,
  borderRadius: radius = BorderRadius.md,
  style,
  count = 1,
  direction = "column",
}: SkeletonLoaderProps) {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  const skeletonItems = Array(count)
    .fill(0)
    .map((_, index) => (
      <Animated.View
        key={index}
        style={[
          {
            width,
            height,
            borderRadius: radius,
            backgroundColor: Colors.background,
            marginBottom: direction === "column" ? Spacing.md : 0,
            marginRight: direction === "row" ? Spacing.md : 0,
          },
          shimmerStyle,
          style,
        ]}
      />
    ));

  if (count === 1) return skeletonItems[0];

  return (
    <View style={{ flexDirection: direction, flexWrap: "wrap" }}>
      {skeletonItems}
    </View>
  );
}

/**
 * Skeleton Product Card Loader
 * Mimics the layout of a product card while loading
 */
export function SkeletonProductCard() {
  return (
    <View style={styles.productCard}>
      {/* Image placeholder */}
      <SkeletonLoader
        width="100%"
        height={150}
        borderRadius={BorderRadius.lg}
        style={{ marginBottom: Spacing.md }}
      />

      {/* Title placeholder */}
      <SkeletonLoader
        width="80%"
        height={16}
        borderRadius={BorderRadius.sm}
        style={{ marginBottom: Spacing.sm }}
      />

      {/* Description placeholder */}
      <SkeletonLoader
        width="100%"
        height={12}
        borderRadius={BorderRadius.sm}
        style={{ marginBottom: Spacing.md }}
      />

      {/* Price placeholder */}
      <View style={{ flexDirection: "row", gap: Spacing.md }}>
        <SkeletonLoader
          width="40%"
          height={14}
          borderRadius={BorderRadius.sm}
        />
        <SkeletonLoader
          width="40%"
          height={14}
          borderRadius={BorderRadius.sm}
        />
      </View>
    </View>
  );
}

/**
 * Skeleton List Loader
 * For lists or grids of items
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <View key={index} style={styles.listItem}>
            {/* Avatar */}
            <SkeletonLoader
              width={50}
              height={50}
              borderRadius={BorderRadius.full}
              style={{ marginRight: Spacing.md }}
            />

            {/* Content */}
            <View style={{ flex: 1 }}>
              <SkeletonLoader
                width="70%"
                height={14}
                borderRadius={BorderRadius.sm}
                style={{ marginBottom: Spacing.sm }}
              />
              <SkeletonLoader
                width="100%"
                height={12}
                borderRadius={BorderRadius.sm}
              />
            </View>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    paddingBottom: Spacing.md,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
