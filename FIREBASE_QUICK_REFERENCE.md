# Firebase Notifications - Quick Reference Card

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION SYSTEM FLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  APP STARTUP                                                        │
│  ├─ Firebase Init                                                  │
│  ├─ Request Permission                                            │
│  ├─ Generate FCM Token                                            │
│  └─ Register Token (Anonymous)                                    │
│         │                                                          │
│         ▼                                                          │
│  USER LOGIN                                                         │
│  ├─ Authenticate                                                  │
│  └─ Re-register Token (With JWT)                                  │
│         │                                                          │
│         ▼                                                          │
│  CONTINUOUS OPERATION                                              │
│  ├─ Listen for Token Refresh → Auto Re-register                  │
│  ├─ Listen for Notifications                                     │
│  │  ├─ Foreground: onMessage()                                  │
│  │  ├─ Background: onNotificationOpenedApp()                    │
│  │  └─ Killed App: getInitialNotification()                     │
│  └─ Handle Navigation via linkUrl                                │
│         │                                                          │
│         ▼                                                          │
│  USER LOGOUT                                                        │
│  ├─ Unregister Token (DELETE)                                    │
│  └─ Clear JWT                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Core Services

### Service 1: firebase.ts (Token Lifecycle)

| Method                       | When Called            | What It Does                                            |
| ---------------------------- | ---------------------- | ------------------------------------------------------- |
| `initialize()`               | App startup            | Request permission + get token + setup refresh listener |
| `registerTokenWithBackend()` | App install & login    | Send token to backend API                               |
| `registerTokenAfterLogin()`  | After successful login | Re-send token with JWT                                  |
| `unregisterTokenOnLogout()`  | On logout              | DELETE token from backend                               |

```javascript
// Token changes
App Start → generate token → register (anon) → localStorage token
                                              ↓
Login → re-register (with JWT) → backend links to user
                                              ↓
Token Refresh (periodic) → auto re-register → backend updates
                                              ↓
Logout → unregister (DELETE) → backend unlinks user
```

---

### Service 2: notification-handlers.ts (Message Handling)

| Handler                     | Triggered When               | Behavior                                        |
| --------------------------- | ---------------------------- | ----------------------------------------------- |
| `onMessage()`               | App is open                  | Foreground notification → Display banner        |
| `onNotificationOpenedApp()` | App minimized, user taps     | App comes to foreground → Navigate              |
| `getInitialNotification()`  | App launches after cold kill | Wait for init → Parse cached message → Navigate |

```javascript
// Three notification states
Foreground (App Open)
  ├─ Notification arrives
  └─ Display banner automatically

Background (App Minimized)
  ├─ Notification arrives
  ├─ User taps in notification center
  ├─ App comes to foreground
  └─ Navigate

Killed App (App Closed)
  ├─ Notification arrives
  ├─ User taps on lock screen
  ├─ App launches from scratch
  └─ Navigate (after 1s delay for init)
```

---

### Service 3: notification-navigation.ts (Deep Linking)

| Input            | Output           | Auth Required? |
| ---------------- | ---------------- | -------------- |
| `/orders/123`    | `/order/123`     | ✅ Yes         |
| `/products/456`  | `/product/456`   | ❌ No          |
| `/cart`          | `/(tabs)/cart`   | ✅ Yes         |
| `/notifications` | `/notifications` | ✅ Yes         |
| Unknown          | `/(tabs)`        | ❌ No          |

```javascript
// Auth protection
if (linkUrl requires auth && user not logged in) {
  redirect to /(auth)/login
  // Notification will process after login
} else {
  navigate directly to screen
}
```

---

### Service 4: index.ts (Coordinator)

**Single entry point that:**

- Coordinates firebase.ts (token)
- Coordinates notification-handlers.ts (messages)
- Coordinates notification-navigation.ts (routing)
- Exposes clean API to app

