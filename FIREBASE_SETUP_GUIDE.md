# 🔥 Firebase Cloud Messaging Setup Guide

> دليل شامل لإعداد Firebase Cloud Messaging في تطبيق توريد

## 📋 جدول المحتويات

1. [متطلبات مسبقة](#متطلبات-مسبقة)
2. [إعداد Firebase Console](#إعداد-firebase-console)
3. [تكوين Android](#تكوين-android)
4. [تكوين iOS](#تكوين-ios)
5. [اختبار النظام](#اختبار-النظام)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## ✅ متطلبات مسبقة

- ✅ حساب Google
- ✅ Firebase Project (مجاني في Spark plan)
- ✅ Android SDK (للتطوير على Android)
- ✅ Xcode (للتطوير على iOS)
- ✅ `google-services.json` (Android)
- ✅ `GoogleService-Info.plist` (iOS)

---

## 🎯 إعداد Firebase Console

### الخطوة 1: إنشاء Project جديد

```
1. اذهب إلى https://console.firebase.google.com
2. انقر على "Create a new project"
3. أدخل اسم Project: "tawreed" (أو أي اسم)
4. اقبل شروط Firebase
5. انقر على "Create project"
```

### الخطوة 2: تفعيل Cloud Messaging

```
1. من Firebase Console، انقر على "Cloud Messaging" في القائمة
2. انقر على "Enable"
3. سيظهر "Messaging API" - تأكد من تفعيله
```

### الخطوة 3: الحصول على بيانات الاعتماد

```
1. اذهب إلى Project Settings (الأيقونة في أسفل يسار القائمة)
2. انسخ Project ID
3. انسخ Project Number (Sender ID)
```

---

## 📱 تكوين Android

### الخطوة 1: تحميل google-services.json

```
1. في Firebase Console، انقر على "Android" من "Add app"
2. أدخل Package Name: "com.tawreed.app" (من app.json)
3. انقر على "Download google-services.json"
4. ضع الملف في: android/app/google-services.json
```

### الخطوة 2: تحديث build.gradle

تأكد من أن `android/build.gradle` يحتوي على:

```gradle
buildscript {
  repositories {
    // Check that you have the following line (if not, add it):
    google()  // Google's Maven repository
  }
  dependencies {
    // ...
    // Add the line below; the version should be at least 4.3.10
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

### الخطوة 3: تطبيق الـ Plugin

تأكد من أن `android/app/build.gradle` يحتوي على:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line
```

### الخطوة 4: بناء APK جديد

```bash
cd /Users/user/Desktop/tawreed/tawreedApp

# للتطوير
eas build --platform android

# أو للـ Production
eas build --platform android --profile production
```

---

## 🍎 تكوين iOS

### الخطوة 1: تحميل GoogleService-Info.plist

```
1. في Firebase Console، انقر على "iOS" من "Add app"
2. أدخل Bundle ID: "com.tawreed.app" (من app.json)
3. انقر على "Download GoogleService-Info.plist"
```

### الخطوة 2: إضافة الملف إلى Xcode

```
1. افتح Xcode: ios/tawreed.xcworkspace
2. في Project Navigator، انقر بزر الماوس على Tawreed folder
3. اختر "Add Files to 'tawreed'"
4. اختر GoogleService-Info.plist
5. تأكد من تفعيل "Copy items if needed"
6. اضغط "Add"
```

### الخطوة 3: التحقق من Firebase SDK

في `ios/Podfile`، تأكد من وجود:

```ruby
target 'tawreed' do
  # ... existing pods

  pod 'Firebase/Core'
  pod 'Firebase/Messaging'

  # ... rest of pods
end
```

### الخطوة 4: بناء iOS App

```bash
cd /Users/user/Desktop/tawreed/tawreedApp

# تحديث Pods
cd ios && pod install && cd ..

# بناء App
eas build --platform ios
```

---

## 🧪 اختبار النظام

### اختبار محلي (على جهاز حقيقي)

#### الخطوة 1: تشغيل التطبيق

```bash
npx expo start
```

#### الخطوة 2: تثبيت على جهاز

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

#### الخطوة 3: التحقق من FCM Token

افتح console وتحقق من السجلات:

```
[Firebase] FCM Token obtained: exxxxxxx...
[Firebase] Device token registered successfully
```

### اختبار من Firebase Console

#### إرسال رسالة تجريبية

```
1. في Firebase Console → Cloud Messaging → Send your first message
2. أدخل العنوان والنص
3. حدد التطبيق
4. حدد الجهاز المستهدف
5. انقر "Send test message"
```

#### ستظهر الرسالة على الجهاز

```
على الشاشة الرئيسية:
- عنوان الإشعار
- نص الإشعار
- أيقونة التطبيق
```

---

## 🐛 استكشاف الأخطاء

### الخطأ: "Firebase not initialized"

**الحل:**
```
1. تأكد من وضع google-services.json (Android)
2. تأكد من وضع GoogleService-Info.plist (iOS)
3. أعد تشغيل التطبيق: npx expo start -c
```

### الخطأ: "MissingPluginException: No implementation found"

**الحل:**
```
1. حذف build folders: rm -rf build/ dist/ .next
2. إعادة تثبيت dependencies: npm install
3. بناء جديد: eas build
```

### الخطأ: "No sender ID found"

**الحل:**
```
1. تأكد من وجود Project Number في Firebase Console
2. تأكد من تفعيل Cloud Messaging
3. أعد تحميل google-services.json
```

### الخطأ: "Invalid APK"

**الحل:**
```
1. تأكد من استخدام Build Profile الصحيح
2. تأكد من توقيع APK
3. جرب: eas build --profile preview
```

### الخطأ: لا توجد رسائل

**خطوات التصحيح:**

```bash
# 1. تحقق من السجلات
console.log في Firebase Service

# 2. تحقق من أن Device Token مسجل
GET /api/v1/notifications/device-token

# 3. اختبر API مباشرة
curl -X POST https://api.tawreed.com/api/v1/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "123", "title": "Test", "body": "Hello"}'

# 4. تحقق من Backend Logs
```

---

## 📝 Checklist نهائي

- [ ] Firebase Project تم إنشاؤه
- [ ] Cloud Messaging تم تفعيله
- [ ] google-services.json موجود (Android)
- [ ] GoogleService-Info.plist موجود (iOS)
- [ ] @react-native-firebase مثبت
- [ ] notificationService.ts محدث
- [ ] app/_layout.tsx محدث
- [ ] APK/IPA تم بناؤه
- [ ] اختبار على جهاز حقيقي ✅
- [ ] رسالة تجريبية وصلت ✅

---

## 📚 روابط مفيدة

- [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/messaging/usage)
- [Expo Firebase Integration](https://docs.expo.dev/guides/notification/)
- [Firebase Console](https://console.firebase.google.com)

---

## 🆘 طلب مساعدة

إذا واجهت مشاكل:

1. تحقق من **Checklist** أعلاه
2. راجع **استكشاف الأخطاء**
3. تحقق من [Firebase Console Logs](https://console.firebase.google.com)
4. اطلب مساعدة من فريق Backend

---

**آخر تحديث:** 6 مايو 2026 | **الإصدار:** 1.0
