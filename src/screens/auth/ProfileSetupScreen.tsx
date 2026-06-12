import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { clearError, register } from "@/src/store/slices/auth.slice";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    I18nManager,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FormErrors {
  username?: string;
  storeName?: string;
  password?: string;
  confirmPassword?: string;
}

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone: string }>();
  const { loading, error, verificationToken } = useAppSelector(
    (state) => state.auth,
  );

  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const storeNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const buttonScale = useSharedValue(1);
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!username.trim()) {
      errors.username = t("auth.usernameRequired");
    }
    if (!storeName.trim()) {
      errors.storeName = t("auth.storeNameRequired");
    }
    if (!password) {
      errors.password = t("auth.passwordRequired");
    } else if (password.length < 8) {
      errors.password = t("auth.passwordMinLength");
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = t("auth.passwordsMismatch");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, storeName, password, confirmPassword, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    dispatch(clearError());
    const result = await dispatch(
      register({
        username: username.trim(),
        phone: params.phone!,
        storeName: storeName.trim(),
        password,
        confirmPassword,
        verificationToken: verificationToken || undefined,
      }),
    );

    if (register.fulfilled.match(result)) {
      try {
        await notificationService.registerTokenAfterLogin();
      } catch (err) {
        console.error("[ProfileSetup] Failed to register device token:", err);
      }
      const user = result.payload.user;
      if (!user.cityId && user.latitude == null) {
        router.replace("/location");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [
    dispatch,
    username,
    storeName,
    password,
    confirmPassword,
    params.phone,
    verificationToken,
    validate,
    router,
  ]);

  const isValid =
    username.trim().length > 0 &&
    storeName.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

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
              paddingTop: insets.top + Spacing.xxl,
              paddingBottom: Math.max(insets.bottom, Spacing.xxl),
            },
          ]}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-circle-outline"
                size={56}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.title}>{t("auth.profileSetupTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.profileSetupSubtitle")}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            style={styles.formSection}
          >
            {/* Username */}
            <Text style={styles.inputLabel}>{t("auth.username")}</Text>
            <View
              style={[
                styles.inputContainer,
                formErrors.username ? styles.inputError : undefined,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={t("auth.profileNamePlaceholder")}
                placeholderTextColor={Colors.textLight}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  clearFieldError("username");
                }}
                autoCapitalize="words"
                autoComplete="off"
                textContentType="none"
                returnKeyType="next"
                onSubmitEditing={() => storeNameRef.current?.focus()}
                autoFocus
              />
            </View>
            {formErrors.username ? (
              <Text style={styles.errorText}>{formErrors.username}</Text>
            ) : null}

            {/* Store Name */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
              {t("auth.storeName")}
            </Text>
            <View
              style={[
                styles.inputContainer,
                formErrors.storeName ? styles.inputError : undefined,
              ]}
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                ref={storeNameRef}
                style={styles.input}
                placeholder={t("auth.profileStorePlaceholder")}
                placeholderTextColor={Colors.textLight}
                value={storeName}
                onChangeText={(text) => {
                  setStoreName(text);
                  clearFieldError("storeName");
                }}
                autoCapitalize="words"
                autoComplete="off"
                textContentType="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {formErrors.storeName ? (
              <Text style={styles.errorText}>{formErrors.storeName}</Text>
            ) : null}

            {/* Password */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
              {t("auth.password")}
            </Text>
            <View
              style={[
                styles.inputContainer,
                formErrors.password ? styles.inputError : undefined,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearFieldError("password");
                }}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
            {formErrors.password ? (
              <Text style={styles.errorText}>{formErrors.password}</Text>
            ) : null}

            {/* Confirm Password */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
              {t("auth.confirmPassword")}
            </Text>
            <View
              style={[
                styles.inputContainer,
                formErrors.confirmPassword ? styles.inputError : undefined,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                ref={confirmPasswordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearFieldError("confirmPassword");
                }}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
            {formErrors.confirmPassword ? (
              <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
            ) : null}

            {error && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text
                  style={[
                    styles.errorText,
                    { marginTop: Spacing.md, textAlign: "center" },
                  ]}
                >
                  {error}
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Bottom Actions */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.bottomSection}
          >
            <AnimatedPressable
              onPress={handleSubmit}
              onPressIn={() => {
                buttonScale.value = withSpring(0.97, {
                  damping: 15,
                  stiffness: 400,
                });
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 400,
                });
              }}
              disabled={loading || !isValid}
              style={[
                styles.ctaButton,
                (!isValid || loading) && styles.ctaButtonDisabled,
                buttonAnimStyle,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {t("auth.profileStartShopping")}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.white}
                  />
                </>
              )}
            </AnimatedPressable>
          </Animated.View>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  formSection: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 54,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: "#fef2f2",
  },
  inputIcon: {
    marginLeft: Spacing.lg,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    textAlign: I18nManager.isRTL ? "right" : "left",
    writingDirection: I18nManager.isRTL ? "rtl" : "ltr",
  },
  eyeIcon: {
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  bottomSection: {
    paddingBottom: Spacing.md,
    marginTop: Spacing.xxl,
  },
  ctaButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
});
