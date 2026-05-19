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
  formatValue?: (value: number) => string;
}

export function useAnimatedCounter(
  targetValue: number,
  options: UseAnimatedCounterOptions = {},
) {
  const {
    springConfig = springPresets.standard,
    formatValue = (val) => Math.round(val).toString(),
  } = options;

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withSpring(targetValue, springConfig);
  }, [targetValue, animatedValue, springConfig]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatValue(animatedValue.value),
    };
  });

  return { animatedValue, animatedProps, formatValue };
}
