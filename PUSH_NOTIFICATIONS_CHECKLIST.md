# Push Notifications - Quick Implementation Checklist

## ✅ Frontend Implementation (COMPLETED)

### Mobile App Setup

- [x] Installed `expo-notifications` package
- [x] Created comprehensive notification service (`src/services/notification.service.ts`)
- [x] Added Redux notification slice integration
- [x] Updated API endpoints (`src/constants/api.ts`)
- [x] Integrated with app layout (`app/_layout.tsx`)
- [x] Updated auth screens (login & register)
- [x] Updated profile logout flow
- [x] Implemented deep linking handler
- [x] Added global notification navigation handler

### Files Modified

```
✓ src/services/notification.service.ts          (Enhanced)
✓ src/constants/api.ts                          (Added endpoints)
✓ app/_layout.tsx                               (Added initialization)
✓ src/screens/auth/LoginScreen.tsx              (Added token registration)
✓ src/screens/auth/RegisterScreen.tsx           (Added token registration)
✓ app/(tabs)/profile.tsx                        (Added token unregistration)
✓ src/store/slices/notifications.slice.ts       (No changes needed)
```

### New Documentation Files Created

```
✓ PUSH_NOTIFICATIONS_SETUP.md                   (Main implementation guide)
✓ PUSH_NOTIFICATIONS_BACKEND.md                 (Backend setup & API)
✓ PUSH_NOTIFICATIONS_CHECKLIST.md               (This file)
```

---

## ⏳ Backend Implementation (TODO)

### Database

- [ ] Create `DeviceToken` table
- [ ] Add indexes on `userId` and `token`
- [ ] Add auto-cascade delete with User
- [ ] Run migration: `npx prisma migrate dev`

### API Endpoints

- [ ] Implement `POST /api/v1/notifications/device-token`
- [ ] Implement `DELETE /api/v1/notifications/device-token`
- [ ] Implement `GET /api/v1/notifications/device-token`
- [ ] Add auth middleware to all new endpoints
- [ ] Add input validation
- [ ] Add error handling

### Notification Sending Service

- [ ] Install Expo Server SDK: `npm install expo-server-sdk`
- [ ] Create notification service class
- [ ] Implement `sendNotificationToUser()` method
- [ ] Implement receipt tracking
- [ ] Add error handling for inactive tokens

### Notification Events

- [ ] Hook new order creation → Send notification
- [ ] Hook order status update → Send notification
- [ ] Hook product arrival → Send notification
- [ ] Hook promotion release → Send notification

---

## 🧪 Testing Checklist

### Test 1: Permission Flow - First Launch

**Expected**: Show permission prompt immediately

```
1. Clear app data completely
2. Launch app fresh
3. Permission dialog should appear
4. Check AsyncStorage: notification_first_launch_done = "true"
5. Record in console: [PushNotifications] First launch detected, requesting permission
```

### Test 2: Permission Denied - Counter Increment

**Expected**: Counter increments, permission skipped future launches

```
1. Tap "Don't Allow" on permission prompt
2. Restart app (kill & relaunch)
3. Check AsyncStorage: notification_denied_counter = "1"
4. No permission prompt
5. Restart app again
6. Check AsyncStorage: notification_denied_counter = "2"
```

### Test 3: Permission Retry - After 3 Denials

**Expected**: Request permission again on 4th app launch

```
1. Continue from Test 2 state (counter = 2)
2. Restart app → no prompt, counter = "3"
3. Restart app → PROMPT appears, counter resets to "0"
4. Tap "Allow"
5. Device token should be generated
```

### Test 4: Device Token Registration

**Expected**: Token registered with backend after permission grant

```
1. From Test 3, grant permission
2. Check AsyncStorage: DEVICE_TOKEN is set with token value
3. Check logs: [PushNotifications] Device token registered successfully
4. Verify in backend: DeviceToken table has entry
5. Platform: "IOS" or "ANDROID"
```

### Test 5: Login Flow

**Expected**: Token registered after successful login

```
1. Logout if authenticated
2. App shows login screen (guest mode)
3. Login with credentials
4. Register screen should NOT prompt for notification again
5. Check logs: [PushNotifications] Token verified and registered
6. Verify backend: Device token associated with user
```

### Test 6: Register Flow

**Expected**: New user registration with token

```
1. Go to register screen
2. Fill form and submit
3. On success, navigate to app
4. Check logs: [PushNotifications] Token registered after login
5. Verify backend: New user has device token
```

