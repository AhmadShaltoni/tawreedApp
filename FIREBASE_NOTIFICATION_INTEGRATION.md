# Firebase Push Notifications Integration - Testing Guide

## Overview

Production-ready Firebase Cloud Messaging (FCM) implementation for Tawreed Mobile App with full token lifecycle management.

---

## Test Scenarios

### 1️⃣ App Install → Anonymous Token Registration

**Scenario**: Fresh app install, user hasn't logged in yet

**Steps**:

```bash
1. Uninstall app completely
2. Reinstall app fresh
3. Tap "Continue as Guest" (skip login)
```

**Expected Behavior**:

```
✅ [FCM] 📱 FCM Token generated: <token>
✅ [FCM] 📤 Registering token with backend: { platform, isAuthenticated: false }
✅ [FCM] ✅ Token registered successfully (ANONYMOUS)
```

**Verify in Backend**:

- Device token exists in database
- userId is NULL or "guest"
- isActive = true

**API Call Should Be**:

```
POST /api/v1/notifications/device-token
Headers: (no Authorization)
Body: { token: "...", platform: "ANDROID" or "IOS" }
Response: 200/201 OK
```

---

### 2️⃣ Login → Token Re-linking

**Scenario**: User logs in after anonymous registration

**Steps**:

```bash
1. App is running with anonymous token
2. Tap "Login"
3. Enter credentials: phone + password
4. Successful login
```

**Expected Behavior**:

```
✅ [Auth] Login successful
✅ [FCM] 🔗 Linking token to authenticated user...
✅ [FCM] 📤 Registering token with backend: { platform, isAuthenticated: true }
✅ [FCM] ✅ Token registered successfully (AUTHENTICATED)
```

**Console Timeline**:

```
1. auth/login thunk called
2. authService.login() returns token + user
3. setToken() stores JWT
4. notificationService.registerTokenAfterLogin() called
5. Existing FCM token re-registered with Authorization header
```

**Verify in Backend**:

- Device token record updated
- userId = authenticated user's ID
- isActive = true
- Token is now linked to user account

**API Call Should Be**:

```
POST /api/v1/notifications/device-token
Headers: Authorization: Bearer <JWT>
Body: { token: "...", platform: "ANDROID" or "IOS" }
Response: 200/201 OK
```

---

### 3️⃣ Token Refresh → Auto Re-registration

**Scenario**: Firebase refreshes the FCM token while app is running

**Steps**:

```bash
1. App running and authenticated
2. Wait (Firebase refreshes token periodically, or force it)
3. Check console logs
```

**Expected Behavior**:

```
✅ [FCM] 🔄 Token refreshed: <new_token>
✅ [FCM] 📤 Registering token with backend: { platform, isAuthenticated: true }
✅ [FCM] ✅ Token registered successfully
```

**Note**: Token refresh happens automatically in background. In test, you can observe:

- onTokenRefresh listener fires
- New token is stored locally
- Backend is notified with new token
- User doesn't need to do anything

---

### 4️⃣ Logout → Token Unlinking

**Scenario**: User logs out of their account

**Steps**:

```bash
1. App running and authenticated
2. Go to Profile screen
3. Tap "Logout" button
4. Confirm logout
```

**Expected Behavior**:

```
✅ [Auth] Logout initiated
✅ [FCM] 🔓 Unlinking token from user account...
✅ [FCM] 📤 Sending DELETE to backend
✅ [FCM] ✅ Token unregistered successfully
✅ [Auth] JWT token cleared from secure storage
```

**Important**: Token is NOT deleted from device, just unlinked from user

**Verify in Backend**:

- Device token record still exists
- userId is cleared/set to null
- isActive can be false
- But token remains in database (can receive broadcast notifications)

**API Call Should Be**:

```
DELETE /api/v1/notifications/device-token
Headers: Authorization: Bearer <JWT>
Body: { token: "..." }
Response: 200 OK
```

---

### 5️⃣ Manual Dashboard Notification

