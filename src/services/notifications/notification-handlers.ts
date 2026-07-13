/**
 * Notification Handlers
 *
 * Handles three notification states:
 * 1. Foreground: App is open, notification arrives
 * 2. Background: App is minimized, user taps notification
 * 3. Killed: App is closed, user taps notification
 */

import Constants from "expo-constants";

/**
 * ⚠️ Firebase native modules (RNFBAppModule) are NOT available in Expo Go.
 * Lazily require the messaging module so importing this file never crashes
 * in Expo Go — notification listeners are simply disabled there.
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
        "[Notifications] Messaging native module unavailable. Use a development build for push notifications.",
        error,
      );
      return null;
    }
  }
  return messagingModule;
}

export interface RemoteMessage {
  messageId?: string;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string | object>;
}

export type NotificationHandler = (message: RemoteMessage) => void;
export type NavigationHandler = (
  linkUrl: string,
  data?: Record<string, string | object>,
) => void;

class NotificationHandlersService {
  private foregroundUnsubscribe: (() => void) | null = null;
  private backgroundUnsubscribe: (() => void) | null = null;
  private navigationHandler: NavigationHandler | null = null;

  /**
   * Setup all notification event listeners
   */
  setupListeners(onNavigate: NavigationHandler): void {
    this.navigationHandler = onNavigate;

    const messaging = getMessagingModule();
    if (!messaging) {
      console.warn(
        "[Notifications] Skipping listeners — native module unavailable (Expo Go?).",
      );
      return;
    }

    try {
      const messagingInstance = messaging.getMessaging();

      // 1️⃣ FOREGROUND: App is open
      this.foregroundUnsubscribe = messaging.onMessage(messagingInstance, (message) => {
        this.handleForegroundMessage(message);
      });

      // 2️⃣ BACKGROUND: User taps notification while app is backgrounded
      this.backgroundUnsubscribe = messaging.onNotificationOpenedApp(
        messagingInstance,
        (message) => {
          this.handleBackgroundMessage(message);
        },
      );

      // 3️⃣ KILLED: App was killed, get initial notification
      this.handleKilledAppNotification();

      console.log("[Notifications] ✅ All listeners setup");
    } catch (error) {
      console.error("[Notifications] Error setting up listeners:", error);
    }
  }

  /**
   * Handle foreground notification
   * App is open and running when notification arrives
   */
  private handleForegroundMessage(message: RemoteMessage): void {
    console.log("[Notifications] 📱 Foreground message received:", {
      title: message.notification?.title,
      body: message.notification?.body,
      data: message.data,
    });

    // Notification is automatically displayed by Firebase
    // We can dispatch to Redux here for real-time UI updates if needed
    const linkUrl = message.data?.linkUrl || message.data?.link_url;
    if (linkUrl && this.navigationHandler) {
      // Optional: navigate immediately on foreground notification
      // this.navigationHandler(linkUrl, message.data);
    }
  }

  /**
   * Handle background notification
   * App is minimized, user taps notification in notification center
   */
  private handleBackgroundMessage(message: RemoteMessage): void {
    console.log(
      "[Notifications] 📲 Background message - notification tapped:",
      {
        title: message.notification?.title,
        data: message.data,
      },
    );

    this.handleNotificationNavigation(message);
  }

  /**
   * Handle killed app notification
   * App was closed, user taps notification from lock screen or notification center
   */
  private async handleKilledAppNotification(): Promise<void> {
    const messaging = getMessagingModule();
    if (!messaging) return;

    try {
      const messagingInstance = messaging.getMessaging();
      const message = await messaging.getInitialNotification(messagingInstance);

      if (message) {
        console.log(
          "[Notifications] ⚠️  App killed - initial notification detected:",
          {
            title: message.notification?.title,
            data: message.data,
          },
        );

        // Delay navigation to allow Redux/Navigation to initialize
        setTimeout(() => {
          this.handleNotificationNavigation(message);
        }, 1000);
      }
    } catch (error) {
      console.error(
        "[Notifications] Error handling killed app notification:",
        error,
      );
    }
  }

  /**
   * Navigate based on notification data
   */
  private handleNotificationNavigation(message: RemoteMessage): void {
    const linkUrl = message.data?.linkUrl || message.data?.link_url;
    const notificationType = message.data?.type;

    console.log("[Notifications] 🔗 Handling navigation:", {
      linkUrl,
      notificationType,
    });

    if (typeof linkUrl === "string" && this.navigationHandler) {
      this.navigationHandler(linkUrl, message.data);
    }
  }

  /**
   * Cleanup - unsubscribe from all listeners
   */
  cleanup(): void {
    if (this.foregroundUnsubscribe) {
      this.foregroundUnsubscribe();
      this.foregroundUnsubscribe = null;
    }

    if (this.backgroundUnsubscribe) {
      this.backgroundUnsubscribe();
      this.backgroundUnsubscribe = null;
    }

    console.log("[Notifications] Cleanup completed");
  }
}

export const notificationHandlers = new NotificationHandlersService();
