import { Colors } from "@/src/constants/theme";
import { useAppSelector } from "@/src/store";
import { isAdminRole } from "@/src/utils/roles";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Admin-only route group (orders management). UI gate only — every admin API
 * endpoint re-checks the role server-side. Non-admin users are sent home.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );

  // Wait for auth restore before deciding (avoids a redirect flash on cold start)
  if (!isInitialized) return null;

  if (!isAuthenticated || !isAdminRole(user?.role)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: Colors.white },
        headerTitleStyle: { fontWeight: "700", color: Colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="orders" options={{ title: t("adminOrders.title") }} />
      <Stack.Screen
        name="order/[id]"
        options={{ title: t("adminOrders.orderDetail") }}
      />
    </Stack>
  );
}