**Scenario**: Admin sends notification from dashboard to all users/specific user

**Steps**:

```bash
1. App running (authenticated or guest)
2. Admin sends notification from backend dashboard
3. Notification arrives on device
```

**Expected Behavior - Foreground (App Open)**:

```
✅ [Notifications] 📱 Foreground message received: { title, body, data }
✅ Notification banner appears on screen
✅ Can tap to navigate (optional)
```

**Expected Behavior - Background (App Minimized)**:

```
✅ Notification appears in system notification center
✅ User taps notification
✅ App opens and navigates to appropriate screen
✅ [Notifications] 📲 Background message - notification tapped
✅ [Navigation] 🧭 Navigating to: <linkUrl>
```

**Data Structure**:

```json
{
  "title": "جديد",
  "body": "منتج جديد: ...",
  "data": {
    "type": "NEW_PRODUCT",
    "linkUrl": "/products/123",
    "productId": "123"
  }
}
```

---

### 6️⃣ Order Status Notification

**Scenario**: System sends order status update notification

**Steps**:

```bash
1. Place an order
2. Admin changes order status (pending → confirmed → processing → shipped)
3. Notification is sent for each status change
4. App receives notification
```

**Expected Behavior**:

```
✅ Notification received with order ID
✅ Type: ORDER_UPDATE / ORDER_STATUS_CHANGE
✅ Deep link includes order ID: /orders/456
✅ User taps notification
✅ App navigates to Order Detail screen for that order
```

**Sample Notification**:

```json
{
  "title": "تحديث الطلب",
  "body": "تم تأكيد طلبك #456",
  "data": {
    "type": "ORDER_STATUS_CHANGE",
    "status": "confirmed",
    "orderId": "456",
    "linkUrl": "/orders/456"
  }
}
```

---

### 7️⃣ App Killed Notification

**Scenario**: App is completely closed, notification arrives, user taps it

**Steps**:

```bash
1. App running and authenticated
2. Completely close/kill app (not just minimized)
3. Send notification from backend
4. Notification appears in notification center
5. User taps notification
6. App launches and navigates to correct screen
```

**Expected Behavior**:

```
✅ Notification appears (even though app is dead)
✅ Firebase cached the notification
✅ User taps notification
✅ App launches (starts cold)
✅ Firebase-init, Notification service, Redux restored
✅ [Notifications] ⚠️  App killed - initial notification detected
✅ Navigation occurs (after 1s delay for init)
✅ User sees correct screen immediately
```

**Console Logs** (on next app start):

```
[FCM] ✅ Notification system ready
[NotificationService] Setting up notification navigation
[Notifications] ⚠️  App killed - initial notification detected
[Navigation] 🧭 Navigating to: /orders/456
Router navigates to /order/456
```

---

### 8️⃣ Background Notification Open

**Scenario**: App is minimized, notification arrives and user taps it

**Steps**:

```bash
1. App running (foreground)
2. Send notification from backend
3. Notification appears in banner/notification center
4. Minimize app (press home button)
5. Notification is now in notification center
6. User taps notification from notification center
```

**Expected Behavior**:

```
✅ Notification displayed normally
✅ App moves to background
✅ Firebase detects notification tap
✅ [Notifications] 📲 Background message - notification tapped
✅ onNotificationOpenedApp triggered
✅ [Navigation] 🧭 Navigating to: <linkUrl>
✅ App comes to foreground
✅ Router navigates to appropriate screen
```

---

### 9️⃣ Permission Request Flow

**Scenario**: Test iOS/Android permission prompts

**Steps**:

```bash
1. Fresh app install
2. App requests notification permission
3. User grants/denies
4. Test permission states
```

**Expected Behavior - Permission Granted**:

```
✅ [Firebase] Notification permission granted
✅ Token generation proceeds
✅ Backend registration happens
✅ User receives notifications
```

**Expected Behavior - Permission Denied**:

