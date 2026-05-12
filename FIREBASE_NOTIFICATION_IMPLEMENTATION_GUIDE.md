# Firebase Push Notifications - Implementation Complete ✅

## Executive Summary

A production-ready **Firebase Cloud Messaging (FCM)** integration for Tawreed Mobile App has been implemented with:

- ✅ Full FCM token lifecycle management (generate → register → refresh → unregister)
- ✅ Three notification delivery states handled (foreground, background, killed app)
- ✅ Deep linking with auth protection
- ✅ Clean, reusable service architecture
- ✅ Redux integration for login/logout flows
- ✅ Android and iOS support with proper configurations

---

## What Was Implemented

### 1. Firebase Configuration Files

#### GoogleService-Info.plist (NEW - iOS)

```
Created: /GoogleService-Info.plist
Purpose: iOS Firebase configuration
Contents:
  - CLIENT_ID, REVERSED_CLIENT_ID
  - API_KEY, GCM_SENDER_ID
  - BUNDLE_ID: tawreed.app.com
  - PROJECT_ID: tawreed-d7550
  - STORAGE_BUCKET
```

#### google-services.json (EXISTING - Android)

```
Already exists: /google-services.json
Configured for:
  - Package: tawreedApp.com.jo
  - Project ID: tawreed-d7550
  - API Key: AIzaSyAQF6m1yPFrAZN8rwwDtNWuCsSG0vX1YWc
```

---

### 2. Notification Service Architecture

#### A. firebase.ts - Token Lifecycle

```typescript
src/services/notifications/firebase.ts

Purpose: Manages FCM token from generation to unregistration

Key Methods:
├─ initialize()                    // Request permission + get token
├─ getAndStoreFCMToken()          // Generate token + store locally
├─ setupTokenRefreshListener()    // Listen for token changes
├─ registerTokenWithBackend()     // POST token to backend (auth/anon)
├─ registerTokenAfterLogin()      // Re-register with JWT after login
├─ unregisterTokenOnLogout()      // DELETE token on logout
└─ getStoredToken()               // Retrieve cached token

Token Flow:
  1. initialize() → get token
  2. registerTokenWithBackend(token, null) → anonymous
  3. [After login] registerTokenAfterLogin() → with JWT
  4. onTokenRefresh() → auto re-register new token
  5. [On logout] unregisterTokenOnLogout() → DELETE
```

#### B. notification-handlers.ts - Message Handling

```typescript
src/services/notifications/notification-handlers.ts

Purpose: Handle notifications in 3 states

States Handled:
├─ FOREGROUND      onMessage()
│  └─ App open when notification arrives
│     → Display automatically, optional nav
│
├─ BACKGROUND      onNotificationOpenedApp()
│  └─ App minimized, user taps notification
│     → App comes to foreground, navigates
│
└─ KILLED          getInitialNotification()
   └─ App completely closed, user taps notification
      → App launches cold, navigates after init

Message Format Expected:
{
  notification: { title, body },
  data: {
    type: "ORDER_UPDATE" | "NEW_PRODUCT" | etc,
    linkUrl: "/orders/123",
    ...custom data
  }
}
```

#### C. notification-navigation.ts - Deep Linking

```typescript
src/services/notifications/notification-navigation.ts

Purpose: Route notifications to correct screens with auth protection

Routes:
├─ /orders/123           → /order/123 (requires auth)
├─ /products/456         → /product/456 (guest OK)
├─ /cart                 → /(tabs)/cart (requires auth)
├─ /notifications        → /notifications (requires auth)
└─ /orders (default)     → /(tabs)/orders (requires auth)

Auth Protection:
  if (route requires auth && !isAuthenticated)
    ├─ Redirect to login
    └─ Store notification for after-login
  else
    └─ Navigate directly

Type Mapping:
  "ORDER_STATUS_CHANGE" → "order_update"
  "NEW_PRODUCT"         → "new_product"
  "PROMOTION"           → "promotion"
  unknown               → "system"
```

#### D. index.ts - Coordinator

