import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  isPassword,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = useSharedValue<string>(Colors.border);

  const animBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(Colors.primary, { duration: 200 });
  };
  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? Colors.error : Colors.border, {
      duration: 200,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
          animBorder,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textLight}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
        )}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#fef2f2",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  eyeIcon: {
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
