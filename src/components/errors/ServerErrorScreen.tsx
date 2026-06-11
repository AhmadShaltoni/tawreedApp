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
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ServerErrorScreenProps {
  onRetry?: () => void;
  statusCode?: number;
}

export default function ServerErrorScreen({
  onRetry,
  statusCode,
}: ServerErrorScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Gear rotation animation
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgPattern1} />
      <View style={styles.bgPattern2} />

      {/* Animated icon */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <Animated.View style={[styles.iconWrapper, bounceStyle]}>
          <View style={styles.iconCircle}>
            <Animated.View style={gearStyle}>
              <Ionicons name="cog" size={32} color={Colors.white} />
            </Animated.View>
            <View style={styles.wrenchOverlay}>
              <Ionicons name="construct" size={22} color={Colors.white} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Status code badge */}
      {statusCode && (
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.statusBadge}
        >
          <Text style={styles.statusCode}>{statusCode}</Text>
        </Animated.View>
      )}

      {/* Text content */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.server.title")}</Text>
        <Text style={styles.subtitle}>{t("errors.server.subtitle")}</Text>
      </Animated.View>

      {/* Info card */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.infoCard}
      >
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
          </View>
          <Text style={styles.infoText}>{t("errors.server.info")}</Text>
        </View>
      </Animated.View>

      {/* Retry */}
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
  bgPattern1: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(249,115,22,0.06)",
  },
  bgPattern2: {
    position: "absolute",
    bottom: -60,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(30,58,138,0.04)",
  },
  iconArea: {
    marginBottom: Spacing.xxl,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  wrenchOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: Colors.secondaryDark,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    backgroundColor: "rgba(249,115,22,0.1)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statusCode: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.secondary,
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
  infoCard: {
    backgroundColor: "rgba(14,165,233,0.08)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxxl,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.15)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginEnd: Spacing.md,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.info,
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
