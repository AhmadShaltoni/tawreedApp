# Push Notifications - Environment & Configuration

## Environment Variables Setup

### Create `.env` file in project root

```bash
# Expo Configuration
EXPO_PUBLIC_PROJECT_ID=tawreed
EXPO_PUBLIC_API_URL=http://localhost:3000

# Optional: Firebase (for future migration)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project
EXPO_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
```

### Update `app.json` with notification settings

```json
{
  "expo": {
    "name": "Tawreed",
    "slug": "tawreed",
    "version": "1.0.0",
    "scheme": "tawreed",
    "platforms": ["ios", "android", "web"],
    
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.tawreed.app",
      "usesNonExemptEncryption": false,
      "entitlements": {
        "aps-environment": "development"
      }
    },
    
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.tawreed.app"
    },
    
    "web": {
      "favicon": "./assets/favicon.png"
    },
    
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3B82F6",
          "sounds": [
            "./assets/sounds/notification.wav"
          ]
        }
      ]
    ],
    
    "notification": {
      "icon": "assets/notification-icon.png",
      "color": "#3B82F7",
      "sounds": [
        "assets/sounds/notification.wav"
      ]
    }
  }
}
```

---

## Asset Files Required

Create these assets for notifications:

```
assets/
├── notification-icon.png        # 192x192px, transparent PNG
├── icon.png                     # 1024x1024px for app icon
├── adaptive-icon.png            # 108x108px for Android adaptive icon
├── favicon.png                  # 32x32px for web
└── sounds/
    └── notification.wav         # ~2 seconds, <500KB
```

### iOS Notification Icon
- Transparent PNG
- Minimum 192x192px
- White/light color
- No alpha gradients

### Android Notification Icon
- Transparent PNG
- Minimum 192x192px
- White/light color
- Large icon: 256x256px

---

## TypeScript Configuration

### Update `tsconfig.json` for notification types

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "types": [
      "react",
      "react-native",
      "expo-notifications"
    ]
  }
}
```

---

## Production vs Development

### Development Configuration

```typescript
// src/services/notification.service.ts
const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID || 'tawreed';

const notificationConfig = {
  projectId: PROJECT_ID,
  environment: 'development',
  debugging: true
};
```

### Production Configuration

```typescript
// Build for production
const notificationConfig = {
  projectId: PROJECT_ID,
  environment: 'production',
  debugging: false,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000
  }
};
```

---

## Optional: Firebase Integration Path

If you want to migrate to Firebase later:

### 1. Install Firebase Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Create Firebase Service Wrapper

```typescript
// src/services/firebaseNotification.service.ts
import messaging from '@react-native-firebase/messaging';

class FirebaseNotificationService {
  async initialize() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
    }
  }
  
  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus;
    } catch (error) {
      console.error('Failed to request FCM permission:', error);
    }
  }
}

export default new FirebaseNotificationService();
```

### 3. Feature Flag for Provider

```typescript
// src/services/notificationProvider.ts
const USE_FIREBASE = process.env.EXPO_PUBLIC_USE_FIREBASE === 'true';

export const getNotificationProvider = () => {
  if (USE_FIREBASE) {
    return firebaseNotificationService;
  }
  return expoNotificationService;
};
```

---

## Notification Channel Setup (Android)

### Configure channels in service

```typescript
// Already implemented in notification.service.ts
Notifications.setNotificationChannelAsync("default", {
  name: "default",
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: "#FF231F7C",
  bypassDnd: false,  // Don't bypass Do Not Disturb
});

// Optional: Additional channels for different notification types
Notifications.setNotificationChannelAsync("orders", {
  name: "Order Updates",
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 500, 0, 500],
  lightColor: "#FF6B9D",
});

Notifications.setNotificationChannelAsync("promotions", {
  name: "Promotions",
  importance: Notifications.AndroidImportance.DEFAULT,
  vibrationPattern: [0, 250],
  lightColor: "#FFA500",
});
```

---

## Testing with EAS Build (iOS/Android)

### Build for Testing

```bash
# Build for iOS
eas build --platform ios --profile preview

# Build for Android
eas build --platform android --profile preview

# Build both
eas build --profile preview
```

### EAS Build Configuration (`eas.json`)

```json
{
  "build": {
    "preview": {
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "large"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Debugging Push Notifications

### Enable Debug Logging

```typescript
// In notification.service.ts, at module level
const DEBUG = process.env.NODE_ENV === 'development';

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[PushNotifications] ${message}`, data || '');
  }
};

