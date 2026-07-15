import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  Shadows,
} from "@/src/constants/theme";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  /** Shows a spinner instead of silently disabling the button. */
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
  accessibilityHint?: string;
}

/**
 * Primary CTA for auth screens: 56pt tall, spinner while loading, subtle
 * press scale. While loading it stays visually prominent (not grayed out)
 * and simply ignores further presses.
 */
export default function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  accessibilityHint,
}: AuthButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      disabled={disabled}
      style={[
        styles.button,
        variant === "primary" ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        animStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.white : Colors.primary}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary" ? styles.textPrimary : styles.textGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Fonts.bold,
    fontSize: FontSize.lg,
  },
  textPrimary: {
    color: Colors.white,
  },
  textGhost: {
    color: Colors.textSecondary,
  },
});
