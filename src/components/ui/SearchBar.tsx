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

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <Ionicons
        name="search-outline"
        size={18}
        color={focused ? Colors.primary : Colors.textLight}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
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
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearButton}>
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
  containerFocused: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    ...Shadows.sm,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
});
