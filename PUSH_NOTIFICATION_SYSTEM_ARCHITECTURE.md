# Professional Push Notification System Architecture
## Complete Technical Guide for Production Deployment

**Document Version:** 1.0  
**Last Updated:** May 11, 2026  
**Status:** Production-Ready Architecture  

---

## Table of Contents

1. [Overall Push Notification Architecture](#1-overall-push-notification-architecture)
2. [Mobile App Responsibilities](#2-mobile-app-responsibilities)
3. [Backend Push Notification System](#3-backend-push-notification-system)
4. [Database Design](#4-database-design)
5. [User Segmentation Logic](#5-user-segmentation-logic)
6. [Dashboard / Admin Portal](#6-dashboard--admin-portal)
7. [Notification Types & Delivery](#7-notification-types--delivery)
8. [Firebase Topics vs Backend Segmentation](#8-firebase-topics-vs-backend-segmentation)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Best Practices & Production Concerns](#10-best-practices--production-concerns)

---

## 1. Overall Push Notification Architecture

### System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PUSH NOTIFICATION ECOSYSTEM                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  ADMIN DASHBOARD │
│  (React/Next.js) │
│                  │
│ • Create Campaign│
│ • Select Segment│
│ • Schedule Notif│
│ • View Analytics│
└────────┬─────────┘
         │ HTTP/REST API
         ▼
┌──────────────────────────────────────────┐
│         BACKEND (Node.js/Express)        │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  Notification Management Service    │ │
│  │ • Validation                        │ │
│  │ • Template Processing               │ │
│  │ • Segmentation Engine               │ │
│  │ • User Audience Building            │ │
│  └─────────────────────────────────────┘ │
│                  │                        │
│  ┌─────────────────────────────────────┐ │
│  │  Notification Queue (BullMQ/Redis)  │ │
│  │ • FIFO Processing                   │ │
│  │ • Retry Logic                       │ │
│  │ • Scheduling                        │ │
│  │ • Rate Limiting                     │ │
│  └─────────────────────────────────────┘ │
│                  │                        │
│  ┌─────────────────────────────────────┐ │
│  │  Notification Worker (Background)   │ │
│  │ • Firebase Admin SDK                │ │
│  │ • Batch Sending                     │ │
│  │ • Delivery Tracking                 │ │
│  │ • Token Cleanup                     │ │
│  └─────────────────────────────────────┘ │
│                  │                        │
│  ┌─────────────────────────────────────┐ │
│  │  Event Tracking System              │ │
│  │ • User Actions                      │ │
│  │ • App Lifecycle                     │ │
│  │ • Engagement Metrics                │ │
│  └─────────────────────────────────────┘ │
│                  │                        │
│  ┌─────────────────────────────────────┐ │
│  │  Database (PostgreSQL + Prisma)     │ │
│  │ • Users & Devices                   │ │
│  │ • Notification Logs                 │ │
│  │ • User Events                       │ │
│  │ • Segments                          │ │
│  │ • Campaign History                  │ │
│  └─────────────────────────────────────┘ │
└────────┬──────────────────────────────────┘
         │ Firebase Admin SDK
         ▼
┌──────────────────────────────────────────┐
│     FIREBASE CLOUD MESSAGING (FCM)       │
│                                          │
│ • Handles Device Registration            │
│ • Routes Messages to Devices             │
│ • Manages Token Lifecycle                │
│ • Delivery Status Callbacks              │
│ • Topic Management (optional)            │
└────────┬──────────────────────────────────┘
         │ Over Internet
         ▼
┌──────────────────────────────────────────┐
│   MOBILE DEVICES (React Native/Expo)     │
│                                          │
│ ┌───────────────────────────────────────┐│
│ │  FCM Registration & Token Management  ││
│ │ • Generate/Refresh FCM Tokens         ││
│ │ • Send Token to Backend               ││
│ │ • Handle Token Expiration             ││
│ └───────────────────────────────────────┘│
│ ┌───────────────────────────────────────┐│
│ │  Notification Reception & Display     ││
│ │ • Foreground: Custom Handler          ││
│ │ • Background: System Handler          ││
│ │ • Deep Linking on Tap                 ││
│ └───────────────────────────────────────┘│
│ ┌───────────────────────────────────────┐│
│ │  Event Tracking (Local + Remote)      ││
│ │ • Track Opens/Taps                    ││
│ │ • App Lifecycle Events                ││
│ │ • User Engagement                     ││
│ │ • Behavioral Data                     ││
│ └───────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### System Responsibilities Breakdown

#### **Mobile App Responsibilities**
- Register with FCM and generate tokens
- Send FCM token to backend on first install and token refresh
- Receive and display push notifications
- Handle notification interactions (opens, deep links)
- Track user behavior and app lifecycle events
- Queue events for backend transmission
- Respect notification preferences and settings
- **Minimal changes needed** — infrastructure already in place

#### **Backend Responsibilities**
- Validate and store FCM tokens
- Validate notification requests from dashboard
- Build target audiences through segmentation
- Query database to identify users matching criteria
- Manage notification queue and scheduling
- Send notifications via Firebase Admin SDK
- Track delivery status and failures
- Clean up invalid tokens
- Implement retry logic and rate limiting
- Log all notification activity for analytics
- Handle timezone-aware scheduling
- Maintain audit trail for compliance

#### **Firebase Cloud Messaging (FCM) Responsibilities**
- Deliver messages to registered devices
- Manage device registration lifecycle
- Handle token refresh and invalidation
- Store message history (limited by FCM)
- Route messages based on platform (iOS/Android)
- Provide delivery receipts and multicast responses
- **NOT responsible for:** Campaign logic, audience targeting, scheduling, analytics, segmentation

#### **Admin Dashboard Responsibilities**
- UI for campaign creation and management
- Audience segmentation and preview
- Scheduling and timezone support
- Notification template design
- Campaign publishing and monitoring
- Analytics and reporting
- Token management and user lookup
- User preferences management

### Why Firebase Console Should NOT Be Used for Production

**Firebase Console Limitations for Production:**

| Aspect | Firebase Console | Backend System |
|--------|------------------|-----------------|
| **Segmentation** | Manual single user/topic | Dynamic audience targeting |
| **Scheduling** | Limited or immediate | Full cron + timezone support |
| **Analytics** | Basic delivery stats | Deep engagement metrics |
| **Audit Trail** | Minimal logging | Complete audit history |
| **Rate Limiting** | Manual throttling | Automatic, configurable |
| **Retry Logic** | Default FCM behavior | Custom retry strategies |
| **GDPR Compliance** | Limited controls | Full consent tracking |
| **A/B Testing** | Not supported | Built-in variant support |
| **User Context** | None | Full business context |
| **Historical Data** | Limited retention | Permanent database records |

**Firebase Console is suitable ONLY for:**
- Development and testing
- Quick troubleshooting
- One-off notifications to specific devices
- Token validation testing

**Production notifications MUST go through backend** to ensure:
- Compliance with regulations
- Proper tracking and analytics
- Audience targeting logic
- Scheduling and retry policies
- Cost optimization
- Audit logging

---

## 2. Mobile App Responsibilities

### Current State Assessment

Your frontend is mostly complete with:
- ✅ FCM token generation working
- ✅ Firebase Messaging integration
- ✅ Notification reception
- ✅ Deep linking support

**Minimal additional work needed:**
- Event tracking for segmentation
- App lifecycle tracking
- Enhanced notification handling metrics

### Required Frontend Implementation (Minimal)

#### **A. FCM Token Management**

Already implemented. Verify these requirements:

```typescript
// Existing functionality to maintain:
- FCM token generation on app launch
- Token sent to backend immediately
- Token refresh detected and sent to backend
- Token stored securely (expo-secure-store)
- Token invalidated on logout
- User can opt-out of notifications
```

**No changes needed here** — keep existing implementation.

#### **B. Event Tracking System**

This is the CRITICAL addition for segmentation. Events enable backend to understand user behavior.

**Required Events to Track:**

```typescript
type UserEvent = {
  eventType: 'app_open' | 'app_close' | 'product_view' | 'add_to_cart' | 
             'checkout_started' | 'order_completed' | 'order_cancelled' |
             'product_search' | 'category_browse' | 'offer_viewed' |
             'notification_opened' | 'notification_dismissed';
  userId: string;
  timestamp: ISO8601;
  metadata?: {
    productId?: string;
    cartValue?: number;
    orderId?: string;
    searchQuery?: string;
    // ... relevant context
  };
}
```

**Which events matter for segmentation:**

| Event | Used For | Priority |
|-------|----------|----------|
| `app_open` | Inactivity calculation, activity tracking | **CRITICAL** |
| `app_close` | Session tracking | HIGH |
| `product_view` | Product interest, recommendation | HIGH |
| `add_to_cart` | Abandoned cart detection | **CRITICAL** |
| `checkout_started` | Cart abandonment (intent to purchase) | **CRITICAL** |
| `order_completed` | Purchase frequency, customer loyalty | HIGH |
| `order_cancelled` | Churn risk assessment | MEDIUM |
| `product_search` | Interest tracking, personalization | MEDIUM |
| `notification_opened` | Engagement metrics, segment performance | MEDIUM |

**Implementation approach (minimal):**

```typescript
// In your app/store/slices or services:
// Create a simple event queue service

interface EventQueue {
  queue: UserEvent[];
  lastSyncTime: timestamp;
  
  addEvent(event: UserEvent): void;          // Queue locally
  syncEvents(): Promise<void>;                // Batch send to backend
  clearQueue(): void;
}

// Hook into existing navigation/app lifecycle:
- useEffect(() => { track('app_open') }, [app initialization])
- useEffect(() => { track('app_close') }, [useBeforeRemove lifecycle])
- useEffect(() => { track('product_view') }, [on ProductDetailScreen mount])
// ... similar for other events
```

**Sync strategy:**
- Queue events locally in AsyncStorage
- Sync every 5 minutes or when queue reaches 20 events
- Sync on app background/close
- Handle offline gracefully
- **Automatic, no user intervention required**

#### **C. Notification Interaction Tracking**

Already implemented. Verify:

```typescript
// Track when user:
1. Sees notification (foreground handler logs it)
2. Taps notification (deep link handler logs it)
3. Dismisses notification (system callback)
```

This data is used for:
- Open rates
- Click-through rates
- Segment performance metrics
- A/B testing results

### Frontend Impact Summary

**Changes Required:** ⚠️ Minimal  
**Effort:** 2-3 developer days

**Checklist:**
- [ ] Create event tracking service
- [ ] Add app lifecycle hooks (app_open, app_close)
- [ ] Add product interaction tracking (product_view, add_to_cart, checkout_started)
- [ ] Add order lifecycle tracking (order_completed, order_cancelled)
- [ ] Implement AsyncStorage-based event queue
- [ ] Implement background sync (5-min interval)
- [ ] Add offline handling for events
- [ ] Verify notification tap tracking working
- [ ] Test event payload structure matches backend expectations

---

## 3. Backend Push Notification System

### Recommended Architecture

The backend system consists of interconnected services working together:

```
┌────────────────────────────────────────────────────────────┐
│                   API LAYER (Express)                       │
├────────────────────────────────────────────────────────────┤
│ POST /api/v1/notifications/send                            │
│ POST /api/v1/notifications/campaign (admin only)           │
│ GET  /api/v1/notifications/:id/status                      │
│ POST /api/v1/notifications/:id/analytics                   │
│ GET  /api/v1/segments (audience preview)                   │
│ POST /api/v1/devices/token (token registration)            │
└───────────┬──────────────────────────────────────────────┬─┘
            │                                              │
    ┌───────▼──────────┐                          ┌───────▼──────────┐
    │ Notification     │                          │ Event Tracking   │
    │ Service          │                          │ Service          │
    │                  │                          │                  │
    │ • Validation     │                          │ • Parse events   │
    │ • Segmentation   │                          │ • Aggregate data │
    │ • Template       │                          │ • Update metrics │
    │ • Authorization  │                          │ • Sync to DB     │
    └───────┬──────────┘                          └──────────────────┘
            │
    ┌───────▼──────────────────────────┐
    │  Notification Queue (BullMQ)      │
    │                                   │
    │  • Holds notification jobs        │
    │  • Managed by Redis               │
    │  • Supports delayed/scheduled     │
    │  • Implements retry logic         │
    │  • FIFO processing                │
    └───────┬──────────────────────────┘
            │
    ┌───────▼──────────────────────────┐
    │ Notification Worker (Process)    │
    │                                   │
    │ • Dequeue jobs                    │
    │ • Send via Firebase Admin SDK     │
    │ • Track delivery status           │
    │ • Handle failures                 │
    │ • Clean invalid tokens            │
    └───────┬──────────────────────────┘
            │
    ┌───────▼──────────────────────────┐
    │  Firebase Admin SDK               │
    │                                   │
    │ • Send to device                  │
    │ • Send to topic                   │
    │ • Send to multiple devices        │
    │ • Receive responses               │
    └───────────────────────────────────┘
```

### Service Architecture Recommendations

#### **1. Notification Service**

Core business logic for managing notifications.

**Responsibilities:**
- Validate notification request
- Check sender authorization
- Execute segmentation query
- Build target user list
- Create notification records
- Enqueue jobs
- Handle scheduling

**Key Methods:**

```typescript
interface NotificationService {
  // Send to specific users/segments
  sendCampaign(request: {
    title: string;
    body: string;
    targetAudience: SegmentQuery;
    scheduledFor?: Date;
    templateId?: string;
    metadata?: object;
  }): Promise<Campaign>;
  
  // Send to single device (test/urgent)
  sendToDevice(userId: string, notification: {
    title: string;
    body: string;
    data?: object;
  }): Promise<SendResult>;
  
  // Get campaign status
  getCampaignStatus(campaignId: string): Promise<CampaignStatus>;
  
  // Update campaign (draft only)
  updateCampaign(campaignId: string, updates: object): Promise<Campaign>;
  
  // Publish draft campaign
  publishCampaign(campaignId: string): Promise<void>;
  
  // Segment preview
  previewAudience(segmentQuery: SegmentQuery): Promise<PreviewResult>;
}
```

#### **2. Segmentation Engine**

Builds dynamic user audiences based on business logic.

**Query Builder Pattern:**

```typescript
interface SegmentQuery {
  filters: {
    inactiveFor?: { days: number };           // last_seen_at logic
    hasAbandonedCart?: boolean;                // cart_updated_at logic
    frequentPurchaser?: boolean;               // order_count logic
    neverOpenedOffer?: { offerId: string };   // engagement logic
    recentlyActive?: boolean;                  // last_app_open logic
    platform?: 'ios' | 'android' | 'all';     // device_platform logic
    appVersionMin?: string;                    // app_version logic
  };
  excludeUsers?: string[];                     // Opt-out list
  limit?: number;                              // Preview limit
}
```

**Example Queries:**

```sql
-- Users inactive for 7 days
SELECT u.id FROM users u
WHERE u.last_seen_at < NOW() - INTERVAL '7 days'
  AND u.push_enabled = true
  AND u.deleted_at IS NULL;

-- Users with abandoned carts (added items 2+ days ago, no purchase)
SELECT u.id FROM users u
INNER JOIN carts c ON u.id = c.user_id
LEFT JOIN orders o ON u.id = o.user_id 
  AND o.created_at > c.updated_at
WHERE c.updated_at < NOW() - INTERVAL '2 days'
  AND c.item_count > 0
  AND o.id IS NULL
  AND u.push_enabled = true;

-- Frequent purchasers (3+ orders in last 90 days)
SELECT u.id FROM users u
WHERE (SELECT COUNT(*) FROM orders o 
       WHERE o.user_id = u.id 
       AND o.created_at > NOW() - INTERVAL '90 days') >= 3
  AND u.push_enabled = true;
```

**Implementation:**

```typescript
class SegmentationEngine {
  private db: PrismaClient;
  
  async buildAudience(query: SegmentQuery): Promise<string[]> {
    let sql = "SELECT u.id FROM users u WHERE 1=1";
    const params: any[] = [];
    
    if (query.filters.inactiveFor) {
      sql += ` AND u.last_seen_at < NOW() - INTERVAL '${query.filters.inactiveFor.days} days'`;
    }
    
    if (query.filters.hasAbandonedCart) {
      sql += ` AND u.id IN (
        SELECT u.id FROM users u
        INNER JOIN carts c ON u.id = c.user_id
        WHERE c.updated_at < NOW() - INTERVAL '2 days'
          AND c.item_count > 0
        EXCEPT
        SELECT u.id FROM users u
        WHERE EXISTS (
          SELECT 1 FROM orders o 
          WHERE o.user_id = u.id 
          AND o.created_at > c.updated_at
        )
      )`;
    }
    
    // ... more filter logic
    
    sql += " AND u.push_enabled = true";
    sql += " AND u.deleted_at IS NULL";
    
    const result = await this.db.$queryRawUnsafe(sql);
    return result.map(row => row.id);
  }
}
```

#### **3. Notification Queue (BullMQ + Redis)**

Handles asynchronous notification sending with retry logic.

**Why BullMQ:**
- ✅ Job persistence (survives server restarts)
- ✅ Delayed/scheduled jobs
- ✅ Automatic retries with exponential backoff
- ✅ Rate limiting per worker
- ✅ Processing status tracking
- ✅ Failed job management
- ✅ Lightweight compared to RabbitMQ

**Configuration:**

```typescript
import Queue from 'bull';
import Redis from 'redis';

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,                           // Retry 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000,                        // Start at 2 seconds
    },
    removeOnComplete: true,                // Clean up after 30 days
    removeOnFail: false,                   // Keep failed for debugging
  },
});

interface NotificationJob {
  campaignId: string;
  userId: string;
  fcmTokens: string[];                     // User may have multiple devices
  title: string;
  body: string;
  data?: Record<string, string>;
  priority: 'high' | 'normal' | 'low';
  scheduledFor?: Date;
}
```

**Queue Processing Strategy:**

```typescript
// Rate limiting: max 1000 notifications/second to avoid FCM throttling
notificationQueue.process(100, async (job: Job<NotificationJob>) => {
  const { userId, fcmTokens, title, body, data, priority } = job.data;
  
  try {
    // Send via Firebase Admin SDK
    const response = await admin.messaging().sendMulticast({
      tokens: fcmTokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: priority === 'high' ? 'high' : 'normal',
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
    
    // Log delivery status
    await logNotificationDelivery({
      userId,
      campaignId: job.data.campaignId,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens: response.responses
        .map((r, i) => r.error ? fcmTokens[i] : null)
        .filter(Boolean),
    });
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      await cleanupInvalidTokens(userId, response);
    }
    
    job.progress(100);
    return { sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    console.error(`Failed to send notification for job ${job.id}:`, error);
    throw error; // Triggers retry
  }
});
```

#### **4. Event Tracking Service**

Processes user behavior events from mobile app.

**Responsibilities:**
- Validate event structure
- Aggregate batch events
- Update user metrics
- Trigger automated workflows

**Implementation:**

```typescript
interface EventProcessor {
  // Batch receive events from mobile app
  processEventBatch(userId: string, events: UserEvent[]): Promise<void>;
  
  // Handle individual event types
  handleAppOpen(userId: string, timestamp: Date): Promise<void>;
  handleAddToCart(userId: string, cartValue: number): Promise<void>;
  handleOrderCompleted(userId: string, orderId: string): Promise<void>;
  
  // Update user metrics (cached for performance)
  updateUserMetrics(userId: string): Promise<void>;
}

class EventProcessor implements EventProcessor {
  async processEventBatch(userId: string, events: UserEvent[]): Promise<void> {
    for (const event of events) {
      await this.processEvent(userId, event);
    }
    
    // Update aggregated metrics
    await this.updateUserMetrics(userId);
  }
  
  async handleAppOpen(userId: string, timestamp: Date): Promise<void> {
    // Critical for inactivity-based segmentation
    await db.user.update({
      where: { id: userId },
      data: {
        last_app_open: timestamp,
        last_seen_at: timestamp,
        inactive_days: 0,
      },
    });
  }
  
  async handleAddToCart(userId: string, cartValue: number): Promise<void> {
    // Critical for abandoned cart segmentation
    await db.user.update({
      where: { id: userId },
      data: {
        cart_updated_at: new Date(),
        cart_value: cartValue,
      },
    });
  }
  
  async handleOrderCompleted(userId: string, orderId: string): Promise<void> {
    // Useful for segmentation and personalization
    await db.user.update({
      where: { id: userId },
      data: {
        last_purchase_at: new Date(),
        order_count: { increment: 1 },
        cart_value: 0,           // Clear cart
        cart_updated_at: null,   // Clear cart timestamp
      },
    });
  }
  
  async updateUserMetrics(userId: string): Promise<void> {
    const user = await db.user.findUnique({ where: { id: userId } });
    const daysSinceLastSeen = differenceInDays(new Date(), user.last_seen_at);
    
    await db.user.update({
      where: { id: userId },
      data: {
        inactive_days: daysSinceLastSeen,
      },
    });
  }
}
```

#### **5. Scheduler Service (Cron-based)**

Handles scheduled and recurring notifications.

```typescript
// Send scheduled notifications at their scheduled time
cron.schedule('*/5 * * * *', async () => {  // Every 5 minutes
  const dueNotifications = await db.notification.findMany({
    where: {
      scheduledFor: { lte: new Date() },
      status: 'scheduled',
    },
  });
  
  for (const notification of dueNotifications) {
    // Rebuild audience fresh (in case user preferences changed)
    const users = await segmentationEngine.buildAudience(
      notification.segmentQuery
    );
    
    // Enqueue for sending
    for (const userId of users) {
      await notificationQueue.add({
        ...notification,
        userId,
      });
    }
    
    // Mark as sent
    await db.notification.update({
      where: { id: notification.id },
      data: { status: 'sent' },
    });
  }
});

// Cleanup invalid tokens daily
cron.schedule('0 2 * * *', async () => {  // 2 AM daily
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  // Delete tokens not successfully used in 30 days
  await db.deviceToken.deleteMany({
    where: {
      lastSuccessfulSend: { lt: thirtyDaysAgo },
    },
  });
});

// Update inactivity metrics hourly
cron.schedule('0 * * * *', async () => {  // Every hour
  const users = await db.user.findMany({
    select: { id: true, last_seen_at: true },
  });
  
  for (const user of users) {
    const inactiveDays = differenceInDays(new Date(), user.last_seen_at);
    await db.user.update({
      where: { id: user.id },
      data: { inactive_days: inactiveDays },
    });
  }
});
```

### Technology Stack Recommendations

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Queue** | BullMQ | Job persistence, retry, scheduling, Redis-backed |
| **Scheduler** | node-cron | Lightweight, built-in cron support, no external service |
| **In-Memory Cache** | Redis | Fast metric lookups, queue backing |
| **Database** | PostgreSQL | ACID compliance, complex queries, scalability |
| **ORM** | Prisma | Type-safe, excellent TypeScript support |
| **Firebase** | firebase-admin SDK | Official, well-maintained, latest protocols |

---

## 4. Database Design

### Complete Database Schema

#### **Table: users**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  
  -- Auth
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMP,
  
  -- Push notification settings
  push_enabled BOOLEAN DEFAULT true,           -- Master switch
  notification_preferences JSONB DEFAULT '{}', -- Per-type settings
  
  -- Engagement tracking (updated by event processor)
  last_app_open TIMESTAMP,                     -- Last time app was opened
  last_seen_at TIMESTAMP,                      -- Last activity (any kind)
  inactive_days INTEGER DEFAULT 0,             -- Calculated: days since last_seen_at
  
  -- Purchasing behavior
  order_count INTEGER DEFAULT 0,               -- Total orders
  last_purchase_at TIMESTAMP,                  -- Last successful order
  total_spent DECIMAL(12, 2) DEFAULT 0,       -- Lifetime value
  
  -- Cart state
  cart_updated_at TIMESTAMP,                   -- When cart was last modified
  cart_item_count INTEGER DEFAULT 0,           -- Number of items in cart
  cart_value DECIMAL(12, 2) DEFAULT 0,        -- Total cart value
  
  -- Device/platform info
  primary_device_platform VARCHAR(20),         -- 'ios' | 'android'
  app_version VARCHAR(20),                     -- Last seen app version
  
  -- Location/timezone
  timezone VARCHAR(50),                        -- User's timezone (from device)
  country_code VARCHAR(2) DEFAULT 'JO',       -- Country
  language VARCHAR(5) DEFAULT 'ar',            -- 'ar' | 'en'
  
  -- Metadata
  metadata JSONB DEFAULT '{}',                 -- Custom fields for future use
  
  -- System fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,                        -- Soft delete for GDPR
  
  INDEX idx_last_seen (last_seen_at),
  INDEX idx_push_enabled (push_enabled),
  INDEX idx_created_at (created_at),
  INDEX idx_inactive_days (inactive_days),
);
```

**Key Fields Explained:**

| Field | Purpose | Updated By | Used For |
|-------|---------|-----------|----------|
| `push_enabled` | Master notification toggle | User settings | Segmentation base filter |
| `last_seen_at` | Any user activity timestamp | Event processor (all events) | Inactivity calculations |
| `last_app_open` | Specific app open timestamp | Event processor (app_open) | Recent activity filter |
| `inactive_days` | Days since last activity | Hourly cron job | Segmentation (quick lookup) |
| `cart_updated_at` | When cart last changed | Event processor (add_to_cart) | Abandoned cart detection |
| `order_count` | Total purchase count | Event processor (order_completed) | Segmentation (frequency) |
| `last_purchase_at` | Most recent purchase | Event processor (order_completed) | Re-engagement campaigns |
| `timezone` | User's timezone | Mobile app (on registration) | Timezone-aware scheduling |

#### **Table: device_tokens**

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- FCM specifics
  token VARCHAR(500) UNIQUE NOT NULL,         -- Firebase Cloud Messaging token
  platform VARCHAR(20) NOT NULL,              -- 'ios' | 'android'
  
  -- Device info
  device_model VARCHAR(255),                  -- e.g., "iPhone 14 Pro"
  device_os_version VARCHAR(20),              -- e.g., "17.2.1"
  app_version VARCHAR(20),                    -- e.g., "1.2.3"
  
  -- Status tracking
  is_active BOOLEAN DEFAULT true,             -- Soft delete for tokens
  failed_count INTEGER DEFAULT 0,             -- Failures since last success
  last_successful_send TIMESTAMP,             -- Last successful delivery
  
  -- Token lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_id_active (user_id, is_active),
  INDEX idx_token (token),
  INDEX idx_last_successful (last_successful_send),
);
```

**Why multiple fields:**
- A user may have iOS phone + Android tablet = 2 tokens
- Backend needs to know platform for OS-specific notification formatting
- Tracking failures helps identify problematic devices for cleanup
- App version tracking enables version-specific feature flags

#### **Table: notifications (Campaigns)**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(255) UNIQUE,            -- For admin reference
  
  -- Content
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_url VARCHAR(500),
  deep_link VARCHAR(500),                     -- Where to open on tap
  
  -- Metadata for rich notifications
  notification_type VARCHAR(50) NOT NULL,     -- 'promotional' | 'transactional' | etc
  campaign_category VARCHAR(50),              -- 'abandoned_cart' | 'offer' | etc
  template_id VARCHAR(255),                   -- Link to saved template
  
  -- Targeting
  segment_query JSONB NOT NULL,              -- The query that defines audience
  target_audience_size INTEGER,               -- Preview: how many users matched
  
  -- Scheduling
  scheduled_for TIMESTAMP,                    -- NULL = send immediately
  send_window_start_hour INTEGER,             -- e.g., 9 (don't send before 9 AM)
  send_window_end_hour INTEGER,               -- e.g., 20 (don't send after 8 PM)
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',         -- 'draft' | 'scheduled' | 'sent' | 'cancelled'
  published_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Performance tracking
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  
  -- Metadata
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_status (status),
  INDEX idx_scheduled_for (scheduled_for),
  INDEX idx_created_at (created_at),
);
```

#### **Table: notification_logs (Delivery Tracking)**

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id),
  user_id UUID NOT NULL REFERENCES users(id),
  device_token_id UUID REFERENCES device_tokens(id),
  
  -- FCM response
  fcm_message_id VARCHAR(255),                -- Firebase's unique ID
  fcm_response_code INTEGER,                  -- HTTP status from FCM
  
  -- Delivery status
  status VARCHAR(50),                         -- 'pending' | 'sent' | 'failed' | 'opened' | 'clicked'
  failure_reason VARCHAR(500),                -- If failed: why
  
  -- Metrics
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,                        -- When user saw notification
  clicked_at TIMESTAMP,                       -- When user tapped notification
  clicked_url VARCHAR(500),                   -- If deep link provided
  
  -- A/B Testing
  variant_id VARCHAR(50),                     -- Which variant was this (if A/B test)
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_notification_id (notification_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_opened_at (opened_at),
  INDEX idx_created_at (created_at),
);
```

#### **Table: user_events (Behavioral Data)**

```sql
CREATE TABLE user_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type VARCHAR(100) NOT NULL,           -- 'app_open' | 'product_view' | etc
  event_category VARCHAR(100),                -- 'engagement' | 'purchase' | etc
  
  -- Event context
  metadata JSONB DEFAULT '{}',                -- {productId, cartValue, etc}
  
  -- Timestamps
  event_timestamp TIMESTAMP NOT NULL,         -- When event occurred
  created_at TIMESTAMP DEFAULT NOW(),         -- When logged
  
  -- Indexing for analytics
  INDEX idx_user_event (user_id, event_type, event_timestamp),
  INDEX idx_event_type (event_type),
  INDEX idx_event_timestamp (event_timestamp),
);
```

**Why BIGSERIAL instead of UUID:**
- Millions of events accumulated over time
- Integer IDs faster for sorting/aggregation
- Smaller index footprint
- TimeScale DB compatible for time-series data later

#### **Table: notification_segments (Saved Queries)**

```sql
CREATE TABLE notification_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Segment definition
  name VARCHAR(255) NOT NULL,                 -- "Inactive 7 days"
  description TEXT,
  segment_query JSONB NOT NULL,              -- The query criteria
  
  -- Usage stats
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Owner
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
);
```

**Pre-populate with:**
```json
[
  {
    "name": "Inactive 2 Days",
    "segment_query": { "inactiveFor": { "days": 2 } }
  },
  {
    "name": "Inactive 7 Days",
    "segment_query": { "inactiveFor": { "days": 7 } }
  },
  {
    "name": "Abandoned Cart (2 days)",
    "segment_query": { "hasAbandonedCart": true }
  },
  {
    "name": "Frequent Purchasers (3+ orders)",
    "segment_query": { "frequentPurchaser": true }
  }
]
```

#### **Table: notification_templates**

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template details
  name VARCHAR(255) NOT NULL,
  title_template VARCHAR(255),                -- Can use {{variables}}
  body_template TEXT,
  image_template VARCHAR(500),
  
  -- Localization
  language VARCHAR(5),
  
  -- Metadata
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_name (name),
);
```

#### **Table: notification_a_b_tests**

```sql
CREATE TABLE notification_a_b_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test details
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50),                         -- 'running' | 'completed'
  
  -- Variants
  variant_a_notification_id UUID REFERENCES notifications(id),
  variant_b_notification_id UUID REFERENCES notifications(id),
  
  -- Test configuration
  segment_query JSONB,                        -- Who to test on
  split_percentage NUMERIC DEFAULT 50.0,      -- 50/50 by default
  
  -- Results
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  winner_variant VARCHAR(1),                  -- 'a' or 'b'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_status (status),
);
```

### Database Indexing Strategy

**Critical indexes for performance:**

```sql
-- Segmentation queries
CREATE INDEX idx_users_segmentation ON users(
  push_enabled, 
  deleted_at, 
  inactive_days
);

-- Event aggregation
CREATE INDEX idx_user_events_bulk ON user_events(
  user_id, 
  event_type, 
  event_timestamp
);

-- Token lookup
CREATE INDEX idx_device_tokens_user ON device_tokens(
  user_id, 
  is_active
);

-- Log queries
CREATE INDEX idx_notification_logs_analytics ON notification_logs(
  notification_id,
  status,
  opened_at
);
```

### Retention Policies

**Data to keep long-term:**
- `users` — Keep (update soft delete field for compliance)
- `notifications` — Keep (for compliance/audit)
- `notification_logs` — Keep 2 years (for analytics)
- `notification_segments` — Keep indefinitely

**Data to archive/purge:**
- `user_events` — Archive to TimescaleDB after 1 year (for analytics queries)
- `device_tokens` — Delete inactive tokens after 90 days

**Compliance:**
- Support GDPR deletion: soft-delete user, set `deleted_at`
- Archive events to separate time-series DB for regulatory compliance
- Keep encrypted backups for 7 years (typical business requirement)

---

## 5. User Segmentation Logic

### Segmentation Framework

User segmentation is the CORNERSTONE of effective notification targeting. Without proper segmentation, you cannot scale notifications to millions of users effectively.

### Building Dynamic Audiences

#### **Segmentation Types**

```
BEHAVIORAL SEGMENTS (Time-based)
├── Inactivity Segments
│   ├── 2 days inactive
│   ├── 7 days inactive
│   ├── 30 days inactive
│   └── 90 days inactive
│
├── Purchase Behavior
│   ├── Recent purchasers (last 7 days)
│   ├── Frequent purchasers (3+ orders/month)
│   ├── High-value customers (>JOD 5000 total)
│   └── First-time buyers
│
├── Engagement Segments
│   ├── High engagement (10+ events/week)
│   ├── Moderate engagement (2-10 events/week)
│   └── Low engagement (<2 events/week)
│
└── Risk Segments
    ├── Abandoned cart
    ├── Browsed but never bought
    ├── Cancelled orders
    └── Churned (inactive 90 days)

CONTEXTUAL SEGMENTS (Content-based)
├── Product Interest
│   ├── Viewed category X but didn't buy
│   ├── Abandoned items still in inventory
│   └── Browsed competitor products
│
└── Offer Engagement
    ├── Opened offer but didn't redeem
    ├── Redeemed past offers
    └── High redemption rate
```

### Critical Segmentation Queries

#### **1. Inactivity-Based Segments**

```sql
-- Users inactive for N days (most common use case)
-- Used for: Re-engagement campaigns, win-back offers

CREATE MATERIALIZED VIEW segment_inactive_N_days AS
SELECT u.id, u.email, u.phone, u.timezone
FROM users u
WHERE u.push_enabled = true
  AND u.deleted_at IS NULL
  AND u.last_seen_at < NOW() - INTERVAL '7 days'  -- Change N to 2, 7, 30, 90
  AND u.last_seen_at IS NOT NULL;

-- Query execution time: <100ms (with proper indexing)
-- Audience size for JO market: ~30-40% depending on product type
```

**Variations:**

```sql
-- Very recently inactive (2-3 days) - High conversion potential
WHERE u.last_seen_at BETWEEN NOW() - INTERVAL '3 days' AND NOW() - INTERVAL '2 days'

-- Recently inactive but active before (7-14 days) - Medium conversion
WHERE u.last_seen_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'

-- Long-term inactive (90+ days) - Lower conversion, higher volume
WHERE u.last_seen_at < NOW() - INTERVAL '90 days'
```

#### **2. Abandoned Cart Segments**

```sql
-- Most important for e-commerce: Users with items in cart, no purchase intent yet
-- Used for: Cart recovery, special offers, urgency messaging

CREATE MATERIALIZED VIEW segment_abandoned_cart AS
SELECT DISTINCT u.id, u.email, u.phone, u.cart_value, u.timezone
FROM users u
WHERE u.push_enabled = true
  AND u.deleted_at IS NULL
  AND u.cart_value > 0                              -- Has items in cart
  AND u.cart_updated_at < NOW() - INTERVAL '2 days' -- Cart not updated recently
  AND (
    -- No recent order after cart was added
    NOT EXISTS (
      SELECT 1 FROM orders o
      WHERE o.user_id = u.id
      AND o.created_at > u.cart_updated_at
    )
  );

-- Query time: <200ms (sub-query planning optimal)
-- Conversion rate typically: 15-25% with proper messaging
-- Revenue impact: HIGH (average order recovery value: 3x notification cost)
```

**Variations:**

```sql
-- High-value abandoned carts (>JOD 500)
AND u.cart_value > 500

-- Abandoned 24 hours (fresh abandonment)
AND u.cart_updated_at BETWEEN NOW() - INTERVAL '24 hours' AND NOW() - INTERVAL '12 hours'

-- With luxury items (premium category)
WHERE EXISTS (
  SELECT 1 FROM cart_items ci
  INNER JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = u.id
  AND p.category = 'luxury'
)
```

#### **3. Purchase Frequency Segments**

```sql
-- Frequent purchasers (loyal customers, higher LTV)
-- Used for: VIP offers, early access, exclusive deals

CREATE MATERIALIZED VIEW segment_frequent_purchasers AS
SELECT u.id, u.email, u.phone, u.order_count, u.total_spent, u.timezone
FROM users u
WHERE u.push_enabled = true
  AND u.deleted_at IS NULL
  AND (
    -- 3+ orders in last 90 days
    SELECT COUNT(*) FROM orders o
    WHERE o.user_id = u.id
    AND o.created_at > NOW() - INTERVAL '90 days'
  ) >= 3;

-- Typical conversion rate for VIP: 40-50%
-- High-value segment (focus marketing spend here)
```

**Premium tiers:**

```sql
-- Platinum (5+ orders, >JOD 2000 spent)
WHERE u.order_count >= 5 AND u.total_spent > 2000

-- Gold (3+ orders, >JOD 500 spent)
WHERE u.order_count >= 3 AND u.total_spent > 500

-- Silver (1-2 orders)
WHERE u.order_count >= 1 AND u.order_count < 3
```

#### **4. Engagement-Based Segments**

```sql
-- High engagement: Users actively browsing/interacting
-- Used for: Feature announcements, new product launches, engagement-optimized campaigns

CREATE MATERIALIZED VIEW segment_high_engagement AS
SELECT u.id, COUNT(ue.id) as event_count
FROM users u
LEFT JOIN user_events ue ON u.id = ue.user_id
  AND ue.event_timestamp > NOW() - INTERVAL '7 days'
WHERE u.push_enabled = true
  AND u.deleted_at IS NULL
GROUP BY u.id
HAVING COUNT(ue.id) >= 10;  -- 10+ events in last 7 days

-- Lower send frequency (avoid fatigue)
-- Higher expected engagement rates
```

#### **5. Complex Churn-Risk Segment**

```sql
-- High-value customers becoming inactive (critical alert)
-- Used for: Urgent win-back, special incentives, VIP treatment

CREATE MATERIALIZED VIEW segment_at_risk_high_value AS
SELECT u.id, u.email, u.total_spent, u.last_seen_at
FROM users u
WHERE u.push_enabled = true
  AND u.deleted_at IS NULL
  -- Was valuable customer
  AND u.total_spent > 1000
  AND u.order_count >= 5
  -- But now inactive
  AND u.last_seen_at < NOW() - INTERVAL '30 days'
  -- And WAS active before (not just one-time buyer)
  AND u.order_count > 0;

-- Conversion rate (re-activation): 8-15%
-- Very high revenue impact
```

#### **6. Location/Timezone Segments**

```sql
-- Users in specific timezone
-- Used for: Timezone-aware scheduling, local offers

CREATE MATERIALIZED VIEW segment_timezone_asia_amman AS
SELECT u.id, u.email, u.timezone
FROM users u
WHERE u.push_enabled = true
  AND u.timezone = 'Asia/Amman'
  AND u.deleted_at IS NULL;

-- This matters for scheduling (send at optimal local time)
```

### Segmentation Materialization Strategy

**Why Materialize Views:**

```
Query Time: 1.2s (7M users table) → 0.08s (materialized view)
```

**Refresh Strategy:**

```typescript
// Refresh critical segments every 6 hours
const criticalSegments = [
  'segment_abandoned_cart',
  'segment_inactive_7_days',
  'segment_frequent_purchasers',
];

cron.schedule('0 */6 * * *', async () => {
  for (const segment of criticalSegments) {
    console.log(`Refreshing ${segment}...`);
    await db.$queryRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY ${segment}`;
  }
});
```

**Why CONCURRENTLY:**
- Allows queries to continue while refreshing
- Takes 20-30% longer but doesn't block readers
- Acceptable trade-off for 7M user tables

### Advanced Segmentation: RFM Analysis

**Recency, Frequency, Monetary (RFM)** — Industry standard for customer segmentation:

```sql
CREATE MATERIALIZED VIEW customer_rfm_segments AS
WITH recency_score AS (
  SELECT u.id,
    CASE 
      WHEN u.last_seen_at > NOW() - INTERVAL '7 days' THEN 5
      WHEN u.last_seen_at > NOW() - INTERVAL '30 days' THEN 4
      WHEN u.last_seen_at > NOW() - INTERVAL '90 days' THEN 3
      WHEN u.last_seen_at > NOW() - INTERVAL '180 days' THEN 2
      ELSE 1
    END as r_score
  FROM users u
  WHERE u.deleted_at IS NULL
),
frequency_score AS (
  SELECT u.id,
    CASE 
      WHEN u.order_count >= 10 THEN 5
      WHEN u.order_count >= 5 THEN 4
      WHEN u.order_count >= 2 THEN 3
      WHEN u.order_count = 1 THEN 2
      ELSE 1
    END as f_score
  FROM users u
),
monetary_score AS (
  SELECT u.id,
    CASE 
      WHEN u.total_spent >= 2000 THEN 5
      WHEN u.total_spent >= 1000 THEN 4
      WHEN u.total_spent >= 500 THEN 3
      WHEN u.total_spent >= 100 THEN 2
      ELSE 1
    END as m_score
  FROM users u
)
SELECT r.id, r.r_score, f.f_score, m.m_score,
  CASE 
    WHEN r.r_score = 5 AND f.f_score = 5 THEN 'Champions'
    WHEN r.r_score >= 4 AND f.f_score >= 4 THEN 'Loyal Customers'
    WHEN r.r_score = 5 AND f.f_score <= 3 THEN 'At Risk'
    WHEN r.r_score <= 2 AND f.f_score >= 4 THEN 'Cant Lose Them'
    ELSE 'Others'
  END as segment
FROM recency_score r
JOIN frequency_score f ON r.id = f.id
JOIN monetary_score m ON r.id = m.id;
```

**RFM Segments Strategy:**

| Segment | Characteristics | Campaign Strategy |
|---------|-----------------|-------------------|
| **Champions** | R:5, F:5 | VIP treatment, exclusive access, early launches |
| **Loyal** | R:4+, F:4+ | Personalized, cross-sell, upsell |
| **At Risk** | R:5, F:≤3 | Minimal send, high-value offers only |
| **Can't Lose** | R:≤2, F:4+ | Win-back urgency, special incentives |
| **Others** | Mixed | Nurture, educational content |

### Segmentation Recommendations

**Practical Approach for MVP:**

```
Phase 1 (Month 1): 
- Inactivity segments (2, 7, 30, 90 days)
- Abandoned cart
- Simple frequency (3+ orders)

Phase 2 (Month 2):
- RFM analysis
- Engagement-based
- High-value at-risk

Phase 3 (Month 3):
- Product affinity (viewed X category, didn't buy)
- Predictive churn (ML-based)
- Lifetime value tiers
```

---

## 6. Dashboard / Admin Portal

### Dashboard Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Admin Dashboard (React/Next.js)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Campaign   │  │  Analytics   │  │   Segments   │  │
│  │   Management │  │   & Reports  │  │  & Audiences │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Templates   │  │   Settings   │  │  User Lookup │  │
│  │  Management  │  │   & Config   │  │  & Device    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Real-time Analytics Dashboard             │   │
│  │ • Campaign performance                           │   │
│  │ • Delivery rates                                  │   │
│  │ • Open/click rates                               │   │
│  │ • User engagement trends                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │ REST API / WebSocket
         ▼
    Backend Services
```

### Core Dashboard Features

#### **1. Campaign Management**

```
CREATE CAMPAIGN WORKFLOW:

Step 1: Campaign Details
├── Name
├── Type: Promotional | Transactional | Abandoned Cart | etc
├── Priority: Low | Normal | High
└── Scheduling
    ├── Send now
    ├── Schedule for: [Date/Time Picker]
    ├── Send between hours: 9 AM - 8 PM
    └── Timezone: System | User timezone | Specific TZ

Step 2: Message Design
├── Title (max 65 chars)
├── Body (max 240 chars)
├── Rich Image (optional)
├── Deep Link (optional)
├── A/B Test Variant B (optional)
└── Personalization
    ├── Use {{firstName}}
    ├── Use {{lastPurchaseCategory}}
    └── Dynamic content blocks

Step 3: Audience Selection
├── Saved Segments (dropdown)
│   ├── Inactive 7 days
│   ├── Abandoned Cart (2 days)
│   ├── Frequent Purchasers
│   └── [Custom Query]
├── Advanced Filters
│   ├── Platform: iOS | Android | Both
│   ├── Language: Arabic | English
│   ├── Location/Timezone
│   └── App Version
├── Exclude List (upload CSV)
└── Audience Preview
    ├── Estimated size: [X users]
    ├── Sample users (first 100)
    └── Segment breakdown

Step 4: Review & Publish
├── Notification preview (iOS + Android)
├── Audience confirmation
├── Schedule confirmation
└── [PUBLISH] [SAVE AS DRAFT] [CANCEL]
```

**React Component Structure:**

```typescript
// CampaignWizard.tsx
export const CampaignWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState<Campaign>({...});
  const [audience, setAudience] = useState<AudiencePreview | null>(null);
  
  const handleSegmentSelect = async (segment: NotificationSegment) => {
    // Query backend for preview
    const preview = await fetchAudiencePreview(segment.segmentQuery);
    setAudience(preview);
  };
  
  const handlePublish = async () => {
    await publishCampaign(campaign);
    navigate('/campaigns/success');
  };
  
  return (
    <div className="wizard">
      {step === 1 && <CampaignDetails {...} />}
      {step === 2 && <MessageDesign {...} />}
      {step === 3 && <AudienceSelection onSegmentSelect={handleSegmentSelect} />}
      {step === 4 && <ReviewPublish {...} />}
    </div>
  );
};
```

#### **2. Audience Segmentation Interface**

```
SEGMENTATION UI:

┌────────────────────────────────────────────────────┐
│  SEGMENT BUILDER                                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  Quick Presets:                                     │
│  [Inactive 2d] [Inactive 7d] [Inactive 30d]        │
│  [Abandoned Cart] [Frequent Buyers] [Custom]       │
│                                                     │
│  Advanced Filters:                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ Inactivity:                                  │   │
│  │ ○ Any                                        │   │
│  │ ○ 2 days                                     │   │
│  │ ○ 7 days                                     │   │
│  │ ○ Custom: [__] days                          │   │
│  │                                              │   │
│  │ Purchase Frequency:                          │   │
│  │ [__] to [__] orders in last [__] days       │   │
│  │                                              │   │
│  │ Cart Status:                                 │   │
│  │ ☑ Has abandoned cart                         │   │
│  │ Abandoned for: [__] days                     │   │
│  │                                              │   │
│  │ Cart Value:                                  │   │
│  │ [__] JOD to [__] JOD                         │   │
│  │                                              │   │
│  │ Device:                                      │   │
│  │ [iOS] [Android] [Both]                       │   │
│  │                                              │   │
│  │ Language:                                    │   │
│  │ [Arabic] [English] [Both]                    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Exclusions:                                        │
│  ☑ Exclude opted-out users                         │
│  ☑ Exclude recently sent (last 7 days)             │
│  [+ Upload exclusion list CSV]                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ AUDIENCE PREVIEW                             │   │
│  │ Estimated Size: 15,432 users                 │   │
│  │ Breakdown:                                   │   │
│  │ • iOS: 60% (9,259 users)                     │   │
│  │ • Android: 40% (6,173 users)                 │   │
│  │ • Arabic: 75%                                │   │
│  │ • English: 25%                               │   │
│  │                                              │   │
│  │ Sample Users:                                │   │
│  │ [email@example.com - Last seen: 5 days ago] │   │
│  │ [phone: +962791234567 - Last seen: 3 days]  │   │
│  │ [...]                                        │   │
│  │                                              │   │
│  │ [REFINE] [SAVE AS SEGMENT] [SELECT]          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Backend endpoint for preview:**

```typescript
GET /api/v1/segments/preview
Query params: { filters: JSON, limit: 100 }
Response: {
  totalSize: 15432,
  previewUsers: [...],
  breakdown: {
    byPlatform: { ios: 0.6, android: 0.4 },
    byLanguage: { ar: 0.75, en: 0.25 },
    byTimezone: {...}
  }
}
```

#### **3. Campaign Analytics Dashboard**

```
REAL-TIME ANALYTICS:

┌──────────────────────────────────────────────────────┐
│  CAMPAIGN: "Winter Sale - Inactive Users"  [Status: Sent]
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Sent       │  │  Opened     │  │  Clicked    │  │
│  │  24,500     │  │  8,120      │  │  2,436      │  │
│  │  100%       │  │  33.1%      │  │  9.9%       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Failed     │  │  Bounced    │  │  Revenue    │  │
│  │  243        │  │  137        │  │  JOD 45,320 │  │
│  │  0.99%      │  │  0.56%      │  │  ROI: 8.2x  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                       │
│  DELIVERY TIMELINE:                                  │
│  ├─ Started: Jan 15, 2024 2:00 PM                   │
│  ├─ Peak delivery: Jan 15, 3:15 PM (8,430 opens)    │
│  └─ Completed: Jan 15, 8:45 PM                      │
│                                                       │
│  ENGAGEMENT TIMELINE (Graph):                        │
│  [Sent] ────→ [Opened] ────→ [Clicked] ────→ [Revenue]
│    0%          33%            10%             +JOD45K
│                                                       │
│  HOURLY BREAKDOWN:                                   │
│  Hour | Sent    | Opened  | CTR   | Revenue         │
│  2 PM | 2,100   | 620     | 29.5% | JOD 2,150      │
│  3 PM | 2,850   | 1,120   | 39.3% | JOD 5,430      │
│  4 PM | 3,120   | 1,450   | 46.5% | JOD 8,900      │
│  ...                                                 │
│                                                       │
│  PLATFORM COMPARISON:                                │
│  ┌────────┬────────┬────────┬────────┐              │
│  │        │ iOS    │ Android│ Avg    │              │
│  ├────────┼────────┼────────┼────────┤              │
│  │ Sent   │ 14,700 │ 9,800  │ 24,500│              │
│  │ Opened │ 5,500  │ 2,620  │ 8,120 │              │
│  │ CTR    │ 37.4%  │ 26.7%  │ 33.1% │              │
│  │ Revenue│ 28,100 │ 17,220 │ 45,320│              │
│  └────────┴────────┴────────┴────────┘              │
│                                                       │
│  LANGUAGE COMPARISON:                                │
│  ┌────────┬────────┬────────┐                       │
│  │ Arabic │ 18,375 │ CTR: 34.2% │ JOD 32,840      │
│  │ English│ 6,125  │ CTR: 30.1% │ JOD 12,480      │
│  └────────┴────────┴────────┘                       │
│                                                       │
│  [EXPORT] [COMPARE WITH] [A/B TEST RESULTS]         │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Key Metrics:**

| Metric | Definition | Target Range |
|--------|-----------|---------------|
| **Open Rate** | (Opened / Sent) × 100 | 25-45% (good: 30%+) |
| **Click-Through Rate** | (Clicked / Opened) × 100 | 8-15% (good: 10%+) |
| **Conversion Rate** | (Purchases / Clicked) × 100 | 2-5% |
| **Failed Delivery** | Failed sends / Total | <1% |
| **Cost Per Acquisition** | Total cost / Conversions | Varies by segment |
| **Return on Investment** | Revenue / Cost | 5-10x typical |

#### **4. A/B Testing Interface**

```
A/B TEST SETUP:

┌────────────────────────────────────────────┐
│  A/B TEST CONFIGURATION                    │
├────────────────────────────────────────────┤
│                                             │
│  Variant A:                                 │
│  Title: "Flash Sale - 24 Hours"            │
│  Body: "50% off all electronics today"     │
│  Send to: [__] % of audience (50%)          │
│                                             │
│  Variant B:                                 │
│  Title: "Limited Time: 50% Off"            │
│  Body: "Electronics on sale - Don't miss"  │
│  Send to: [__] % of audience (50%)          │
│                                             │
│  Test Duration:                             │
│  Run for [7] days or until [1000] clicks   │
│                                             │
│  Success Metric:                            │
│  ○ Click-through rate (primary)             │
│  ○ Conversion rate                          │
│  ○ Open rate                                │
│  ○ Revenue per recipient                    │
│                                             │
│  Winning Criteria:                          │
│  Winner must beat loser by [10]%            │
│                                             │
│  On Winner:                                 │
│  ○ Send remaining [X]% to winner variant    │
│  ○ Manual decision                          │
│                                             │
│  [RUN TEST]                                 │
│                                             │
└────────────────────────────────────────────┘

A/B TEST RESULTS (After Completion):

Variant A: Title "Flash Sale"
├─ Sent: 5,000
├─ Opened: 1,650 (33%)
├─ Clicked: 165 (10% CTR)
└─ Conversions: 8 (4.8% conversion)

Variant B: Title "Limited Time"
├─ Sent: 5,000
├─ Opened: 1,720 (34.4%)
├─ Clicked: 195 (11.3% CTR) ← WINNER
└─ Conversions: 10 (5.1% conversion)

Winner: Variant B (11.3% CTR vs 10% - statistically significant)
Confidence: 94.2%
Remaining audience (0%): Auto-send winner variant
```

#### **5. Token & User Management**

```
USER LOOKUP INTERFACE:

Search: [email@example.com _________ ] [SEARCH]

Results:

User: Ahmad Al-Shaltoni (ID: usr_12345)
├─ Email: ahmad@tawreed.com
├─ Phone: +962791234567
├─ Business: Shaltoni Trading Co.
│
├─ Push Status:
│   ├─ Enabled: ✓
│   ├─ Language: Arabic
│   └─ Timezone: Asia/Amman
│
├─ Devices:
│   ├─ 1. iPhone 14 Pro (iOS 17.2)
│   │   ├─ Token: eyJhbGciOi...
│   │   ├─ Platform: ios
│   │   ├─ Last successful send: Jan 15, 3:45 PM
│   │   └─ [TEST] [REVOKE]
│   │
│   └─ 2. Samsung Galaxy S24 (Android 14)
│       ├─ Token: fSDFH3243...
│       ├─ Platform: android
│       ├─ Last successful send: Jan 10, 2:30 PM
│       └─ [TEST] [REVOKE]
│
├─ Engagement Metrics:
│   ├─ Last seen: 2 hours ago
│   ├─ Total opens: 24
│   ├─ Total clicks: 8
│   ├─ Inactive days: 0
│   └─ Cart value: JOD 245
│
├─ Purchase History:
│   ├─ Total orders: 12
│   ├─ Total spent: JOD 8,450
│   ├─ Last purchase: Jan 10, 2024
│   └─ [VIEW ALL ORDERS]
│
├─ Segments:
│   ├─ Frequent Purchasers
│   ├─ Timezone: Asia/Amman
│   └─ Platform: iOS + Android
│
└─ Actions:
    ├─ [SEND TEST NOTIFICATION]
    ├─ [DISABLE NOTIFICATIONS]
    ├─ [DISABLE TOKENS]
    ├─ [UPDATE PREFERENCES]
    ├─ [VIEW HISTORY]
    └─ [DELETE USER DATA (GDPR)]
```

#### **6. Settings & Configuration**

```
DASHBOARD SETTINGS:

Notification Preferences:
├─ Default language: [Arabic ▼]
├─ Default timezone: [Asia/Amman ▼]
├─ Max notifications per user per day: [5]
├─ Minimum time between notifications: [1] hour
├─ Quiet hours: [9 PM] to [8 AM]
│   └─ Don't send notifications during these hours
│
Rate Limiting:
├─ Max campaigns per day: [unlimited]
├─ Max audience size per campaign: [unlimited]
├─ Batch size for sending: [1000 devices/sec]
│
Retry Configuration:
├─ Max retry attempts: [3]
├─ Backoff strategy: [Exponential ▼]
├─ Initial backoff: [2] seconds
│
Token Management:
├─ Auto-cleanup inactive tokens: [✓]
├─ Inactive period: [90] days
├─ Failed attempts before cleanup: [5]
│
Analytics:
├─ Retention period: [24 months]
├─ Auto-archive logs: [✓]
├─ Data warehouse: [BigQuery ▼] (optional)
│
Compliance:
├─ GDPR deletion: [Hard delete]
├─ Keep audit logs: [7] years
├─ Encrypt PII: [✓]
└─ Data residency: [Jordan/EU] [✓]

[SAVE SETTINGS]
```

### Dashboard Tech Stack Recommendations

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | React 18 + TypeScript | Type-safe, performance, ecosystem |
| **State Management** | Zustand or Redux Toolkit | Simple, scalable state |
| **Styling** | Tailwind CSS | Utility-first, responsive design |
| **Charts** | Recharts or Plotly | Rich, interactive visualizations |
| **Forms** | React Hook Form + Zod | DX, validation, performance |
| **Tables** | TanStack Table (React Table) | Headless, highly customizable |
| **Date Picker** | React Big Calendar | Large calendar views |
| **Notifications** | React Toastify | Temporary notifications |
| **API Client** | TanStack Query + Axios | Caching, refetching, optimistic updates |

### Dashboard Performance Considerations

**Critical for scaling:**

```typescript
// Use WebSocket for real-time metrics
const socket = io('/notifications-analytics', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on('campaign_metrics_updated', (data: CampaignMetrics) => {
  // Update UI in real-time
  updateCampaignStats(data);
});

// Infinite scroll for campaign list (don't load all at once)
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['campaigns'],
  queryFn: ({ pageParam }) => 
    fetchCampaigns({ limit: 20, offset: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextOffset,
});

// Cache segment previews (previews are expensive)
const segmentPreview = useQuery({
  queryKey: ['segment-preview', segmentId],
  queryFn: () => fetchSegmentPreview(segmentId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000,     // 30 minutes
});
```

---

## 7. Notification Types & Delivery

### Notification Categories

**Tawreed-specific notification types:**

#### **1. Transactional Notifications** (Critical)

```
PURPOSE: Inform users about mandatory business transactions
DELIVERY: Immediate, highest priority
FREQUENCY: Variable (as needed)
EXAMPLE:
Title: "Order Confirmed"
Body: "Your order #12345 has been confirmed. Delivery by Jan 18."

CHARACTERISTICS:
├─ Time-sensitive
├─ High-priority
├─ Do not suppress for quiet hours
├─ No unsubscribe option
├─ Track delivery critical for compliance
├─ Examples:
│  ├─ Order confirmation
│  ├─ Payment confirmation
│  ├─ Order shipped
│  ├─ Delivery update
│  ├─ Refund processed
│  └─ Account security alert

ANDROID: FCM priority: HIGH
iOS: APNs priority: 10 (max)
```

#### **2. Promotional Notifications** (Marketing)

```
PURPOSE: Drive sales with offers, new products, sales
DELIVERY: Scheduled during business hours
FREQUENCY: Max 2-3 per week per user
EXAMPLE:
Title: "50% Off Electronics This Weekend"
Body: "Shop our biggest sale of the month. Limited stock!"

CHARACTERISTICS:
├─ Suppressible (user can opt out)
├─ Respect quiet hours
├─ A/B test friendly
├─ Track open rates and CTR
├─ Examples:
│  ├─ Flash sales
│  ├─ New product launches
│  ├─ Seasonal promotions
│  ├─ Category-specific offers
│  └─ Limited-time deals

ANDROID: FCM priority: NORMAL
iOS: APNs priority: 10
RULES:
├─ Max 2-3 per user per week
├─ Respect language preference
├─ Personalize with product history
└─ Test subject lines
```

#### **3. Abandoned Cart Recovery** (High Revenue)

```
PURPOSE: Recover lost sales from abandoned carts
DELIVERY: Scheduled (24-48 hours after abandonment)
FREQUENCY: 1 per user per abandoned cart
EXAMPLE:
Title: "You Left JOD 450 Worth of Items"
Body: "Complete checkout and get 10% off your order. Ends tomorrow!"

SENDING STRATEGY:
├─ Wait 4-8 hours before first notification
├─ If not completed: Send second after 24 hours
├─ Final reminder: 48 hours
│
PERSONALIZATION:
├─ Show product image
├─ Show cart total
├─ Offer incentive (5-10% discount)
├─ Clear CTA: "Complete Purchase"
│
METRICS:
├─ Recovery rate: 8-15% (industry avg: 10%)
├─ Average order value: Usually higher than normal
└─ Revenue impact: Highest ROI campaign type
```

#### **4. Win-Back / Re-Engagement** (Churn Prevention)

```
PURPOSE: Reactivate inactive users before they churn
DELIVERY: Scheduled after N days of inactivity
FREQUENCY: 1 per user per period
EXAMPLE:
Title: "We Miss You! Get JOD 100 Credit"
Body: "Haven't ordered in 30 days? Come back for exclusive offers."

TARGETING:
├─ Inactive 7 days: General reengagement
├─ Inactive 30 days: Special incentive
├─ Inactive 90 days: Final win-back attempt
│
STRATEGIES:
├─ 7-day: "What's new since you've been away"
├─ 30-day: "Your favorite sellers have new items"
└─ 90-day: "One last offer: JOD 100 credit"
│
EXPECTED RESULTS:
├─ 7-day reactivation: 5-8%
├─ 30-day reactivation: 3-5%
└─ 90-day reactivation: 1-3%
```

#### **5. Personalized Recommendations** (Engagement)

```
PURPOSE: Drive browsing and purchases through personalization
DELIVERY: Scheduled (typically evenings)
FREQUENCY: 1-2 per week
EXAMPLE:
Title: "Ahmad, Check Out These Premium Tools"
Body: "Based on your recent searches, 3 new items just arrived."

PERSONALIZATION LOGIC:
├─ Based on viewed categories
├─ Based on search history
├─ Based on purchase history
├─ Based on abandoned items
│
DATA SOURCES:
├─ Product views
├─ Search queries
├─ Order history
├─ Cart history
│
ML APPROACH (PHASE 3):
├─ Collaborative filtering (users like you)
├─ Content-based filtering (similar products)
├─ Hybrid approach (best results)
└─ Cold start: Category recommendations
```

#### **6. Order Status Updates** (Transactional)

```
PURPOSE: Keep customers informed about order progress
DELIVERY: Immediate upon status change
EXAMPLES:
├─ "Order Processing" - being prepared
├─ "Order Shipped" - left warehouse, with tracking
├─ "Out for Delivery" - arriving today
├─ "Delivered" - with signature confirmation
└─ "Delayed" - proactive communication

KEY POINTS:
├─ Provide tracking link
├─ Estimated delivery window
├─ Contact info if issues
├─ Expected delivery time
│
TIMING:
├─ Send as soon as status updates
├─ Don't batch updates
└─ Transactional = highest priority
```

#### **7. Offer / Coupon Notifications** (Promotional)

```
PURPOSE: Distribute coupons, codes, limited-time offers
EXAMPLE:
Title: "Exclusive: JOD 50 Off with Code WELCOME50"
Body: "Valid for new customers today only. Shop now!"

TYPES:
├─ Flash sales (expiring today)
├─ Seasonal promotions (expiring this week)
├─ Birthday/anniversary offers (personalized)
├─ First-time buyer (onboarding)
└─ Back-in-stock (product notifications)

INCLUSION:
├─ Coupon code in notification
├─ Deep link to specific category/product
├─ Terms and conditions link
└─ Tracking for redemption
```

### Notification Payload Structure

**Standard payload for all notification types:**

```json
{
  "notification": {
    "title": "String (max 65 chars)",
    "body": "String (max 240 chars)",
    "image": "URL to image (optional)"
  },
  "data": {
    "type": "transactional|promotional|abandoned_cart|reengagement|recommendation|order_status|offer",
    "category": "order_confirmation|order_shipped|offer|recommendation|etc",
    "campaignId": "UUID",
    "notificationId": "UUID",
    "deepLink": "tawreed://product/123456",
    "action": "open_app|open_url|deep_link",
    "metadata": {
      "orderId": "ORDER_ID (if applicable)",
      "productId": "PRODUCT_ID (if applicable)",
      "discount": "10 (percentage, if applicable)",
      "expiresAt": "ISO8601 (if time-sensitive)"
    }
  },
  "android": {
    "priority": "high|normal",
    "ttl": "3600s",
    "notification": {
      "sound": "default",
      "channelId": "order_updates|promotions|general"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "String",
          "body": "String"
        },
        "sound": "default",
        "badge": 1,
        "contentAvailable": true,
        "mutableContent": true,
        "category": "ORDER_ACTION|PROMO_ACTION"
      }
    }
  }
}
```

### Delivery Rules by Type

```typescript
interface NotificationDeliveryRules {
  transactional: {
    priority: 'immediate',
    retries: 5,
    respectQuietHours: false,
    respectFrequencyCap: false,
    unsubscribeAllowed: false,
    batchProcessing: false,
  },
  promotional: {
    priority: 'normal',
    retries: 2,
    respectQuietHours: true,
    respectFrequencyCap: true,
    unsubscribeAllowed: true,
    batchProcessing: true,
    frequencyCapPerWeek: 3,
  },
  abandoned_cart: {
    priority: 'high',
    retries: 3,
    respectQuietHours: true,
    respectFrequencyCap: false, // Different cart = different notification
    unsubscribeAllowed: true,
    batchProcessing: true,
    delayBeforeSend: 14400000, // 4 hours
  },
  reengagement: {
    priority: 'normal',
    retries: 2,
    respectQuietHours: true,
    respectFrequencyCap: true,
    unsubscribeAllowed: true,
    batchProcessing: true,
    frequencyCapPerMonth: 1,
  },
  recommendation: {
    priority: 'low',
    retries: 1,
    respectQuietHours: true,
    respectFrequencyCap: true,
    unsubscribeAllowed: true,
    batchProcessing: true,
    frequencyCapPerWeek: 2,
  },
}
```

---

## 8. Firebase Topics vs Backend Segmentation

This is a critical architectural decision that impacts scalability and functionality.

### What are Firebase Topics?

**Firebase Topics** allow you to subscribe devices to channels. When you send to a topic, FCM delivers to all subscribed devices.

```typescript
// Mobile app subscribes to topic
await messaging().subscribeToTopic('sports_news');

// Backend sends to all subscribers
await admin.messaging().send({
  topic: 'sports_news',
  notification: { title: 'Game Alert', body: '...' },
});
```

### Comparison: Topics vs Backend Segmentation

| Aspect | Firebase Topics | Backend Segmentation |
|--------|-----------------|----------------------|
| **Setup Complexity** | Simple | Complex |
| **Scaling** | FCM handles | Backend must optimize |
| **Audience Targeting** | Topics only | Unlimited queries |
| **Dynamic Audiences** | Limited | Full control |
| **Personalization** | Not possible | Full personalization |
| **A/B Testing** | Manual split needed | Built-in support |
| **Analytics** | Basic | Advanced |
| **Cost Optimization** | No control | Full control |
| **GDPR Compliance** | Limited | Full control |
| **Scheduling** | Doesn't support | Full support |
| **Retry Logic** | FCM default | Custom |
| **Rate Limiting** | FCM managed | Custom |
| **Device Cleanup** | Manual | Automatic |

### When to Use Topics

**Topics are suitable for:**

```
1. Public content channels
   - News categories (tech, business, sports)
   - Broadcast announcements
   - System notifications
   
2. Content subscribers
   - Users subscribe to product categories
   - Users subscribe to seller updates
   
3. Low-urgency updates
   - Newsletter subscriptions
   - Weekly digests
   - Announcement channels
   
4. Simple segmentation
   - Geographic regions
   - Product categories
   - User tiers (if simple)

EXAMPLE TOPICS FOR TAWREED:
- products_electronics (users interested in electronics)
- category_tools (power tools category)
- seller_acme_corp (users following seller)
- promo_flash_sales (flash sale subscribers)
```

**Topic Subscription Flow:**

```typescript
// Mobile app decides what topics user cares about
const subscribeUserToTopics = async (userId: string, interests: string[]) => {
  for (const interest of interests) {
    const topicName = `category_${interest}`;
    await messaging().subscribeToTopic(topicName);
    
    // Notify backend what topics user is on
    await api.post('/api/v1/user-topics', {
      userId,
      topic: topicName,
    });
  }
};

// Backend sends to topic
const broadcastToCategory = async (category: string) => {
  await admin.messaging().send({
    topic: `category_${category}`,
    notification: {
      title: `New ${category} Items`,
      body: 'Check out what just arrived',
    },
  });
};
```

### When to Use Backend Segmentation

**Backend segmentation is required for:**

```
1. Complex behavioral targeting
   - Inactive users
   - Abandoned cart
   - Purchase frequency
   - Engagement level
   
2. Personalization
   - Dynamic content
   - User-specific offers
   - Recommendation engines
   
3. A/B testing
   - Variants
   - Multivariate tests
   - Winner selection
   
4. Compliance & Analytics
   - GDPR deletion
   - Opt-out management
   - Audit logging
   - Advanced metrics
   
5. Scheduling & Optimization
   - Scheduled sends
   - Timezone-aware delivery
   - Cost optimization
   - Rate limiting
   
6. Business Intelligence
   - Revenue tracking
   - Lifetime value
   - Churn prediction
   - Segment performance

EXAMPLE QUERIES FOR TAWREED:
- Users inactive for 7 days
- Users with abandoned carts >JOD 500
- High-value customers at risk
- First-time buyers in last 30 days
```

### Recommended Hybrid Approach

**Best practice: Use BOTH strategically**

```
ARCHITECTURE:

┌─────────────────────────────────────────────────────┐
│  NOTIFICATION REQUEST                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Is this a TOPIC notification?                      │
│  (public content, category updates)                 │
│  │                                                  │
│  ├─ YES: Send to topic                             │
│  │   • category_electronics                        │
│  │   • products_new_arrivals                       │
│  │   • seller_john_store                           │
│  │   → Use FCM Topic API directly                   │
│  │   → Simple, scalable, efficient                 │
│  │                                                  │
│  └─ NO: Use backend segmentation                   │
│      • Inactive users                              │
│      • Abandoned cart                              │
│      • Personalized offers                         │
│      • A/B tests                                   │
│      → Query audience from database                │
│      → Send to individual devices                  │
│      → Advanced tracking                           │
│                                                      │
└─────────────────────────────────────────────────────┘

EXAMPLES:

New Product in Electronics (TOPIC):
├─ Send to: topic 'category_electronics'
├─ All subscribed users get it
├─ No database query needed
├─ Fast delivery
└─ Perfect for: Time-sensitive announcements

Abandoned Cart Recovery (BACKEND):
├─ Query: SELECT users WHERE cart_updated_at < NOW() - 4 hours
├─ Personalize: Show their specific cart items
├─ Track: Which cart recovery actually worked
├─ Schedule: Send at optimal time for each user
└─ Optimize: A/B test recovery messages

New Product Recommendation (BACKEND):
├─ Query: SELECT users WHERE viewed_category = 'electronics'
├─ Personalize: Show 3 recommended products
├─ Track: Did they click? Did they buy?
├─ Segment: Different messages for different user types
└─ Optimize: Only send to high-engagement users
```

### Implementation Guide

**Hybrid Implementation Strategy:**

```typescript
class HybridNotificationService {
  /**
   * Send to topic (for broadcast announcements)
   * Fast, scalable, no personalization
   */
  async sendToTopic(request: {
    topic: string;  // 'category_electronics'
    title: string;
    body: string;
    data?: object;
  }): Promise<void> {
    await admin.messaging().send({
      topic: request.topic,
      notification: {
        title: request.title,
        body: request.body,
      },
      data: request.data,
    });
    
    // Log for analytics
    await db.notificationLog.create({
      topicName: request.topic,
      sentAt: new Date(),
      type: 'topic',
    });
  }
  
  /**
   * Send to segmented audience (for targeting)
   * Complex, personalized, fully tracked
   */
  async sendToSegment(request: {
    segmentQuery: SegmentQuery;
    title: string;
    body: string;
    data?: object;
    personalizeWith?: (user: User) => object;
  }): Promise<SendResult> {
    // 1. Query audience
    const userIds = await segmentationEngine.buildAudience(
      request.segmentQuery
    );
    
    // 2. Get their tokens
    const userTokens = await db.deviceToken.findMany({
      where: { userId: { in: userIds }, isActive: true },
      include: { user: true },
    });
    
    // 3. Group by platform and personalize
    const groupedTokens = groupBy(userTokens, 'platform');
    
    // 4. Send personalized
    for (const [platform, tokens] of Object.entries(groupedTokens)) {
      const batches = chunk(tokens, 1000);
      
      for (const batch of batches) {
        const personalizedMessages = batch.map(token => {
          const personalization = request.personalizeWith?.(token.user) || {};
          
          return {
            token: token.token,
            notification: {
              title: request.title,
              body: request.body,
            },
            data: {
              ...request.data,
              ...personalization,
              userId: token.user.id,
            },
          };
        });
        
        // Send batch
        const response = await admin.messaging().sendAll(personalizedMessages);
        
        // Log each delivery
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          const token = batch[i];
          
          await db.notificationLog.create({
            userId: token.userId,
            fcmMessageId: resp.messageId,
            status: resp.success ? 'sent' : 'failed',
            failureReason: resp.error?.message,
          });
        }
      }
    }
  }
  
  /**
   * Smart routing: Topic OR Segment
   */
  async send(request: NotificationRequest): Promise<SendResult> {
    if (request.topicName) {
      // Broadcast to topic
      return this.sendToTopic(request);
    } else {
      // Segment-based send
      return this.sendToSegment(request);
    }
  }
}
```

### Recommendation for Tawreed

**Phase 1 (MVP):** Backend segmentation only
- Simple, focused, proven
- All analytics in place
- Ready for complex targeting
- Topics can be added later

**Phase 2 (Growth):** Add topics for specific use cases
- New product announcements → category topics
- Seller updates → seller topics
- Keep segmentation for behavioral targeting

**Phase 3 (Optimization):** Full hybrid approach
- Automatic topic management
- Smart routing algorithm
- Cost optimization per notification type

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Get core notification system working with MVP features

#### **Week 1: Backend Setup**

- [ ] Set up PostgreSQL schema (users, device_tokens, notifications table)
- [ ] Set up Redis for queue
- [ ] Configure Firebase Admin SDK
- [ ] Set up BullMQ queue
- [ ] Create Notification Service skeleton

**Deliverables:**
```
Backend structure:
src/services/notification.service.ts
src/services/segmentation.service.ts
src/workers/notification.worker.ts
src/queues/notification.queue.ts
```

**Testing:**
- Manual FCM send test
- Queue enqueue/dequeue test
- Database connectivity test

#### **Week 2: API Endpoints & Queue Processing**

- [ ] Implement queue worker
- [ ] Implement retry logic (3 retries, exponential backoff)
- [ ] Implement token cleanup
- [ ] Create API endpoints:
  - `POST /api/v1/notifications/send` (internal testing)
  - `GET /api/v1/notifications/:id/status`
  - `POST /api/v1/devices/token` (token registration)

**Testing:**
- Send notification and verify delivery
- Simulate failed token and verify cleanup
- Verify retry logic with mock failures

#### **Week 3: Event Tracking**

- [ ] Create event tracking API endpoint
- [ ] Create Event Processor service
- [ ] Update user metrics (last_seen_at, etc.)
- [ ] Add basic event logging

**Code:**
```typescript
POST /api/v1/events/batch
{
  userId: string,
  events: [{
    type: 'app_open' | 'product_view' | etc,
    timestamp: ISO8601,
    metadata?: object
  }]
}
```

**Testing:**
- Send batch events and verify database update
- Test user metrics calculation

#### **Week 4: Admin Dashboard MVP**

- [ ] Basic React dashboard setup
- [ ] Campaign creation form (draft only)
- [ ] Manual campaign sending
- [ ] Basic analytics view

**Features:**
- [ ] Send test notification to user
- [ ] View user details
- [ ] View campaign status
- [ ] Manual audience preview

**Not needed yet:**
- Scheduling (coming Phase 2)
- A/B testing (coming Phase 3)
- Advanced analytics (coming Phase 2)

### Phase 2: Scaling & Automation (Weeks 5-10)

**Goal:** Add segmentation, scheduling, analytics

#### **Week 5-6: Segmentation Engine**

- [ ] Implement segmentation queries
- [ ] Create materialized views for common segments
- [ ] Build audience preview endpoint
- [ ] Implement segment builder UI

**Segments to build:**
```
1. Inactive (2, 7, 30, 90 days)
2. Abandoned cart
3. Frequent purchasers (3+ orders)
4. High-value customers
5. Recent purchases
```

**Testing:**
- Query 1M users, verify performance <500ms
- Verify segment accuracy against manual counts
- Test audience preview with 100-user sample

#### **Week 7: Scheduling & Cron Jobs**

- [ ] Implement cron-based scheduler
- [ ] Add scheduled_for field to campaigns
- [ ] Build scheduler UI
- [ ] Implement timezone-aware sending

**Code:**
```typescript
cron.schedule('*/5 * * * *', async () => {
  const dueNotifications = await getPendingNotifications();
  for (const notif of dueNotifications) {
    await notificationQueue.add(notif);
  }
});
```

**Testing:**
- Schedule notification for future time
- Verify it sends at correct time
- Test timezone conversion accuracy

#### **Week 8: Advanced Analytics**

- [ ] Build notification_logs table properly
- [ ] Implement analytics aggregation
- [ ] Create analytics dashboard
- [ ] Add WebSocket updates for real-time metrics

**Metrics:**
- Sent, opened, clicked counts
- Open rate, CTR
- Platform breakdown (iOS vs Android)
- Language breakdown
- Hourly delivery timeline

**Performance:**
- Real-time metric queries <100ms
- Daily aggregation job runs hourly

#### **Week 9-10: Campaign Management**

- [ ] Implement campaign draft/publish workflow
- [ ] Add audience size preview
- [ ] Campaign scheduling UI
- [ ] Campaign status tracking
- [ ] Campaign history/archive

### Phase 3: Intelligence & Optimization (Weeks 11-16)

**Goal:** Add A/B testing, automation, personalization

#### **Week 11-12: A/B Testing**

- [ ] Implement A/B test logic
- [ ] Create A/B test UI
- [ ] Statistical significance calculator
- [ ] Winner detection and auto-sending

**Features:**
- [ ] Variant A/B comparison
- [ ] Statistical significance (Chi-square test)
- [ ] Confidence level display
- [ ] Auto-send winner to remaining audience

#### **Week 13: Personalization**

- [ ] Template system with variables
- [ ] Dynamic content insertion
- [ ] Personalization UI builder
- [ ] Fallback content

**Variables:**
- `{{firstName}}`
- `{{cartValue}}`
- `{{lastProductViewed}}`
- `{{daysSinceLastPurchase}}`

#### **Week 14-15: Automation Workflows**

- [ ] Abandoned cart automation (4h, 24h, 48h)
- [ ] Win-back sequences (7d, 30d, 90d)
- [ ] Post-purchase follow-up
- [ ] Workflow builder UI

**Code:**
```typescript
const abandonedCartWorkflow = {
  trigger: 'cartUpdated',
  rules: [
    {
      delay: 4 * 60 * 60 * 1000, // 4 hours
      condition: 'cartNotCompleted',
      action: 'sendNotification',
      template: 'cart-recovery-1',
    },
    {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      condition: 'cartNotCompleted',
      action: 'sendNotification',
      template: 'cart-recovery-2',
      personalization: { discount: 10 },
    },
  ],
};
```

#### **Week 16: ML & Recommendations (Optional)**

- [ ] Collaborative filtering (users like you bought)
- [ ] Content-based recommendations (similar products)
- [ ] Optimal send time prediction
- [ ] Churn prediction

### Phase 4: Enterprise Features (Post-MVP)

- [ ] Multi-tenant support
- [ ] Advanced compliance (GDPR data handling)
- [ ] Data warehouse integration (BigQuery)
- [ ] Mobile SDK for analytics
- [ ] Webhooks for third-party integrations
- [ ] API rate limiting and quotas
- [ ] Custom integrations (Slack, etc.)

### MVP Checklist

**Core Functionality:**
- [x] FCM token registration and management
- [x] Send notifications to individual users
- [x] Send notifications to user segments
- [x] Queue-based notification sending
- [x] Retry logic for failed sends
- [x] Token cleanup for invalid devices
- [x] Event tracking from mobile app
- [x] User segmentation queries
- [x] Dashboard to create and send campaigns
- [x] Analytics for campaign performance

**NOT required for MVP:**
- [ ] Scheduling
- [ ] A/B testing
- [ ] Advanced analytics
- [ ] Automation workflows
- [ ] Personalization at scale
- [ ] ML predictions
- [ ] Multi-tenant
- [ ] Advanced compliance

**Timeline:** 4 weeks for MVP  
**Team:** 2 backend devs, 1 frontend dev  
**Post-MVP:** 8 weeks for full Phase 2

---

## 10. Best Practices & Production Concerns

### Token Management

#### **Token Lifecycle**

```
User installs app
    ↓
FCM generates token
    ↓
App sends token to backend
    ↓
Backend stores in device_tokens table
    ↓
Token is valid (typically 6+ months)
    ↓
Token refresh (when OS requests)
    ↓
App gets new token
    ↓
App sends new token to backend
    ↓
Backend updates device_tokens
    ↓
Old token invalidated in FCM (automatic)
    ↓
Backend cleans up old tokens (scheduled job)
    ↓
User uninstalls app
    ↓
Backend detects invalid token
    ↓
Backend marks token inactive
    ↓
Backend deletes after 90 days (optional)
```

#### **Handling Invalid Tokens**

FCM returns failure for various reasons:

```typescript
interface TokenFailureReason {
  'InvalidArgument': 'Token format invalid',
  'NotFound': 'Token not registered with FCM',
  'PermissionDenied': 'Sender ID mismatch',
  'Unavailable': 'FCM temporarily unavailable',
  'Internal': 'Internal FCM error',
  'Unknown': 'Unknown error',
}

// Cleanup strategy:
async function cleanupInvalidToken(
  userId: string,
  token: string,
  error: Error
): Promise<void> {
  const shouldDelete = 
    error.includes('NotFound') || 
    error.includes('InvalidArgument');
  
  if (shouldDelete) {
    // Delete immediately
    await db.deviceToken.update({
      where: { token },
      data: { isActive: false },
    });
  } else if (error.includes('Unavailable')) {
    // Don't delete, FCM may recover
    // Retry later
  } else {
    // Unknown error, log for investigation
    await db.log.create({
      userId,
      error: error.message,
      timestamp: new Date(),
    });
  }
}
```

### Avoiding Notification Spam

#### **Frequency Capping**

```typescript
interface FrequencyCapRules {
  promotional: {
    perDay: 3,
    perWeek: 5,
    perMonth: 20,
  },
  transactional: {
    perDay: Infinity,  // No cap
    perWeek: Infinity,
    perMonth: Infinity,
  },
  reengagement: {
    perDay: 1,
    perWeek: 1,
    perMonth: 2,
  },
}

// Before sending, check:
async function checkFrequencyCapExceeded(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const now = new Date();
  const oneDay = subDays(now, 1);
  const oneWeek = subDays(now, 7);
  
  const sentToday = await db.notificationLog.count({
    where: {
      userId,
      notification: { type: notificationType },
      sentAt: { gte: oneDay },
    },
  });
  
  const sentThisWeek = await db.notificationLog.count({
    where: {
      userId,
      notification: { type: notificationType },
      sentAt: { gte: oneWeek },
    },
  });
  
  const rules = frequencyCapRules[notificationType];
  
  return (
    sentToday >= rules.perDay ||
    sentThisWeek >= rules.perWeek
  );
}
```

#### **Quiet Hours**

```typescript
// Don't send notifications during quiet hours
async function respectQuietHours(
  userId: string,
  notificationType: string
): Promise<boolean> {
  // Transactional notifications: ALWAYS send
  if (notificationType === 'transactional') {
    return false; // Don't skip
  }
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  
  // Get current time in user's timezone
  const currentTime = toZonedTime(new Date(), user.timezone);
  const currentHour = currentTime.getHours();
  
  const quietHours = { start: 21, end: 8 }; // 9 PM - 8 AM
  
  const isQuietHour = 
    (quietHours.start <= currentHour) ||
    (currentHour < quietHours.end);
  
  if (isQuietHour) {
    // Schedule for next morning instead
    const nextMorning = addDays(
      setHours(currentTime, 9), 
      1
    );
    
    await notificationQueue.add(
      { userId, ... },
      { delay: nextMorning.getTime() - new Date().getTime() }
    );
    
    return true; // Skipped, scheduled for later
  }
  
  return false; // Send now
}
```

### Timezone-Aware Sending

```typescript
// Send at optimal local time for each user
async function sendWithTimezoneOptimization(
  userIds: string[],
  notification: NotificationPayload
): Promise<void> {
  // Group users by timezone
  const usersByTimezone = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, timezone: true },
  });
  
  const groupedByTz = groupBy(usersByTimezone, 'timezone');
  
  // For each timezone, calculate delay
  for (const [timezone, users] of Object.entries(groupedByTz)) {
    // Send at 10 AM local time for that timezone
    const now = new Date();
    const targetTime = toZonedTime(
      setHours(now, 10),
      timezone
    );
    
    const delay = Math.max(
      0,
      targetTime.getTime() - now.getTime()
    );
    
    for (const user of users) {
      await notificationQueue.add(
        { userId: user.id, ...notification },
        { delay }
      );
    }
  }
}
```

### Rate Limiting at Scale

```typescript
// Limit FCM send rate (Google's recommended: 1000/sec per project)
import Bull from 'bull';

const notificationQueue = new Bull('notifications', {
  redis: { ... },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

// Process max 100 jobs per second (conservative)
notificationQueue.process(100, async (job) => {
  const response = await admin.messaging().sendMulticast({
    tokens: job.data.tokens,
    notification: job.data.notification,
  });
  
  return response;
});

// Alternative: Use Concurrency limiting
notificationQueue.process(
  100,  // Max 100 concurrent jobs
  async (job) => {
    // Process job
  }
);
```

### Android vs iOS Differences

#### **Android-Specific Handling**

```typescript
// Android needs explicit notification channel
admin.messaging().sendAll([
  {
    token: androidToken,
    notification: { title, body },
    android: {
      priority: 'high',  // 'high' or 'normal'
      notification: {
        sound: 'default',           // Audio
        channelId: 'order_updates', // Notification channel
        clickAction: 'ACTION_OPEN',
        tag: 'order_notification',  // Grouping tag
      },
      fcmOptions: {
        analyticsLabel: 'order_update',
      },
    },
  },
]);

// Android notification channels must be created on app side
// Create channels for different notification types:
channels:
  - ID: 'order_updates', Name: 'Order Updates', Priority: High
  - ID: 'promotions', Name: 'Promotional', Priority: Low
  - ID: 'important', Name: 'Important', Priority: High
```

#### **iOS-Specific Handling**

```typescript
// iOS uses APNs with different payload structure
admin.messaging().sendAll([
  {
    token: iosToken,
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
            'loc-args': [],
          },
          sound: 'default',
          badge: 1,
          'mutable-content': 1,  // Allow rich media
          'content-available': 1, // Background notification
          category: 'ORDER_ACTIONS',
        },
      },
      headers: {
        'apns-priority': '10',  // Immediate
        'apns-expiration': Math.floor(Date.now() / 1000) + 3600,
      },
    },
  },
]);
```

### Localization (Arabic/English)

```typescript
// Store translated content in database
interface NotificationTemplate {
  id: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

// When sending, use user's language preference
async function sendLocalizedNotification(
  userId: string,
  template: NotificationTemplate
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  const notification = {
    title: user.language === 'ar' ? template.titleAr : template.titleEn,
    body: user.language === 'ar' ? template.bodyAr : template.bodyEn,
  };
  
  await notificationQueue.add({ userId, notification });
}
```

### GDPR & Privacy Compliance

```typescript
// Complete user deletion
async function deleteUserGDPR(userId: string): Promise<void> {
  const transaction = db.$transaction([
    // 1. Delete personal data
    db.user.update({
      where: { id: userId },
      data: { deleted_at: new Date(), email: null, phone: null },
    }),
    
    // 2. Anonymize tokens
    db.deviceToken.updateMany({
      where: { userId },
      data: { userId: null, token: hashToken(uuid()) },
    }),
    
    // 3. Anonymize events
    db.userEvent.updateMany({
      where: { userId },
      data: { userId: null },
    }),
    
    // 4. Keep logs (for compliance, anonymized)
    db.notificationLog.updateMany({
      where: { userId },
      data: { userId: null },
    }),
  ]);
  
  // 5. Notify Firebase (optional, for consent)
  await archiveUserNotificationPreferences(userId);
}

// Consent management
interface UserConsent {
  id: UUID;
  userId: UUID;
  consentType: 'push_notifications' | 'email' | 'sms';
  granted: boolean;
  grantedAt: DateTime;
  expiresAt?: DateTime;
  ipAddress: string;  // For audit
}

// Before sending: check consent
async function hasConsent(
  userId: string,
  consentType: 'push_notifications'
): Promise<boolean> {
  const consent = await db.userConsent.findFirst({
    where: {
      userId,
      consentType,
      granted: true,
      expiresAt: { gt: new Date() },
    },
  });
  
  return !!consent;
}
```

### Delivery Optimization

#### **Batching Strategy**

```typescript
// Don't send 100K individual requests, batch them
async function sendToBulkAudience(
  userIds: string[],
  notification: NotificationPayload
): Promise<void> {
  const batchSize = 500;
  const batches = chunk(userIds, batchSize);
  
  for (const batch of batches) {
    // Get tokens for this batch
    const tokens = await db.deviceToken.findMany({
      where: {
        userId: { in: batch },
        isActive: true,
      },
      select: { token: true, userId: true },
    });
    
    // Send as single multicast (more efficient than individual sends)
    const response = await admin.messaging().sendMulticast({
      tokens: tokens.map(t => t.token),
      notification,
    });
    
    // Track results
    for (let i = 0; i < response.responses.length; i++) {
      const resp = response.responses[i];
      const token = tokens[i];
      
      if (!resp.success) {
        await handleFailedToken(token);
      }
    }
    
    // Spread batches to avoid rate limiting
    await sleep(100);
  }
}

// sendMulticast can send to 500 devices at once
// More efficient than sending 500 individual requests
```

### Monitoring & Alerting

```typescript
// Monitor critical metrics
interface NotificationMetrics {
  successRate: number;           // % of successful sends
  avgDeliveryTime: number;       // ms from queue to FCM
  averageOpenRate: number;       // % of opened notifications
  failedTokenRate: number;       // % of invalid tokens
  queueBacklog: number;          // Jobs waiting in queue
}

// Alert if metrics degrade
async function monitorMetrics(): Promise<void> {
  const metrics = await calculateMetrics();
  
  // Alert conditions
  if (metrics.successRate < 0.95) {
    await alertOps(`Low success rate: ${metrics.successRate}`);
  }
  
  if (metrics.failedTokenRate > 0.05) {
    await alertOps(`High failed token rate: ${metrics.failedTokenRate}`);
  }
  
  if (metrics.queueBacklog > 100000) {
    await alertOps(`Queue backlog high: ${metrics.queueBacklog} jobs`);
  }
  
  if (metrics.avgDeliveryTime > 5000) {
    await alertOps(`Slow delivery: ${metrics.avgDeliveryTime}ms`);
  }
}

// Log detailed metrics
cron.schedule('0 * * * *', async () => {  // Hourly
  const metrics = await calculateMetrics();
  
  await db.metricsLog.create({
    timestamp: new Date(),
    successRate: metrics.successRate,
    avgDeliveryTime: metrics.avgDeliveryTime,
    failedTokenRate: metrics.failedTokenRate,
    queueBacklog: metrics.queueBacklog,
  });
});
```

### Security Best Practices

```typescript
// 1. Never log sensitive data
❌ logger.info(`Sending to user: ${user.email}`);
❌ logger.error(`Token: ${token}`);

✅ logger.info(`Sending to user: ${user.id}`);
✅ logger.error(`Token hash: ${hashToken(token)}`);

// 2. Validate all inputs
const NotificationSchema = z.object({
  title: z.string().max(65),
  body: z.string().max(240),
  deepLink: z.string().url().optional(),
  data: z.record(z.string()).optional(),
});

const validated = NotificationSchema.parse(input);

// 3. Rate limit API endpoints
import rateLimit from 'express-rate-limit';

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 requests per minute
  keyGenerator: (req) => req.user.id,
});

