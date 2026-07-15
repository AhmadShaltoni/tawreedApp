import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Motion,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  /** Shows the Tawreed logo + tagline above the title (login screen). */
  showLogo?: boolean;
  /** Center the title + subtitle without showing the logo (register screen). */
  centerHeader?: boolean;
  /** Renders a back button above the header when provided. */
  onBack?: () => void;
  /** Vertically centers the content block (login, OTP). */
  centered?: boolean;
  children: ReactNode;
  /** Pinned under the form: CTA + secondary links. */
  footer?: ReactNode;
}

/**
 * Shared scaffold for all auth screens: keyboard avoidance, safe areas,
 * logo → heading → form → footer hierarchy. Direction (RTL/LTR) is inherited
 * from the root DirectionProvider; the back chevron flips with the language.
 */
export default function AuthLayout({
  title,
  subtitle,
  showLogo = false,
  centerHeader = false,
  onBack,
  centered = false,
  children,
  footer,
}: AuthLayoutProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const rtl = i18n.language === "ar";
  const headerCentered = showLogo || centerHeader;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top + Spacing.md,
              paddingBottom: Math.max(insets.bottom, Spacing.xxl),
            },
          ]}
        >
          {onBack && (
            <Animated.View entering={FadeIn.duration(Motion.base)}>
              <Pressable
                style={styles.backButton}
                onPress={onBack}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t("common.back")}
              >
                <Ionicons
                  name={rtl ? "arrow-forward" : "arrow-back"}
                  size={24}
                  color={Colors.text}
                />
              </Pressable>
            </Animated.View>
          )}

          <View style={[styles.body, centered && styles.bodyCentered]}>
            <Animated.View
              entering={FadeInDown.duration(Motion.slow)}
              style={[styles.header, headerCentered && styles.headerCentered]}
            >
              {showLogo && (
                <>
                  <Image
                    source={require("../../../assets/images/TawreedLoginLogo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityRole="image"
                    accessibilityLabel={t("common.appName")}
                  />
                  <Text style={styles.tagline}>{t("auth.otpTagline")}</Text>
                </>
              )}
              <Text
                style={[styles.title, headerCentered && styles.titleCentered]}
                accessibilityRole="header"
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    headerCentered && styles.subtitleCentered,
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(Motion.slow).delay(100)}
              style={styles.form}
            >
              {children}
            </Animated.View>
          </View>

          {footer ? (
            <Animated.View
              entering={FadeInDown.duration(Motion.slow).delay(150)}
              style={styles.footer}
            >
              {footer}
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  body: {
    flex: 1,
  },
  bodyCentered: {
    justifyContent: "center",
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  headerCentered: {
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    textAlign: "center",
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSize.xxl,
    color: Colors.text,
    lineHeight: FontSize.xxl * LineHeight.tight,
    marginBottom: Spacing.xs,
  },
  titleCentered: {
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * LineHeight.base,
  },
  subtitleCentered: {
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  footer: {
    marginTop: Spacing.xxl,
  },
});
