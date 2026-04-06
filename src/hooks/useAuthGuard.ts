import { useAppSelector } from "@/src/store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * Hook that provides auth guard functionality for guest mode.
 * Returns a function that checks auth and either runs the callback or redirects to login.
 */
export function useAuthGuard() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const { t } = useTranslation();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (isAuthenticated) {
        callback?.();
        return true;
      }

      Alert.alert(t("auth.guestPromptTitle"), t("auth.guestPromptMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.goToLogin"),
          onPress: () => router.push("/(auth)/login"),
        },
      ]);
      return false;
    },
    [isAuthenticated, router, t],
  );

  return { isAuthenticated, requireAuth };
}
