import {
  AuthButton,
  AuthInput,
  AuthLayout,
  PasswordStrength,
} from "@/src/components/auth";
import ErrorAlert from "@/src/components/ui/ErrorAlert";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { clearError, register } from "@/src/store/slices/auth.slice";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "react-native";

/**
 * Final step of the OTP registration flow (phone → otp → profile-setup).
 * Currently OUT of the active sign-up journey — PhoneScreen registers
 * directly while OTP delivery (WhatsApp/SMS) is unconfigured. Kept working
 * and restyled so the flow can be re-enabled without UI work.
 */

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
  const params = useLocalSearchParams<{ phone: string }>();
  const { loading, error, verificationToken } = useAppSelector(
    (state) => state.auth,
  );

  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const usernameRef = useRef<TextInput>(null);
  const storeNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const fieldError = useCallback(
    (field: keyof FormErrors): string | undefined => {
      switch (field) {
        case "username":
          return username.trim() ? undefined : t("auth.usernameRequired");
        case "storeName":
          return storeName.trim() ? undefined : t("auth.storeNameRequired");
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
    [username, storeName, password, confirmPassword, t],
  );

  const validateField = useCallback(
    (field: keyof FormErrors) => {
      setFormErrors((prev) => ({ ...prev, [field]: fieldError(field) }));
    },
    [fieldError],
  );

  const handleSubmit = useCallback(async () => {
    if (loading) return;

    const errors: FormErrors = {
      username: fieldError("username"),
      storeName: fieldError("storeName"),
      password: fieldError("password"),
      confirmPassword:
        password !== confirmPassword
          ? t("auth.passwordsMismatch")
          : undefined,
    };
    setFormErrors(errors);

    const refs: Record<keyof FormErrors, React.RefObject<TextInput | null>> = {
      username: usernameRef,
      storeName: storeNameRef,
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
        router.replace("/location?flow=onboarding");
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
    fieldError,
    t,
    router,
    loading,
  ]);

  return (
    <AuthLayout
      title={t("auth.profileSetupTitle")}
      subtitle={t("auth.profileSetupSubtitle")}
      footer={
        <>
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}
          <AuthButton
            title={t("auth.profileStartShopping")}
            onPress={handleSubmit}
            loading={loading}
          />
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
        autoFocus
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
        onSubmitEditing={handleSubmit}
      />
    </AuthLayout>
  );
}
