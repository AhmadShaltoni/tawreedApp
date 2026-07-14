import { Colors } from "@/src/constants/theme";
import { useAppSelector } from "@/src/store";
import { scaleFont } from "@/src/utils/responsive";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { t } = useTranslation();
  const cartItemCount = useAppSelector((state) => state.cart.items.length);
  const insets = useSafeAreaInsets();

  // Calculate safe bottom padding
  // Minimum 8dp padding + actual system inset
  const bottomPaddingAndroid = Math.max(insets.bottom, 8);
  const tabBarHeightAndroid = 56 + bottomPaddingAndroid;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          fontWeight: "700",
          color: Colors.text,
          fontSize: scaleFont(17),
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          height: Platform.OS === "ios" ? 88 : tabBarHeightAndroid,
          paddingBottom:
            Platform.OS === "ios" ? insets.bottom : bottomPaddingAndroid,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: scaleFont(11),
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home.title"),
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("cart.title"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.secondary,
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("orders.title"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
