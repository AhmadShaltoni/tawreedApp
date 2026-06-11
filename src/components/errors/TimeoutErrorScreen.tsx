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

interface TimeoutErrorScreenProps {
  onRetry?: () => void;
}

export default function TimeoutErrorScreen({
  onRetry,
}: TimeoutErrorScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Hourglass flip animation
  const flip = useSharedValue(0);
  const sandDrop = useSharedValue(0);

  useEffect(() => {
    flip.value = withRepeat(
      withSequence(
        withTiming(180, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(180, { duration: 1000 }),
        withTiming(360, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(360, { duration: 1000 }),
      ),
      -1,
    );

    sandDrop.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
    );
  }, []);

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${flip.value}deg` }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      {/* Animated hourglass */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <View style={styles.outerRing} />
        <Animated.View style={[styles.iconCircle, flipStyle]}>
          <Ionicons name="hourglass" size={44} color={Colors.white} />
        </Animated.View>
      </Animated.View>

      {/* Text content */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.timeout.title")}</Text>
        <Text style={styles.subtitle}>{t("errors.timeout.subtitle")}</Text>
      </Animated.View>

      {/* Suggestions */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.suggestionsCard}
      >
        <View style={styles.suggestionItem}>
          <View
            style={[
              styles.suggestionIcon,
              { backgroundColor: "rgba(249,115,22,0.1)" },
            ]}
          >
            <Ionicons name="cellular" size={18} color={Colors.secondary} />
          </View>
          <Text style={styles.suggestionText}>
            {t("errors.timeout.suggestion1")}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.suggestionItem}>
          <View
            style={[
              styles.suggestionIcon,
              { backgroundColor: "rgba(14,165,233,0.1)" },
            ]}
          >
            <Ionicons name="time" size={18} color={Colors.info} />
          </View>
          <Text style={styles.suggestionText}>
            {t("errors.timeout.suggestion2")}
          </Text>
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
  bgDecor1: {
    position: "absolute",
    top: -60,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(245,158,11,0.05)",
  },
  bgDecor2: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(30,58,138,0.04)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
  },
  outerRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "rgba(245,158,11,0.2)",
    borderStyle: "dashed",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.warning,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
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
  suggestionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    marginBottom: Spacing.xxxl,
    ...Shadows.md,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: Spacing.md,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  buttonArea: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    width: "100%",
  },
});
