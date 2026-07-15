import {
  AuthButton,
  AuthInput,
  AuthLayout,
  PasswordStrength,
  PhonePrefix,
} from "@/src/components/auth";
import ErrorAlert from "@/src/components/ui/ErrorAlert";
import { Colors, Fonts, FontSize, Spacing } from "@/src/constants/theme";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
// OTP disabled temporarily - will re-enable later
// import { clearError, sendOtp } from "@/src/store/slices/auth.slice";
import { clearError, register } from "@/src/store/slices/auth.slice";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface FormErrors {
  username?: string;
  storeName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const PHONE_REGEX = /^07\d{8}$/;

export default function PhoneScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const usernameRef = useRef<TextInput>(null);
  const storeNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) dispatch(clearError());
  };

  // Only allow English digits for phone
  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhone(digits);
    clearFieldError("phone");
  };

  const fieldError = useCallback(
    (field: keyof FormErrors): string | undefined => {
      switch (field) {
        case "username":
          return username.trim() ? undefined : t("auth.usernameRequired");
        case "storeName":
          return storeName.trim() ? undefined : t("auth.storeNameRequired");
        case "phone": {
          const trimmed = phone.trim();
          if (!trimmed) return t("auth.phoneRequired");
          if (!PHONE_REGEX.test(trimmed)) return t("auth.phoneInvalid");
          return undefined;
        }
        case "password":
          if (!password) return t("auth.passwordRequired");
          if (password.length < 8) return t("auth.passwordMinLength");
          return undefined;
        case "confirmPassword":
          if (confirmPassword && password !== confirmPassword)
            return t("auth.passwordsMismatch");
          return undefined;
      }
    },
    [username, storeName, phone, password, confirmPassword, t],
  );

  const validateField = useCallback(
    (field: keyof FormErrors) => {
      setFormErrors((prev) => ({ ...prev, [field]: fieldError(field) }));
    },
    [fieldError],
  );

  const validate = useCallback((): FormErrors => {
    const errors: FormErrors = {
      username: fieldError("username"),
      storeName: fieldError("storeName"),
      phone: fieldError("phone"),
      password: fieldError("password"),
      confirmPassword:
        password !== confirmPassword
          ? t("auth.passwordsMismatch")
          : undefined,
    };
    setFormErrors(errors);
    return errors;
  }, [fieldError, password, confirmPassword, t]);

  // OTP disabled temporarily - register directly without OTP verification.
  // The previous sendOtp → /(auth)/otp flow is preserved in OTPScreen and can
  // be restored once the WhatsApp/SMS provider is configured.

  const handleContinue = useCallback(async () => {
    if (loading) return;

    const errors = validate();
    const refs: Record<keyof FormErrors, React.RefObject<TextInput | null>> = {
      username: usernameRef,
      storeName: storeNameRef,
      phone: phoneRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
    };
    const firstError = (
      Object.keys(refs) as (keyof FormErrors)[]
    ).find((key) => errors[key]);
    if (firstError) {
      refs[firstError].current?.focus();
      return;
    }

    dispatch(clearError());
    const result = await dispatch(
      register({
        username: username.trim(),
        phone: phone.trim(),
        storeName: storeName.trim(),
        password,
        confirmPassword,
      }),
    );

    if (register.fulfilled.match(result)) {
      // Register device token after successful registration
      try {
        await notificationService.registerTokenAfterLogin();
      } catch (err) {
        console.error("[PhoneScreen] Failed to register device token:", err);
      }
      const user = result.payload.user;
      if (!user.cityId && user.latitude == null) {
        router.replace("/location?flow=onboarding");
      } else {
        router.replace("/(tabs)");
      }
    }
    // On rejection the localized message renders inline via ErrorAlert.
  }, [
    dispatch,
    phone,
    username,
    storeName,
    password,
    confirmPassword,
    validate,
    router,
    loading,
  ]);

  return (
    <AuthLayout
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      centerHeader
      onBack={() => router.back()}
      footer={
        <>
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}
          <AuthButton
            title={t("auth.createAccount")}
            onPress={handleContinue}
            loading={loading}
          />
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t("auth.haveAccount")} </Text>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="link"
              accessibilityLabel={t("auth.signIn")}
            >
              <Text style={styles.footerLink}>{t("auth.signIn")}</Text>
            </Pressable>
          </View>
        </>
      }
    >
      <AuthInput
        ref={usernameRef}
        label={t("auth.username")}
        placeholder={t("auth.profileNamePlaceholder")}
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          clearFieldError("username");
        }}
        onBlur={() => validateField("username")}
        error={formErrors.username}
        icon="person-outline"
        autoCapitalize="words"
        autoComplete="off"
        textContentType="none"
        returnKeyType="next"
        onSubmitEditing={() => storeNameRef.current?.focus()}
      />

      <AuthInput
        ref={storeNameRef}
        label={t("auth.storeName")}
        placeholder={t("auth.profileStorePlaceholder")}
        value={storeName}
        onChangeText={(text) => {
          setStoreName(text);
          clearFieldError("storeName");
        }}
        onBlur={() => validateField("storeName")}
        error={formErrors.storeName}
        icon="storefront-outline"
        autoCapitalize="words"
        autoComplete="off"
        textContentType="none"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />

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
          clearFieldError("password");
        }}
        onBlur={() => validateField("password")}
        error={formErrors.password}
        isPassword
        icon="lock-closed-outline"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      <PasswordStrength password={password} />

      <AuthInput
        ref={confirmPasswordRef}
        label={t("auth.confirmPassword")}
        placeholder="••••••••"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          clearFieldError("confirmPassword");
        }}
        onBlur={() => validateField("confirmPassword")}
        error={formErrors.confirmPassword}
        isPassword
        icon="lock-closed-outline"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleContinue}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: Fonts.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