```typescript
src/services/notifications/index.ts

Purpose: Single entry point, orchestrates all services

Main Exports:
├─ notificationService.initialize()     // App startup
├─ notificationService.setupNavigation()// After auth ready
├─ notificationService.registerTokenAfterLogin()
├─ notificationService.unregisterTokenOnLogout()
├─ notificationService.updateAuthStatus()
└─ notificationService.cleanup()

This class:
  1. Coordinates firebase.ts (token lifecycle)
  2. Coordinates notification-handlers.ts (message handling)
  3. Coordinates notification-navigation.ts (deep linking)
  4. Exposes single API to app
```

---

### 3. Redux Integration

#### auth.slice.ts - Token Lifecycle Hooks

```typescript
src/store/slices/auth.slice.ts

Modified Thunks:

1. login()
   ├─ authService.login()
   ├─ setToken(JWT)
   ├─ await notificationService.registerTokenAfterLogin()
   └─ return { user, token }

2. register()
   ├─ authService.register()
   ├─ setToken(JWT)
   ├─ await notificationService.registerTokenAfterLogin()
   └─ return { user, token }

3. logout()
   ├─ await notificationService.unregisterTokenOnLogout()
   │  └─ DELETE token from backend
   └─ removeToken() → Clear JWT
```

Flow Diagram:

```
User Action          Redux Thunk              Notification Service
│                    │                        │
├─ Tap Login    ──→  login()          ──→    registerTokenAfterLogin()
│  (credentials)     ├─ auth service          ├─ POST /device-token (with JWT)
│                    ├─ setToken(JWT)        └─ Update in backend
│                    └─ notify service
│
├─ Tap Logout   ──→  logout()         ──→    unregisterTokenOnLogout()
│                    ├─ notify service        ├─ DELETE /device-token (with JWT)
│                    │  (DELETE token)        └─ Unlink from user
│                    └─ removeToken(JWT)
│
└─ App restart  ──→  restoreSession() ──→    No token action
                     (restore JWT)            (token already registered)
```

---

### 4. App Initialization

#### app/\_layout.tsx - Startup Sequence

```typescript
Sequence:

1. SplashScreen.preventAutoHideAsync()

2. AuthGate useEffect (on mount):
   ├─ initializeFirebase()
   │  └─ getApps() → Verify Firebase initialized
   │
   ├─ notificationService.initialize()
   │  ├─ firebaseMessagingService.initialize()
   │  │  ├─ requestPermission() → "Allow notifications?"
   │  │  ├─ getAndStoreFCMToken() → Get token
   │  │  └─ setupTokenRefreshListener() → Listen for changes
   │  └─ (handlers not setup yet - need router)
   │
   ├─ loadSavedLanguage()
   │
   └─ dispatch(restoreSession())
      └─ Restore JWT from secure storage if exists

3. useFocusEffect (every screen focus):
   ├─ notificationService.setupNavigation(router, isAuth)
   │  ├─ notificationHandlers.setupListeners()
   │  │  ├─ onMessage() for foreground
   │  │  ├─ onNotificationOpenedApp() for background
   │  │  └─ getInitialNotification() for killed app
   │  └─ Ready to navigate on notification tap
   │
   └─ notificationService.updateAuthStatus(isAuthenticated)

4. SplashScreen.hideAsync() when isInitialized = true
```

---

## FCM Token Lifecycle - Complete Flow

### Phase 1: App Install (Anonymous)

```
Fresh App Start
    ↓
Firebase Initialized (firebase-init.ts)
    ↓
notificationService.initialize()
    ├─ requestPermission()
    │  └─ "Allow Tawreed to send you notifications?"
    │     ├─ User taps "Allow" → Continue
    │     └─ User taps "Don't Allow" → Skip token registration
    │
    ├─ getAndStoreFCMToken()
    │  ├─ getToken(messaging)
    │  ├─ AsyncStorage.setItem('fcm_token', token)
    │  └─ this.currentToken = token
    │
    └─ setupTokenRefreshListener()
       └─ onTokenRefresh(messaging, callback)

POST /api/v1/notifications/device-token
{
  "token": "c4dW7P4exT...",
  "platform": "ANDROID" or "IOS"
}
(NO Authorization header)

Response: 201 Created
Backend: Creates DeviceToken record, userId = null

Status: ✅ ANONYMOUS TOKEN REGISTERED
```

### Phase 2: User Login