### Test 7: Logout Flow

**Expected**: Device token unregistered

```
1. Navigate to Profile screen
2. Tap Sign Out button
3. Confirm logout
4. Check logs: [PushNotifications] Token unregistered successfully
5. Verify backend: Device token marked inactive or deleted
6. Check AsyncStorage: device tokens cleared
7. User should be in guest mode
```

### Test 8: Foreground Notification

**Expected**: Alert shown with option to open

```
1. Send notification from backend for logged-in user
2. Keep app in foreground
3. Alert should appear
4. [PushNotifications] Foreground notification: ...
5. Tap "Open" → should navigate
```

### Test 9: Background Notification

**Expected**: System displays, navigate on tap

```
1. Send notification while app is in background
2. Notification appears in system tray
3. Tap the notification
4. App opens and navigates
5. Deep link should work correctly
```

### Test 10: Deep Linking

**Expected**: Navigate to correct screen based on URL

```
// Test Order Navigation
- Link: /orders/order_123
- Expected: Navigate to /order/order_123

// Test Product Navigation
- Link: /products/prod_456
- Expected: Navigate to /product/prod_456

// Test Cart Navigation
- Link: /cart
- Expected: Navigate to /(tabs)/cart

// Test Notifications Navigation
- Link: /notifications
- Expected: Navigate to /notifications
```

### Test 11: Killed App + Notification

**Expected**: Navigate when app bootstrap from killed state

```
1. Kill app completely (remove from recent)
2. Send notification to registered device
3. Tap notification in system tray
4. App starts
5. After bootstrap, should navigate to link
6. Check logs: [PushNotifications] Initial notification detected
```

### Test 12: Token Refresh

**Expected**: Handle token changes on app resume

```
1. App in foreground, keep running
2. Wait 1 hour (or simulate token refresh)
3. Notification sent with old token
4. Should still work or handle gracefully
5. Check logs for token refresh events
```

---

## 🛠️ Development Tips

### Quick Testing Commands

```bash
# Check AsyncStorage values (debug)
# Add this to any component temporarily:
useEffect(() => {
  AsyncStorage.getItem('notification_ready').then(val => {
    console.log('notification_ready:', val);
  });
}, []);

# Clear push notification storage
const CLEAR_STORAGE = async () => {
  await AsyncStorage.multiRemove([
    'notification_ready',
    'notification_first_launch_done',
    'notification_denied_counter',
    'deviceToken'
  ]);
};

# Check stored device token
const CHECK_TOKEN = async () => {
  const token = await AsyncStorage.getItem('deviceToken');
  console.log('Stored device token:', token);
};
```

### Local Logging Enhanced

All logs use `[PushNotifications]` prefix for easy grep:

```bash
# View all notification logs
console.logs | grep "\[PushNotifications\]"

# Filter by log level
console.errors | grep "\[PushNotifications\]"
```

### Redux DevTools Integration (Optional)

Monitor Redux state changes related to notifications:

```typescript
// In Redux store, if using Redux DevTools
// Watch notifications.slice actions:
// - fetchNotifications
// - markNotificationRead
// - markAllNotificationsRead
```

---

## 📊 Testing Data

### Test Notification Payloads

**Order Notification**

```json
{
  "title": "طلب جديد",
  "body": "تم تلقي طلبك #ORD-2024-001",
  "data": {
    "linkUrl": "/orders/ORD-2024-001",
    "orderId": "ORD-2024-001",
    "amount": "150"
  }
}
```

**Product Notification**

```json
{
  "title": "منتج جديد وصل",
  "body": "القهوة العربية الممتازة متوفرة الآن",
  "data": {
    "linkUrl": "/products/PROD-COFFEE-001",
    "productId": "PROD-COFFEE-001",
    "category": "beverages"
  }
}
```

**Promotion Notification**

```json
{
  "title": "عرض خاص",
  "body": "خصم 30% على جميع المنتجات",
  "data": {
    "linkUrl": "/products?promo=SUMMER30",
    "promoCode": "SUMMER30",
    "discount": "30%"
  }
}
```

---

## 🐛 Troubleshooting Guide

### Problem: Permission prompt not showing

**Solutions**:

- [ ] Check AsyncStorage: `notification_first_launch_done` might be set
- [ ] Clear app data completely
- [ ] Verify `notification_ready !== "true"`
- [ ] Check for errors in `checkAndRequestPermission()`

