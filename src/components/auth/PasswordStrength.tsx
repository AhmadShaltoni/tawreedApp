import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  Motion,
  Spacing,
} from "@/src/constants/theme";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type StrengthLevel = 0 | 1 | 2 | 3;

/** 0 = empty, 1 = weak, 2 = medium, 3 = strong. */
export function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0;
  const classes =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^a-zA-Z0-9]/.test(password));
  if (password.length >= 10 && classes >= 3) return 3;
  if (password.length >= 8 && classes >= 2) return 2;
  return 1;
}

const LEVEL_COLORS: Record<Exclude<StrengthLevel, 0>, string> = {
  1: Colors.error,
  2: Colors.warning,
  3: Colors.success,
};

const LEVEL_KEYS: Record<Exclude<StrengthLevel, 0>, string> = {
  1: "auth.passwordWeak",
  2: "auth.passwordMedium",
  3: "auth.passwordStrong",
};

function Segment({ active, color }: { active: boolean; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: Motion.base });
  }, [active, progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <View style={styles.segmentTrack}>
      <Animated.View
        style={[styles.segmentFill, { backgroundColor: color }, animStyle]}
      />
    </View>
  );
}

/**
 * Three-segment password strength meter shown on sign-up. Hidden while the
 * field is empty; announces the current level to screen readers.
 */
export default function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const level = getPasswordStrength(password);

  if (level === 0) return null;

  const color = LEVEL_COLORS[level];
  const label = t(LEVEL_KEYS[level]);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${t("auth.passwordStrength")}: ${label}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.segments}>
        {([1, 2, 3] as const).map((s) => (
          <Segment key={s} active={level >= s} color={color} />
        ))}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  segments: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  segmentFill: {
    flex: 1,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.xs,
  },
});