```javascript
notificationService.initialize(); // App startup
notificationService.setupNavigation(); // After router ready
notificationService.registerTokenAfterLogin(); // On login
notificationService.unregisterTokenOnLogout(); // On logout
notificationService.updateAuthStatus(); // When auth changes
```

---

## 🔄 Token Lifecycle Timeline

```
TIME:  0h      ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓      24h
       ├────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
STATE: ANON    LOGIN  AUTH   AUTH   AUTH   AUTH   AUTH   AUTH   LOGOUT ANON
       │        │      │      │      │      │      │      │      │      │
API:   POST→ POST→   CHECK  CHECK  CHECK  CHECK  CHECK  CHECK DELETE→ (listen)
       201    200    (ok)   (ok)   (ok)   (ok)   (ok)   (ok)   200
       │        │      │      │      │      │      │      │      │      │
TOKEN: GEN    STORED  LINK   LINKED LINKED LINKED LINKED LINKED UNLINK ANON
```

---

## 🛠️ Integration Points

### 1. app/\_layout.tsx (Startup)

```typescript
// Initialize Firebase
await initializeFirebase()

// Initialize Notifications
await notificationService.initialize()
  ├─ requestPermission()
  ├─ getAndStoreFCMToken()
  └─ setupTokenRefreshListener()

// Setup Navigation (when router available)
notificationService.setupNavigation(router, isAuthenticated)
  ├─ Setup onMessage() listener
  ├─ Setup onNotificationOpenedApp() listener
  └─ Setup getInitialNotification() listener
```

### 2. auth.slice.ts (Login/Logout)

```typescript
// In login() thunk
await authService.login(credentials);
await setToken(JWT);
await notificationService.registerTokenAfterLogin();

// In logout() thunk
await notificationService.unregisterTokenOnLogout();
await removeToken();
```

---

## 📡 API Calls (Backend Contract)

### POST /api/v1/notifications/device-token

**Anonymous** (No auth header)

```json
{
  "token": "c4dW7P4exT...",
  "platform": "ANDROID"
}
→ Response 201: Created
→ Backend: userId = null
```

**Authenticated** (With JWT header)

```json
Authorization: Bearer eyJhbGc...
{
  "token": "c4dW7P4exT...",
  "platform": "ANDROID"
}
→ Response 200: OK
→ Backend: userId = user_id
```

### DELETE /api/v1/notifications/device-token

```json
Authorization: Bearer eyJhbGc...
{
  "token": "c4dW7P4exT..."
}
→ Response 200: OK
→ Backend: userId = null (unlinked, not deleted)
```

---

## 🧠 Data Structures

### Notification Message (From Backend)

```json
{
  "notification": {
    "title": "جديد",
    "body": "منتج جديد متوفر الآن"
  },
  "data": {
    "type": "NEW_PRODUCT",
    "linkUrl": "/products/123",
    "productId": "123"
  }
}
```

### Order Status Notification

```json
{
  "notification": {
    "title": "تحديث الطلب",
    "body": "تم تأكيد طلبك #456"
  },
  "data": {
    "type": "ORDER_STATUS_CHANGE",
    "orderId": "456",
    "status": "confirmed",
    "linkUrl": "/orders/456"
  }
}
```

---

## ✅ Testing Matrix

| Scenario         | App State          | Expected                      | ✓   |
| ---------------- | ------------------ | ----------------------------- | --- |
| Token Generation | Fresh install      | `[FCM] 📱 Token generated`    |     |
| Anon Register    | After permission   | POST /device-token (no auth)  |     |
| Login            | User logs in       | POST /device-token (with JWT) |     |
| Token Refresh    | Periodic           | Auto POST /device-token       |     |
| Logout           | User logs out      | DELETE /device-token          |     |
| Foreground       | App open           | Banner appears                |     |
| Background       | App minimized, tap | App opens, navigates          |     |
| Killed App       | App closed, tap    | App launches, navigates       |     |
| Auth Route       | Logged out         | Redirect to login             |     |

---

