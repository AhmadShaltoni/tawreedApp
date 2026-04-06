import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
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

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  const handlePress = () => {
    if (!isDisabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        isDisabled && styles.disabled,
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? Colors.primary
              : Colors.white
          }
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              textStyles[size],
              (variant === "outline" || variant === "ghost") &&
                styles.outlineText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 38,
  },
  md: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xxl,
    minHeight: 50,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    minHeight: 56,
  },
});

const textStyles = StyleSheet.create({
  sm: { fontSize: FontSize.sm },
  md: { fontSize: FontSize.md },
  lg: { fontSize: FontSize.lg },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: Colors.primary, ...Shadows.md },
  secondary: { backgroundColor: Colors.secondary, ...Shadows.md },
  accent: { backgroundColor: Colors.secondary, ...Shadows.md },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: { backgroundColor: "transparent" },
});

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "700",
    color: Colors.white,
  },
  outlineText: {
    color: Colors.primary,
  },
});
