import {
  AuthButton,
  AuthInput,
  AuthLayout,
  PhonePrefix,
} from "@/src/components/auth";
import ErrorAlert from "@/src/components/ui/ErrorAlert";
import { Colors, Fonts, FontSize, Spacing } from "@/src/constants/theme";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  clearError,
  continueAsGuest,
  login,
} from "@/src/store/slices/auth.slice";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface FormErrors {
  phone?: string;
  password?: string;
}

const PHONE_REGEX = /^07\d{8}$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handlePhoneChange = (text: string) => {
    // Phone is always western digits, max 10 (07xxxxxxxx).
    const digits = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(digits);
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const validateField = useCallback(
    (field: keyof FormErrors) => {
      setFormErrors((prev) => {
        const next = { ...prev };
        if (field === "phone") {
          const trimmed = phone.trim();
          if (!trimmed) next.phone = t("auth.phoneRequired");
          else if (!PHONE_REGEX.test(trimmed))
            next.phone = t("auth.phoneInvalid");
          else next.phone = undefined;
        }
        if (field === "password") {
          if (!password) next.password = t("auth.passwordRequired");
          else if (password.length < 6)
            next.password = t("auth.passwordMinLength");
          else next.password = undefined;
        }
        return next;
      });
    },
    [phone, password, t],
  );

  const validate = useCallback((): FormErrors => {
    const errors: FormErrors = {};
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) errors.phone = t("auth.phoneRequired");
    else if (!PHONE_REGEX.test(trimmedPhone))
      errors.phone = t("auth.phoneInvalid");

    if (!password) errors.password = t("auth.passwordRequired");
    else if (password.length < 6) errors.password = t("auth.passwordMinLength");

    setFormErrors(errors);
    return errors;
  }, [phone, password, t]);

  const handleLogin = useCallback(async () => {
    if (loading) return;

    const errors = validate();
    if (errors.phone) {
      phoneRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }

    dispatch(clearError());
    const result = await dispatch(login({ phone: phone.trim(), password }));

    if (login.fulfilled.match(result)) {
      // Register device token after successful login
      try {
        await notificationService.registerTokenAfterLogin();
      } catch (err) {
        console.error("[LoginScreen] Failed to register device token:", err);
        // Don't block login if token registration fails
      }
      router.replace("/(tabs)");
    }
    // On rejection the localized message lands in state.error and renders
    // inline above the button — no blocking Alert.
  }, [dispatch, phone, password, validate, router, loading]);

  const handleGuestMode = useCallback(() => {
    dispatch(continueAsGuest());
    router.replace("/(tabs)");
  }, [dispatch, router]);

  return (
    <AuthLayout
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSubtitle")}
      showLogo
      centered
      footer={
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t("auth.noAccount")} </Text>
          <Pressable
            onPress={() => router.push("/(auth)/phone")}
            hitSlop={12}
            accessibilityRole="link"
            accessibilityLabel={t("auth.register")}
          >
            <Text style={styles.registerLink}>{t("auth.register")}</Text>
          </Pressable>
        </View>
      }
    >
      <AuthInput
        ref={phoneRef}
        label={t("auth.phone")}
        placeholder="07XXXXXXXX"
        value={phone}
        onChangeText={handlePhoneChange}
        onBlur={() => validateField("phone")}
        error={formErrors.phone}
        prefix={<PhonePrefix />}
        ltrField
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={10}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthInput
        ref={passwordRef}
        label={t("auth.password")}
        placeholder="••••••••"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (formErrors.password)
            setFormErrors((prev) => ({ ...prev, password: undefined }));
        }}
        onBlur={() => validateField("password")}
        error={formErrors.password}
        isPassword
        icon="lock-closed-outline"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      {error && (
        <ErrorAlert message={error} onClose={() => dispatch(clearError())} />
      )}

      <AuthButton
        title={t("auth.signIn")}
        onPress={handleLogin}
        loading={loading}
        style={styles.submitButton}
      />

      <AuthButton
        title={t("auth.continueAsGuest")}
        onPress={handleGuestMode}
        variant="ghost"
        accessibilityHint={t("auth.guestPromptMessage")}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submitButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    gap: Spacing.xs,
  },
  registerText: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontFamily: Fonts.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
