# Push Notifications - Backend & Platform Setup

## Expo Push Notifications vs Firebase

For this Expo project, we're using **Expo Push Notifications**, which provides:

- ✅ No Firebase setup required initially
- ✅ Works immediately with Expo project
- ✅ Later migration path to Firebase/FCM possible
- ✅ Automatic token management

---

## Backend Requirements

### 1. Database Schema

Store device tokens with this structure:

```typescript
// Example: Prisma schema
model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token     String   @unique  // Expo push token
  platform  String   // "IOS" or "ANDROID"
  isActive  Boolean  @default(true)

  lastUsed  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([token])
}
```

### 2. API Endpoints Implementation

#### Register Device Token

```typescript
// POST /api/v1/notifications/device-token
router.post("/device-token", authMiddleware, async (req, res) => {
  const { token, platform } = req.body;
  const userId = req.user.id;

  // Validate input
  if (!token || !["IOS", "ANDROID"].includes(platform)) {
    return res.status(400).json({
      success: false,
      error: "Invalid request data",
    });
  }

  try {
    // Find or create device token
    let deviceToken = await DeviceToken.findUnique({
      where: { token },
    });

    if (deviceToken) {
      // Update existing token
      deviceToken = await DeviceToken.update({
        where: { token },
        data: {
          userId,
          platform,
          isActive: true,
          lastUsed: new Date(),
        },
      });
    } else {
      // Create new token
      deviceToken = await DeviceToken.create({
        data: {
          userId,
          token,
          platform,
          isActive: true,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: "Device token registered successfully",
        deviceToken: {
          id: deviceToken.id,
          platform: deviceToken.platform,
          isActive: deviceToken.isActive,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to register device token",
    });
  }
});
```

#### Unregister Device Token

```typescript
// DELETE /api/v1/notifications/device-token
router.delete("/device-token", authMiddleware, async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Invalid request data",
    });
  }

  try {
    const deviceToken = await DeviceToken.deleteMany({
      where: {
        token,
        userId,
      },
    });

    if (deviceToken.count === 0) {
      return res.status(404).json({
        success: false,
        error: "Device token not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: "Device token unregistered successfully",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to unregister device token",
    });
  }
});
```

#### Get User's Device Tokens

```typescript
// GET /api/v1/notifications/device-token
router.get("/device-token", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const deviceTokens = await DeviceToken.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        deviceTokens,
        count: deviceTokens.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch device tokens",
    });
  }
});
```

#### Send Notification Service

```typescript
// services/notificationService.ts
import { Expo } from "expo-server-sdk";

const expo = new Expo();

interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    linkUrl?: string;
    [key: string]: any;
  };
}

export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
) {
  try {
    // Get user's device tokens
    const deviceTokens = await DeviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (deviceTokens.length === 0) {
      console.log(`No active device tokens for user ${userId}`);
      return [];
    }

    const messages = deviceTokens.map((dt) => ({
      to: dt.token,
      sound: "default" as const,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: 1,
      priority: "high" as const,
    }));

    // Send notifications
    const tickets = await expo.sendPushNotificationsAsync(messages);
    return tickets;
  } catch (error) {
    console.error("Failed to send notifications:", error);
    throw error;
  }
}

// Helper to parse notification receipts
export async function getNotificationReceipts(ticketIds: string[]) {
  try {
    const receipts = await expo.getPushNotificationReceiptsAsync(ticketIds);
    return receipts;
  } catch (error) {
    console.error("Failed to get receipts:", error);
    throw error;
  }
}
```

### 3. Enhanced Login/Register Endpoints

Optionally accept deviceToken during login/register:

```typescript
// POST /api/v1/auth (with device token)
router.post("/auth", async (req, res) => {
  const { phone, password, deviceToken, platform, action } = req.body;

  // ... existing validation and authentication logic ...

  if (authentication_success) {
    const user = {
      /* ... */
    };
    const token = generateJWT(user);

    // If device token provided, register it
    if (deviceToken && platform) {
      try {
        await DeviceToken.upsert({
          where: { token: deviceToken },
          update: {
            userId: user.id,
            platform,
            isActive: true,
          },
          create: {
            userId: user.id,
            token: deviceToken,
            platform,
            isActive: true,
          },
        });
      } catch (error) {
        // Non-critical, don't fail auth
        console.error("Failed to register device token during login");
      }
    }

    res.status(200).json({
      success: true,
      data: { token, user },
    });
  }
});
```

---

## Sending Notifications from Backend

### Example: New Order Notification

```typescript
// handlers/orderHandler.ts
export async function notifyNewOrder(order: Order, customer: User) {
  const notificationPayload = {
    title: "طلب جديد",
    body: `تم تلقي طلب بقيمة ${order.total} د.أ`,
    data: {
      linkUrl: `/orders/${order.id}`,
      orderId: order.id,
      orderTotal: order.total,
      orderStatus: order.status,
      imageUrl: order.items[0]?.product?.imageUrl, // Optional
    },
  };

  await sendNotificationToUser(customer.id, notificationPayload);
}
```

### Example: Cron Job for Reminders

