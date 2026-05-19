/**
 * usePulseAnimation Hook
 * Subtle pulsing animation for near-completion states
 * 
 * PERFORMANCE: Uses native driver, loop runs on UI thread
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { timingPresets } from "./motionPresets";

interface UsePulseAnimationOptions {
  enabled?: boolean;
  intensity?: number; // 1.0 = 100% scale change
  duration?: number;
}

export function usePulseAnimation(options: UsePulseAnimationOptions = {}) {
  const { enabled = true, intensity = 0.05, duration = 1000 } = options;

  const scale = useSharedValue(1);

  useEffect(() => {
    if (enabled) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1 + intensity, { duration: duration / 2 }),
          withTiming(1, { duration: duration / 2 }),
        ),
        -1, // Infinite repeat
        false,
      );
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }

    return () => {
      cancelAnimation(scale);
    };
  }, [enabled, intensity, duration, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return animatedStyle;
}
