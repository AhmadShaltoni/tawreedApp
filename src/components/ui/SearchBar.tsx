import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  I18nManager,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Search products...",
  ...props
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar" || I18nManager.isRTL;

  return (
    <View
      style={[
        styles.container,
        focused && styles.containerFocused,
        isRTL && styles.containerRTL,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={focused ? Colors.primary : Colors.textLight}
        style={[styles.icon, isRTL && styles.iconRTL]}
      />
      <TextInput
        style={[styles.input, isRTL && styles.inputRTL]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {value ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          style={[styles.clearButton, isRTL && styles.clearButtonRTL]}
        >
          <Ionicons name="close-circle" size={18} color={Colors.textLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 46,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  containerFocused: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  iconRTL: {
    marginRight: 0,
    marginLeft: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  inputRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
  clearButtonRTL: {
    marginLeft: 0,
    marginRight: Spacing.sm,
  },
});
