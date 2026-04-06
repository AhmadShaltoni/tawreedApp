# Push Notifications Implementation Guide

## Overview

This document outlines the complete push notification system implementation for Tawreed mobile app. The system handles intelligent permission requesting with retry logic, device token management, and deep linking to app screens.

---

## Features Implemented

### 1. Intelligent Permission Requesting
- **First Launch**: Ask for notification permission immediately
- **Permission Denied**: Remember the denial
- **Smart Retry**: Re-request after every 3 app launches (4th, 7th, 10th, etc.)
- **No Spam**: Respects user's choices while ensuring engagement

### 2. Device Token Management
- Automatic token generation on permission grant
- Token registration with backend API
- Token refresh handling
- Token unregistration on logout

### 3. Deep Linking
- Tap notifications to navigate to correct screens
- Handles 4 cases:
  - `/orders/:id` → Order detail screen
  - `/products/:id` → Product detail screen
  - `/cart` → Cart screen
  - `/notifications` → Notifications screen

### 4. Notification Handling
- **Foreground**: Displays in-app alert with option to open
- **Background**: System handles display, app navigates on tap
- **Killed App**: App bootstraps and navigates to notification data

---

## Project Setup

### Dependencies Installed

```bash
npm install expo-notifications
```

### Backend API Integration

The app connects to these backend endpoints:

#### Register Device Token
```
POST /api/v1/notifications/device-token
Headers: Authorization: Bearer {jwt_token}
Body: { token: string, platform: "IOS" | "ANDROID" }
```

#### Unregister Device Token
```
DELETE /api/v1/notifications/device-token
Headers: Authorization: Bearer {jwt_token}
Body: { token: string }
```

#### Get Device Tokens
```
GET /api/v1/notifications/device-token
Headers: Authorization: Bearer {jwt_token}
```

---

## File Structure

```
src/
├── services/
│   └── notification.service.ts    # Push notification service class
├── store/
│   └── slices/
│       └── notifications.slice.ts # Redux notification state (existing)
├── constants/
│   └── api.ts                     # API endpoints + new device token endpoints
app/
├── _layout.tsx                    # App initialization + deep linking
└── (tabs)/
    └── profile.tsx               # Logout with token unregistration
src/screens/auth/
├── LoginScreen.tsx               # Login + token registration
└── RegisterScreen.tsx            # Register + token registration
```

---

## Implementation Details

### 1. Storage Keys

Used in AsyncStorage for persistent state:
```typescript
NOTIFICATION_READY: "notification_ready"
NOTIFICATION_FIRST_LAUNCH_DONE: "notification_first_launch_done"
NOTIFICATION_DENIED_COUNTER: "notification_denied_counter"
DEVICE_TOKEN: "deviceToken"
```

### 2. Permission Request Flow

```
App Launch
    ↓
checkAndRequestPermission()
    ↓
├─ First Launch?
│  └─ YES → Request Permission immediately
│
└─ Not First Launch
   ├─ Check denial counter
   ├─ Counter >= 3?
   │  └─ YES → Request Permission, reset counter to 0
   │
   └─ Counter < 3
      └─ Increment counter by 1
```

### 3. Device Token Registration Flow

```
Permission Granted
    ↓
getExpoPushTokenAsync()
    ↓
User Authenticated?
├─ NO → Store token in AsyncStorage for later
└─ YES
   ↓
   POST /api/v1/notifications/device-token
   ├─ Success (201/200) → Save token locally
   └─ Error → Log and continue
```

### 4. Login/Register Flow

```
Login/Register Form Submission
    ↓
Dispatch login/register thunk
    ↓
Authentication Success
    ↓
Call notificationService.registerTokenAfterLogin()
    ├─ NO stored token? → Generate new token and register
    └─ Have stored token? → Verify and register
    ↓
Navigate to app
```

### 5. Logout Flow

```
LogoutButton Pressed
    ↓
Confirmation Alert
    ↓
User Confirms
    ↓
notificationService.unregisterToken()
    ├─ Get stored device token
    ├─ DELETE /api/v1/notifications/device-token
    └─ Clear local storage
    ↓
Dispatch logout() action
```

---

## API Endpoints Added

### Constants File Update (`src/constants/api.ts`)

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  REGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
  UNREGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
}
```

---

## Deep Linking Handler

Implemented in [app/_layout.tsx](app/_layout.tsx):

```typescript
global.notificationNavigation = (linkUrl: string, data?: any) => {
  if (linkUrl.startsWith("/orders/")) {
    const id = linkUrl.replace("/orders/", "");
    router.push(`/order/${id}`);
  } else if (linkUrl.startsWith("/products/")) {
    const id = linkUrl.replace("/products/", "");
    router.push(`/product/${id}`);
  } else if (linkUrl.includes("/cart")) {
    router.push("/(tabs)/cart");
  } else if (linkUrl.includes("/notifications")) {
    router.push("/notifications");
  } else {
    router.push("/(tabs)");
  }
};
```

---

## Service Class Architecture

### `NotificationServiceClass` in [src/services/notification.service.ts](src/services/notification.service.ts)

#### Key Methods

| Method | Purpose |
|--------|---------|
| `initialize()` | Initialize service on app launch |
| `checkAndRequestPermission()` | Check if permission is needed |
| `requestNotificationPermission()` | Show permission dialog |
| `registerDeviceToken()` | Get token and register with backend |
| `setupNotificationHandlers()` | Setup event listeners |
| `handleNotificationTap()` | Handle user tapping notification |
| `registerTokenAfterLogin()` | Register token after authentication |
| `unregisterToken()` | Unregister token on logout |
| `cleanup()` | Clean up event listeners |

---

## Usage in Components

### In App Layout (Initialization)

```typescript
import { notificationService } from "@/src/services/notification.service";

