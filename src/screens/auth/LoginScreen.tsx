import Button from "@/src/components/ui/Button";
import ErrorAlert from "@/src/components/ui/ErrorAlert";
import Input from "@/src/components/ui/Input";
import ScreenWrapper from "@/src/components/ui/ScreenWrapper";
import { Colors, FontSize, Spacing } from "@/src/constants/theme";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  clearError,
  continueAsGuest,
  login,
} from "@/src/store/slices/auth.slice";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface FormErrors {
  phone?: string;
  password?: string;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {};

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      errors.phone = t("auth.phoneRequired") || "Phone number is required";
    } else if (!/^07\d{8}$/.test(trimmedPhone)) {
      errors.phone =
        t("auth.phoneInvalid") || "Phone must be in format 07xxxxxxxx";
    }

    if (!password) {
      errors.password = t("auth.passwordRequired") || "Password is required";
    } else if (password.length < 6) {
      errors.password =
        t("auth.passwordMinLength") || "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [phone, password, t]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    dispatch(clearError());
    const result = await dispatch(login({ phone: phone.trim(), password }));

    if (login.fulfilled.match(result)) {
      // Register device token after successful login
      try {
        await notificationService.registerTokenAfterLogin();
      } catch (error) {
        console.error("[LoginScreen] Failed to register device token:", error);
        // Don't block login if token registration fails
      }
      router.replace("/(tabs)");
    } else if (login.rejected.match(result)) {
      Alert.alert(t("auth.login"), result.payload as string);
    }
  }, [dispatch, phone, password, validate, t, router]);

  const handleGuestMode = useCallback(() => {
    dispatch(continueAsGuest());
    router.replace("/(tabs)");
  }, [dispatch, router]);

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.duration(500).delay(50)}
          style={styles.header}
        >
          <Text style={styles.logo}>{t("common.appName")}</Text>
          <Text style={styles.subtitle}>B2B Wholesale Platform</Text>
          <Text style={styles.title}>{t("auth.loginSubtitle")}</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={styles.form}
        >
          <Input
            label={t("auth.phone")}
            placeholder="07XXXXXXXX"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (formErrors.phone)
                setFormErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            error={formErrors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <Input
            label={t("auth.password")}
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (formErrors.password)
                setFormErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={formErrors.password}
            isPassword
            textContentType="password"
          />

          {error && (
            <ErrorAlert
              message={error}
              onClose={() => dispatch(clearError())}
            />
          )}

          <Button
            title={t("auth.signIn")}
            onPress={handleLogin}
            loading={loading}
            variant="accent"
            style={styles.button}
          />

          <Pressable style={styles.guestButton} onPress={handleGuestMode}>
            <Text style={styles.guestText}>{t("auth.continueAsGuest")}</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.noAccount")} </Text>
            <Link href="/(auth)/register" style={styles.link}>
              {t("auth.register")}
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
    marginBottom: Spacing.xxxl + 8,
  },
  logo: {
    fontSize: FontSize.xxxl + 4,
    fontWeight: "800",
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
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
  guestButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing.sm,
  },
  guestText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    textDecorationLine: "underline",
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