const error = (message: string, err?: any) => {
  console.error(`[PushNotifications] ${message}`, err || '');
};
```

### Browser DevTools Integration

```typescript
// Expose to window for console debugging
if (DEBUG) {
  (global as any).debugNotifications = {
    getToken: async () => {
      return await notificationService.getDeviceToken();
    },
    getPermissionStatus: async () => {
      return await Notifications.getPermissionsAsync();
    },
    clearStorage: async () => {
      // Clear all notification storage
    }
  };
}

// Usage in console:
// debugNotifications.getToken()
// debugNotifications.getPermissionStatus()
```

---

## Local Development Server

### Backend API Proxy (for local testing)

```typescript
// Configure for local development
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'  // Use your backend IP for device testing
  : 'https://api.tawreed.jo';

// For device testing on same network:
const getLocalIP = () => {
  // Get device IP from environment
  return process.env.EXPO_PUBLIC_API_URL || '192.168.1.100:3000';
};
```

---

## Expo Go Testing

For rapid testing without builds:

```bash
# Start Expo dev server
npm start

# Scan QR code with Expo Go app
# Test notifications directly on device
# Check console logs in terminal
```

### Limitations in Expo Go
- Real FCM/APNs tokens won't work
- Expo Notifications work perfectly
- Good for development/testing
- Production requires EAS builds

---

## Error Handling Configuration

```typescript
// Define error severity levels
enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

const errorConfig = {
  [ErrorSeverity.INFO]: {
    log: true,
    alert: false,
    retry: false
  },
  [ErrorSeverity.WARNING]: {
    log: true,
    alert: false,
    retry: true
  },
  [ErrorSeverity.ERROR]: {
    log: true,
    alert: true,
    retry: true
  },
  [ErrorSeverity.CRITICAL]: {
    log: true,
    alert: true,
    retry: false,
    crash: true
  }
};
```

---

## Performance Monitoring

### Optional Sentry Integration

```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production'
});

// Wrap service in Sentry
export const notificationService = Sentry.withProfiler(
  new NotificationServiceClass()
);
```

---

## Backend Configuration Template

### `config/notifications.config.ts` (Backend)

```typescript
export interface NotificationConfig {
  // Expo specific
  expoPushProjectId: string;
  
  // Firebase specific (optional)
  firebaseProjectId?: string;
  firebaseApiKey?: string;
  
  // Rate limiting
  maxTokensPerUser: number;
  maxNotificationsPerHour: number;
  
  // Retry policy
  maxRetries: number;
  retryBackoffMs: number;
  
  // Cleanup
  inactiveTokenCleanupDays: number;
}

export const notificationConfig: NotificationConfig = {
  expoPushProjectId: process.env.EXPO_PROJECT_ID || 'tawreed',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  
  maxTokensPerUser: 5,
  maxNotificationsPerHour: 10,
  
  maxRetries: 3,
  retryBackoffMs: 1000,
  
  inactiveTokenCleanupDays: 30
};
```

---

## Monitoring Dashboard Setup

### Key Metrics to Track

```typescript
interface NotificationMetrics {
  tokensRegistered: number;
  tokensActive: number;
  notificationsSent: number;
  notificationsDelivered: number;
  notificationsOpened: number;
  averageOpenRate: number;
  averageDeliveryTime: number;
}
```

### Database Queries for Analytics

```sql
-- Active tokens per platform
SELECT platform, COUNT(*) as count FROM DeviceToken 
WHERE isActive = true GROUP BY platform;

-- Tokens by user
SELECT userId, COUNT(*) as token_count FROM DeviceToken
WHERE isActive = true GROUP BY userId;

-- Oldest inactive tokens (cleanup candidates)
SELECT id, userId FROM DeviceToken
WHERE isActive = false AND updatedAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## Compliance & Legal

### GDPR & Privacy
- [ ] Users can opt-out of notifications
- [ ] Users can delete notification history
- [ ] Tokens deleted on account deletion
- [ ] Privacy policy mentions notifications

### Data Retention
- Keep active tokens indefinitely
- Delete inactive tokens after 30 days
- Retention policy: 90 days for notification logs
- User deletion: cascade delete all tokens

---

## Deployment Checklist

- [ ] Environment variables set in Expo Cloud
- [ ] Backend endpoints deployed and tested
- [ ] Database migrations running
- [ ] Firebase/APNs credentials configured (if upgrading)
- [ ] App Store / Play Store submissions updated
- [ ] Notification channels configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Analytics dashboard created
- [ ] User notification preferences implemented
- [ ] Rate limiting configured
- [ ] Cleanup jobs scheduled

---

## References

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/notifications/)
- [Android Push Notifications](https://developer.android.com/google/play/services/messaging)
