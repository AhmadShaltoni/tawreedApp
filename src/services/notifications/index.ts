/**
 * Main Notification Service Coordinator
 *
 * Orchestrates Firebase Messaging, handlers, and navigation
 * Single entry point for notification system initialization and lifecycle
 */

import { firebaseMessagingService } from "./firebase";
import { notificationHandlers } from "./notification-handlers";
import {
    notificationNavigationService
} from "./notification-navigation";

class NotificationServiceCoordinator {
  private initialized = false;

  /**
   * Initialize notification system
   * Called during app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("[NotificationService] Already initialized");
      return;
    }

    try {
      console.log(
        "[NotificationService] 🚀 Initializing notification system...",
      );

      // 1️⃣ Initialize Firebase Messaging
      await firebaseMessagingService.initialize();

      // 2️⃣ Setup notification handlers (requires router, passed later)
      console.log("[NotificationService] ✅ Notification system ready");
      this.initialized = true;
    } catch (error) {
      console.error("[NotificationService] Initialization failed:", error);
    }
  }

  /**
   * Setup navigation handlers
   * Called after router and auth state are available
   */
  setupNavigation(
    router: any,
    isAuthenticated: boolean,
    onNavigate: (linkUrl: string, data?: Record<string, string | object>) => void,
  ): void {
    try {
      console.log("[NotificationService] Setting up notification navigation");

      // Initialize navigation service
      notificationNavigationService.initialize(router, isAuthenticated);

      // Setup listeners with navigation callback
      notificationHandlers.setupListeners((linkUrl, data) => {
        notificationNavigationService.navigate(linkUrl, data);
        onNavigate(linkUrl, data);
      });

      console.log("[NotificationService] ✅ Navigation setup complete");
    } catch (error) {
      console.error("[NotificationService] Navigation setup error:", error);
    }
  }

  /**
   * Update authentication status in navigation handler
   */
  updateAuthStatus(isAuthenticated: boolean): void {
    notificationNavigationService.setAuthenticated(isAuthenticated);
  }

  /**
   * Register token after login
   */
  async registerTokenAfterLogin(): Promise<void> {
    console.log("[NotificationService] 🔗 Registering token after login");
    await firebaseMessagingService.registerTokenAfterLogin();
  }

  /**
   * Unregister token on logout
   */
  async unregisterTokenOnLogout(): Promise<void> {
    console.log("[NotificationService] 🔓 Unregistering token on logout");
    await firebaseMessagingService.unregisterTokenOnLogout();
  }

  /**
   * Get stored FCM token
   */
  async getStoredToken(): Promise<string | null> {
    return firebaseMessagingService.getStoredToken();
  }

  /**
   * Cleanup notification system
   */
  cleanup(): void {
    firebaseMessagingService.cleanup();
    notificationHandlers.cleanup();
    this.initialized = false;
    console.log("[NotificationService] Cleanup completed");
  }
}

export const notificationService = new NotificationServiceCoordinator();
