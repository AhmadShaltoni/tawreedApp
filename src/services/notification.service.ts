import { API_ENDPOINTS } from "@/src/constants/api";
import type { Notification } from "@/src/types";
import { notificationPermissionTracker } from "@/src/utils/notificationPermissionTracker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import apiClient from "./api";
import { getToken } from "./tokenStorage";

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATION_READY: "notification_ready",
  NOTIFICATION_FIRST_LAUNCH_DONE: "notification_first_launch_done",
  NOTIFICATION_DENIED_COUNTER: "notification_denied_counter",
  DEVICE_TOKEN: "deviceToken",
};

type ExpoNotificationsModule = typeof import("expo-notifications");

interface NotificationPayload {
  title?: string | null;
  body?: string | null;
  linkUrl?: string;
  link_url?: string;
  data?: Record<string, any>;
}

interface PermissionCheckResult {
  shouldShowModal: boolean;
  attemptCount: number;
  isPermanentlyDenied: boolean;
}

class NotificationServiceClass {
  private initialized = false;
  private responseSubscription: any = null;
  private notificationSubscription: any = null;
  private modalVisibleCallback: ((show: boolean) => void) | null = null;
  private notificationsModule: ExpoNotificationsModule | null = null;

  private isExpoGoAndroid(): boolean {
    return Constants.appOwnership === "expo" && Platform.OS === "android";
  }

  private async getNotificationsModule(): Promise<ExpoNotificationsModule> {
    if (!this.notificationsModule) {
      this.notificationsModule = await import("expo-notifications");
    }
    return this.notificationsModule;
  }

  /**
   * Set callback to show/hide the permission modal
   */
  setModalVisibleCallback(callback: ((show: boolean) => void) | null): void {
    this.modalVisibleCallback = callback;
  }

  /**
   * Initialize notification service on app launch
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.isExpoGoAndroid()) {
      this.initialized = true;
      console.log(
        "[PushNotifications] Skipping initialization in Expo Go (Android)",
      );
      return;
    }

    try {
      const Notifications = await this.getNotificationsModule();

      // Configure notification channel for Android
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });

      // Set notification handler for foreground notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions and check if we should prompt
      await this.checkAndRequestPermission();

      // Setup notification handlers
      await this.setupNotificationHandlers();

      this.initialized = true;
      console.log("[PushNotifications] Service initialized");
    } catch (error) {
      console.error("[PushNotifications] Initialization error:", error);
    }
  }

  /**
   * Check if notification permission is needed and request it
   */
  private async checkAndRequestPermission(): Promise<PermissionCheckResult> {
    try {
      // Increment the attempt counter
      await notificationPermissionTracker.incrementAttemptCount();

      // Get current status
      const status = await notificationPermissionTracker.getStatus();

      console.log("[PushNotifications] Permission status:", status);

      // Check if already configured
      const isReady = await AsyncStorage.getItem(
        STORAGE_KEYS.NOTIFICATION_READY,
      );
      if (isReady === "true") {
        console.log("[PushNotifications] Already configured, skipping");
        return {
          shouldShowModal: false,
          attemptCount: status.attemptCount,
          isPermanentlyDenied: status.isPermanentlyDenied,
        };
      }

      // If attempt count < 4, show native permission dialog
      if (status.attemptCount < 4) {
        console.log(
          `[PushNotifications] Attempt ${status.attemptCount}, showing native permission dialog`,
        );
        await this.requestNotificationPermission();
      } else if (status.shouldShowCustomModal) {
        // On 4th+ attempts, show custom modal
        console.log(
          `[PushNotifications] Attempt ${status.attemptCount}, showing custom modal`,
        );
        if (this.modalVisibleCallback) {
          this.modalVisibleCallback(true);
        }
        // Mark modal as shown today
        await notificationPermissionTracker.markModalShownToday();
      }

      return {
        shouldShowModal: status.shouldShowCustomModal,
        attemptCount: status.attemptCount,
        isPermanentlyDenied: status.isPermanentlyDenied,
      };
    } catch (error) {
      console.error(
        "[PushNotifications] Error in checkAndRequestPermission:",
        error,
      );
      return {
        shouldShowModal: false,
        attemptCount: 0,
        isPermanentlyDenied: false,
      };
    }
  }

