# Push Notification Permission Modal - Integration Guide

## Overview

This guide shows how to integrate the push notification permission modal into your Tawreed app. The system intelligently handles permission requests with a custom modal fallback for users who have denied permissions multiple times.

## Architecture

```
App Initialization
    ↓
usePushNotificationPermission Hook
    ├─ Initializes NotificationService
    ├─ Triggers on app focus via useFocusEffect
    ├─ Manages permission attempt tracking
    └─ Shows custom modal on 4th+ attempts
    ↓
NotificationService
    ├─ Uses notificationPermissionTracker
    ├─ Calls modal callback on 4th+ attempt
    └─ Handles device token registration
```

## Integration Steps

### 1. Update App Layout (app/_layout.tsx)

Add the permission hook and modal component to your root layout:

```typescript
import { NotificationPermissionModal } from "@/src/components/NotificationPermissionModal";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";

export default function RootLayout() {
  // ... other code ...
  
  // Add permission hook
  const {
    displayModal,
    permissionAttempt,
    handleModalEnable,
    handleModalClose,
  } = usePushNotificationPermission();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AuthGate>
          {/* Your app content */}
          <Stack>
            {/* routes */}
          </Stack>

          {/* Add notification permission modal */}
          <NotificationPermissionModal
            visible={displayModal}
            onOpenSettings={handleModalEnable}
            onClose={handleModalClose}
          />
        </AuthGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
```

### 2. Permission Flow Details

#### Attempt 1-3: Native Permission Dialog
- App shows iOS/Android native permission prompt
- System handles the dialog
- If denied, attempt counter increments

#### Attempt 4+: Custom Modal
- NotificationPermissionModal is displayed
- Shows benefits of notifications
- Provides "Enable Now" (opens settings) and "Skip" buttons
- Modal shown once per day (doesn't spam user)
- Can be dismissed and retried tomorrow

#### Permission States

```typescript
{
  attemptCount: number;              // Current attempt #
  shouldShowModal: boolean;           // Use custom modal?
  isPermanentlyDenied: boolean;      // User permanently declined?
}
```

### 3. Localization

Strings are in both `src/localization/ar.json` and `src/localization/en.json`:

```json
{
  "notifications": {
    "permissionModal": {
      "title": "قم بتفعيل الإشعارات",
      "description": "قم بتفعيل الإشعارات لتصلك الخصومات والعروض أولاً بأول لا تفوت أي فرصة",
      "benefit1": "عروض حصرية وخصومات",
      "benefit2": "التحديثات الأخيرة للمنتجات",
      "benefit3": "إشعارات فورية عن الطلبات",
      "enableNow": "فعل الآن",
      "skip": "تخطي",
      "footer": "يمكنك تغيير الإعدادات لاحقًا في إعدادات الجهاز"
    }
  }
}
```

### 4. Permission Tracker Utilities

Methods available on `notificationPermissionTracker`:

```typescript
// Get current attempt count
const count = await notificationPermissionTracker.getAttemptCount();

// Get complete status
const status = await notificationPermissionTracker.getStatus();
// Returns: { attemptCount, hasShownToday, isPermanentlyDenied, shouldShowCustomModal }

// Check if should show native permission prompt
const shouldShow = await notificationPermissionTracker.shouldShowNativePermission();

// Mark permanently denied (user clicked "Don't Allow" permanently)
await notificationPermissionTracker.markPermanentlyDenied();

// Reset for testing
await notificationPermissionTracker.reset();
```

### 5. Hook Usage

Hook provides everything needed:

```typescript
const {
  displayModal,           // Boolean - show/hide modal
  permissionAttempt,      // Number - current attempt
  isLoading,             // Boolean - loading state
  handleModalEnable,     // Function - user clicked Enable
  handleModalClose,      // Function - user clicked Skip/Close
} = usePushNotificationPermission();
```

## Testing

### Test Scenario 1: First Launch
1. Fresh app install
2. App shows native permission dialog
3. Deny permission
4. Close app, reopen
5. No permission prompt (attempt 2)

### Test Scenario 2: Fourth Attempt
1. Repeat deny process 3 times
2. On 4th app launch: Custom modal appears
3. Tap "Enable Now": Opens device settings
4. Tap "Skip": Modal closes, don't ask again today

### Test Scenario 3: Reset for Testing
```typescript
// In your test code
import { notificationPermissionTracker } from "@/src/utils/notificationPermissionTracker";

await notificationPermissionTracker.reset();
// Now app will ask for permission on next launch
```

## Error Handling

All methods are wrapped in try-catch:
- Permission failures don't crash the app
- Errors logged with `[PushNotifications]` prefix
- Modal gracefully handles missing i18n strings

## Performance

- Permission tracking uses AsyncStorage (local only)
- No network calls during permission flow
- Device token registration happens after permission granted
- Non-blocking on UI thread

## Production Considerations

1. **Monitoring**: Track permission acceptance rates
2. **A/B Testing**: Test different modal messages
3. **Analytics**: Log permission attempt counts
4. **Deep Linking**: Ensure notification deep links work with permission modal visible
5. **Settings**: Allow users to manage notifications in ProfileScreen

## Troubleshooting

### Modal Not Showing
- Check if `usePushNotificationPermission` hook is in root layout
- Verify `displayModal` prop passed to `NotificationPermissionModal`
- Check i18n strings are loaded: `t("notifications.permissionModal.title")`
- Check AsyncStorage isn't corrupted: Run `notificationPermissionTracker.reset()`

### Permission Dialog Not Showing
- iOS: Check Info.plist has NSUserNotificationsUsageDescription
- Android: Check AndroidManifest.xml has notification permissions
- Check attempt count < 4: `await notificationPermissionTracker.getAttemptCount()`

### App Crashes on Modal Appear
- Check `Linking` module is imported: `import { Linking } from "react-native"`
- Verify `Linking.openSettings()` works on device
- Check memory for leaks in animation state

## Files Reference

| File | Purpose |
|------|---------|
| `src/utils/notificationPermissionTracker.ts` | Permission state tracking |
| `src/hooks/usePushNotificationPermission.ts` | React hook for integration |
| `src/components/NotificationPermissionModal.tsx` | Modal UI component |
| `src/services/notification.service.ts` | Service with permission logic |
| `src/localization/ar.json` | Arabic translations |
| `src/localization/en.json` | English translations |

## Next Phase: Backend Integration

After permission is granted:

1. Device token saved to AsyncStorage
2. RegisterDeviceToken API called
3. Backend stores token for push delivery
4. Users receive notifications via Expo Push Service

See `PUSH_NOTIFICATIONS_BACKEND.md` for API specifications.
