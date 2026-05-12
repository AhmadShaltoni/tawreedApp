# Push Notifications - Environment & Configuration

## Environment Variables Setup

### Create `.env` file in project root

```bash
# Copy from .env.example and update values
cp .env.example .env
```

**Important: Add to `.gitignore`**

```
.env
.env.local
.env.*.local
serviceAccountKey.json
```

**Backend .env (Node.js/Express server):**

```bash
# Firebase Service Account (Backend only)
FIREBASE_PROJECT_ID=tawreed-d7550
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tawreed-d7550.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=dcac4fc11052be79bb3a0f381a2aec97d1740005
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"

# Firebase Public Config (Frontend - safe to expose)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tawreed-d7550
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_PUBLIC_API_KEY
EXPO_PUBLIC_FIREBASE_APP_ID=1:116745950976293819044:android:YOUR_APP_ID

# Expo Configuration
EXPO_PUBLIC_PROJECT_ID=tawreed
EXPO_PUBLIC_API_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Frontend .env (Expo/React Native):**

```bash
# Only public Firebase credentials here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tawreed-d7550
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_PUBLIC_API_KEY
EXPO_PUBLIC_FIREBASE_APP_ID=1:116745950976293819044:android:YOUR_APP_ID

EXPO_PUBLIC_PROJECT_ID=tawreed
EXPO_PUBLIC_API_URL=http://localhost:3000
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
    "icon": "./assets/icon2.png",
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
        "foregroundImage": "./assets/adaptive-icon2.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.tawreed.app"
    },

    "web": {
      "favicon": "./assets/favicon2.png"
    },

    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon2.png",
          "color": "#3B82F6",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],

    "notification": {
      "icon": "assets/notification-icon2.png",
      "color": "#3B82F7",
      "sounds": ["assets/sounds/notification.wav"]
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
    "types": ["react", "react-native", "expo-notifications"]
  }
}
```

---

## Production vs Development

### Development Configuration

```typescript
// src/services/notification.service.ts
const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID || "tawreed";

const notificationConfig = {
  projectId: PROJECT_ID,
  environment: "development",
  debugging: true,
};
```

### Production Configuration

```typescript
// Build for production
const notificationConfig = {
  projectId: PROJECT_ID,
  environment: "production",
  debugging: false,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000,
  },
};
```

---

## Optional: Firebase Integration Path

If you want to migrate to Firebase later:

## Optional: Firebase Integration Path

If you want to migrate to Firebase later:

### 1. Install Firebase Dependencies

```bash
npm install firebase-admin
```

### 2. Backend Firebase Admin SDK Initialization

```typescript
// backend/src/config/firebase.ts
import admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK
 * Uses credentials from .env environment variables
 */
export const initializeFirebase = () => {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: "116745950976293819044",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  };

  if (!serviceAccount.project_id || !serviceAccount.private_key) {
    throw new Error(
      "Firebase credentials missing. Set FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY in .env",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log("✓ Firebase Admin SDK initialized");
  return admin.app();
};

// Export services
export const messaging = () => admin.messaging();
export const database = () => admin.database();
export const firestore = () => admin.firestore();
```

### 3. Create Firebase Service Wrapper (Backend)

```typescript
// backend/src/services/firebase-notification.service.ts
import admin from "firebase-admin";
import { initializeFirebase } from "../config/firebase";

interface SendNotificationParams {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

class FirebaseNotificationService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    initializeFirebase();
    this.messaging = admin.messaging();
  }

  /**
   * Send notification to multiple devices
   */
  async sendMulticast(params: SendNotificationParams) {
    try {
      const message = {
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data || {},
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.sendMulticast({
        tokens: params.tokens,
        ...message,
      } as any);

      console.log(`✓ Sent to ${response.successCount} devices`);
      console.log(`✗ Failed: ${response.failureCount} devices`);

      // Log failed tokens
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed token: ${params.tokens[idx]}`, resp.error);
        }
      });

      return response;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Send to a specific topic
   */
  async sendToTopic(topic: string, title: string, body: string) {
    try {
      const message = {
        notification: { title, body },
        topic,
      };

      const response = await this.messaging.send(message as any);
      console.log("✓ Message sent to topic:", response);
      return response;
    } catch (error) {
      console.error("Error sending to topic:", error);
      throw error;
    }
  }

  /**
   * Subscribe user to topic
   */
  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      console.log(`✓ Subscribed ${tokens.length} tokens to ${topic}`);
      return response;
    } catch (error) {
      console.error("Error subscribing to topic:", error);
      throw error;
    }
  }
}

export const firebaseNotificationService = new FirebaseNotificationService();
```

### 4. Example Backend Express Endpoint

```typescript
// backend/src/routes/notifications.ts
import express from "express";
import { firebaseNotificationService } from "../services/firebase-notification.service";

const router = express.Router();

/**
 * Send notification to users
 * POST /api/v1/notifications/send
 */
router.post("/send", async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;

    // Validate
    if (!tokens?.length || !title || !body) {
      return res.status(400).json({
        error: "Missing required fields: tokens, title, body",
      });
    }

    // Send
    const result = await firebaseNotificationService.sendMulticast({
      tokens,
      title,
      body,
      data,
    });

    res.json({
      success: true,
      sent: result.successCount,
      failed: result.failureCount,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
```

### 5. Feature Flag for Provider (Optional)

```typescript
// backend/src/services/notification-provider.ts
import { firebaseNotificationService } from "./firebase-notification.service";

// Feature flag: which provider to use
const USE_FIREBASE = process.env.USE_FIREBASE_NOTIFICATIONS === "true";

export const getNotificationProvider = () => {
  if (USE_FIREBASE) {
    return firebaseNotificationService;
  }
  // Fallback to Expo or other provider
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
  bypassDnd: false, // Don't bypass Do Not Disturb
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
const DEBUG = process.env.NODE_ENV === "development";

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[PushNotifications] ${message}`, data || "");
  }
};

const error = (message: string, err?: any) => {
  console.error(`[PushNotifications] ${message}`, err || "");
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
    },
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
  ? "http://localhost:3000" // Use your backend IP for device testing
  : "https://api.tawreed.jo";

// For device testing on same network:
const getLocalIP = () => {
  // Get device IP from environment
  return process.env.EXPO_PUBLIC_API_URL || "192.168.1.100:3000";
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
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

const errorConfig = {
  [ErrorSeverity.INFO]: {
    log: true,
    alert: false,
    retry: false,
  },
  [ErrorSeverity.WARNING]: {
    log: true,
    alert: false,
    retry: true,
  },
  [ErrorSeverity.ERROR]: {
    log: true,
    alert: true,
    retry: true,
  },
  [ErrorSeverity.CRITICAL]: {
    log: true,
    alert: true,
    retry: false,
    crash: true,
  },
};
```

---

## Performance Monitoring

### Optional Sentry Integration

```typescript
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
});

