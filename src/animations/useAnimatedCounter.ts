/**
 * useAnimatedCounter Hook
 * Smooth number counting animation using Reanimated
 * 
 * PERFORMANCE: Uses native driver (UI thread) for 60fps
 */

import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import { springPresets } from "./motionPresets";

interface UseAnimatedCounterOptions {
  duration?: number;
  springConfig?: WithSpringConfig;
}

/**
 * Worklet-safe number formatter with thousands separators
 * Uses 'worklet' directive to run on UI thread
 */
function formatNumberWorklet(value: number): string {
  'worklet';
  const rounded = Math.round(value);
  const str = rounded.toString();
  const parts = [];
  
  for (let i = str.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      parts.unshift(',');
    }
    parts.unshift(str[i]);
  }
  
  return parts.join('');
}

export function useAnimatedCounter(
  targetValue: number,
  options: UseAnimatedCounterOptions = {},
) {
  const {
    springConfig = springPresets.standard,
  } = options;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(targetValue, springConfig);
  }, [targetValue, animatedValue, springConfig]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatNumberWorklet(animatedValue.value),
    };
  });

  return { animatedValue, animatedProps };
}
