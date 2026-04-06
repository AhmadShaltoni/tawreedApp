import { BorderRadius, Colors, Spacing } from "@/src/constants/theme";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface LoaderProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
}

/** Skeleton shimmer bar */
function SkeletonBar({
  width,
  height = 14,
  style,
}: {
  width: number | string;
  height?: number;
  style?: any;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 }),
      ),
      -1,
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: BorderRadius.sm,
          backgroundColor: Colors.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export default function Loader({
  size = "large",
  color = Colors.primary,
  fullScreen = true,
}: LoaderProps) {
  if (!fullScreen) {
    return (
      <View style={styles.inlineWrap}>
        <SkeletonBar width="60%" height={18} />
        <SkeletonBar
          width="80%"
          height={14}
          style={{ marginTop: Spacing.sm }}
        />
        <SkeletonBar
          width="40%"
          height={14}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Skeleton product cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBar width="100%" height={120} />
          <View style={styles.skeletonContent}>
            <SkeletonBar width="75%" height={16} />
            <SkeletonBar
              width="50%"
              height={14}
              style={{ marginTop: Spacing.sm }}
            />
            <SkeletonBar
              width="35%"
              height={14}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export { SkeletonBar };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  inlineWrap: {
    padding: Spacing.lg,
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  skeletonContent: {
    padding: Spacing.lg,
  },
});