```
User taps "Login"
    ↓
auth.slice.ts → login()
    ├─ authService.login(phone, password)
    ├─ await setToken(JWT)
    │  └─ Save JWT to secure storage
    │
    └─ await notificationService.registerTokenAfterLogin()
       ├─ getJwtToken() → "Bearer ..."
       ├─ AsyncStorage.getItem('fcm_token') → retrieve existing token
       │
       └─ registerTokenWithBackend(token, JWT)
          │
          └─ POST /api/v1/notifications/device-token
             {
               "token": "c4dW7P4exT...",
               "platform": "ANDROID" or "IOS"
             }
             (Authorization: Bearer <JWT>)

Response: 200 OK
Backend: Updates DeviceToken record, userId = <user_id>

Status: ✅ TOKEN LINKED TO AUTHENTICATED USER
```

### Phase 3: Token Refresh

```
[Periodic - Firebase manages]
    ↓
onTokenRefresh() callback fires
    ├─ New token generated by Firebase
    ├─ AsyncStorage.setItem('fcm_token', newToken)
    ├─ this.currentToken = newToken
    │
    └─ getJwtToken() exists?
       ├─ Yes → registerTokenWithBackend(newToken, JWT)
       │        └─ POST /device-token with new token
       │
       └─ No  → Just store locally (for later)

Response: 200 OK
Backend: Updates DeviceToken with new token string

Status: ✅ TOKEN REFRESHED
```

### Phase 4: User Logout

```
User taps "Logout"
    ↓
auth.slice.ts → logout()
    │
    ├─ notificationService.unregisterTokenOnLogout()
    │  ├─ getJwtToken() → Last valid JWT
    │  ├─ AsyncStorage.getItem('fcm_token') → Current token
    │  │
    │  └─ DELETE /api/v1/notifications/device-token
    │     {
    │       "token": "c4dW7P4exT..."
    │     }
    │     (Authorization: Bearer <JWT>)
    │
    └─ removeToken()
       └─ Delete JWT from secure storage

Response: 200 OK
Backend: Updates DeviceToken record
         ├─ userId = null (unlinked)
         └─ token still exists (for broadcasts)

Status: ✅ TOKEN UNLINKED FROM USER
         ⚠️  Device can still receive BROADCAST notifications
```

---

## Notification Delivery States

### 1. Foreground (App Open)

```
App is running and in foreground
    ↓
Firebase receives message
    ↓
onMessage() listener fires
    ├─ Console: "[Notifications] 📱 Foreground message received"
    ├─ Notification banner appears automatically
    │  (setNotificationHandler configured to show alert)
    │
    └─ Optional: Process linkUrl for nav
       (user can tap banner to navigate)

User taps notification banner
    └─ Navigate to /orders/123 → /order/123
```

### 2. Background (App Minimized)

```
App running but minimized (home screen visible)
    ↓
Firebase receives message
    ├─ Notification stored by OS
    └─ System notification center shows it

User taps notification in notification center
    ↓
onNotificationOpenedApp() listener fires
    ├─ App comes to foreground
    ├─ Console: "[Notifications] 📲 Background message - notification tapped"
    │
    └─ Router.push(screen) navigates
       └─ Order detail, product detail, etc.

User sees: App opens, correct screen displayed
```

### 3. Killed App (App Completely Closed)

```
App completely terminated (not in memory)
    ↓
Firebase receives message
    ├─ Message stored by Firebase
    └─ System notification appears

User taps notification on lock screen
    ↓
App launches (cold start)
    ├─ firebase-init.ts initializes
    ├─ notificationService.initialize()
    ├─ Redux restored
    ├─ Router ready
    │
    └─ After ~1 second delay:
       getInitialNotification() returns cached message
       ├─ Console: "[Notifications] ⚠️  App killed - initial notification detected"
       │
       └─ handleKilledAppNotification()
          └─ setTimeout 1000ms → allow init to complete
             └─ Router.push(screen) navigates

User sees: App launches, correct screen displayed
```

---

## Deep Linking Examples

### Order Notification

```json
{
  "notification": {
    "title": "تحديث الطلب",
    "body": "تم تأكيد طلبك"
  },
  "data": {
    "type": "ORDER_STATUS_CHANGE",
    "orderId": "abc123",
    "linkUrl": "/orders/abc123",
    "status": "confirmed"
  }
}

Router: /orders/abc123 → /order/abc123 (exact match)
Screen: OrderDetailScreen(id: "abc123")
```

