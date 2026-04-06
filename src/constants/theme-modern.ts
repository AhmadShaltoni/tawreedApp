import { I18nManager } from "react-native";

/**
 * 🎨 Tawreed Modern Color System v2.0
 * Psychology-driven colors for engagement and conversion
 */

export const Colors = {
  // PRIMARY - Deep Blue (Trust & Professionalism)
  primary: "#1e3a8a", // Deep Blue
  primaryLight: "#1e40af", // Blue Hover
  primaryXLight: "#eff6ff", // Light background

  // ACCENT - Orange (Action & Urgency)
  accent: "#f97316", // Primary accent
  accentDark: "#ea580c", // Hover state
  accentLight: "#fef3c7", // Subtle highlights

  // NEUTRAL - Structure & Readability
  background: "#f9fafb", // Main app background
  surface: "#ffffff", // Cards, containers
  text: "#111827", // Primary text
  textSecondary: "#6b7280", // Secondary copy
  textLight: "#9ca3af", // Hints, metadata,disabled
  border: "#e5e7eb", // Dividers, subtle lines

  // SEMANTIC - System Status
  success: "#10b981", // Order confirmed, delivery complete
  warning: "#f59e0b", // Processing, pending status
  error: "#ef4444", // Failed orders, validation errors
  info: "#0ea5e9", // New products, promotions

  // UTILITIES
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)", // Modal/drawer overlays
  glassDark: "rgba(255, 255, 255, 0.7)", // Glassmorphism dark mode
  glassLight: "rgba(255, 255, 255, 0.9)", // Glassmorphism light mode
  inputBackground: "#f3f4f6",
} as const;

/**
 * 🔤 Typography System
 * Rubik for Arabic (RTL), Geist Sans for English (LTR), Zain for branding
 */
export const Typography = {
  fontFamily: {
    // Arabic RTL
    rubik: "Rubik",
    // English LTR
    geistSans: "Geist Sans",
    // Branding only
    zain: "Zain",
    // System fallback
    default: "system",
  },

  fontSize: {
    display: 32, // Hero, app title
    xxxl: 28, // Large headings
    xxl: 24, // Main headings
    xl: 20, // Section headers
    lg: 18, // Card titles
    md: 16, // Body text, descriptions
    sm: 14, // Secondary text, captions
    xs: 12, // Meta info, small labels
    xxs: 11, // Very small labels
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeight: {
    display: 1.2,
    heading: 1.3,
    body: 1.5,
    bodyTight: 1.4,
    caption: 1.4,
    label: 1.2,
  },
} as const;

/**
 * 📏 Spacing System
 * Consistent spacing scale for all layouts
 */
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

/**
 * 🔲 Border Radius
 * Modern soft edges for UI elements
 */
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999, // Pill buttons, avatars
} as const;

/**
 * ✨ Shadows System
 * Soft UI depth for modern appearance
 */
export const Shadows = {
  // Subtle shadow for cards
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Medium shadow for interactive elements
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Strong shadow for modals
  strong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * ⏱️ Animation Timing
 * Standard durations for consistent feel
 */
export const Animation = {
  duration: {
    fast: 100,
    normal: 300,
    slow: 600,
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
} as const;

/**
 * 🌍 RTL Support
 * Full support for Arabic right-to-left layout
 */
export const isRTL = I18nManager.isRTL;

/**
 * 🎯 Component-Specific Tokens
 */
export const ComponentTokens = {
  button: {
    primary: {
      backgroundColor: Colors.primary,
      textColor: Colors.white,
    },
    accent: {
      backgroundColor: Colors.accent,
      textColor: Colors.white,
    },
    secondary: {
      backgroundColor: Colors.surface,
      textColor: Colors.primary,
      borderColor: Colors.border,
    },
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },

  input: {
    backgroundColor: Colors.inputBackground,
    textColor: Colors.text,
    placeholderColor: Colors.textLight,
    borderColor: Colors.border,
  },

  badge: {
    primary: {
      backgroundColor: Colors.primaryXLight,
      textColor: Colors.primary,
    },
    accent: {
      backgroundColor: Colors.accentLight,
      textColor: Colors.accent,
    },
    success: {
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      textColor: Colors.success,
    },
    error: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      textColor: Colors.error,
    },
  },
} as const;

// Backward compatibility with v1
export const FontSize = Typography.fontSize;
export const BorderRadiusCompat = BorderRadius;
