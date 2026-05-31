import { Stack, useFocusEffect, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import NotificationPermissionModal from "@/src/components/NotificationPermissionModal";
import WhatsAppFAB from "@/src/components/WhatsAppFAB";
import { Config } from "@/src/config/env";
import { Colors } from "@/src/constants/theme";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";
import { loadSavedLanguage } from "@/src/localization/i18n";
import { initializeFirebase } from "@/src/services/firebase-init";
import { notificationService } from "@/src/services/notifications";
import { store, useAppDispatch, useAppSelector } from "@/src/store";
import { restoreSession } from "@/src/store/slices/auth.slice";
import { fetchCart } from "@/src/store/slices/cart.slice";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Setup global notification navigation handler
declare global {
  var notificationNavigation: (linkUrl: string, data?: any) => void;
}

function AuthGate() {
  const { isAuthenticated, isGuest, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  const dispatch = useAppDispatch();
  const segments = useSegments();
  const router = useRouter();

  // Permission modal hook
  const { displayModal, handleModalEnable, handleModalClose } =
    usePushNotificationPermission();

  // Initialize localization and Firebase
  useEffect(() => {
    const initialize = async () => {
      try {
        // ✅ Initialize Firebase FIRST (required before using messaging)
        console.log("[AppInit] Initializing Firebase...");
        await initializeFirebase();
        console.log("[AppInit] ✅ Firebase initialized");

        // ✅ Initialize notification system
        console.log("[AppInit] Initializing notification system...");
        await notificationService.initialize();
        console.log("[AppInit] ✅ Notification system initialized");
      } catch (error) {
        console.error(
          "[AppInit] Firebase/Notification initialization failed:",
          error,
        );
        // Continue anyway - notifications will fail gracefully
      }

      loadSavedLanguage();
      dispatch(restoreSession());

      // Log app configuration in development
      if (__DEV__) {
        console.log("✅ App initialized with Config:", {
          API_BASE_URL: Config.API_BASE_URL,
          APP_ENV: Config.APP_ENV,
          IS_DEV: Config.IS_DEV,
        });
      }
    };

    initialize();
  }, [dispatch]);

  // Hide splash screen when app is initialized
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync().catch((err) => {
        console.warn("[SplashScreen] Failed to hide:", err);
      });
    }
  }, [isInitialized]);

  // Setup notification handlers when auth state and router are ready
  useFocusEffect(
    useCallback(() => {
      console.log("[AuthGate] Setting up notification handlers");

      try {
        // Setup notification navigation with current auth state
        notificationService.setupNavigation(
          router,
          isAuthenticated,
          (linkUrl: string, data?: any) => {
            // Optional: Dispatch to Redux for UI updates
            console.log("[AuthGate] Notification navigation callback", linkUrl);
          },
        );

        // Update auth status in notification service
        notificationService.updateAuthStatus(isAuthenticated);
      } catch (error) {
        console.error(
          "[AuthGate] Failed to setup notification handlers:",
          error,
        );
      }

      return () => {
        notificationService.cleanup();
      };
    }, [router, isAuthenticated]),
  );

  // Fetch cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !isGuest && !inAuthGroup) {
      // After logout or first launch: redirect to login
      router.replace("/(auth)/login");
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
            title: "الأصناف",
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
        <Stack.Screen
          name="location"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
      <StatusBar style="dark" />
      <NotificationPermissionModal
        visible={displayModal}
        onOpenSettings={handleModalEnable}
        onClose={handleModalClose}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AuthGate />
      </Provider>
    </SafeAreaProvider>
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
