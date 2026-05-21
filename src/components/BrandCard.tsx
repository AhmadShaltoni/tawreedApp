import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import type { Brand } from "@/src/types";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SkeletonLoader } from "./ui/SkeletonLoader";

interface BrandCardProps {
  brand: Brand;
  onPress: (brand: Brand) => void;
}

export function BrandCard({ brand, onPress }: BrandCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(brand)}
      accessibilityLabel={`Brand: ${brand.name}`}
      accessibilityRole="button"
    >
      <View style={styles.logoContainer}>
        {brand.logo ? (
          <Image
            source={{ uri: brand.logo }}
            style={styles.logo}
            contentFit="contain"
            transition={200}
            recyclingKey={brand.id}
          />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>
              {brand.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {brand.name}
      </Text>
      {brand.productCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{brand.productCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function BrandCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonLoader
        width={80}
        height={80}
        borderRadius={BorderRadius.full}
        style={styles.logoContainer}
      />
      <SkeletonLoader
        width={70}
        height={14}
        borderRadius={BorderRadius.sm}
        style={{ marginTop: Spacing.sm }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.md,
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  logo: {
    width: "85%",
    height: "85%",
  },
  logoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryXLight,
  },
  logoPlaceholderText: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
});