### Problem: Device token always null

**Solutions**:

- [ ] Permission not granted
- [ ] `getExpoPushTokenAsync()` returning null
- [ ] Check network connectivity
- [ ] Verify Expo project is configured

### Problem: Token registration fails silently

**Solutions**:

- [ ] Check JWT token is valid
- [ ] Verify backend endpoint exists
- [ ] Check Network tab in DevTools
- [ ] Add try-catch and log errors
- [ ] Verify backend API is accessible

### Problem: Deep link not working

**Solutions**:

- [ ] Check URL format matches pattern
- [ ] Verify `global.notificationNavigation` is set
- [ ] Check router is initialized
- [ ] Add logging to `handleNotificationTap()`
- [ ] Check data.linkUrl is passed correctly

### Problem: Notifications not persisting after logout/login

**Solutions**:

- [ ] Token not being stored between sessions
- [ ] JWT token expired
- [ ] Backend user association lost
- [ ] AsyncStorage cleared during logout

---

## 🔒 Security Checklist

- [ ] JWT tokens stored with `expo-secure-store`
- [ ] Device tokens stored encrypted on device
- [ ] API endpoints require authentication
- [ ] 401 errors handled correctly
- [ ] Tokens cleared on logout
- [ ] No sensitive data in deep links
- [ ] Notification payload sanitized
- [ ] HTTPS only for production
- [ ] Rate limiting on token registration
- [ ] DDoS protection on notification endpoints

---

## 📈 Performance Optimization

### Current Implementation

- Token stored in AsyncStorage (fast local reads)
- One-time initialization on app launch
- Efficient counter-based retry logic
- Non-blocking error handling

### Potential Improvements

- [ ] Implement token refresh on app resume
- [ ] Batch notification sending
- [ ] Implement retry-with-exponential-backoff
- [ ] Cache notification list in Redux
- [ ] Pagination for notification history
- [ ] Deduplicate notifications
- [ ] Offline queue for notifications

---

## 📚 Related Documentation

- [PUSH_NOTIFICATIONS_SETUP.md](PUSH_NOTIFICATIONS_SETUP.md) - Main setup guide
- [PUSH_NOTIFICATIONS_BACKEND.md](PUSH_NOTIFICATIONS_BACKEND.md) - Backend API docs
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

## 🎯 Implementation Timeline

**Week 1 (Frontend - COMPLETED)**

- [x] Install dependencies
- [x] Create notification service
- [x] Integrate with app layout
- [x] Update auth flows
- [x] Implement deep linking

**Week 2 (Backend)**

- [ ] Create database schema
- [ ] Implement API endpoints
- [ ] Build notification service
- [ ] Add notification events

**Week 3 (Testing & Polish)**

- [ ] Run test suite
- [ ] Fix edge cases
- [ ] Performance optimization
- [ ] Production setup

**Week 4+ (Monitoring & Analytics)**

- [ ] Track metrics
- [ ] Implement analytics
- [ ] User preference system
- [ ] Advanced features

---

## 📞 Support Questions

**Q: Can I migrate from Expo Notifications to FCM later?**
A: Yes! Device tokens can be exchanged in the future. Keep the backend abstraction layer flexible.

**Q: What happens if user denies permission permanently?**
A: App respects the choice and retries every 3 launches. User can manually enable in Settings.

**Q: Can guests see notifications?**
A: No. Guest mode skips notification initialization. Tokens registered only after login.

**Q: Are notifications sent while app is closed?**
A: Yes. Expo/native system handles delivery. App navigates when user taps.

**Q: Can I customize notification sound/badge?**
A: Yes. Configure in `Notifications.setNotificationChannelAsync()` on Android.

---

## ✨ Next Features to Add

1. **Notification Center**
   - View all notifications in history
   - Filter by type
   - Mark multiple as read

2. **User Preferences**
   - Toggle notification types on/off
   - Set quiet hours
   - Language preference per category

3. **Analytics**
   - Track open rates
   - Track click-through rates
   - Measure engagement

4. **Advanced Features**
   - Scheduled notifications
   - A/B testing
   - Dynamic content personalization

---

## 🎉 Completion Status

Frontend: **100% ✅**
Backend: **0% ⏳**
Testing: **Ready for manual testing**
Documentation: **100% ✅**

**Next Step**: Start backend implementation following `PUSH_NOTIFICATIONS_BACKEND.md`
