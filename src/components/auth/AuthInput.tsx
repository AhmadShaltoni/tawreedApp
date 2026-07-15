import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Motion,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { textAlignStart, writingDirection } from "@/src/utils/rtl";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Leading icon inside the field. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Fixed leading element (e.g. country code) rendered before the input. */
  prefix?: ReactNode;
  /**
   * Lay the input row out left-to-right even in Arabic. Used for the phone
   * field so the flag + country code sit on the physical left and the LTR
   * number reads naturally after them.
   */
  ltrField?: boolean;
  isPassword?: boolean;
  disabled?: boolean;
}

/**
 * Shared auth text field with distinct default / focus / filled / error /
 * disabled states, an accessible show-hide toggle for passwords, and a
 * 200ms border transition. Text alignment follows the active language.
 */
const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { label, error, icon, prefix, ltrField, isPassword, disabled, style, ...props },
  ref,
) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === "ar";
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const filled = !!props.value;
  const borderColor = useSharedValue<string>(Colors.border);

  useEffect(() => {
    const target = error
      ? Colors.error
      : focused
        ? Colors.primary
        : filled
          ? Colors.borderFilled
          : Colors.border;
    borderColor.value = withTiming(target, { duration: Motion.base });
  }, [error, focused, filled, borderColor]);

  const animBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.label, focused && !error && styles.labelFocused]}>
        {label}
      </Text>
      <Animated.View
        style={[
          styles.field,
          ltrField && styles.fieldLTR,
          focused && styles.fieldFocused,
          error ? styles.fieldError : undefined,
          disabled && styles.fieldDisabled,
          animBorder,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? Colors.primary : Colors.textSecondary}
            style={styles.icon}
          />
        )}
        {prefix}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              textAlign: ltrField ? "left" : rtl ? "right" : "left",
              writingDirection: ltrField ? "ltr" : rtl ? "rtl" : "ltr",
            },
            style,
          ]}
          placeholderTextColor={Colors.textLight}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={isPassword ? "none" : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
          editable={!disabled && props.editable !== false}
          accessibilityLabel={label}
          accessibilityState={{ disabled: !!disabled }}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? t("auth.hidePassword") : t("auth.showPassword")
            }
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Animated.View
          entering={FadeIn.duration(Motion.base)}
          style={styles.errorRow}
        >
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text
            style={styles.errorText}
            accessibilityLiveRegion="polite"
            numberOfLines={2}
          >
            {error}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
});

export default AuthInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    // Anchor the label to the reading start (right in Arabic, left in English).
    textAlign: textAlignStart,
    writingDirection,
  },
  labelFocused: {
    color: Colors.primary,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  fieldLTR: {
    direction: "ltr",
  },
  fieldFocused: {
    ...Shadows.sm,
  },
  fieldError: {
    backgroundColor: Colors.errorSurface,
  },
  fieldDisabled: {
    backgroundColor: Colors.inputDisabled,
    opacity: 0.6,
  },
  icon: {
    marginStart: Spacing.lg,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: FontSize.xs,
    color: Colors.error,
    lineHeight: FontSize.xs * LineHeight.base,
  },
});
