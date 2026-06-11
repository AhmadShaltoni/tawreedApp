import Button from "@/src/components/ui/Button";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { openWhatsApp } from "@/src/utils/whatsapp";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

const WHATSAPP_GREEN = "#25D366";

interface GenericErrorScreenProps {
  onRetry?: () => void;
  errorMessage?: string;
  errorCode?: string;
}

export default function GenericErrorScreen({
  onRetry,
  errorMessage,
  errorCode,
}: GenericErrorScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Sad face wobble
  const wobble = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    wobble.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wobble.value}deg` }, { translateY: floatY.value }],
  }));

  const handleWhatsApp = () => {
    const message = errorCode
      ? t("errors.generic.whatsappMessage", { code: errorCode })
      : t("errors.generic.whatsappMessageDefault");
    openWhatsApp(message);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Animated icon */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <View style={styles.outerRing} />
        <Animated.View style={[styles.iconCircle, wobbleStyle]}>
          <Ionicons name="warning" size={44} color={Colors.white} />
        </Animated.View>
      </Animated.View>

      {/* Text content */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.generic.title")}</Text>
        <Text style={styles.subtitle}>{t("errors.generic.subtitle")}</Text>
      </Animated.View>

      {/* Error details (if available) */}
      {(errorMessage || errorCode) && (
        <Animated.View
          entering={FadeInDown.delay(350).duration(500)}
          style={styles.errorDetailCard}
        >
          <View style={styles.errorDetailHeader}>
            <Ionicons name="bug" size={16} color={Colors.error} />
            <Text style={styles.errorDetailTitle}>
              {t("errors.generic.errorDetails")}
            </Text>
          </View>
          {errorCode && (
            <Text style={styles.errorCode}>
              {t("errors.generic.errorCodeLabel")}: {errorCode}
            </Text>
          )}
          {errorMessage && (
            <Text style={styles.errorMsg} numberOfLines={3}>
              {errorMessage}
            </Text>
          )}
        </Animated.View>
      )}

      {/* Action buttons */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        style={styles.buttonArea}
      >
        {onRetry && (
          <Button
            title={t("errors.generic.retryLater")}
            onPress={onRetry}
            variant="primary"
            size="lg"
            icon={<Ionicons name="refresh" size={20} color={Colors.white} />}
            style={styles.retryButton}
          />
        )}

        {/* WhatsApp contact button */}
        <Pressable
          onPress={handleWhatsApp}
          style={({ pressed }) => [
            styles.whatsappButton,
            pressed && styles.whatsappPressed,
          ]}
        >
          <View style={styles.whatsappContent}>
            <View style={styles.whatsappIconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color={Colors.white} />
            </View>
            <View style={styles.whatsappTextArea}>
              <Text style={styles.whatsappTitle}>
                {t("errors.generic.contactUs")}
              </Text>
              <Text style={styles.whatsappSubtitle}>
                {t("errors.generic.contactUsSubtitle")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={WHATSAPP_GREEN} />
          </View>
        </Pressable>
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
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(239,68,68,0.05)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(30,58,138,0.04)",
  },
  bgCircle3: {
    position: "absolute",
    top: "45%",
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(37,211,102,0.06)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
  },
  outerRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: "rgba(239,68,68,0.15)",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6366f1",
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
  errorDetailCard: {
    backgroundColor: "rgba(239,68,68,0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.1)",
  },
  errorDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorDetailTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.error,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorCode: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: "monospace",
    marginBottom: Spacing.xs,
  },
  errorMsg: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  buttonArea: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  retryButton: {
    width: "100%",
  },
  whatsappButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: WHATSAPP_GREEN,
    ...Shadows.sm,
  },
  whatsappPressed: {
    backgroundColor: "rgba(37,211,102,0.05)",
    transform: [{ scale: 0.98 }],
  },
  whatsappContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHATSAPP_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: Spacing.md,
  },
  whatsappTextArea: {
    flex: 1,
  },
  whatsappTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  whatsappSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