## 🔍 Console Debug

All components log with prefix for easy search:

```
[FCM]                  → firebase.ts token lifecycle
[Notifications]        → notification-handlers.ts message handling
[Navigation]           → notification-navigation.ts deep linking
[NotificationService]  → index.ts coordinator
[AppInit]              → app/_layout.tsx startup
[Auth]                 → Redux auth events
```

**Example traces:**

```
[AppInit] Initializing Firebase...
[AppInit] ✅ Firebase initialized
[AppInit] Initializing notification system...
[FCM] Initializing Firebase Messaging...
[FCM] ✅ Notification permission granted
[FCM] 📱 FCM Token generated: c4dW7P4exT...
[FCM] 📤 Registering token with backend: { platform, isAuthenticated: false }
[FCM] ✅ Token registered successfully
[NotificationService] ✅ Notification system ready
```

---

## 🚨 Common Issues

| Issue                  | Check                | Solution                                      |
| ---------------------- | -------------------- | --------------------------------------------- |
| No FCM token           | [FCM] logs           | Check permission granted, check Firebase init |
| Token not at backend   | Network tab          | Check POST request sent, check response 201   |
| No notification        | Console logs         | Check backend sending to correct token        |
| Foreground not showing | Notification handler | Verify setNotificationHandler configured      |
| Navigation not working | [Navigation] logs    | Check linkUrl in data, check auth state       |

---

## 📚 Documentation

| Document                                          | Purpose                | Length          |
| ------------------------------------------------- | ---------------------- | --------------- |
| **FIREBASE_NOTIFICATION_INTEGRATION.md**          | Test all 9 scenarios   | 600+ lines      |
| **FIREBASE_NOTIFICATION_IMPLEMENTATION_GUIDE.md** | Architecture deep-dive | 400+ lines      |
| **FIREBASE_DELIVERABLES_SUMMARY.md**              | What was delivered     | 300+ lines      |
| **FIREBASE_QUICK_REFERENCE.md**                   | This card              | Quick reference |

---

## 🎬 Quick Start

### For Developers

1. Read this card (you are here ✓)
2. Run app → Check console for [FCM] logs
3. Test login/logout → Check API calls
4. See FIREBASE_NOTIFICATION_INTEGRATION.md for test scenarios

### For QA

1. Run 9 test scenarios from FIREBASE_NOTIFICATION_INTEGRATION.md
2. Monitor console logs for [FCM], [Notifications], [Navigation]
3. Check backend database for token records
4. Verify notifications appear on device

### For Backend

1. Deploy `/api/v1/notifications/device-token` endpoints
2. Test POST (anonymous) → POST (with JWT) → DELETE flow
3. Send test notification from dashboard
4. Monitor token lifecycle in database

---

## ✨ Status

```
✅ Firebase Config         (iOS + Android)
✅ Token Lifecycle         (Generate → Register → Refresh → Unregister)
✅ Message Handling        (Foreground + Background + Killed App)
✅ Deep Linking            (With auth protection)
✅ Redux Integration       (Login/Logout hooks)
✅ Clean Architecture      (4 services + 1 coordinator)
✅ Full Documentation      (Testing + Implementation guides)
✅ Production Ready        (Error handling + Resilience)

READY FOR:
├─ Backend integration
├─ Testing (all 9 scenarios)
├─ User acceptance testing
├─ Production deployment
└─ Notification sending
```

---

## 📞 Need Help?

1. **Setup Issue?** → Check FIREBASE_NOTIFICATION_IMPLEMENTATION_GUIDE.md
2. **Testing?** → Run scenarios from FIREBASE_NOTIFICATION_INTEGRATION.md
3. **Architecture?** → See FIREBASE_NOTIFICATION_IMPLEMENTATION_GUIDE.md
4. **Debugging?** → Search console for [FCM] prefix logs
5. **Backend?** → See API Contract section above

**All questions answered in the 4 markdown files provided.** 🚀
