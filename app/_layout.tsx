import { Stack, useFocusEffect, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Provider } from "react-redux";

import NotificationPermissionModal from "@/src/components/NotificationPermissionModal";
import WhatsAppFAB from "@/src/components/WhatsAppFAB";
import { Colors } from "@/src/constants/theme";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";
import { loadSavedLanguage } from "@/src/localization/i18n";
import { notificationService } from "@/src/services/notification.service";
import { store, useAppDispatch, useAppSelector } from "@/src/store";
import { restoreSession } from "@/src/store/slices/auth.slice";
import { fetchCart } from "@/src/store/slices/cart.slice";

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

  // Initialize localization
  useEffect(() => {
    loadSavedLanguage();
    dispatch(restoreSession());
  }, [dispatch]);

  // Initialize push notifications (on every app focus)
  useFocusEffect(
    useCallback(() => {
      console.log("[AuthGate] App focused, checking notifications");

      const initNotifications = async () => {
        try {
          await notificationService.initializePushNotifications();
        } catch (error) {
          console.error(
            "[AuthGate] Failed to initialize push notifications:",
            error,
          );
        }
      };

      initNotifications();

      // Setup deep linking for notifications
      global.notificationNavigation = (linkUrl: string, data?: any) => {
        if (linkUrl.startsWith("/orders/")) {
          const id = linkUrl.replace("/orders/", "");
          router.push(`/order/${id}`);
        } else if (linkUrl.startsWith("/products/")) {
          const id = linkUrl.replace("/products/", "");
          router.push(`/product/${id}`);
        } else if (linkUrl.includes("/cart")) {
          router.push("/(tabs)/cart");
        } else if (linkUrl.includes("/notifications")) {
          router.push("/notifications");
        } else {
          router.push("/(tabs)");
        }
      };

      return () => {
        notificationService.cleanup();
      };
    }, [router]),
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
        <Stack.Screen
          name="location"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
      <StatusBar style="dark" />
      <WhatsAppFAB />
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