```typescript
// jobs/reminderJob.ts (runs every hour)
export async function sendPendingOrderReminders() {
  const pendingOrders = await Order.findMany({
    where: {
      status: "pending",
      createdAt: {
        lte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Created > 24 hours ago
      },
    },
    include: { customer: true },
  });

  for (const order of pendingOrders) {
    await sendNotificationToUser(order.customer.id, {
      title: "تذكير بطلبك",
      body: `طلبك #${order.id} لم يتم تأكيده بعد`,
      data: {
        linkUrl: `/orders/${order.id}`,
        orderId: order.id,
        type: "reminder",
      },
    });
  }
}
```

---

## Handling Notification Receipts

After sending notifications, track delivery status:

```typescript
// services/notificationReceiptHandler.ts
export async function handleNotificationReceipts(ticketIds: string[]) {
  const receipts = await getNotificationReceipts(ticketIds);

  for (const [key, receipt] of Object.entries(receipts)) {
    if (receipt.status === "ok") {
      console.log(`Notification sent: ${key}`);
    } else if (receipt.status === "error") {
      console.error(`Notification error [${key}]:`, receipt.message);

      // Handle specific error types
      if (receipt.details?.error === "DeviceNotRegistered") {
        // Mark token as inactive
        await DeviceToken.updateMany({
          where: { token: key },
          data: { isActive: false },
        });
      } else if (receipt.details?.error === "InvalidCredentials") {
        // Remove invalid token
        await DeviceToken.deleteMany({
          where: { token: key },
        });
      }
    }
  }
}
```

---

## Database Migration (if using Prisma)

```prisma
// prisma/migrations/xxx_add_device_tokens/migration.sql

CREATE TABLE "DeviceToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "platform" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsed" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");
```

---

## Platform-Specific Setup (Optional)

### iOS Setup (For Production)

1. **Apple Push Certificates**
   - Login to Apple Developer Account
   - Create Push Notification Certificate
   - Download .p8 key file

2. **Expo Configuration**

   ```bash
   eas build --platform ios --auto-submit
   ```

3. **app.json**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./path/to/notification-icon.png",
             "color": "#3B82F6"
           }
         ]
       ]
     }
   }
   ```

### Android Setup (For Production)

1. **Firebase Project**
   - Create Firebase project
   - Download google-services.json
   - Add to android/app/

2. **Expo Configuration**
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

---

## Testing Backend Notifications

### Using curl

```bash
# Register device token (test)
curl -X POST http://localhost:3000/api/v1/notifications/device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxx]",
    "platform": "IOS"
  }'

# Get device tokens
curl -X GET http://localhost:3000/api/v1/notifications/device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. Import collection
2. Set `{{jwt_token}}` environment variable
3. Run register device token endpoint
4. Send test notification
5. Verify receipt in backend logs

---

## Monitoring & Analytics

### Track Notification Metrics

```typescript
// Track in database
model NotificationLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  title     String
  body      String
  linkUrl   String?
  type      String   // "order", "product", "promotion", etc.

  sent      Boolean  @default(true)
  delivered Boolean  @default(false)
  opened    Boolean  @default(false)

  sentAt    DateTime @default(now())
  deliveredAt DateTime?
  openedAt  DateTime?

  @@index([userId])
  @@index([type])
}
```

Track opening by detecting deep link navigation:

```typescript
// In React Native app, when notification is tapped
const handleNotificationTap = (notification) => {
  // Log to backend that notification was opened
  await api.post("/api/v1/notifications/:id/opened", {
    notificationId: notification.id,
    openedAt: new Date(),
  });
};
```

---

## Error Scenarios & Responses

| Scenario                 | Status | Response               |
| ------------------------ | ------ | ---------------------- |
| Valid request            | 201    | Token registered       |
| Invalid token format     | 400    | Invalid request data   |
| Missing auth header      | 401    | Unauthorized           |
| Token already registered | 201    | Updated entry          |
| User not found           | 401    | Unauthorized           |
| Database error           | 500    | Server error           |
| Token not found (delete) | 404    | Device token not found |
| Successful delete        | 200    | Token unregistered     |

---

## Performance Optimization

### Batch Token Registration

```typescript
// For high-volume scenarios
export async function batchRegisterDeviceTokens(
  tokens: Array<{ userId: string; token: string; platform: string }>,
) {
  return await DeviceToken.createMany({
    data: tokens,
    skipDuplicates: true,
  });
}
```

### Caching

```typescript
// Cache active tokens in Redis for faster lookup
const cacheKey = `user_active_tokens:${userId}`;
const cached = await redis.get(cacheKey);

if (!cached) {
  const tokens = await DeviceToken.findMany({ where: { userId } });
  await redis.set(cacheKey, JSON.stringify(tokens), "EX", 3600);
  return tokens;
}

return JSON.parse(cached);
```

---

## Next Steps

1. **Implement Device Token Endpoints** - Add routes to your backend
2. **Database Schema** - Create DeviceToken table
3. **Notification Service** - Implement sending logic
4. **Test Workflow** - Register token → Send notification → Verify receipt
5. **Production Setup** - Configure iOS/Android platform credentials
6. **Analytics** - Track notification metrics
7. **User Preferences** - Add notification opt-in/out per type
