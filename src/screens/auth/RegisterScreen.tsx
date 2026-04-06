import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ScreenWrapper from "@/src/components/ui/ScreenWrapper";
import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { clearError, register } from "@/src/store/slices/auth.slice";
import { notificationService } from "@/src/services/notification.service";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface FormErrors {
  username?: string;
  phone?: string;
  storeName?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!username.trim())
      errors.username = t("auth.usernameRequired") || "Username is required";
    if (!phone.trim()) {
      errors.phone = t("auth.phoneRequired") || "Phone number is required";
    } else if (!/^07\d{8}$/.test(phone.trim())) {
      errors.phone =
        t("auth.phoneInvalid") || "Phone must be in format 07xxxxxxxx";
    }
    if (!storeName.trim())
      errors.storeName =
        t("auth.storeNameRequired") || "Store name is required";
    if (!password) {
      errors.password = t("auth.passwordRequired") || "Password is required";
    } else if (password.length < 8) {
      errors.password =
        t("auth.passwordMinLength") || "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword =
        t("auth.passwordsMismatch") || "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [username, phone, storeName, password, confirmPassword, t]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;

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
      } catch (error) {
        console.error("[RegisterScreen] Failed to register device token:", error);
        // Don't block registration if token registration fails
      }
      router.replace("/(tabs)");
    } else if (register.rejected.match(result)) {
      Alert.alert(t("auth.register"), result.payload as string);
    }
  }, [
    dispatch,
    username,
    phone,
    storeName,
    password,
    confirmPassword,
    validate,
    t,
    router,
  ]);

  const clearFieldError = (field: keyof FormErrors) => {
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.duration(500).delay(50)}
          style={styles.header}
        >
          <Text style={styles.logo}>{t("common.appName")}</Text>
          <Text style={styles.subtitle}>B2B Wholesale Platform</Text>
          <Text style={styles.title}>{t("auth.registerSubtitle")}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={styles.form}
        >
          <Input
            label={t("auth.username")}
            placeholder="أحمد الخالدي"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              clearFieldError("username");
            }}
            error={formErrors.username}
            autoComplete="username"
          />

          <Input
            label={t("auth.phone")}
            placeholder="07XXXXXXXX"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              clearFieldError("phone");
            }}
            error={formErrors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <Input
            label={t("auth.storeName")}
            placeholder="اسم البقالة"
            value={storeName}
            onChangeText={(text) => {
              setStoreName(text);
              clearFieldError("storeName");
            }}
            error={formErrors.storeName}
            autoComplete="organization"
            textContentType="organizationName"
          />

          <Input
            label={t("auth.password")}
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearFieldError("password");
            }}
            error={formErrors.password}
            isPassword
            textContentType="newPassword"
          />

          <Input
            label={t("auth.confirmPassword")}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearFieldError("confirmPassword");
            }}
            error={formErrors.confirmPassword}
            isPassword
            textContentType="newPassword"
          />

          {error ? <Text style={styles.apiError}>{error}</Text> : null}

          <Button
            title={t("auth.createAccount")}
            onPress={handleRegister}
            loading={loading}
            variant="accent"
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.haveAccount")} </Text>
            <Link href="/(auth)/login" style={styles.link}>
              {t("auth.signIn")}
            </Link>
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logo: {
    fontSize: FontSize.xxxl,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  form: {
    width: "100%",
  },
  apiError: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  button: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xxl,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  link: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
});
