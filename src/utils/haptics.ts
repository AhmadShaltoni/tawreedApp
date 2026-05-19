/**
 * Haptic Feedback Utility
 * Semantic haptic feedback for loyalty interactions
 * Wraps expo-haptics with meaningful method names
 */

import * as Haptics from "expo-haptics";

class HapticsService {
  /**
   * Light tap feedback
   * Use for: button press, toggle, filter selection
   */
  light() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log("[Haptics] Light feedback error:", error);
    }
  }

  /**
   * Medium impact feedback
   * Use for: milestone unlock, card flip, reveal animation start
   */
  medium() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log("[Haptics] Medium feedback error:", error);
    }
  }

  /**
   * Heavy impact feedback
   * Use for: reward redemption success, campaign completion
   */
  heavy() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log("[Haptics] Heavy feedback error:", error);
    }
  }

  /**
   * Success notification
   * Use for: reward redemption success, coupon created, points earned
   */
  success() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log("[Haptics] Success feedback error:", error);
    }
  }

  /**
   * Warning notification
   * Use for: insufficient points, near expiry warning
   */
  warning() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.log("[Haptics] Warning feedback error:", error);
    }
  }

  /**
   * Error notification
   * Use for: redemption failure, validation error
   */
  error() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.log("[Haptics] Error feedback error:", error);
    }
  }

  /**
   * Selection feedback
   * Use for: slider change, picker change, card swipe
   */
  selection() {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.log("[Haptics] Selection feedback error:", error);
    }
  }

  /**
   * Celebration sequence
   * Use for: reward reveal, campaign completion
   */
  async celebration() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        100,
      );
      setTimeout(
        () =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        200,
      );
    } catch (error) {
      console.log("[Haptics] Celebration sequence error:", error);
    }
  }
}

export const haptics = new HapticsService();
