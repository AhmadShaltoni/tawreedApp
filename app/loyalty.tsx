/**
 * Loyalty Route
 * Production loyalty screen accessible from Profile
 */

import LoyaltyScreen from "@/src/screens/loyalty/LoyaltyScreen";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function LoyaltyRoute() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("loyalty.title") }} />
      <LoyaltyScreen />
    </>
  );
}
