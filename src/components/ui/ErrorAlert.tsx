import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

/**
 * Inline alert for API errors. Auto-dismisses after 5s when onClose is
 * provided; announced to screen readers via the alert role.
 */
export default function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  React.useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 5000); // Auto dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  if (!message) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.content}>
        <Ionicons
          name="alert-circle"
          size={20}
          color={Colors.error}
          style={styles.icon}
        />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorSurface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    overflow: "hidden",
    borderStartWidth: 4,
    borderStartColor: Colors.error,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  icon: {
    marginEnd: Spacing.md,
  },
  message: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
    color: Colors.error,
    lineHeight: FontSize.sm * LineHeight.base,
  },
});
