import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import Animated, { FadeIn } from "react-native-reanimated";
import { Provider } from "react-redux";

import { Colors } from "@/src/constants/theme";
import "@/src/localization/i18n";
import { loadSavedLanguage } from "@/src/localization/i18n";
import { store, useAppDispatch, useAppSelector } from "@/src/store";
import { continueAsGuest, restoreSession } from "@/src/store/slices/auth.slice";

function AuthGate() {
  const { isAuthenticated, isGuest, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadSavedLanguage();
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !isGuest && !inAuthGroup) {
      // New users start as guests and go to main app
      dispatch(continueAsGuest());
      router.replace("/(tabs)");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isGuest, isInitialized, segments, router, dispatch]);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <Animated.View entering={FadeIn.duration(400)}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </Animated.View>
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="products"
          options={{
            headerShown: true,
            title: "Products",
            animation: "slide_from_right",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontWeight: "700", color: Colors.text },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            headerShown: true,
            title: "Categories",
            animation: "slide_from_right",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontWeight: "700", color: Colors.text },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: true,
            title: "Checkout",
            animation: "slide_from_bottom",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontWeight: "700", color: Colors.text },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: "Notifications",
            animation: "slide_from_right",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontWeight: "700", color: Colors.text },
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthGate />
    </Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
