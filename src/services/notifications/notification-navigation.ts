/**
 * Notification Navigation Handler
 *
 * Routes notifications to appropriate screens. Two schemes are supported:
 *
 * 1. Structured (preferred) — `data.targetType` + `data.targetId`, set by the
 *    admin compose form: PRODUCT, CATEGORY, BRAND, COLLECTION, ORDER, URL, NONE.
 *    `targetId` holds the collection SLUG (not its id) for COLLECTION targets.
 * 2. Legacy — free-text `linkUrl` prefix matching (`/products/<id>`, `/orders/<id>`, ...),
 *    kept as a fallback for notifications sent before the structured scheme existed.
 *
 * Handles authentication requirement:
 * - If logged out and route needs auth → redirect to login first
 */

import { Linking } from "react-native";

export interface NotificationNavigation {
  linkUrl: string;
  data?: Record<string, string | object>;
}

const AUTH_REQUIRED_TARGET_TYPES = new Set(["ORDER", "ADMIN_ORDER"]);

type TargetType =
  | "PRODUCT"
  | "CATEGORY"
  | "BRAND"
  | "COLLECTION"
  | "ORDER"
  | "ADMIN_ORDER"
  | "URL"
  | "NONE";

export class NotificationNavigationService {
  private router: any = null;
  private isAuthenticated = false;

  /**
   * Initialize with router and auth status
   */
  initialize(router: any, isAuthenticated: boolean): void {
    this.router = router;
    this.isAuthenticated = isAuthenticated;
    console.log("[Navigation] Notification navigation initialized");
  }

  /**
   * Update authentication status
   */
  setAuthenticated(isAuthenticated: boolean): void {
    this.isAuthenticated = isAuthenticated;
  }

  /**
   * Navigate to screen based on notification link
   * Handles auth redirects automatically
   */
  navigate(linkUrl: string, data?: Record<string, string | object>): void {
    if (!this.router) {
      console.warn("[Navigation] Router not initialized");
      return;
    }

    console.log("[Navigation] 🧭 Navigating to:", linkUrl, { data });

    try {
      const targetType = this.extractTargetType(data);

      // Determine if route requires authentication
      const requiresAuth = targetType
        ? AUTH_REQUIRED_TARGET_TYPES.has(targetType)
        : this.isAuthRequiredRoute(linkUrl);

      // If not authenticated and route requires auth, redirect to login first
      if (requiresAuth && !this.isAuthenticated) {
        console.log(
          "[Navigation] ℹ️  Route requires auth, redirecting to login",
        );
        this.router.replace("/(auth)/login");
        // Store notification data to process after login
        // This would be handled by Redux or global state
        return;
      }

      // Navigate to appropriate screen
      this.navigateToRoute(linkUrl, data);
    } catch (error) {
      console.error("[Navigation] Navigation error:", error);
    }
  }

  private extractTargetType(
    data?: Record<string, string | object>,
  ): TargetType | null {
    const targetType = data?.targetType;
    return typeof targetType === "string" ? (targetType as TargetType) : null;
  }

  /**
   * Determine if a route requires authentication (legacy linkUrl parsing)
   */
  private isAuthRequiredRoute(linkUrl: string): boolean {
    // Routes that work for guests
    const guestRoutes = ["/(tabs)", "/products", "/categories", "/product/"];

    return !guestRoutes.some((route) => linkUrl.startsWith(route));
  }