```
⚠️  [Firebase] Notification permission denied
✅ FCM token still generated (but won't be delivered to lock screen)
✅ Backend registration attempted
✅ App continues working (notifications just won't show)
✅ User can enable later from settings
```

---

## Debugging Checklist

### Firebase Configuration

```bash
# 1. Verify Firebase is initialized
✅ Check: app/_layout.tsx calls initializeFirebase()
✅ Check: GoogleService-Info.plist exists (iOS)
✅ Check: google-services.json exists (Android)
✅ Check: PROJECT_ID in env matches plist/json

# 2. Verify FCM token generation
✅ Console shows: [FCM] 📱 FCM Token generated
✅ Token is 152+ characters long
✅ Token is stored in AsyncStorage: fcm_token
✅ Different tokens for iOS/Android (expected)
```

### Token Lifecycle

```bash
# 1. Verify app install flow
✅ Token generated
✅ POST /api/v1/notifications/device-token (no auth header)
✅ Backend stores token with userId=null

# 2. Verify login flow
✅ Login successful
✅ JWT stored in secure storage
✅ [FCM] 🔗 Linking token to authenticated user
✅ POST /api/v1/notifications/device-token (WITH auth header)
✅ Backend updates token with userId=<user_id>

# 3. Verify logout flow
✅ DELETE /api/v1/notifications/device-token
✅ Backend unlinks token (userId=null)
✅ JWT removed from secure storage
✅ App can still receive broadcast notifications
```

### Notification Delivery

```bash
# 1. Verify foreground handling
✅ [Notifications] 📱 Foreground message received
✅ Notification banner appears
✅ Redux updated (if needed)

# 2. Verify background/killed app handling
✅ [Notifications] ⚠️  App killed - initial notification detected
OR
✅ [Notifications] 📲 Background message - notification tapped
✅ [Navigation] 🧭 Navigating to: <linkUrl>

# 3. Verify deep linking
✅ /orders/123 → /order/123 navigation works
✅ /products/456 → /product/456 navigation works
✅ /cart → /(tabs)/cart works
✅ /notifications → /notifications works
```

---

## Common Issues & Solutions

### ❌ Issue: "Firebase app not initialized"

**Cause**: GoogleService-Info.plist missing or wrong package name

**Solution**:

```bash
1. Verify GoogleService-Info.plist exists in root
2. Check app.json: ios.bundleIdentifier = "tawreed.app.com"
3. Check firebase-init.ts initialization order
4. Rebuild: npx expo prebuild --clean
```

### ❌ Issue: Token not generated

**Cause**: Permission not granted, Firebase not initialized

**Solution**:

```bash
1. Check [FCM] logs in console
2. Ensure permission prompt appears and user taps "Allow"
3. Check if app is running in Expo Go (some features limited)
4. Check BUILD_TOOLS_VERSION in android/app/build.gradle
```

### ❌ Issue: Backend not receiving token registration

**Cause**: API endpoint wrong, no authorization header, network error

**Solution**:

```bash
1. Verify API_ENDPOINTS.REGISTER_DEVICE_TOKEN = "/api/v1/notifications/device-token"
2. Check network tab in DevTools for requests
3. Verify Backend server is running
4. Check 401/403 auth errors
```

### ❌ Issue: Notifications not appearing

**Cause**: Token not registered, notification not targeting token, permissions

**Solution**:

```bash
1. Verify token was successfully registered (check backend DB)
2. Check notification targeting (is it sent to this device?)
3. Verify notification JSON format is correct
4. Check app.json has Firebase plugins
5. For Android: verify notification channel setup
6. For iOS: verify entitlements for push notifications
```

---

