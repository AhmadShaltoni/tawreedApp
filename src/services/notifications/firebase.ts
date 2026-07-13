/**
 * Firebase Messaging Service
 * Handles FCM token lifecycle: generation, registration, refresh, and cleanup
 *
 * LIFECYCLE:
 * 1. APP INSTALL → Generate FCM token → Register anonymously
 * 2. LOGIN → Re-send same token with auth
 * 3. TOKEN REFRESH → Listen & re-register
 * 4. LOGOUT → unlink token from authenticated user
 */

import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import apiClient from "../api";
import { getToken as getJwtToken } from "../tokenStorage";

/**
 * ⚠️ Firebase native modules (RNFBAppModule) are NOT available in Expo Go.
 * Lazily require the messaging module so importing this file never crashes
 * in Expo Go — FCM is simply disabled there.
 */
const isExpoGo = Constants.executionEnvironment === "storeClient";

type MessagingModule = typeof import("@react-native-firebase/messaging");

let messagingModule: MessagingModule | null = null;

function getMessagingModule(): MessagingModule | null {
  if (isExpoGo) return null;
  if (!messagingModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      messagingModule = require("@react-native-firebase/messaging");
    } catch (error) {
      console.warn(
        "[FCM] Messaging native module unavailable. Use a development build for push notifications.",
        error,
      );
      return null;
    }
  }
  return messagingModule;
}

const STORAGE_KEYS = {
  FCM_TOKEN: "fcm_token",
  FCM_TOKEN_REGISTERED: "fcm_token_registered",
};

const anonymousApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

class FirebaseMessagingService {
  private tokenRefreshUnsubscribe: (() => void) | null = null;
  private currentToken: string | null = null;

  /**
   * Initialize Firebase Messaging and request permissions
   */
  async initialize(): Promise<void> {
    const messaging = getMessagingModule();
    if (!messaging) {
      console.warn(
        "[FCM] Skipping initialization — native module unavailable (Expo Go?). Use a development build for push notifications.",
      );
      return;
    }

    try {
      console.log("[FCM] Initializing Firebase Messaging...");

      const messagingInstance = messaging.getMessaging();

      // Request notification permission from user
      const authStatus = await messaging.requestPermission(messagingInstance);
      const hasPermission =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!hasPermission) {
        console.warn("[FCM] Notification permission denied");
        return;
      }

      console.log("[FCM] ✅ Notification permission granted");

      // Get initial FCM token and register it before auth is restored.
      const fcmToken = await this.getAndStoreFCMToken();
      if (fcmToken) {
        await this.registerTokenWithBackend(fcmToken, null);
      }

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
    const messaging = getMessagingModule();
    if (!messaging) return null;

    try {
      const messagingInstance = messaging.getMessaging();
      const fcmToken = await messaging.getToken(messagingInstance);

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
    const messaging = getMessagingModule();
    if (!messaging) return;

    try {
      const messagingInstance = messaging.getMessaging();

      this.tokenRefreshUnsubscribe = messaging.onTokenRefresh(
        messagingInstance,
        async (newToken) => {
          console.log(
            "[FCM] 🔄 Token refreshed:",
            newToken.substring(0, 20) + "...",
          );

          this.currentToken = newToken;
          await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);

          // Re-register refreshed tokens for both anonymous and authenticated devices.
          const jwtToken = await getJwtToken();
          await this.registerTokenWithBackend(newToken, jwtToken);
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
    jwtToken?: string | null,
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
      const authToken = jwtToken === undefined ? await getJwtToken() : jwtToken;
      const payload = {
        token,
        platform,
        deviceInfo: this.getDeviceInfo(),
      };

      console.log("[FCM] 📤 Registering token with backend:", {
        platform,
        tokenLength: token.length,
        isAuthenticated: !!authToken,
      });

      const response = authToken
        ? await apiClient.post(API_ENDPOINTS.REGISTER_DEVICE_TOKEN, payload, {
            headers: { Authorization: `Bearer ${authToken}` },
          })
        : await anonymousApiClient.post(
            API_ENDPOINTS.REGISTER_DEVICE_TOKEN,
            payload,
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

  private getDeviceInfo(): Record<string, string | number | boolean | null> {
    return {
      brand: Device.brand ?? null,
      manufacturer: Device.manufacturer ?? null,
      modelName: Device.modelName ?? null,
      osName: Device.osName ?? Platform.OS,
      osVersion: Device.osVersion ?? null,
      deviceName: Device.deviceName ?? null,
      deviceType: Device.deviceType ?? null,
      isDevice: Device.isDevice,
    };
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