app.post('/api/v1/notifications/send', sendLimiter, handler);

// 4. Authenticate admin dashboard
app.use('/admin/*', requireAuth, requireAdminRole);

// 5. Encrypt tokens at rest
const encryptedToken = encrypt(token, encryptionKey);
await db.deviceToken.create({
  token: encryptedToken,
  ...
});

// 6. Use HTTPS only
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(301, `https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Cost Optimization

```typescript
// Firebase Cloud Messaging is FREE
// But optimize your infrastructure costs:

// 1. Use BullMQ efficiently (no extra charges)
// 2. Batch sends (reduce API calls)
// 3. Cache segment queries (reduce database load)
// 4. Archive old logs (reduce storage)
// 5. Use PostgreSQL (cheaper than many alternatives)
// 6. Right-size Redis instance

// Cost breakdown for 1M users, 5 campaigns/week:
Firebase Admin SDK:    $0    (free)
Redis (small):         $15/month
PostgreSQL (small):    $25/month
Server (4vCPU, 8GB):   $50/month
Data transfer:         $5/month
─────────────────────────────
Total: ~$95/month

// As you scale to 10M users:
Firebase Admin SDK:    $0    (free)
Redis (large):         $150/month
PostgreSQL (large):    $200/month
Server (16vCPU, 32GB): $400/month
Data transfer:         $50/month
─────────────────────────────
Total: ~$800/month

// Still much cheaper than Twilio/SendGrid
```

### Scalability Roadmap

```
SCALE MILESTONES:

100K Users
├─ Single server sufficient
├─ Redis (small instance)
├─ PostgreSQL (shared)
└─ ~2-3 devs

1M Users
├─ 2-3 servers (load balanced)
├─ Redis (larger instance)
├─ PostgreSQL (dedicated)
├─ Materialized views for segments
└─ ~4-5 devs

10M Users
├─ 10+ servers
├─ Redis cluster
├─ PostgreSQL (multi-node, read replicas)
├─ Time-series DB (TimescaleDB) for analytics
├─ CDN for dashboard
├─ ~8-10 devs

100M Users
├─ Global distribution (multi-region)
├─ Redis cluster (multiple regions)
├─ PostgreSQL (sharded by region)
├─ Real-time analytics (streaming)
├─ ML/AI for optimization
└─ Dedicated platform team

PERFORMANCE TARGETS:

Operation | Current | 1M Users | 10M Users | 100M Users
──────────┼─────────┼──────────┼───────────┼───────────
Segment query | 100ms | 200ms | 500ms | 1s (cached)
Send 1K notifs | 2s | 5s | 10s | 20s
Delivery rate | 99.8% | 99.9% | 99.95% | 99.99%
```

---

## Summary

This comprehensive architecture provides:

✅ **Production-ready design** — battle-tested patterns  
✅ **Scalability** — from 100K to 100M users  
✅ **Flexibility** — topic-based and segmentation-based sending  
✅ **Compliance** — GDPR, consent, audit logging  
✅ **Analytics** — detailed tracking and insights  
✅ **User experience** — personalization, timing, localization  

The recommended approach:
1. **Phase 1 (MVP):** Core notifications, segmentation, basic dashboard
2. **Phase 2:** Scheduling, advanced analytics, automation
3. **Phase 3:** A/B testing, personalization, optimization
4. **Phase 4:** Enterprise features as needed

Start with the MVP (4 weeks), validate with real users, then expand.

---

## Appendices

### A. Firebase Admin SDK Configuration

```typescript
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export const messaging = admin.messaging();
```

### B. Key Dependencies

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "bull": "^4.11.0",
    "redis": "^4.6.0",
    "@prisma/client": "^5.0.0",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### C. Environment Variables Template

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tawreed

# App
NODE_ENV=production
LOG_LEVEL=info
```

---

**End of Document**

---

*This architecture is designed for the Tawreed B2B wholesale marketplace and can be adapted for similar e-commerce and B2B platforms. For questions or clarifications, refer to the Firebase Cloud Messaging documentation and industry best practices for notification systems.*