// Wrap service in Sentry
export const notificationService = Sentry.withProfiler(
  new NotificationServiceClass(),
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
  expoPushProjectId: process.env.EXPO_PROJECT_ID || "tawreed",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseApiKey: process.env.FIREBASE_API_KEY,

  maxTokensPerUser: 5,
  maxNotificationsPerHour: 10,

  maxRetries: 3,
  retryBackoffMs: 1000,

  inactiveTokenCleanupDays: 30,
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

## Security Best Practices for Firebase Credentials

### ⚠️ CRITICAL: Protecting Your Private Key

**NEVER:**

- ❌ Commit `.env` file to version control
- ❌ Share private keys via email, Slack, or GitHub
- ❌ Expose backend credentials in frontend code
- ❌ Log sensitive credentials
- ❌ Use same credentials across environments

**ALWAYS:**

- ✅ Use environment variables
- ✅ Rotate keys regularly (monthly recommended)
- ✅ Use different credentials per environment (dev/staging/prod)
- ✅ Use Secret Manager in production (Google Cloud, AWS Secrets Manager, etc.)
- ✅ Audit who has access to credentials

### Setting Up .env File Securely

```bash
# 1. Add .env to .gitignore (if not already there)
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "serviceAccountKey.json" >> .gitignore

# 2. Copy template
cp .env.example .env

# 3. Edit .env with your actual credentials (local only)
nano .env

# 4. IMPORTANT: Never commit .env
git status  # Verify .env is not staged
```

### Handling Private Key in .env

The private key has `\n` characters. When pasting, you need to preserve them:

**Option 1: Paste with literal newlines (recommended)**

```bash
# In .env file
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
... (each line on new line)
-----END PRIVATE KEY-----"
```

**Option 2: Keep escaped newlines**

```bash
# In .env file (as provided in JSON)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"

# Then use this in code:
private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
```

### Loading .env in Node.js

```typescript
// backend/src/config/env.ts
import dotenv from "dotenv";
import path from "path";

// Load .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// Validate required environment variables
const requiredVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(
      `Missing required environment variable: ${varName}\n` +
        `Please set it in .env file. Copy from .env.example`,
    );
  }
}

console.log("✓ Environment variables loaded");
```

### Rotating Firebase Keys (Important!)

When you accidentally expose a private key:

1. **Go to Firebase Console** → Project Settings → Service Accounts
2. **Delete the old key** (the one you exposed)
3. **Create a new service account key**
4. **Update .env** with the new private key
5. **Restart your backend server**

**Check if key was exposed:**

```bash
# Search git history for the key
git log -S "PRIVATE KEY" --all

# If found, you MUST rotate the key
```

### Production: Using Google Cloud Secret Manager

For production deployments:

```typescript
// backend/src/config/firebase-prod.ts
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

async function getFirebaseCredentials() {
  const client = new SecretManagerServiceClient();

  const secretName = client.secretVersionPath(
    process.env.GCP_PROJECT_ID,
    "firebase-private-key",
    "latest",
  );

  const [version] = await client.accessSecretVersion({ name: secretName });
  const secretString = version.payload?.data?.toString();

  return JSON.parse(secretString!);
}

// Initialize with secret
const credentials = await getFirebaseCredentials();
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  projectId: process.env.GCP_PROJECT_ID,
});
```

### Environment-Specific Credentials

```bash
# development
.env.local (ignored, never committed)

# staging
.env.staging (kept in secure vault, not in repo)

# production
.env.production (kept in Google Cloud Secret Manager)

# CI/CD
Use GitHub Secrets or GitLab CI variables
```

---

## References

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/notifications/)
- [Android Push Notifications](https://developer.android.com/google/play/services/messaging)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager)