### Product Notification

```json
{
  "notification": {
    "title": "منتج جديد",
    "body": "تحقق من المنتج الجديد..."
  },
  "data": {
    "type": "NEW_PRODUCT",
    "productId": "prod456",
    "linkUrl": "/products/prod456"
  }
}

Router: /products/prod456 → /product/prod456 (exact match)
Screen: ProductDetailScreen(id: "prod456")
```

### Auth-Protected Route

```json
{
  "data": {
    "linkUrl": "/orders/order789"
  }
}

Check: isAuthRequiredRoute("/orders/order789") = true
Logged out? → Redirect to /(auth)/login
Logged in? → Navigate to /order/order789
```

---

## Error Handling & Resilience

### Permission Denied

```
User denies notification permission
    ↓
[FCM] ⚠️  Notification permission denied
    ↓
App continues normally
    ├─ FCM token NOT generated
    ├─ Backend registration skipped
    └─ No notifications received

Recovery:
  User can enable in Settings
  → App detects next time
  → Permission prompt shown again (up to 4 times)
```

### Firebase Not Initialized

```
initializeFirebase() fails
    ↓
Caught in try/catch in _layout.tsx
    ├─ Error logged: "[AppInit] Firebase initialization failed"
    └─ App continues (notifications just won't work)
```

### Backend Registration Fails

```
POST /device-token fails
    ├─ 401 Unauthorized
    │  └─ User not logged in (expected for guests)
    │     → Token stored locally for later
    │
    ├─ 500 Server Error
    │  └─ Error logged, retry next time
    │
    └─ Network Error
       └─ Catch in try/catch
          → Token still stored locally
          → Will retry on token refresh
```

### Token Unregistration Fails

```
DELETE /device-token fails
    ├─ 404 Not Found
    │  └─ Token already unregistered (OK)
    │
    └─ 500 Server Error
       └─ Error logged but user logout completes
          (JWT removed anyway)
```

---

## Storage & Persistence

### AsyncStorage (Local)

```
Key: 'fcm_token'
Value: "c4dW7P4exT..." (152+ chars)
Cleared: Never (persists across app restarts)
Used for: Token availability check, re-registration
```

### Secure Storage (JWT)

```
Key: 'tawreed_auth_token'
Value: "eyJhbGc..." (JWT)
Cleared: On logout
Accessed: All API calls (Authorization header)
```

### Backend Database

```
Table: DeviceToken
Columns:
  id          → UUID
  userId      → User ID (null for anonymous)
  token       → FCM token (unique)
  platform    → "IOS" or "ANDROID"
  isActive    → boolean
  createdAt   → timestamp
  updatedAt   → timestamp

Queries:
  Find all tokens for user:      WHERE userId = <id>
  Find all devices for broadcast: WHERE isActive = true
  Find by token:                  WHERE token = <token>
```

---

## Console Logging

All components log with prefixes for easy debugging:

```
[FCM]                      → firebase.ts
[Notifications]            → notification-handlers.ts
[Navigation]               → notification-navigation.ts
[NotificationService]      → index.ts coordinator
[AppInit]                  → app/_layout.tsx
[Auth]                     → Redux auth flows
[Firebase]                 → firebaseNotification.service.ts (old - can remove)
[PushNotifications]        → notification.service.ts (old - can remove)
```

Search console for each prefix to trace that component.

---

## Files Summary

### New Files Created

| File                                                    | Purpose                     |
| ------------------------------------------------------- | --------------------------- |
| `src/services/notifications/firebase.ts`                | FCM token lifecycle         |
| `src/services/notifications/notification-handlers.ts`   | Message handling (3 states) |
| `src/services/notifications/notification-navigation.ts` | Deep linking + auth         |
| `src/services/notifications/index.ts`                   | Coordinator                 |
| `GoogleService-Info.plist`                              | iOS Firebase config         |
| `FIREBASE_NOTIFICATION_INTEGRATION.md`                  | Testing guide (this file)   |

### Files Modified

