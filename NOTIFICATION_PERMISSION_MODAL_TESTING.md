# Push Notification Permission Modal - Testing Guide

## Quick Test Checklist

### Basic Setup (Required Before Testing)

- [ ] App layout includes `usePushNotificationPermission` hook
- [ ] NotificationPermissionModal component added to layout
- [ ] i18n strings loaded (translations appear in Arabic and English)
- [ ] Permission tracker utility accessible
- [ ] Notification service has modal callback

### Test Environment Setup

```bash
# Install with fresh database
npm install
expo start

# iOS
expo start --ios

# Android  
expo start --android
```

## Test Scenarios

### Scenario 1: Fresh Installation - Permission on First Launch

**Prerequisites**: Fresh app install or after permission reset

**Steps**:
1. Launch app
2. Observe native permission dialog appears immediately
3. Tap "Don't Allow"
4. Close app completely
5. Reopen app

**Expected**:
- ✅ No permission prompt on reopen (Attempt 2)
- ✅ Console logs show `[PushNotifications] Attempt 2, skipping`

---

### Scenario 2: Third Denial - Modal on Fourth Attempt

**Prerequisites**: Complete Scenario 1, then repeat deny 2 more times

**Steps**:
1. Reopen app (Attempt 2): No prompt
2. Close app, reopen (Attempt 3): No prompt  
3. Close app, reopen (Attempt 4): Custom modal appears
4. Observe modal content

**Expected**:
- ✅ Modal shows "قم بتفعيل الإشعارات" (title)
- ✅ Description text visible
- ✅ 3 benefit items with checkmark icons
- ✅ "فعل الآن" (Enable Now) button
- ✅ "تخطي" (Skip) button
- ✅ Close button (X) at top
- ✅ Footer note at bottom
- ✅ Smooth slide-up animation
- ✅ iOS: App uses RTL layout if Arabic

---

### Scenario 3: Modal Enable Button

**Prerequisites**: Modal visible from Scenario 2

**Steps**:
1. Tap "فعل الآن" (Enable Now) button
2. Observe behavior

**Expected**:
- ✅ Modal closes smoothly
- ✅ Device settings app opens (iOS: Settings.app, Android: App Info → Notifications)
- ✅ User can enable notifications in settings
- ✅ Console shows `[PushNotifications] User tapped Enable in modal`

---

### Scenario 4: Modal Skip Button

**Prerequisites**: Fresh attempt at Attempt 4

**Steps**:
1. When modal appears, tap "تخطي" (Skip) button
2. Close app
3. Immediately reopen app

**Expected**:
- ✅ Modal closes
- ✅ No permission prompt on immediate reopen
- ✅ Console shows `[PushNotifications] User closed permission modal`
- ✅ Modal won't show again until tomorrow

---

### Scenario 5: Modal Close Button

**Prerequisites**: Fresh attempt at Attempt 4

**Steps**:
1. When modal appears, tap close button (X)
2. Close app and reopen

**Expected**:
- ✅ Modal closes
- ✅ Same behavior as "Skip" button
- ✅ No modal until next day

---

### Scenario 6: Language Switching

**Prerequisites**: Modal visible

**Steps**:
1. Go to Profile screen
2. Change language to English
3. Return to app
4. Trigger modal to appear again (Attempt 5 next day)
5. Observe modal text

**Expected**:
- ✅ Modal displays in English on Attempt 5
- ✅ No RTL layout for English (left-aligned)
- ✅ Benefits list shows English text
- ✅ Buttons show English text: "Enable Now", "Skip"

---

### Scenario 7: Permission Granted

**Prerequisites**: Modal appears, user has access to settings

**Steps**:
1. Tap "Enable Now" (or close X button)
2. Go to device settings and enable notifications
3. Return to app
4. Close app
5. Reopen app multiple times

**Expected**:
- ✅ First reopen shows notification permission granted
- ✅ Device token is registered with backend
- ✅ No more permission prompts or modals
- ✅ Subsequent app launches show `[PushNotifications] Already configured, skipping`

---

### Scenario 8: Multiple Days

**Prerequisites**: Complete Scenario 4 (skip on Attempt 4)

**Steps**:
1. Change device date/time forward by 1 day
2. Reopen app

**Expected**:
- ✅ Modal appears again (reset for new day)
- ✅ Attempt counter continues from previous day
- ✅ Tracker shows modal can be shown today

---

## Console Logging Verification

Look for these logs in React Native debugger:

### Successful Flow
```
[PushNotifications] Service initialized
[PushNotifications] Attempt 1, showing native permission dialog
[PushNotifications] Permission requested
[PushNotifications] Permission granted
```

### Permission Modal Flow
```
[PushNotifications] Attempt 4, showing custom modal
[PushNotificationPermission] Permission status: {
  shouldShowModal: true,
  attemptCount: 4,
  isPermanentlyDenied: false
}
[PushNotifications] User tapped Enable in modal
```

### Permanent Dismissal
```
[PermissionTracker] Attempt count: 4
[PermissionTracker] Modal marked as shown today
[PermissionModal] Modal callback triggered: true
```

