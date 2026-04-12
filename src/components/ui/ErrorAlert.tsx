import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

/**
 * Beautiful error alert component for displaying API errors
 * Shows error icon, message, and automatic dismiss
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
    <View style={styles.container}>
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
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginBottom: Spacing.md,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  icon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: "500",
    lineHeight: 20,
  },
});
