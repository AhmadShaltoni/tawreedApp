import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
    marginTop: Spacing.xxl,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  accent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
