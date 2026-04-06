import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Button from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "cube-outline",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? (
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
            style={styles.button}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl * 2,
  },
  card: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.xxxl + Spacing.lg,
    width: "100%",
    ...Shadows.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryXLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  button: {
    minWidth: 180,
  },
});
