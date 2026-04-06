import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { pushNotificationService } from "@/src/services/notification.service";

/**
 * Hook to manage push notification permission requests with modal fallback
 * Handles showing native permission dialog on early attempts and custom modal on 4th+ attempts
 */
export const usePushNotificationPermission = () => {
  const [displayModal, setDisplayModal] = useState(false);
  const [permissionAttempt, setPermissionAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Register modal callback when component mounts
  useEffect(() => {
    pushNotificationService.setModalVisibleCallback((show: boolean) => {
      console.log("[PushNotificationPermission] Modal callback triggered:", show);
      setDisplayModal(show);
    });

    return () => {
      pushNotificationService.setModalVisibleCallback(null);
    };
  }, []);

  // Check permission status on app focus
  useFocusEffect(
    useCallback(() => {
      checkPermissionStatus();
    }, []),
  );

  const checkPermissionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await pushNotificationService.getPermissionStatus();
      
      console.log("[PushNotificationPermission] Permission status:", {
        shouldShowModal: status.shouldShowModal,
        attemptCount: status.attemptCount,
        isPermanentlyDenied: status.isPermanentlyDenied,
      });

      setPermissionAttempt(status.attemptCount);
      
      // Note: The service will call setModalVisibleCallback during checkAndRequestPermission
      // We just need to track the attempt count here
    } catch (error) {
      console.error("[PushNotificationPermission] Error checking status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalEnable = useCallback(async () => {
    try {
      await pushNotificationService.handlePermissionModalEnable();
      setDisplayModal(false);
    } catch (error) {
      console.error("[PushNotificationPermission] Error handling modal enable:", error);
    }
  }, []);

  const handleModalClose = useCallback(async () => {
    try {
      await pushNotificationService.handlePermissionModalClose();
      setDisplayModal(false);
    } catch (error) {
      console.error("[PushNotificationPermission] Error handling modal close:", error);
    }
  }, []);

  return {
    displayModal,
    permissionAttempt,
    isLoading,
    handleModalEnable,
    handleModalClose,
  };
};
