import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Wrench swing animation
  const swing = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    swing.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Loading dots animation
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
      true,
    );
    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        true,
      ),
    );
    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const swingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }],
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />
      <View style={styles.bgBlob3} />

      {/* Animated construction icon */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <View style={styles.outerGlow} />
        <Animated.View style={[styles.iconCircle, swingStyle]}>
          <Ionicons name="hammer" size={44} color={Colors.white} />
        </Animated.View>
      </Animated.View>

      {/* Text */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.maintenance.title")}</Text>
        <Text style={styles.subtitle}>{t("errors.maintenance.subtitle")}</Text>
      </Animated.View>

      {/* Loading dots */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.dotsRow}
      >
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </Animated.View>

      {/* Progress card */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        style={styles.progressCard}
      >
        <View style={styles.progressRow}>
          <Ionicons name="time-outline" size={20} color={Colors.secondary} />
          <Text style={styles.progressText}>
            {t("errors.maintenance.estimatedTime")}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <Animated.View style={styles.progressBarFill} />
        </View>
      </Animated.View>

      {/* Bottom note */}
      <Animated.View
        entering={FadeInDown.delay(700).duration(500)}
        style={styles.noteCard}
      >
        <Ionicons name="sparkles" size={18} color={Colors.primary} />
        <Text style={styles.noteText}>{t("errors.maintenance.note")}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  bgBlob1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(249,115,22,0.05)",
  },
  bgBlob2: {
    position: "absolute",
    bottom: -60,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(30,58,138,0.04)",
  },
  bgBlob3: {
    position: "absolute",
    top: "40%",
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245,158,11,0.06)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
  },
  outerGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(249,115,22,0.1)",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8b5cf6",
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "60%",
    backgroundColor: "#8b5cf6",
    borderRadius: 3,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
  },
  noteText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    flex: 1,
    lineHeight: 20,
  },
});
