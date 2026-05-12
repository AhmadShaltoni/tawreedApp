/**
 * Notification Navigation Handler
 *
 * Routes notifications to appropriate screens:
 * - Order notifications → Order Detail
 * - Product notifications → Product Detail
 * - Cart notifications → Cart
 * - General notifications → Notifications list
 *
 * Handles authentication requirement:
 * - If logged out and route needs auth → redirect to login first
 */


export interface NotificationNavigation {
  linkUrl: string;
  data?: Record<string, string>;
}

class NotificationNavigationService {
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
  navigate(linkUrl: string, data?: Record<string, string>): void {
    if (!this.router) {
      console.warn("[Navigation] Router not initialized");
      return;
    }

    console.log("[Navigation] 🧭 Navigating to:", linkUrl, { data });

    try {
      // Determine if route requires authentication
      const requiresAuth = this.isAuthRequiredRoute(linkUrl);

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

  /**
   * Determine if a route requires authentication
   */
  private isAuthRequiredRoute(linkUrl: string): boolean {
    // Routes that work for guests
    const guestRoutes = ["/(tabs)", "/products", "/categories", "/product/"];

    return !guestRoutes.some((route) => linkUrl.startsWith(route));
  }

  /**
   * Navigate to specific route
   */
  private navigateToRoute(
    linkUrl: string,
    data?: Record<string, string>,
  ): void {
    if (linkUrl.startsWith("/orders/")) {
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
  static extractLinkUrl(data?: Record<string, string>): string | null {
    if (!data) return null;
    return data.linkUrl || data.link_url || null;
  }

  /**
   * Build notification metadata for Redux dispatch
   */
  static buildNotificationMetadata(remoteMessage: any) {
    return {
      id: remoteMessage.messageId || `msg_${Date.now()}`,
      title: remoteMessage.notification?.title || "Notification",
      body: remoteMessage.notification?.body || "",
      type: this.mapNotificationType(remoteMessage.data?.type),
      read: false,
      createdAt: new Date().toISOString(),
      data: remoteMessage.data,
      deepLink: this.extractLinkUrl(remoteMessage.data),
    };
  }

  /**
   * Map notification type from backend to app types
   */
  private static mapNotificationType(
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
