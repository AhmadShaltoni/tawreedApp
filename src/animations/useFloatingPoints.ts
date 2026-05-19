/**
 * useFloatingPoints Hook
 * Floating "+X points" animation that rises and fades
 * 
 * PERFORMANCE: Uses native driver for opacity and translateY
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface UseFloatingPointsOptions {
  duration?: number;
  distance?: number; // How far up to float
  onComplete?: () => void;
}

export function useFloatingPoints(
  visible: boolean,
  options: UseFloatingPointsOptions = {},
) {
  const { duration = 2000, distance = -60, onComplete } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start: fade in and rise
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(
        distance,
        {
          duration: duration,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished && onComplete) {
            onComplete();
          }
        },
      );

      // Fade out near the end
      opacity.value = withDelay(
        duration - 500,
        withTiming(0, { duration: 500 }),
      );
    } else {
      // Reset
      opacity.value = 0;
      translateY.value = 0;
    }
  }, [visible, duration, distance, opacity, translateY, onComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return animatedStyle;
}
