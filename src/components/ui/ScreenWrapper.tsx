import { Colors, Spacing } from "@/src/constants/theme";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
    type ViewStyle,
} from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}

export default function ScreenWrapper({
  children,
  style,
  scroll = true,
}: ScreenWrapperProps) {
  const content = <View style={[styles.container, style]}>{children}</View>;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
