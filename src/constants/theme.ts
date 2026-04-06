import { I18nManager } from "react-native";

export const Colors = {
  // Primary — Deep Blue (trust & professionalism)
  primary: "#1e3a8a",
  primaryLight: "#1e40af",
  primaryXLight: "#eff6ff",

  // Accent — Orange (urgency & action)
  secondary: "#f97316",
  secondaryDark: "#ea580c",
  secondaryLight: "#fff7ed",

  // Neutral
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",
  border: "#e5e7eb",
  inputBackground: "#f3f4f6",

  // Semantic
  error: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#0ea5e9",

  // Utilities
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0,0,0,0.4)",

  // Backward compat
  primaryDark: "#1e40af",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

export const isRTL = I18nManager.isRTL;
