import Button from "@/src/components/ui/Button";
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

interface NetworkErrorScreenProps {
  onRetry?: () => void;
}

export default function NetworkErrorScreen({
  onRetry,
}: NetworkErrorScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animated pulse for the WiFi icon
  const pulse = useSharedValue(1);
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    wave1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
      ),
      -1,
    );
    wave2.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 }),
        ),
        -1,
      ),
    );
    wave3.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 }),
        ),
        -1,
      ),
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const wave1Style = useAnimatedStyle(() => ({
    opacity: wave1.value * 0.3,
    transform: [{ scale: 1 + wave1.value * 0.5 }],
  }));

  const wave2Style = useAnimatedStyle(() => ({
    opacity: wave2.value * 0.2,
    transform: [{ scale: 1 + wave2.value * 0.8 }],
  }));

  const wave3Style = useAnimatedStyle(() => ({
    opacity: wave3.value * 0.1,
    transform: [{ scale: 1 + wave3.value * 1.1 }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Icon with animated waves */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <Animated.View style={[styles.wave, wave3Style]} />
        <Animated.View style={[styles.wave, wave2Style]} />
        <Animated.View style={[styles.wave, wave1Style]} />
        <Animated.View style={[styles.iconCircle, pulseStyle]}>
          <Ionicons name="wifi" size={48} color={Colors.white} />
          <View style={styles.crossLine} />
        </Animated.View>
      </Animated.View>

      {/* Text content */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.network.title")}</Text>
        <Text style={styles.subtitle}>{t("errors.network.subtitle")}</Text>
      </Animated.View>

      {/* Tips */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.tipsCard}
      >
        <Text style={styles.tipsTitle}>{t("errors.network.tipsTitle")}</Text>
        {["tip1", "tip2", "tip3"].map((tipKey, index) => (
          <View key={tipKey} style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>{t(`errors.network.${tipKey}`)}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Retry button */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(500)}
        style={styles.buttonArea}
      >
        {onRetry && (
          <Button
            title={t("common.retry")}
            onPress={onRetry}
            variant="primary"
            size="lg"
            icon={<Ionicons name="refresh" size={20} color={Colors.white} />}
            style={styles.retryButton}
          />
        )}
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
  bgCircle1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -40,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(30,58,138,0.04)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
  },
  wave: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  crossLine: {
    position: "absolute",
    width: 56,
    height: 3,
    backgroundColor: Colors.white,
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  content: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
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
  tipsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    marginBottom: Spacing.xxxl,
    ...Shadows.md,
  },
  tipsTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
    marginEnd: Spacing.md,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  buttonArea: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    width: "100%",
  },
});
