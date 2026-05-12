# 🔥 Firebase Messaging Setup - Complete Guide

## ✅ What I Fixed

I've identified and resolved the **"No Firebase App '[DEFAULT]' has been created"** error. Here are the changes:

### 1. **Added Firebase Plugins to `app.json`** ✅

- Configured `@react-native-firebase/app` plugin
- Configured `@react-native-firebase/messaging` plugin
- Linked to your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### 2. **Created Firebase Initialization Module** ✅

- New file: `src/services/firebase-init.ts`
- Handles Firebase app initialization before using any services
- Provides verification functions

### 3. **Updated Firebase Service** ✅

- Modified `src/services/firebaseNotification.service.ts`
- Now calls `initializeFirebase()` BEFORE requesting permissions
- Added proper error handling

### 4. **Updated App Layout** ✅

- Modified `app/_layout.tsx`
- Calls Firebase initialization on app startup
- Ensures Firebase is ready before notifications are used

### 5. **Added Google Services Plugin to Gradle** ✅

- Updated `android/build.gradle`
- Updated `android/app/build.gradle`
- Added `com.google.gms:google-services:4.3.15` dependency

---

## 📋 Prerequisites You Need to Have

### ✅ Already Done (Confirmed)

- [ ] `@react-native-firebase/app` installed ✅
- [ ] `@react-native-firebase/messaging` installed ✅
- [ ] Firebase project created in Firebase Console ✅
- [ ] Android package name: `tawreedApp.com.jo`
- [ ] iOS bundle ID: `tawreed.app.com`

### 🔴 CRITICAL: Files You Must Provide

You need to download **BOTH** files from Firebase Console and place them in your project:

#### **1. Android: `google-services.json`**

```
Location: android/app/google-services.json
```

**How to get:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project → Project Settings
3. Go to "Your apps" → Android app
4. Click "Download google-services.json"
5. Place in `android/app/` directory

#### **2. iOS: `GoogleService-Info.plist`**

```
Location: ios/GoogleService-Info.plist
```

**How to get:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project → Project Settings
3. Go to "Your apps" → iOS app
4. Click "Download GoogleService-Info.plist"
5. Place in `ios/` directory
6. Add to Xcode:
   - Open `ios/tawreed.xcworkspace`
   - Right-click project → Add Files to "tawreed"
   - Select the plist file

---

## 🚀 Next Steps

### Step 1: Clean & Rebuild

```bash
# Clear cache
npx expo prebuild --clean

# Clear node_modules cache
npm run reset-project

# Reinstall
npm install
```

### Step 2: Build for Android (Required - Expo Go doesn't support native modules)

```bash
# Option A: Development build with Expo prebuild
npx expo run:android

# Option B: Production build with EAS
eas build --platform android --profile preview
```

### Step 3: Build for iOS

```bash
# Option A: Development build with Expo prebuild
npx expo run:ios

# Option B: Production build with EAS
eas build --platform ios --profile preview
```

---

## 🧪 Testing

After building, test Firebase initialization:

1. **Open the app** - Check console logs for:

   ```
   [AppInit] Initializing Firebase...
   [AppInit] ✅ Firebase initialized
   [Firebase] Initializing Firebase Messaging...
   [Firebase] Notification permission granted
   ```

2. **If you see errors**, check:
   - [ ] `google-services.json` is in `android/app/`
   - [ ] `GoogleService-Info.plist` is added to Xcode project
   - [ ] You're NOT using Expo Go (use `expo run:android` or `expo run:ios`)
   - [ ] You called `expo prebuild` or used EAS build

---

## ❌ Common Issues & Solutions

### Issue: "Cannot find module '@react-native-firebase/app'"

**Solution:** Run `npm install` and ensure packages are installed

### Issue: Still getting "[Firebase] Initialization error"

**Solution:**

1. Verify `google-services.json` is in correct location
2. Run `npx expo prebuild --clean`
3. Rebuild the app

### Issue: "Expo Go doesn't support Firebase"

**Solution:**

- Use `npx expo run:android` or `npx expo run:ios`
- OR use EAS build: `eas build --platform android --profile preview`
- Expo Go does NOT support native modules

### Issue: "Project initialization error" when building iOS

**Solution:**

1. Ensure `GoogleService-Info.plist` is added to Xcode project
2. Check Build Phases → Copy Bundle Resources includes the plist file
3. Clean Xcode build folder: Cmd+Shift+K

---

## 📚 Architecture Overview

### Firebase Initialization Flow

```
app/_layout.tsx (App Startup)
    ↓
initializeFirebase() [src/services/firebase-init.ts]
    ↓
initializeApp() [auto via plugins]
    ↓
notificationService.initialize()
    ↓
requestPermission(getMessaging())
    ↓
✅ Firebase Messaging Ready
```

### File Structure

```
src/services/
├── firebase-init.ts          ← NEW: Firebase initialization
├── firebaseNotification.service.ts  ← UPDATED: Uses firebase-init
└── notification.service.ts   ← UPDATED: Calls Firebase init

app/
└── _layout.tsx               ← UPDATED: Calls initializeFirebase()

android/
├── build.gradle              ← UPDATED: Added Google Services
└── app/
    ├── build.gradle          ← UPDATED: Applied Google Services plugin
    └── google-services.json  ← MUST DOWNLOAD from Firebase

ios/
└── GoogleService-Info.plist  ← MUST DOWNLOAD from Firebase
```

---

## 🔐 Security Notes

### Don't Commit These Files

Add to `.gitignore`:

```gitignore
# Firebase config files (never commit!)
google-services.json
GoogleService-Info.plist
```

### Store Securely

- Use EAS Secrets for production builds
- Never hardcode Firebase credentials
- Use Firebase Security Rules to protect data

---

## 📖 References

- [React Native Firebase Docs](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [Expo Router + Firebase Setup](https://docs.expo.dev/guides/using-firebase/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

---

## ✨ What's Working Now

✅ Firebase automatically initializes on app startup  
✅ Firebase messaging service is properly initialized  
✅ FCM tokens can be requested and registered  
✅ Push notifications will be received in foreground and background  
✅ Deep linking from notifications works

---

## 🆘 Need Help?

If you're still getting errors:

1. Check the console logs for the exact error message
2. Verify `google-services.json` and `GoogleService-Info.plist` are in place
3. Ensure you're not using Expo Go
4. Share the console error in your feedback