  /**
   * Handle modal enable button press - user chose to open settings
   */
  async handlePermissionModalEnable(): Promise<void> {
    try {
      console.log("[PushNotifications] User tapped Enable in modal");
      await notificationPermissionTracker.markModalShownToday();
      // The modal will open settings via Linking.openSettings()
    } catch (error) {
      console.error("[PushNotifications] Error handling modal enable:", error);
    }
  }

  /**
   * Handle modal close/skip button press
   */
  async handlePermissionModalClose(): Promise<void> {
    try {
      console.log("[PushNotifications] User closed permission modal");
      // Mark as permanently dismissed for today
      await notificationPermissionTracker.markModalShownToday();
    } catch (error) {
      console.error("[PushNotifications] Error handling modal close:", error);
    }
  }

  /**
   * Request notification permission from user
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      const Notifications = await this.getNotificationsModule();
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      if (status === "granted") {
        console.log("[PushNotifications] Permission granted");
        await this.registerDeviceToken();
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_READY, "true");
      } else {
        console.log("[PushNotifications] Permission denied");
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_READY, "false");
      }
    } catch (error) {
      console.error("[PushNotifications] Error requesting permission:", error);
    }
  }

  /**
   * Get and register device token with backend
   */
  async registerDeviceToken(): Promise<string | null> {
    try {
      if (this.isExpoGoAndroid()) {
        console.log(
          "[PushNotifications] Skipping token registration in Expo Go (Android)",
        );
        return null;
      }

      const Notifications = await this.getNotificationsModule();

      // Get current token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "tawreed",
      });

      const deviceToken = token.data;
      console.log("[PushNotifications] Device token obtained:", deviceToken);

      // Check if user is authenticated
      const jwtToken = await getToken();
      if (!jwtToken) {
        console.log(
          "[PushNotifications] No JWT token, storing token for later registration",
        );
        // Store for later registration after login
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
        return deviceToken;
      }

      // Call backend API to register token
      const response = await apiClient.post(
        API_ENDPOINTS.REGISTER_DEVICE_TOKEN,
        {
          token: deviceToken,
          platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        },
      );

