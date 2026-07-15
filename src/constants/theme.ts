import { I18nManager } from "react-native";

import { moderateScale, scaleFont } from "@/src/utils/responsive";

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
  errorSurface: "#fef2f2",
  success: "#10b981",
  successSurface: "#f0fdf4",
  warning: "#f59e0b",
  info: "#0ea5e9",
  whatsapp: "#25d366",

  // Input states
  inputDisabled: "#f3f4f6",
  borderFilled: "#cbd5e1",

  // Utilities
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0,0,0,0.4)",

  // Backward compat
  primaryDark: "#1e40af",
} as const;

// Spacing scales gently with screen width (moderateScale) so layouts breathe
// on large phones without blowing apart on small ones.
export const Spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
  xxxxl: moderateScale(40),
} as const;

// Font sizes are width-scaled and clamped (0.9x–1.2x) so text stays legible on
// iPhone SE / Android 360dp and isn't oversized on Pro Max / large Android.
export const FontSize = {
  xxs: scaleFont(10),
  xs: scaleFont(12),
  sm: scaleFont(14),
  md: scaleFont(16),
  lg: scaleFont(18),
  xl: scaleFont(20),
  xxl: scaleFont(24),
  xxxl: scaleFont(32),
} as const;

// Tajawal is loaded in app/_layout.tsx via expo-font. Custom font families on
// Android ignore `fontWeight`, so weight is selected by family name — never
// combine these with a `fontWeight` style.
export const Fonts = {
  regular: "Tajawal-Regular",
  medium: "Tajawal-Medium",
  bold: "Tajawal-Bold",
  extraBold: "Tajawal-ExtraBold",
} as const;

// Arabic script needs taller lines than Latin; multiply by FontSize.
export const LineHeight = {
  tight: 1.35,
  base: 1.5,
  relaxed: 1.7,
} as const;

// Micro-interaction durations (ms). Keep animations inside this range.
export const Motion = {
  fast: 150,
  base: 200,
  slow: 250,
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
