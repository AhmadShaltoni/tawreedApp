/**
 * useProgressFill Hook
 * Smooth progress bar fill animation with spring physics
 * 
 * PERFORMANCE: Uses native driver for transforms
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { springPresets } from "./motionPresets";

interface UseProgressFillOptions {
  springConfig?: "gentle" | "standard" | "snappy" | "progress";
}

export function useProgressFill(
  progress: number, // 0-100
  options: UseProgressFillOptions = {},
) {
  const { springConfig = "progress" } = options;

  const progressValue = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    progressValue.value = withSpring(clampedProgress, springPresets[springConfig]);
  }, [progress, progressValue, springConfig]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  return { animatedStyle, progressValue };
}
