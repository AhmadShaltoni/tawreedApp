/**
 * Loyalty Design System
 * Dedicated visual identity for the loyalty experience
 * 
 * IMPORTANT: All values optimized for 60fps on mid-range Android devices
 * - Native shadows only (no blur stacking)
 * - Performant gradients
 * - Optimized animation timings
 */

import { Platform } from "react-native";
import { Colors as AppColors } from "./theme";

// ============================================
// Rarity System Colors
// ============================================
export const RarityColors = {
  COMMON: {
    primary: "#6b7280", // Gray
    light: "#9ca3af",
    bg: "#f3f4f6",
    glow: "#6b728020",
  },
  RARE: {
    primary: "#3b82f6", // Blue
    light: "#60a5fa",
    bg: "#eff6ff",
    glow: "#3b82f640",
  },
  EPIC: {
    primary: "#8b5cf6", // Purple
    light: "#a78bfa",
    bg: "#f5f3ff",
    glow: "#8b5cf660",
  },
  LEGENDARY: {
    primary: "#f59e0b", // Gold/Amber
    light: "#fbbf24",
    bg: "#fffbeb",
    glow: "#f59e0b80",
  },
} as const;

// ============================================
// Premium Gradients
// ============================================
export const LoyaltyGradients = {
  // Balance hero card
  gold: ["#f59e0b", "#d97706"],
  goldLight: ["#fbbf24", "#f59e0b"],
  
  // Progress & success
  blue: ["#3b82f6", "#1e40af"],
  blueLight: ["#60a5fa", "#3b82f6"],
  
  // Success states
  green: ["#10b981", "#059669"],
  greenLight: ["#34d399", "#10b981"],
  
  // Premium dark
  darkBlue: ["#1e3a8a", "#1e293b"],
  
  // Subtle backgrounds
  lightGold: ["#fffbeb", "#fef3c7"],
  lightBlue: ["#eff6ff", "#dbeafe"],
  
  // Rarity-specific
  rare: ["#3b82f6", "#2563eb"],
  epic: ["#8b5cf6", "#7c3aed"],
  legendary: ["#f59e0b", "#ea580c", "#dc2626"], // 3-color gradient
} as const;

// ============================================
// Premium Shadows (native only, Android-safe)
// ============================================
export const LoyaltyShadows = {
  // Subtle elevation
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: Platform.OS === "android" ? 2 : 3,
  },
  
  // Card elevation
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 3 : 5,
  },
  
  // Premium/elevated cards
  premium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: Platform.OS === "android" ? 5 : 8,
  },
  
  // Rarity glow shadows (gold-tinted)
  goldGlow: {
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0 : 0.3, // No colored shadows on Android
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 4 : 0,
  },
  
  blueGlow: {
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0 : 0.25,
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 4 : 0,
  },
  
  purpleGlow: {
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === "android" ? 0 : 0.25,
    shadowRadius: 12,
    elevation: Platform.OS === "android" ? 4 : 0,
  },
} as const;

// ============================================
// Animation Timing Presets
// ============================================
export const AnimationTimings = {
  // Ultra-fast micro-interactions
  instant: 150,
  
  // Quick feedback
  quick: 200,
  
  // Standard transitions
  normal: 400,
  
  // Smooth expansions
  smooth: 600,
  
  // Celebration moments
  celebration: 800,
  
  // Full reveal sequences
  reveal: 1200,
  
  // Long dramatic moments
  dramatic: 1600,
} as const;

// ============================================
// Spring Configs (Reanimated-compatible)
// ============================================
export const SpringConfigs = {
  // Gentle, smooth
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },
  
  // Standard UI response
  standard: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  // Snappy, responsive
  snappy: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },
  
  // Bouncy celebration
  bouncy: {
    damping: 8,
    stiffness: 150,
    mass: 1,
  },
  
  // Progress fill
  progress: {
    damping: 18,
    stiffness: 100,
    mass: 1,
  },
} as const;

// ============================================
// Loyalty Typography
// ============================================
export const LoyaltyTypography = {
  // Large numbers (points balance)
  balanceHero: {
    fontSize: 48,
    fontWeight: "700" as const,
    lineHeight: 56,
    letterSpacing: -1,
  },
  
  // Medium numbers (rewards, transactions)
  number: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  
  // Section titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  
  // Card titles
  cardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  
  // Floating points toast
  floatingPoints: {
    fontSize: 18,
    fontWeight: "700" as const,
    lineHeight: 24,
  },
  
  // Near-completion urgency
  urgency: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
} as const;

// ============================================
// Loyalty-specific Spacing
// ============================================
export const LoyaltySpacing = {
  // Generous whitespace multiplier
  card: 20,
  section: 28,
  hero: 32,
  
  // Rarity badge sizes
  rarityBadge: {
    small: 20,
    medium: 28,
    large: 36,
  },
  
  // Progress bar heights
  progressBar: {
    thin: 4,
    standard: 8,
    thick: 12,
  },
} as const;

// ============================================
// Glassmorphism (iOS only, fallback on Android)
// ============================================
export const GlassEffect = {
  // Use blur on iOS, solid semi-transparent on Android for performance
  background: Platform.OS === "ios" 
    ? "transparent" 
    : "rgba(255, 255, 255, 0.95)",
  
  blurIntensity: 20, // iOS only
  
  fallbackBackground: "rgba(255, 255, 255, 0.95)", // Android
  
  borderColor: "rgba(255, 255, 255, 0.3)",
  borderWidth: 1,
} as const;

// ============================================
// Near-Completion Thresholds
// ============================================
export const CompletionThresholds = {
  // When to start showing urgency
  nearCompletion: 0.7, // 70%
  
  // When to pulse/glow
  veryClose: 0.8, // 80%
  
  // Maximum urgency state
  almostThere: 0.9, // 90%
} as const;

// ============================================
// Reward Card Dimensions
// ============================================
export const CardDimensions = {
  reward: {
    width: 160,
    height: 200,
  },
  campaign: {
    height: 180,
  },
  coupon: {
    height: 140,
  },
  transaction: {
    height: 80,
  },
} as const;

// ============================================
// Celebration Particle Config
// ============================================
export const ParticleConfig = {
  // Confetti count (reduce on Android for performance)
  confettiCount: Platform.OS === "android" ? 30 : 50,
  
  // Coin burst count
  coinBurst: Platform.OS === "android" ? 10 : 15,
  
  // Animation duration
  duration: 2000,
} as const;

// Export consolidated theme
export const LoyaltyTheme = {
  colors: {
    rarity: RarityColors,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    success: AppColors.success,
    warning: AppColors.warning,
    text: AppColors.text,
    textSecondary: AppColors.textSecondary,
    background: AppColors.background,
    surface: AppColors.surface,
    border: AppColors.border,
  },
  gradients: LoyaltyGradients,
  shadows: LoyaltyShadows,
  animation: {
    timings: AnimationTimings,
    springs: SpringConfigs,
  },
  typography: LoyaltyTypography,
  spacing: LoyaltySpacing,
  glass: GlassEffect,
  thresholds: CompletionThresholds,
  dimensions: CardDimensions,
  particles: ParticleConfig,
} as const;
