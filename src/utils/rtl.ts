import { I18nManager, Platform } from "react-native";

/**
 * Cross-platform text alignment anchored to the reading direction.
 *
 * React Native resolves `textAlign` inconsistently in RTL:
 * - <Text> on Android: "left"/"right" are FLIPPED to follow the layout
 *   direction (a hardcoded "right" renders on the physical left).
 * - <Text> on iOS and <TextInput> on BOTH platforms: values are literal.
 *
 * Use `textAlignStart`/`textAlignEnd` on <Text>, and `inputTextAlign` on
 * <TextInput>, so text always begins at the reading start (right in Arabic,
 * left in English).
 *
 * These are module-level constants because `I18nManager.isRTL` is fixed for
 * the lifetime of the JS context — direction changes always reload the app.
 */
export const textAlignStart: "left" | "right" =
  I18nManager.isRTL && Platform.OS === "ios" ? "right" : "left";

export const textAlignEnd: "left" | "right" =
  I18nManager.isRTL && Platform.OS === "ios" ? "left" : "right";

/** Literal on both platforms — safe for <TextInput>. */
export const inputTextAlign: "left" | "right" = I18nManager.isRTL
  ? "right"
  : "left";

export const writingDirection: "rtl" | "ltr" = I18nManager.isRTL
  ? "rtl"
  : "ltr";
