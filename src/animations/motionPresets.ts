/**
 * Motion Presets
 * Reusable animation configurations for consistent motion design
 * All use Reanimated worklets for 60fps native performance
 */

import type { WithSpringConfig, WithTimingConfig } from "react-native-reanimated";
import { Easing } from "react-native-reanimated";
import { AnimationTimings, SpringConfigs } from "@/src/constants/loyaltyTheme";

// ============================================
// Spring Configurations (Reanimated)
// ============================================

export const springPresets: Record<string, WithSpringConfig> = {
  gentle: SpringConfigs.gentle,
  standard: SpringConfigs.standard,
  snappy: SpringConfigs.snappy,
  bouncy: SpringConfigs.bouncy,
  progress: SpringConfigs.progress,
};

// ============================================
// Timing Configurations (Reanimated)
// ============================================

export const timingPresets: Record<string, WithTimingConfig> = {
  instant: {
    duration: AnimationTimings.instant,
    easing: Easing.out(Easing.ease),
  },
  quick: {
    duration: AnimationTimings.quick,
    easing: Easing.out(Easing.ease),
  },
  normal: {
    duration: AnimationTimings.normal,
    easing: Easing.out(Easing.cubic),
  },
  smooth: {
    duration: AnimationTimings.smooth,
    easing: Easing.bezier(0.4, 0, 0.2, 1), // Material Design standard easing
  },
  celebration: {
    duration: AnimationTimings.celebration,
    easing: Easing.out(Easing.back(1.5)),
  },
  reveal: {
    duration: AnimationTimings.reveal,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth reveal
  },
};

// ============================================
// Entrance Animations
// ============================================

export const entrancePresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: AnimationTimings.normal,
  },
  
  slideUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
    duration: AnimationTimings.normal,
  },
  
  slideDown: {
    from: { opacity: 0, translateY: -20 },
    to: { opacity: 1, translateY: 0 },
    duration: AnimationTimings.normal,
  },
  
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: AnimationTimings.normal,
  },
  
  zoom: {
    from: { opacity: 0, scale: 0.5 },
    to: { opacity: 1, scale: 1 },
    duration: AnimationTimings.celebration,
  },
};

// ============================================
// Exit Animations
// ============================================

export const exitPresets = {
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: AnimationTimings.quick,
  },
  
  slideDown: {
    from: { opacity: 1, translateY: 0 },
    to: { opacity: 0, translateY: 20 },
    duration: AnimationTimings.quick,
  },
  
  scaleOut: {
    from: { opacity: 1, scale: 1 },
    to: { opacity: 0, scale: 0.9 },
    duration: AnimationTimings.quick,
  },
};

// ============================================
// Gesture Presets
// ============================================

export const gesturePresets = {
  press: {
    scale: 0.96,
    duration: AnimationTimings.instant,
  },
  
  longPress: {
    scale: 0.92,
    duration: AnimationTimings.quick,
  },
  
  swipe: {
    translateX: 20,
    duration: AnimationTimings.quick,
  },
};