## FCM Token Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────┐
│           APP INSTALL (User not logged in)              │
├─────────────────────────────────────────────────────────┤
│ 1. generateFCMToken()                                   │
│ 2. POST /device-token (no auth) → ANONYMOUS REGISTER   │
│ 3. Token stored in Backend with userId=null            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          USER LOGIN (Authenticate)                      │
├─────────────────────────────────────────────────────────┤
│ 1. authService.login()                                  │
│ 2. JWT stored in secure storage                         │
│ 3. registerTokenAfterLogin() called                     │
│ 4. POST /device-token (WITH auth) → RE-REGISTER        │
│ 5. Token linked to userId in Backend                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│        TOKEN REFRESH (Periodic or on demand)            │
├─────────────────────────────────────────────────────────┤
│ 1. onTokenRefresh() listener fires                      │
│ 2. New token generated by Firebase                      │
│ 3. POST /device-token (WITH auth) → REFRESH            │
│ 4. Backend updates with new token                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           USER LOGOUT (Unlink)                          │
├─────────────────────────────────────────────────────────┤
│ 1. logout() thunk called                                │
│ 2. unregisterTokenOnLogout() called                     │
│ 3. DELETE /device-token → UNLINK TOKEN                 │
│ 4. JWT removed from secure storage                      │
│ 5. Token still in Backend but userId=null              │
│    (Can still receive BROADCAST notifications)         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ Ready for relogin│
         └──────────────────┘
```

---

## Files Changed/Created

### New Files

```
src/services/notifications/
  ├── firebase.ts ..................... FCM token lifecycle
  ├── notification-handlers.ts ........ Foreground/background/killed
  ├── notification-navigation.ts ...... Deep linking
  └── index.ts ....................... Coordinator
```

### Modified Files

```
app/_layout.tsx ..................... Notification system setup
src/store/slices/auth.slice.ts ....... Login/logout token management
GoogleService-Info.plist ............ iOS Firebase config
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           NOTIFICATION SYSTEM ARCHITECTURE              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  app/_layout.tsx (App Startup)                          │
│  ├─ initializeFirebase()                               │
│  └─ notificationService.initialize()                   │
│                                                         │
│  firebase.ts (Token Lifecycle)                          │
│  ├─ initialize() → get FCM token                       │
│  ├─ setupTokenRefreshListener() → listen for changes  │
│  ├─ registerTokenWithBackend() → API call             │
│  ├─ registerTokenAfterLogin() → re-register auth      │
│  └─ unregisterTokenOnLogout() → unlink token          │
│                                                         │
│  notification-handlers.ts (Message Handling)           │
│  ├─ onMessage() → foreground notifications            │
│  ├─ onNotificationOpenedApp() → background tap        │
│  └─ getInitialNotification() → app killed tap         │
│                                                         │
│  notification-navigation.ts (Deep Linking)             │
│  ├─ navigate() → route to correct screen              │
│  └─ isAuthRequiredRoute() → check auth               │
│                                                         │
│  auth.slice.ts (Redux Integration)                     │
│  ├─ login → registerTokenAfterLogin()                 │
│  ├─ register → registerTokenAfterLogin()              │
│  └─ logout → unregisterTokenOnLogout()                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Backend API Contract

### POST /api/v1/notifications/device-token

**Anonymous Registration** (App Install)

```bash
POST /api/v1/notifications/device-token
Content-Type: application/json

{
  "token": "c4dW7P4exT...152 chars",
  "platform": "ANDROID"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "message": "Device token registered successfully",
    "deviceToken": {
      "id": "...",
      "platform": "ANDROID",
      "isActive": true
    }
  }
}
```

**Authenticated Registration** (After Login)

```bash
POST /api/v1/notifications/device-token
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "token": "c4dW7P4exT...152 chars",
  "platform": "ANDROID"
}

Response: 201 Created or 200 OK
```

### DELETE /api/v1/notifications/device-token

**Logout**

```bash
DELETE /api/v1/notifications/device-token
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "token": "c4dW7P4exT...152 chars"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Device token unregistered successfully"
  }
}
```

---

## Next Steps

1. ✅ Deploy backend notification endpoints
2. ✅ Test all 9 scenarios above
3. ✅ Monitor console logs during testing
4. ✅ Verify backend database records
5. ✅ Test on actual iOS and Android devices
6. ✅ Verify notifications appear on lock screen
7. ✅ Test with various notification types