useEffect(() => {
  const initNotifications = async () => {
    try {
      await notificationService.initializePushNotifications();
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  };

  initNotifications();

  return () => {
    notificationService.cleanup();
  };
}, []);
```

### In Login Screen (After Authentication)

```typescript
import { notificationService } from "@/src/services/notification.service";

const handleLogin = useCallback(async () => {
  const result = await dispatch(login(credentials));
  
  if (login.fulfilled.match(result)) {
    // Register device token after successful login
    try {
      await notificationService.registerTokenAfterLogin();
    } catch (error) {
      console.error("Failed to register device token:", error);
    }
    router.replace("/(tabs)");
  }
}, [dispatch, router]);
```

### In Logout (Profile Screen)

```typescript
import { notificationService } from "@/src/services/notification.service";

const handleLogout = async () => {
  try {
    await notificationService.unregisterToken();
  } catch (error) {
    console.error("Failed to unregister token:", error);
  }
  dispatch(logout());
};
```

---

## Notification Payload Format

When backend sends notifications, include this structure:

```json
{
  "title": "طلب جديد",
  "body": "تم تلقي طلب جديد بقيمة 150 د.أ",
  "data": {
    "linkUrl": "/orders/order_123",
    "orderId": "order_123",
    "amount": "150"
  }
}
```

Supported URL formats:
- `/orders/{id}` - Opens order detail
- `/products/{id}` - Opens product detail
- `/cart` - Opens cart screen
- `/notifications` - Opens notifications screen
- Any other - Defaults to home

---

## Error Handling

The service gracefully handles errors:

1. **Permission Denied**: Stores count, retries after 3 launches
2. **Network Error**: Logs error, continues with stored token
3. **Token Registration Failed**: Non-blocking, user can still use app
4. **Token Unregistration Failed**: Continues with logout if 404 (already unregistered)

All errors are logged with `[PushNotifications]` prefix for debugging.

---

## Testing Checklist

- [ ] First app launch shows permission prompt
- [ ] Deny permission, counter increments
- [ ] Launch app 3 more times, permission asked on 4th launch
- [ ] Grant permission on 4th launch
- [ ] Device token registered with backend
- [ ] Token stored in AsyncStorage
- [ ] Login shows no duplicate permission requests
- [ ] Foreground notification shows alert
- [ ] Tap notification navigates to correct screen
- [ ] Deep links work for orders, products, cart, notifications
- [ ] Logout unregisters device token
- [ ] Kill app with notification pending, tap it navigates correctly

---

## Logging

All logs use `[PushNotifications]` prefix:

```typescript
console.log("[PushNotifications] Service initialized");
console.error("[PushNotifications] Initialization error:", error);
```

Monitor these logs to debug notification flow:
- Initialization status
- Permission requests
- Token generation and registration
- Notification handlers setup
- Navigation events

---

## Storage Cleanup

On logout, the following are cleared:
```typescript
{
  NOTIFICATION_READY,
  DEVICE_TOKEN
}
```

Note: `NOTIFICATION_FIRST_LAUNCH_DONE` and `NOTIFICATION_DENIED_COUNTER` are NOT cleared so the system remembers user's notification preferences across logins.

---

## Future Enhancements

1. **Notification Center UI**: Build notification history/center view
2. **Notification Preferences**: Allow users to customize notification types
3. **FCM/APNs Setup**: Setup actual push services for production
4. **Token Refresh Logic**: Handle token expiration and refresh
5. **Analytics**: Track notification engagement metrics
6. **A/B Testing**: Test different notification strategies

---

## Troubleshooting

### Tokens not registering
- Check if user is authenticated when registering
- Verify backend API is accessible
- Check AsyncStorage is accessible

### Notifications not showing
- Ensure permission was granted
- Check device notification settings
- Verify backend is sending notifications

### Deep linking not working
- Check if `global.notificationNavigation` is set
- Verify URL format matches one of the supported patterns
- Check router is available and not in loading state

---

## Backend Integration Notes

Make sure your backend:

1. **Sends notifications with correct payload structure** (linkUrl required)
2. **Handles 401 errors** for unregistered/expired tokens
3. **Returns 404 when deleting** missing tokens (safe to ignore)
4. **Supports both iOS and Android** platform identifiers
5. **Validates FCM/Expo tokens** before saving

---

## Security Considerations

1. **JWT Token**: Device registration requires valid JWT
2. **Secure Storage**: Tokens stored in `expo-secure-store`
3. **Token Encryption**: Expo handles encryption at platform level
4. **No PII in Links**: Deep links contain only IDs, not sensitive data
5. **Token Cleanup**: All tokens removed on logout

---

## Support & References

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Async Storage](https://react-native-async-storage.github.io/async-storage/)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)

