# App Layout Integration Example

This document shows exactly how to integrate the permission modal into your app's root layout.

## Current App Layout (Before)

Here's a typical `app/_layout.tsx` file:

```typescript
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import store from "@/src/store";
import AuthGate from "@/app/_gate";
import "@/src/localization/i18n"; // i18n init

export default function RootLayout() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // App initialization
    console.log("App initialized with language:", i18n.language);
  }, [i18n]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#f9fafb",
              },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="products" />
            <Stack.Screen name="categories" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="notifications" />
          </Stack>
        </AuthGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
```

## Updated App Layout (After)

Here's the same file with permission modal integration:

```typescript
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider, useSelector } from "react-redux";
import store from "@/src/store";
import AuthGate from "@/app/_gate";
import "@/src/localization/i18n"; // i18n init

// IMPORT: Permission modal components
import { NotificationPermissionModal } from "@/src/components/NotificationPermissionModal";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";

export default function RootLayout() {
  const { i18n } = useTranslation();

  // ADDITION: Permission hook
  const {
    displayModal,
    permissionAttempt,
    handleModalEnable,
    handleModalClose,
  } = usePushNotificationPermission();

  useEffect(() => {
    // App initialization
    console.log("App initialized with language:", i18n.language);
  }, [i18n]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: "#f9fafb",
              },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="products" />
            <Stack.Screen name="categories" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="notifications" />
          </Stack>

          {/* ADDITION: Permission Modal Component */}
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

## Key Changes

### 1. Import Statements (Add at top)
```typescript
import { NotificationPermissionModal } from "@/src/components/NotificationPermissionModal";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";
```

### 2. Hook in Component
```typescript
const {
  displayModal,
  permissionAttempt,
  handleModalEnable,
  handleModalClose,
} = usePushNotificationPermission();
```

**What each property does**:
- `displayModal` (boolean): Controls when the modal is shown
- `permissionAttempt` (number): Current attempt count (for debugging)
- `handleModalEnable()` (function): Called when user clicks "Enable Now"
- `handleModalClose()` (function): Called when user clicks "Skip" or close button

### 3. Modal Component (Add inside layout, before closing tags)
```typescript
<NotificationPermissionModal
  visible={displayModal}
  onOpenSettings={handleModalEnable}
  onClose={handleModalClose}
/>
```

**Props**:
- `visible`: When `true`, modal is displayed
- `onOpenSettings`: Callback when "Enable Now" tapped
- `onClose`: Callback when "Skip" or X button tapped

## Visual Hierarchy

The modal should be placed **after** the navigation stack but **inside** the providers:

```
GestureHandlerRootView
  └─ Provider (Redux)
     └─ AuthGate
        ├─ Stack (Navigation)
        │  └─ Routes
        └─ NotificationPermissionModal ← Here!
```

## Complete File Example

See [app/_layout.tsx.example](#) for the complete file with comments.

## Gradual Integration

If you want to integrate gradually:

### Step 1: Add imports only
```typescript
import { NotificationPermissionModal } from "@/src/components/NotificationPermissionModal";
import { usePushNotificationPermission } from "@/src/hooks/usePushNotificationPermission";
```

### Step 2: Add hook
```typescript
const {
  displayModal,
  handleModalEnable,
  handleModalClose,
} = usePushNotificationPermission();
```

### Step 3: Add modal component
```typescript
<NotificationPermissionModal
  visible={displayModal}
  onOpenSettings={handleModalEnable}
  onClose={handleModalClose}
/>
```

### Test at each step
```bash
expo start --clear
```

## Troubleshooting

### Modal not showing?
1. Check `usePushNotificationPermission` is called
2. Verify `displayModal` prop is correctly passed
3. Check console for `[PushNotificationPermission]` logs
4. Verify app layout is properly structured

### Permission dialog not showing?
1. Check permission tracker: `await notificationPermissionTracker.getAttemptCount()`
2. If attempt > 3, modal will show instead of dialog
3. Try reset: `await notificationPermissionTracker.reset()`

### Buttons not responding?
1. Check callback functions are passed: `onOpenSettings`, `onClose`
2. Verify Linking module can open settings
3. Check for any TypeScript errors

## Next Steps

1. **Integrate** the modal into app/_layout.tsx
2. **Test** on iOS and Android using NOTIFICATION_PERMISSION_MODAL_TESTING.md
3. **Verify** i18n strings are displaying correctly
4. **Monitor** permission acceptance rates in production
5. **Deploy** with EAS build

## API Reference

### usePushNotificationPermission Hook

```typescript
const {
  displayModal: boolean;                    // Show/hide modal
  permissionAttempt: number;               // Current attempt (1-10+)
  isLoading: boolean;                      // Loading state
  handleModalEnable: () => Promise<void>;  // User clicked Enable
  handleModalClose: () => Promise<void>;   // User clicked Skip/Close
} = usePushNotificationPermission();
```

### NotificationPermissionModal Component

```typescript
<NotificationPermissionModal
  visible: boolean;                  // Required: Modal visibility
  onOpenSettings: () => void;        // Required: Enable button callback
  onClose: () => void;               // Required: Close button callback
/>
```

## Performance Notes

- Hook uses `useFocusEffect` (only runs on screen focus)
- Modal renders only when `visible={true}`
- AsyncStorage lookups cached in component state
- No blocking operations on main thread

## Security Notes

- Permission tracking stored locally (no network exposure)
- Device token registered only after permission granted
- No sensitive data in modal component
- All fields properly typed with TypeScript

---

For more details, see:
- Integration Guide: NOTIFICATION_PERMISSION_MODAL_INTEGRATION.md
- Testing Guide: NOTIFICATION_PERMISSION_MODAL_TESTING.md
- Troubleshooting: See issues section in integration guide
