import Button from "@/src/components/ui/Button";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

interface SessionExpiredScreenProps {
  onLogin?: () => void;
}

export default function SessionExpiredScreen({
  onLogin,
}: SessionExpiredScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Lock animation
  const lockBounce = useSharedValue(0);
  const shieldPulse = useSharedValue(1);

  useEffect(() => {
    lockBounce.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      3,
      true,
    );

    shieldPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lockBounce.value}deg` }],
  }));

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shieldPulse.value }],
  }));

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      {/* Background decoration */}
      <View style={styles.bgShape1} />
      <View style={styles.bgShape2} />

      {/* Animated lock icon */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconArea}>
        <Animated.View style={[styles.shieldBg, shieldStyle]} />
        <Animated.View style={[styles.iconCircle, lockStyle]}>
          <Ionicons name="lock-closed" size={44} color={Colors.white} />
        </Animated.View>
      </Animated.View>

      {/* Text content */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.content}
      >
        <Text style={styles.title}>{t("errors.sessionExpired.title")}</Text>
        <Text style={styles.subtitle}>
          {t("errors.sessionExpired.subtitle")}
        </Text>
      </Animated.View>

      {/* Security info card */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.securityCard}
      >
        <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
        <Text style={styles.securityText}>
          {t("errors.sessionExpired.securityNote")}
        </Text>
      </Animated.View>

      {/* Login button */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(500)}
        style={styles.buttonArea}
      >
        <Button
          title={t("auth.login")}
          onPress={handleLogin}
          variant="primary"
          size="lg"
          icon={<Ionicons name="log-in" size={20} color={Colors.white} />}
          style={styles.loginButton}
        />
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
  bgShape1: {
    position: "absolute",
    top: -90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(30,58,138,0.05)",
  },
  bgShape2: {
    position: "absolute",
    bottom: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(30,64,175,0.04)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
  },
  shieldBg: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(30,58,138,0.08)",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
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
  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryXLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  securityText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  buttonArea: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  loginButton: {
    width: "100%",
  },
});