      if (response.status === 201 || response.status === 200) {
        console.log("[PushNotifications] Device token registered successfully");
        // Save token locally for reference
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
        return deviceToken;
      } else {
        console.error(
          "[PushNotifications] Failed to register device token:",
          response.status,
        );
        return null;
      }
    } catch (error) {
      console.error(
        "[PushNotifications] Device token registration error:",
        error,
      );
      return null;
    }
  }

  /**
   * Setup notification event handlers
   */
  private async setupNotificationHandlers(): Promise<void> {
    try {
      const Notifications = await this.getNotificationsModule();
      // Handle background/killed app notification tap
      this.responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("[PushNotifications] Notification response:", response);
          this.handleNotificationTap(response.notification.request.content);
        });

      // Handle foreground notifications
      this.notificationSubscription =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log(
            "[PushNotifications] Foreground notification:",
            notification,
          );
          // Foreground notifications are shown by the handler configured above
        });

      // Check for initial notification (app was killed when notification arrived)
      const initialNotification =
        await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        console.log(
          "[PushNotifications] Initial notification detected:",
          initialNotification,
        );
        this.handleNotificationTap(
          initialNotification.notification.request.content,
        );
      }
    } catch (error) {
      console.error("[PushNotifications] Error setting up handlers:", error);
    }
  }

  /**
   * Handle notification tap and navigate
   */
  private handleNotificationTap(content: NotificationPayload): void {
    try {
      const linkUrl = content.data?.linkUrl || content.data?.link_url;
      const notificationData = content.data;

      console.log("[PushNotifications] Handling notification tap:", {
        linkUrl,
        notificationData,
      });

      if (linkUrl) {
        this.navigateToScreen(linkUrl, notificationData);
      }
    } catch (error) {
      console.error(
        "[PushNotifications] Error handling notification tap:",
        error,
      );
    }
  }

  /**
   * Navigate to screen based on link URL
   */
  private navigateToScreen(linkUrl: string, data?: Record<string, any>): void {
    console.log("[PushNotifications] Navigating to:", linkUrl);
    // This will be handled by deep linking in app layout
    // We'll emit an event that the navigation layer can listen to
    if (global.notificationNavigation) {
      global.notificationNavigation(linkUrl, data);
    }
  }

  /**
   * Register device token during login (called after authentication)
   */
  async registerTokenAfterLogin(): Promise<void> {
    try {
      if (this.isExpoGoAndroid()) {
        console.log(
          "[PushNotifications] Skipping token registration after login in Expo Go (Android)",
        );
        return;
      }

      // Try to register token from storage
      const deviceToken = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      if (!deviceToken) {
        // Try to get new token
        await this.registerDeviceToken();
      } else {
        // Verify token is still registered
        await this.verifyAndRegisterToken(deviceToken);
      }
    } catch (error) {
      console.error(
        "[PushNotifications] Error registering token after login:",
        error,
      );
    }
  }

  /**
   * Verify and register a token if needed
   */
  private async verifyAndRegisterToken(token: string): Promise<void> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.REGISTER_DEVICE_TOKEN,
        {
          token,
          platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
        },
      );

      if (response.status === 201 || response.status === 200) {
        console.log("[PushNotifications] Token verified and registered");
      }
    } catch (error) {
      console.error("[PushNotifications] Error verifying token:", error);
    }
  }

  /**
   * Unregister device token on logout
   */
  async unregisterToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      if (!token) {
        console.log("[PushNotifications] No token to unregister");
        return;
      }

      try {
        const response = await apiClient.delete(
          API_ENDPOINTS.UNREGISTER_DEVICE_TOKEN,
          {
            data: { token },
          },
        );

        if (response.status === 200) {
          console.log("[PushNotifications] Token unregistered successfully");
        }
      } catch (error: any) {
        // 404 is okay - token was already unregistered
        if (error.response?.status === 404) {
          console.log("[PushNotifications] Token already unregistered");
        } else {
          throw error;
        }
      }

      // Clear local storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.NOTIFICATION_READY,
        STORAGE_KEYS.DEVICE_TOKEN,
      ]);
    } catch (error) {
      console.error("[PushNotifications] Error unregistering token:", error);
    }
  }

  /**
   * Get current device token
   */
  async getDeviceToken(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
  }

  /**
   * Get current permission tracking status
   */
  async getPermissionStatus(): Promise<PermissionCheckResult> {
    const status = await notificationPermissionTracker.getStatus();
    return {
      shouldShowModal: status.shouldShowCustomModal,
      attemptCount: status.attemptCount,
      isPermanentlyDenied: status.isPermanentlyDenied,
    };
  }

  /**
   * Get notification attempt count
   */
  async getPermissionAttemptCount(): Promise<number> {
    return notificationPermissionTracker.getAttemptCount();
  }

  /**
   * Reset permission tracking (for testing or logout)
   */
  async resetPermissionTracking(): Promise<void> {
    try {
      await notificationPermissionTracker.reset();
      console.log("[PushNotifications] Permission tracking reset");
    } catch (error) {
      console.error(
        "[PushNotifications] Error resetting permission tracking:",
        error,
      );
    }
  }

  /**
   * Manually show the permission modal (for testing)
   */
  showPermissionModal(): void {
    if (this.modalVisibleCallback) {
      this.modalVisibleCallback(true);
    } else {
      console.warn("[PushNotifications] Modal callback not set");
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }
  }
}

// Export both old interface and new class
export const pushNotificationService = new NotificationServiceClass();

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.notifications)) return data.notifications;
    return [];
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },

  // Push notification methods
  initializePushNotifications: async () => {
    return pushNotificationService.initialize();
  },

  registerDeviceToken: async () => {
    return pushNotificationService.registerDeviceToken();
  },

  registerTokenAfterLogin: async () => {
    return pushNotificationService.registerTokenAfterLogin();
  },

  unregisterToken: async () => {
    return pushNotificationService.unregisterToken();
  },

  getDeviceToken: async () => {
    return pushNotificationService.getDeviceToken();
  },

  cleanup: () => {
    pushNotificationService.cleanup();
  },
};