## i18n Verification

### Arabic Strings
- Title: "قم بتفعيل الإشعارات"
- Benefit 1: "عروض حصرية وخصومات"  
- Enable: "فعل الآن"

### English Strings
- Title: "Enable Notifications"
- Benefit 1: "Exclusive offers and discounts"
- Enable: "Enable Now"

### RTL Layout (Arabic)
- ✅ Close button appears on left
- ✅ Text is right-aligned
- ✅ Benefit icons on right side of text

---

## Device-Specific Testing

### iOS (14+)
```
Expected Permission Dialog States:
1. "Allow" + "Don't Allow" buttons
2. Shows on first ask
3. Can't be triggered again (use modal on attempt 4)
```

**Steps for iOS**:
1. Connect iPhone/iPad
2. Run: `expo start --ios`
3. Observe native dialog appearance

### Android (10+)
```
Expected Permission Dialog:
1. Runtime permission prompt
2. "Allow" + "Deny" buttons
3. May show multiple times (system behavior varies)
```

**Steps for Android**:
1. Connect Android device/emulator
2. Run: `expo start --android`
3. Observe system permission behavior

---

## Reset for Testing

### Full Reset
```bash
# Reset all tracking data
import { notificationPermissionTracker } from "@/src/utils/notificationPermissionTracker"
await notificationPermissionTracker.reset()
```

### Partial Reset
```bash
# Reset specific states
await AsyncStorage.removeItem("notification_permission_attempt_count")
await AsyncStorage.removeItem("notification_permission_modal_shown_today")
await AsyncStorage.removeItem("notification_permission_denied_permanently")
```

## Edge Cases to Test

1. **Offline during permission**: No network when registering token
   - Expected: Device token stored locally, registered when online

2. **App crashed during modal**: Cache recovery
   - Expected: Attempt count preserved in AsyncStorage

3. **Multiple quick app launches**: Rapid background/foreground
   - Expected: useFocusEffect triggers each focus, but only one modal shown

4. **Permission state change outside app**: User changed in settings
   - Expected: Next app focus detects new state

---

## Performance Testing

### Memory Usage
- [ ] Monitor memory while showing modal
- [ ] Check for memory leaks after closing modal
- [ ] Verify cleanup on app background

### Animation Performance
- [ ] Modal slide-up animation smooth (60fps)
- [ ] Icon scale animation fluid
- [ ] No jank on benefit list render

### Storage Performance
- [ ] AsyncStorage reads < 50ms
- [ ] Permission tracking < 20ms
- [ ] No blocking on main thread

---

## Sign-Off Checklist

- [ ] All scenarios tested on iOS
- [ ] All scenarios tested on Android
- [ ] i18n translations working
- [ ] Permission tracking accurate
- [ ] Modal animations smooth
- [ ] No console errors
- [ ] Device token registered after permission granted
- [ ] Device settings properly opened
- [ ] No memory leaks
- [ ] All edge cases handled

---

## Troubleshooting

### Modal Not Appearing on Attempt 4

**Check**:
```bash
# Verify attempt count
import { notificationPermissionTracker } from "@/src/utils/notificationPermissionTracker"
const count = await notificationPermissionTracker.getAttemptCount()
console.log("Attempt count:", count)

# Check if modal was already shown today
const status = await notificationPermissionTracker.getStatus()
console.log("Status:", status)

# If stuck, reset
await notificationPermissionTracker.reset()
```

### Permission Dialog Not Showing

**Check**:
1. Attempt count < 4: `count < 4`
2. Info.plist (iOS): NSUserNotificationsUsageDescription present
3. AndroidManifest.xml (Android): POST_NOTIFICATIONS permission
4. Device has not denied permanently

### i18n Strings Not Displaying

**Check**:
1. Translations loaded: Check Network tab for i18n JSON
2. Key path correct: `notifications.permissionModal.title`
3. Language set correctly: `i18n.language === "ar"`
4. Fallback strings work if translations missing

### App Crashes on Modal Close

**Check**:
1. Linking module imported
2. Linking.openSettings() doesn't crash on simulator
3. No infinite loops in callbacks
4. Memory properly cleaned up

---

## Report Template

Use this template to report testing results:

```markdown
## Testing Report - Push Notification Modal

**Device**: [iPhone 14 / Android Emulator]
**OS Version**: [iOS 16.5 / Android 12]
**App Version**: [1.0.0]
**Date**: [YYYY-MM-DD]

### Scenarios Tested
- [ ] Scenario 1: First Launch
- [ ] Scenario 2: Fourth Attempt Modal
- [ ] Scenario 3: Enable Button
- [ ] Scenario 4: Skip Button
- [ ] Scenario 5: Close Button
- [ ] Scenario 6: Language Switch
- [ ] Scenario 7: Permission Granted
- [ ] Scenario 8: Multiple Days

### Issues Found
1. [Issue description]
2. [Issue description]

### Console Logs
[Paste relevant console output]

### Notes
[Any additional observations]
```
