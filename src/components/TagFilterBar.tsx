import { BorderRadius, Colors, FontSize, Spacing } from "@/src/constants/theme";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

interface TagFilterBarProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  allLabel?: string;
}

export function TagFilterBar({
  tags,
  selectedTag,
  onSelectTag,
  allLabel = "All",
}: TagFilterBarProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All tab */}
      <Pressable
        style={[styles.tab, !selectedTag && styles.tabActive]}
        onPress={() => onSelectTag(null)}
      >
        <Text style={[styles.tabText, !selectedTag && styles.tabTextActive]}>
          {allLabel}
        </Text>
      </Pressable>

      {/* Tag tabs */}
      {tags.map((tag) => (
        <Pressable
          key={tag}
          style={[styles.tab, selectedTag === tag && styles.tabActive]}
          onPress={() => onSelectTag(tag)}
        >
          <Text
            style={[
              styles.tabText,
              selectedTag === tag && styles.tabTextActive,
            ]}
          >
            {tag}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryXLight,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  tabTextActive: {
    color: Colors.white,
  },
});
