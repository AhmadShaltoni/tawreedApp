/**
 * useStaggeredEntry Hook
 * Staggered list item entrance animation
 * 
 * PERFORMANCE: Uses native driver
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface UseStaggeredEntryOptions {
  index: number;
  delay?: number; // Delay between items (ms)
  duration?: number;
}

export function useStaggeredEntry(options: UseStaggeredEntryOptions) {
  const { index, delay = 80, duration = 400 } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const itemDelay = index * delay;

    opacity.value = withDelay(
      itemDelay,
      withTiming(1, {
        duration,
        easing: Easing.out(Easing.ease),
      }),
    );

    translateY.value = withDelay(
      itemDelay,
      withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [index, delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
}
