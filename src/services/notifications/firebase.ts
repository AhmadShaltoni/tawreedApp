/**
 * Firebase Messaging Service
 * Handles FCM token lifecycle: generation, registration, refresh, and cleanup
 *
 * LIFECYCLE:
 * 1. APP INSTALL → Generate FCM token → Register anonymously
 * 2. LOGIN → Re-send same token with auth
 * 3. TOKEN REFRESH → Listen & re-register
 * 4. LOGOUT → DELETE token
 */

import { API_ENDPOINTS } from "@/src/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    AuthorizationStatus,
    getMessaging,
    getToken,
    onTokenRefresh,
    requestPermission,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import apiClient from "../api";
import { getToken as getJwtToken } from "../tokenStorage";

const STORAGE_KEYS = {
  FCM_TOKEN: "fcm_token",
  FCM_TOKEN_REGISTERED: "fcm_token_registered",
};

class FirebaseMessagingService {
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private currentToken: string | null = null;

  /**
   * Initialize Firebase Messaging and request permissions
   */
  async initialize(): Promise<void> {
    try {
      console.log("[FCM] Initializing Firebase Messaging...");

      const messaging = getMessaging();

      // Request notification permission from user
      const authStatus = await requestPermission(messaging);
      const hasPermission =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!hasPermission) {
        console.warn("[FCM] Notification permission denied");
        return;
      }

      console.log("[FCM] ✅ Notification permission granted");

      // Get initial FCM token
      await this.getAndStoreFCMToken();

      // Setup token refresh listener
      this.setupTokenRefreshListener();
    } catch (error) {
      console.error("[FCM] Initialization error:", error);
    }
  }

  /**
   * Get FCM token and store locally
   * Called during app initialization
   */
  private async getAndStoreFCMToken(): Promise<string | null> {
    try {
      const messaging = getMessaging();
      const fcmToken = await getToken(messaging);

      if (!fcmToken) {
        console.warn("[FCM] Failed to get FCM token");
        return null;
      }

      this.currentToken = fcmToken;
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, fcmToken);

      console.log(
        "[FCM] 📱 FCM Token generated:",
        fcmToken.substring(0, 20) + "...",
      );

      return fcmToken;
    } catch (error) {
      console.error("[FCM] Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Setup token refresh listener
   * Called when token expires/refreshes
   */
  private setupTokenRefreshListener(): void {
    try {
      const messaging = getMessaging();

      this.tokenRefreshUnsubscribe = onTokenRefresh(
        messaging,
        async (newToken) => {
          console.log(
            "[FCM] 🔄 Token refreshed:",
            newToken.substring(0, 20) + "...",
          );

          this.currentToken = newToken;
          await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);

          // Re-register with backend if user is authenticated
          const jwtToken = await getJwtToken();
          if (jwtToken) {
            await this.registerTokenWithBackend(newToken, jwtToken);
          }
        },
      );

      console.log("[FCM] ✅ Token refresh listener setup");
    } catch (error) {
      console.error("[FCM] Error setting up token refresh listener:", error);
    }
  }

  /**
   * Register FCM token with backend (anonymously or authenticated)
   * Called during app install (anon) or after login (auth)
   */
  async registerTokenWithBackend(
    fcmToken?: string,
    jwtToken?: string,
  ): Promise<boolean> {
    try {
      const token =
        fcmToken ||
        this.currentToken ||
        (await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN));

      if (!token) {
        console.warn("[FCM] No token to register");
        return false;
      }

      const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";
      const authToken = jwtToken || (await getJwtToken());

      console.log("[FCM] 📤 Registering token with backend:", {
        platform,
        tokenLength: token.length,
        isAuthenticated: !!authToken,
      });

      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const response = await apiClient.post(
        API_ENDPOINTS.REGISTER_DEVICE_TOKEN,
        { token, platform },
        { headers },
      );

      if (response.status === 201 || response.status === 200) {
        console.log("[FCM] ✅ Token registered successfully");
        await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN_REGISTERED, "true");
        return true;
      }

      console.error("[FCM] Unexpected response status:", response.status);
      return false;
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log(
          "[FCM] ℹ️  Token registration deferred (not authenticated yet)",
        );
        return true; // Not an error - expected for guests
      }

      console.error("[FCM] Token registration error:", error);
      return false;
    }
  }

  /**
   * Register token after login
   * User is now authenticated, so link the token to their account
   */
  async registerTokenAfterLogin(): Promise<void> {
    try {
      const jwtToken = await getJwtToken();
      if (!jwtToken) return;

      const fcmToken =
        this.currentToken ||
        (await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN));

      if (!fcmToken) {
        console.warn("[FCM] No FCM token available");
        return;
      }

      console.log("[FCM] 🔗 Linking token to authenticated user...");
      await this.registerTokenWithBackend(fcmToken, jwtToken);
    } catch (error) {
      console.error("[FCM] Error registering token after login:", error);
    }
  }

  /**
   * Unregister token on logout
   * Token remains on device but is unlinked from user account
   */
  async unregisterTokenOnLogout(): Promise<void> {
    try {
      const jwtToken = await getJwtToken();
      const fcmToken =
        this.currentToken ||
        (await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN));

      if (!fcmToken) {
        console.log("[FCM] No token to unregister");
        return;
      }

      console.log("[FCM] 🔓 Unlinking token from user account...");

      const response = await apiClient.delete(
        API_ENDPOINTS.UNREGISTER_DEVICE_TOKEN,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          data: { token: fcmToken },
        },
      );

      if (response.status === 200) {
        console.log("[FCM] ✅ Token unregistered successfully");
        await AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKEN_REGISTERED);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("[FCM] ℹ️  Token already unregistered");
        return;
      }

      console.error("[FCM] Error unregistering token:", error);
    }
  }

  /**
   * Get stored FCM token
   */
  async getStoredToken(): Promise<string | null> {
    return this.currentToken || AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
  }

  /**
   * Cleanup - unsubscribe from token refresh listener
   */
  cleanup(): void {
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
      this.tokenRefreshUnsubscribe = null;
    }
    console.log("[FCM] Cleanup completed");
  }
}

export const firebaseMessagingService = new FirebaseMessagingService();
