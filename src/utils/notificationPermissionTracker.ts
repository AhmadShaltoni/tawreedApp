import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  PERMISSION_ATTEMPT_COUNT: "notification_permission_attempt_count",
  PERMISSION_MODAL_SHOWN_TODAY: "notification_permission_modal_shown_today",
  PERMISSION_DENIED_PERMANENTLY: "notification_permission_denied_permanently",
};

class NotificationPermissionTracker {
  /**
   * Get current attempt count
   */
  async getAttemptCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(
        STORAGE_KEYS.PERMISSION_ATTEMPT_COUNT,
      );
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error("[PermissionTracker] Failed to get attempt count:", error);
      return 0;
    }
  }

  /**
   * Increment attempt count
   */
  async incrementAttemptCount(): Promise<number> {
    try {
      const current = await this.getAttemptCount();
      const next = current + 1;
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERMISSION_ATTEMPT_COUNT,
        String(next),
      );
      console.log(
        `[PermissionTracker] Attempt count incremented: ${current} → ${next}`,
      );
      return next;
    } catch (error) {
      console.error(
        "[PermissionTracker] Failed to increment attempt count:",
        error,
      );
      return 0;
    }
  }

  /**
   * Check if modal was shown today
   */
  async hasModalShownToday(): Promise<boolean> {
    try {
      const lastShown = await AsyncStorage.getItem(
        STORAGE_KEYS.PERMISSION_MODAL_SHOWN_TODAY,
      );
      if (!lastShown) return false;

      const lastShownDate = new Date(lastShown);
      const today = new Date();

      // Check if same day
      const isSameDay =
        lastShownDate.toDateString() === today.toDateString();

      return isSameDay;
    } catch (error) {
      console.error("[PermissionTracker] Failed to check modal shown:", error);
      return false;
    }
  }

  /**
   * Mark modal as shown today
   */
  async markModalShownToday(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERMISSION_MODAL_SHOWN_TODAY,
        new Date().toISOString(),
      );
      console.log("[PermissionTracker] Modal marked as shown today");
    } catch (error) {
      console.error(
        "[PermissionTracker] Failed to mark modal as shown:",
        error,
      );
    }
  }

  /**
   * Check if permission is denied permanently
   */
  async isPermanentlyDenied(): Promise<boolean> {
    try {
      const denied = await AsyncStorage.getItem(
        STORAGE_KEYS.PERMISSION_DENIED_PERMANENTLY,
      );
      return denied === "true";
    } catch (error) {
      console.error(
        "[PermissionTracker] Failed to check if permanently denied:",
        error,
      );
      return false;
    }
  }

  /**
   * Mark permission as permanently denied
   */
  async markPermanentlyDenied(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PERMISSION_DENIED_PERMANENTLY,
        "true",
      );
      console.log("[PermissionTracker] Permission marked as permanently denied");
    } catch (error) {
      console.error(
        "[PermissionTracker] Failed to mark as permanently denied:",
        error,
      );
    }
  }

  /**
   * Reset all tracking data (for testing or logout)
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      console.log("[PermissionTracker] All tracking data reset");
    } catch (error) {
      console.error("[PermissionTracker] Failed to reset:", error);
    }
  }

  /**
   * Get detailed status
   */
  async getStatus(): Promise<{
    attemptCount: number;
    hasShownToday: boolean;
    isPermanentlyDenied: boolean;
    shouldShowCustomModal: boolean;
  }> {
    const attemptCount = await this.getAttemptCount();
    const hasShownToday = await this.hasModalShownToday();
    const isPermanentlyDenied = await this.isPermanentlyDenied();

    // Show custom modal if:
    // 1. Attempts >= 4 (more than 3)
    // 2. Not shown today yet
    // 3. Not permanently denied (user chose to dismiss forever)
    const shouldShowCustomModal =
      attemptCount >= 4 && !hasShownToday && !isPermanentlyDenied;

    return {
      attemptCount,
      hasShownToday,
      isPermanentlyDenied,
      shouldShowCustomModal,
    };
  }

  /**
   * Should show native permission prompt?
   */
  shouldShowNativePermission(): Promise<boolean> {
    return this.getAttemptCount().then((count) => count < 4);
  }
}

export const notificationPermissionTracker =
  new NotificationPermissionTracker();