| File                             | Changes                                                   |
| -------------------------------- | --------------------------------------------------------- |
| `app/_layout.tsx`                | Import new services, setup on startup, setup nav on focus |
| `src/store/slices/auth.slice.ts` | Add notification calls in login/register/logout           |
| `app.json`                       | Already had Firebase plugins (no change)                  |

### Files to Keep/Deprecate

| File                                           | Status        | Notes                                     |
| ---------------------------------------------- | ------------- | ----------------------------------------- |
| `src/services/firebaseNotification.service.ts` | ❓ DEPRECATED | Old Firebase service - can be removed     |
| `src/services/notification.service.ts`         | ❓ DEPRECATED | Expo notifications service - kept for now |
| `src/services/firebase-init.ts`                | ✅ KEEP       | Core Firebase initialization              |
| `google-services.json`                         | ✅ KEEP       | Android Firebase config                   |
| `GoogleService-Info.plist`                     | ✅ KEEP       | iOS Firebase config (NEW)                 |

---

## Next Steps for Backend

### 1. Verify Database Schema

```sql
CREATE TABLE DeviceToken (
  id           TEXT PRIMARY KEY,
  userId       TEXT,
  token        TEXT UNIQUE NOT NULL,
  platform     TEXT NOT NULL,
  isActive     BOOLEAN DEFAULT true,
  createdAt    DATETIME DEFAULT NOW(),
  updatedAt    DATETIME DEFAULT NOW(),

  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### 2. Test Endpoints

```bash
# Anonymous token (app install)
POST /api/v1/notifications/device-token
{ "token": "...", "platform": "ANDROID" }

# Authenticated token (after login)
POST /api/v1/notifications/device-token
Authorization: Bearer <JWT>
{ "token": "...", "platform": "ANDROID" }

# Unregister (logout)
DELETE /api/v1/notifications/device-token
Authorization: Bearer <JWT>
{ "token": "..." }
```

### 3. Send Test Notifications

```bash
# Use Firebase Console or your backend notification service
POST /admin/send-notification
{
  "userId": "user123",
  "title": "Test",
  "body": "Hello",
  "data": {
    "type": "ORDER_UPDATE",
    "linkUrl": "/orders/123"
  }
}

OR for broadcast:
{
  "query": { "isActive": true },
  "title": "Broadcast",
  "body": "Message for everyone"
}
```

---

## Verification Checklist

### Firebase Configuration

- [ ] `GoogleService-Info.plist` exists in root
- [ ] `google-services.json` exists in root
- [ ] `app.json` references both files
- [ ] Bundle ID matches: `tawreed.app.com` (iOS)
- [ ] Package name matches: `tawreedApp.com.jo` (Android)
- [ ] Firebase plugins in `app.json`:
  ```json
  "@react-native-firebase/app"
  "@react-native-firebase/messaging"
  ```

### Code Integration

- [ ] `src/services/notifications/` folder created with 4 files
- [ ] `app/_layout.tsx` imports from `@/src/services/notifications`
- [ ] `auth.slice.ts` imports `notificationService`
- [ ] `login()` thunk calls `registerTokenAfterLogin()`
- [ ] `register()` thunk calls `registerTokenAfterLogin()`
- [ ] `logout()` thunk calls `unregisterTokenOnLogout()`

### Runtime Behavior

- [ ] App startup logs: `[FCM] 📱 FCM Token generated`
- [ ] Permission prompt appears on first launch
- [ ] Token registration logged: `[FCM] ✅ Token registered successfully`
- [ ] Login re-registers: `[FCM] 🔗 Linking token to authenticated user`
- [ ] Logout unregisters: `[FCM] 🔓 Unlinking token from user account`
- [ ] Notifications appear in foreground
- [ ] Notification tap navigates correctly
- [ ] App killed → tap → navigates correctly

---

## Support & Debugging

For issues, check:

1. Console logs (search for [FCM], [Notifications], [Navigation])
2. Backend API responses (check 200 vs 201 vs 401)
3. Firebase console (check token validity)
4. Network tab in DevTools (verify requests sent)
5. Device logs (adb logcat for Android)
6. Secure storage contains JWT (check after login)
7. AsyncStorage contains FCM token

See FIREBASE_NOTIFICATION_INTEGRATION.md for detailed test scenarios.