  /**
   * Navigate to specific route. Prefers the structured `data.targetType` /
   * `data.targetId` scheme; falls back to legacy `linkUrl` prefix parsing
   * for notifications sent before that scheme existed.
   */
  private navigateToRoute(
    linkUrl: string,
    data?: Record<string, string | object>,
  ): void {
    const targetType = this.extractTargetType(data);
    const targetId =
      typeof data?.targetId === "string" ? data.targetId : null;

    if (targetType) {
      switch (targetType) {
        case "PRODUCT":
          if (targetId) {
            console.log("[Navigation] → Product Detail:", targetId);
            this.router.push(`/product/${targetId}`);
            return;
          }
          break;
        case "CATEGORY":
          if (targetId) {
            console.log("[Navigation] → Category products:", targetId);
            this.router.push({
              pathname: "/products",
              params: { categoryId: targetId, includeDescendants: "true" },
            });
            return;
          }
          break;
        case "BRAND":
          if (targetId) {
            console.log("[Navigation] → Brand products:", targetId);
            this.router.push({
              pathname: "/products",
              params: { brandId: targetId },
            });
            return;
          }
          break;
        case "COLLECTION":
          if (targetId) {
            // targetId holds the collection slug
            console.log("[Navigation] → Marketing section:", targetId);
            this.router.push(`/marketing-section/${targetId}`);
            return;
          }
          break;
        case "ORDER":
          if (targetId) {
            console.log("[Navigation] → Order Detail:", targetId);
            this.router.push(`/order/${targetId}`);
            return;
          }
          break;
        case "ADMIN_ORDER":
          // Admin order screen (new order / edit request pushes to staff).
          // The /admin layout redirects non-admin users home.
          if (targetId) {
            console.log("[Navigation] → Admin Order Detail:", targetId);
            this.router.push(`/admin/order/${targetId}`);
            return;
          }
          break;
        case "URL":
          if (linkUrl) {
            console.log("[Navigation] → External URL:", linkUrl);
            Linking.openURL(linkUrl).catch((error) =>
              console.error("[Navigation] Failed to open URL:", error),
            );
            return;
          }
          break;
        case "NONE":
          console.log("[Navigation] → Notifications (no target)");
          this.router.push("/notifications");
          return;
      }
      // Structured target type present but missing/invalid data — fall through to Home
      console.log("[Navigation] → Home (incomplete structured target)");
      this.router.push("/(tabs)");
      return;
    }

    // Legacy fallback: parse the free-text linkUrl
    if (linkUrl.startsWith("/admin/orders/")) {
      // Admin order deep link (staff notifications stored before the
      // structured ADMIN_ORDER target existed)
      const orderId = linkUrl.replace("/admin/orders/", "");
      console.log("[Navigation] → Admin Order Detail:", orderId);
      this.router.push(`/admin/order/${orderId}`);
    } else if (linkUrl.startsWith("/orders/")) {
      // Order Detail: /orders/123 → /order/123
      const orderId = linkUrl.replace("/orders/", "");
      console.log("[Navigation] → Order Detail:", orderId);
      this.router.push(`/order/${orderId}`);
    } else if (linkUrl.startsWith("/products/")) {
      // Product Detail: /products/456 → /product/456
      const productId = linkUrl.replace("/products/", "");
      console.log("[Navigation] → Product Detail:", productId);
      this.router.push(`/product/${productId}`);
    } else if (linkUrl.includes("/cart")) {
      // Cart
      console.log("[Navigation] → Cart");
      this.router.push("/(tabs)/cart");
    } else if (linkUrl.includes("/notifications")) {
      // Notifications list
      console.log("[Navigation] → Notifications");
      this.router.push("/notifications");
    } else if (linkUrl.includes("/orders")) {
      // Orders list
      console.log("[Navigation] → Orders");
      this.router.push("/(tabs)/orders");
    } else {
      // Default: Home
      console.log("[Navigation] → Home (default)");
      this.router.push("/(tabs)");
    }
  }

  /**
   * Get deep link URL from notification data
   */
  static extractLinkUrl(data?: Record<string, string | object>): string | null {
    if (!data) return null;
    const linkUrl = data.linkUrl || data.link_url;
    return typeof linkUrl === "string" ? linkUrl : null;
  }

  /**
   * Build notification metadata for Redux dispatch
   */
  static buildNotificationMetadata(remoteMessage: any) {
    return {
      id: remoteMessage.messageId || `msg_${Date.now()}`,
      title: remoteMessage.notification?.title || "Notification",
      body: remoteMessage.notification?.body || "",
      type: this.mapNotificationType(
        typeof remoteMessage.data?.type === "string"
          ? remoteMessage.data.type
          : undefined,
      ),
      read: false,
      createdAt: new Date().toISOString(),
      data: remoteMessage.data,
      deepLink: this.extractLinkUrl(remoteMessage.data),
    };
  }

  /**
   * Map notification type from backend to app types
   */
  static mapNotificationType(
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

    return typeMap[typeString || ""] || "system";
  }
}

export const notificationNavigationService =
  new NotificationNavigationService();
