import { API_ENDPOINTS } from "@/src/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import apiClient from "./api";
import { initializeFirebase, isFirebaseInitialized } from "./firebase-init";
import { getToken as getJwtToken } from "./tokenStorage";

// Storage keys
const STORAGE_KEYS = {
  FCM_TOKEN: "fcmToken",
  NOTIFICATION_PERMISSION_ASKED: "notificationPermissionAsked",
};

type ReduxDispatch = (action: any) => void;

class FirebaseNotificationService {
  private initialized = false;
  private reduxDispatch: ReduxDispatch | null = null;
  private messageUnsubscribe: (() => void) | null = null;

  /**
   * تسجيل Redux dispatch callback لتحديث الحالة عند وصول إشعار
   */
  setReduxDispatch(dispatch: ReduxDispatch | null): void {
    this.reduxDispatch = dispatch;
    console.log("[Firebase] Redux dispatch callback registered");
  }

  /**
   * تهيئة خدمة Firebase للإشعارات
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("[Firebase] Initializing Firebase Messaging...");

      // ✅ CRITICAL: Initialize Firebase first
      if (!isFirebaseInitialized()) {
        console.log("[Firebase] Firebase not initialized yet, initializing...");
        await initializeFirebase();
      } else {
        console.log("[Firebase] Firebase already initialized");
      }

      // طلب الصلاحيات من المستخدم
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("[Firebase] Notification permission granted");

        // الحصول على FCM Token
        await this.getAndRegisterFCMToken();

        // إعداد معالج الرسائل الواردة
        this.setupMessageHandlers();

        this.initialized = true;
        console.log("[Firebase] Initialization completed");
      } else {
        console.warn("[Firebase] Notification permission denied");
      }
    } catch (error) {
      console.error("[Firebase] Initialization error:", error);
      throw error; // Re-throw to handle in caller
    }
  }

  /**
   * الحصول على FCM Token وتسجيله مع Backend
   */
  async getAndRegisterFCMToken(): Promise<string | null> {
    try {
      // الحصول على Token من Firebase
      const messagingInstance = getMessaging();
      const fcmToken = await getToken(messagingInstance);
      console.log("[Firebase] FCM Token obtained:", fcmToken);

      // حفظ Token محلياً
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, fcmToken);

      // التحقق من تسجيل المستخدم
      const jwtToken = await getJwtToken();

      if (!jwtToken) {
        console.log(
          "[Firebase] No JWT token, token will be registered after login",
        );
        return fcmToken;
      }

      // تسجيل Token مع Backend
      await this.registerTokenWithBackend(fcmToken, jwtToken);

      return fcmToken;
    } catch (error) {
      console.error("[Firebase] Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * تسجيل Device Token مع Backend API
   */
  private async registerTokenWithBackend(
    fcmToken: string,
    jwtToken: string,
  ): Promise<void> {
    try {
      const platform = Platform.OS === "ios" ? "IOS" : "ANDROID";

      console.log("[Firebase] Registering token with backend:", {
        platform,
        tokenLength: fcmToken.length,
      });

      const response = await apiClient.post(
        API_ENDPOINTS.REGISTER_DEVICE_TOKEN,
        {
          token: fcmToken,
          platform,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      if (response.status === 201 || response.status === 200) {
        console.log("[Firebase] Device token registered successfully");
      } else {
        console.error("[Firebase] Failed to register token:", response.status);
      }
    } catch (error: any) {
      console.error("[Firebase] Error registering token with backend:", error);

      // إذا كان الخطأ 401 (Unauthorized)، فإن Token ربما يُسجّل بعد تسجيل الدخول
      if (error.response?.status === 401) {
        console.log(
          "[Firebase] Token registration deferred (not authenticated yet)",
        );
      }
    }
  }

  /**
   * إعداد معالجات الرسائل الواردة والاستجابات
   */
  private setupMessageHandlers(): void {
    // معالج الرسائل الواردة (Foreground)
    this.messageUnsubscribe = onMessage(
      getMessaging(),
      async (remoteMessage) => {
        console.log("[Firebase] Foreground message received:", {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        });

        // تحديث Redux بالإشعار الجديد
        if (this.reduxDispatch) {
          // إضافة الإشعار الجديد إلى الحالة
          const rawType = remoteMessage.data?.type;
          const typeString = typeof rawType === "string" ? rawType : undefined;

          this.reduxDispatch({
            type: "notifications/addIncomingNotification",
            payload: {
              id: `temp_${Date.now()}`,
              title: remoteMessage.notification?.title || "إشعار جديد",
              message: remoteMessage.notification?.body || "",
              type: this.getNotificationType(typeString),
              read: false,
              createdAt: new Date().toISOString(),
              data: remoteMessage.data,
            },
          });

          // جلب الإشعارات الكاملة من Backend
          this.reduxDispatch({
            type: "notifications/fetchNotifications/pending",
          });
        }
      },
    );

    // معالج الضغط على الإشعار من الخلفية
    onNotificationOpenedApp(getMessaging(), (remoteMessage) => {
      console.log("[Firebase] Notification opened app:", {
        title: remoteMessage.notification?.title,
        data: remoteMessage.data,
      });

      this.handleNotificationTap(remoteMessage);
    });

    // معالج الإشعار عند فتح التطبيق (killed state)
    getInitialNotification(getMessaging()).then((remoteMessage) => {
      if (remoteMessage) {
        console.log("[Firebase] App opened from notification:", {
          title: remoteMessage.notification?.title,
        });

        this.handleNotificationTap(remoteMessage);
      }
    });
  }

  /**
   * معالجة الضغط على الإشعار والتنقل
   */
  private handleNotificationTap(remoteMessage: any): void {
    try {
      const linkUrl =
        remoteMessage.data?.linkUrl || remoteMessage.data?.link_url;
      const notificationData = remoteMessage.data;

      console.log("[Firebase] Handling notification tap:", {
        linkUrl,
        data: notificationData,
      });

      if (linkUrl) {
        this.navigateToScreen(linkUrl, notificationData);
      }
    } catch (error) {
      console.error("[Firebase] Error handling notification tap:", error);
    }
  }

  /**
   * التنقل إلى الشاشة بناءً على رابط الإشعار
   */
  private navigateToScreen(linkUrl: string, data?: Record<string, any>): void {
    console.log("[Firebase] Navigating to:", linkUrl);

    // استخدام Global notification navigation handler
    if (global.notificationNavigation) {
      global.notificationNavigation(linkUrl, data);
    }
  }

  /**
   * تحديد نوع الإشعار من البيانات
   */
  private getNotificationType(
    typeString?: string,
  ): "order_update" | "new_product" | "promotion" | "system" {
    const typeMap: Record<string, any> = {
      ORDER_UPDATE: "order_update",
      ORDER_STATUS_CHANGE: "order_update",
      NEW_ORDER: "order_update",
      NEW_PRODUCT: "new_product",
      PROMOTION: "promotion",
      OFFER_ACCEPTED: "order_update",
      OFFER_REJECTED: "system",
      NEW_REQUEST: "order_update",
      NEW_OFFER: "order_update",
    };

    if (!typeString) {
      return "system";
    }

    return typeMap[typeString] || "system";
  }

  /**
   * تسجيل Token بعد تسجيل الدخول
   */
  async registerTokenAfterLogin(): Promise<void> {
    try {
      const jwtToken = await getJwtToken();
      if (!jwtToken) return;

      const fcmToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);

      if (fcmToken) {
        // Token موجود محلياً، سجله مع Backend
        await this.registerTokenWithBackend(fcmToken, jwtToken);
      } else {
        // احصل على Token جديد وسجله
        await this.getAndRegisterFCMToken();
      }
    } catch (error) {
      console.error("[Firebase] Error registering token after login:", error);
    }
  }

  /**
   * إلغاء تسجيل Token عند تسجيل الخروج
   */
  async unregisterToken(): Promise<void> {
    try {
      const jwtToken = await getJwtToken();
      const fcmToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);

      if (!fcmToken) {
        console.log("[Firebase] No token to unregister");
        return;
      }

      // حذف من Backend
      if (jwtToken) {
        try {
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
            console.log("[Firebase] Token unregistered successfully");
          }
        } catch (error: any) {
          // 404 معناه Token موجود بالفعل غير مسجل
          if (error.response?.status === 404) {
            console.log("[Firebase] Token already unregistered");
          } else {
            throw error;
          }
        }
      }

      // مسح من AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEYS.FCM_TOKEN);
      console.log("[Firebase] Token cleared from local storage");
    } catch (error) {
      console.error("[Firebase] Error unregistering token:", error);
    }
  }

  /**
   * الحصول على FCM Token المحفوظ
   */
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
  }

  /**
   * تنظيف موارد الخدمة
   */
  cleanup(): void {
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    console.log("[Firebase] Service cleaned up");
  }
}

// تصدير الخدمة
export const firebaseNotificationService = new FirebaseNotificationService();

// تصدير واجهة موحدة متوافقة مع الكود الموجود
export const notificationServiceFirebase = {
  initialize: () => firebaseNotificationService.initialize(),
  getAndRegisterFCMToken: () =>
    firebaseNotificationService.getAndRegisterFCMToken(),
  registerTokenAfterLogin: () =>
    firebaseNotificationService.registerTokenAfterLogin(),
  unregisterToken: () => firebaseNotificationService.unregisterToken(),
  getStoredToken: () => firebaseNotificationService.getStoredToken(),
  setReduxDispatch: (dispatch: ReduxDispatch) =>
    firebaseNotificationService.setReduxDispatch(dispatch),
  cleanup: () => firebaseNotificationService.cleanup(),
};
