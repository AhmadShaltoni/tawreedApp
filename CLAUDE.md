# CLAUDE.md — Tawreed Mobile App

## Project Overview

**Tawreed** is a production-level B2B wholesale marketplace mobile application built with React Native (Expo). It enables businesses in Jordan to browse products, manage orders, and handle wholesale procurement entirely from mobile.

- **Platform**: React Native (Expo SDK 54)
- **Navigation**: Expo Router ~6.0.23 (file-based, React Navigation 7)
- **State**: Redux Toolkit + react-redux
- **API**: Axios with JWT Bearer token interceptor
- **Languages**: Arabic (default) & English — full RTL support
- **Auth**: JWT stored in expo-secure-store, guest mode supported

---

## Tech Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | Expo SDK 54, React Native 0.81.5, React 19.1.0 |
| Language         | TypeScript 5.9 (strict mode)                   |
| Navigation       | Expo Router ~6.0.23                            |
| State Management | Redux Toolkit 2.x, react-redux 9.x             |
| API Client       | Axios 1.x with interceptors                    |
| Auth Storage     | expo-secure-store                              |
| Images           | expo-image (optimized, recyclingKey)           |
| i18n             | i18next + react-i18next, expo-localization     |
| Offline          | @react-native-async-storage/async-storage      |
| Icons            | @expo/vector-icons (Ionicons)                  |

---

## Project Structure

```
tawreedApp/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout (Provider, AuthGate, i18n init)
│   ├── (auth)/                   # Auth group (login, register)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab bar (Home, Cart, Orders, Profile)
│   │   ├── index.tsx             # Home tab → HomeScreen
│   │   ├── cart.tsx              # Cart tab → CartScreen
│   │   ├── orders.tsx            # Orders tab → OrdersListScreen
│   │   └── profile.tsx           # Profile tab (inline, full settings)
│   ├── products.tsx              # Products listing route
│   ├── categories.tsx            # Categories route
│   ├── product/[id].tsx          # Product detail route
│   ├── checkout.tsx              # Checkout route
│   ├── order/[id].tsx            # Order detail route
│   └── notifications.tsx         # Notifications route
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI: Button, Input, Loader, EmptyState, ScreenWrapper, SearchBar
│   │   ├── ProductCard.tsx
│   │   ├── CategoryCard.tsx
│   │   └── SectionHeader.tsx
│   ├── constants/
│   │   ├── api.ts                # API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS
│   │   └── theme.ts              # Colors, Spacing, FontSize, BorderRadius
│   ├── hooks/
│   │   └── useAuthGuard.ts       # Guest mode guard hook
│   ├── localization/
│   │   ├── i18n.ts               # i18next config, language switching, RTL control
│   │   ├── ar.json               # Arabic translations (default)
│   │   └── en.json               # English translations
│   ├── screens/
│   │   ├── auth/                 # LoginScreen, RegisterScreen
│   │   ├── home/                 # HomeScreen
│   │   ├── products/             # ProductsListScreen, CategoriesScreen, ProductDetailScreen
│   │   ├── cart/                 # CartScreen, CheckoutScreen
│   │   ├── orders/               # OrdersListScreen, OrderDetailScreen
│   │   └── notifications/        # NotificationsScreen
│   ├── services/                 # API service layer
│   │   ├── api.ts                # Axios client with JWT interceptor
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── category.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   └── notification.service.ts
│   ├── store/                    # Redux store
│   │   ├── index.ts              # Store config, typed hooks
│   │   └── slices/               # auth, products, categories, cart, orders, notifications
│   ├── types/
│   │   └── index.ts              # All TypeScript interfaces
│   └── utils/
│       └── cache.ts              # AsyncStorage cache utility with TTL
└── CLAUDE.md                     # This file
```

---

## Key Features

### Authentication & Guest Mode

- JWT-based login/register with secure token storage
- **Guest mode**: Users can browse Home, Products, Categories without login
- Protected actions (cart, orders, checkout) prompt login via `useAuthGuard` hook
- "Continue as Guest" button on login screen
- Auth state: `{ isAuthenticated, isGuest, isInitialized }`

### Localization (i18n)

- **Arabic is the default language**
- Full RTL support via `I18nManager.forceRTL()`
- Translation files: `src/localization/ar.json` and `en.json`
- Language switching persisted in AsyncStorage
- All UI text uses `useTranslation()` hook — no hardcoded strings
- Currency displayed as `د.أ` (Arabic) or `JOD` (English)

### Products & Categories

- Products grid with search, category filtering, pagination
- Product detail with image gallery, quantity selector, discount badges
- Categories grid with search
- Offline cache for products and categories (30-min TTL)

### Cart & Checkout

- Cart with quantity controls, line totals, remove/clear
- Checkout with order summary, shipping address, city picker, notes
- Cart badge on tab bar showing item count

### Orders

- Orders list with 6 status types and color-coded badges
- Order detail with visual timeline/progress tracker
- Status: pending → confirmed → processing → shipped → delivered (or cancelled)

### Notifications

- Notification list with type icons (order_update, new_product, promotion, system)
- Mark individual or all as read
- Unread badge on notification bell in HomeScreen
- Deep linking to orders/products from notifications

### Animated Notices Banner

- Admin-managed announcements displayed on Home screen
- Rotates automatically every 10 seconds with fade animation
- Single notice visible at a time above Welcome Header
- Customizable background & text colors per notice
- Auto-hides when no notices available
- Inherits admin control via backend dashboard
- Fetched on screen focus and pull-to-refresh

### Profile & Settings

- Personal info display (name, email, phone, business)
- Language switcher (Arabic ↔ English) with RTL toggle
- Notifications link
- App version info
- Sign out with confirmation
- Guest-aware (shows login prompt for guests)

### Offline Support

- Cache utility (`src/utils/cache.ts`) with configurable TTL
- Featured products and categories cached in AsyncStorage
- Network failure fallback to cached data

---

## Design System

| Token          | Value     |
| -------------- | --------- |
| Primary        | `#3b82f6` |
| Secondary      | `#f97316` |
| Background     | `#f9fafb` |
| Text           | `#111827` |
| Text Secondary | `#6b7280` |
| Error          | `#ef4444` |
| Success        | `#22c55e` |
| Border         | `#e5e7eb` |

---

## API Endpoints

All endpoints are prefixed with `API_BASE_URL` (default: `http://localhost:3000`).

| Module        | Endpoints                                                                |
| ------------- | ------------------------------------------------------------------------ |
| Auth          | POST `/api/v1/auth` (login/register), GET `/api/v1/auth/me`              |
| Products      | GET `/api/v1/products`, GET `/api/v1/products/:id`, GET `?featured=true` |
| Categories    | GET `/api/v1/categories`                                                 |
| Cart          | GET/POST `/api/v1/cart`, PATCH/DELETE `/api/v1/cart/:id`                 |
| Orders        | GET/POST `/api/v1/orders`, GET `/api/v1/orders/:id`                      |
| Notifications | GET `/api/v1/notifications`, PATCH `.../read`, PATCH `.../read-all`      |
| Notices       | GET `/api/v1/notices` (public), POST/PATCH/DELETE (admin-only)           |

---

## Development Commands

```bash
# Start development server
npx expo start

# Type check
npx tsc --noEmit

# Lint
npx expo lint

# iOS
npx expo start --ios

# Android
npx expo start --android
```

---

## State Shape (Redux)

```typescript
{
  auth: {
    (user, token, loading, error, isAuthenticated, isGuest, isInitialized);
  }
  products: {
    (items,
      featured,
      selectedProduct,
      total,
      page,
      loading,
      loadingMore,
      loadingDetail,
      error,
      filters);
  }
  categories: {
    (items, loading, error);
  }
  cart: {
    (items, loading, updating, error);
  }
  orders: {
    (items, selectedOrder, loading, loadingDetail, creating, error);
  }
  notices: {
    (items, currentIndex, loading, error);
  }
  notifications: {
    (items, loading, error, unreadCount);
  }
}
```

---

## Path Alias

`@/*` maps to `./*` (configured in tsconfig.json)

Example: `import { Colors } from "@/src/constants/theme"`

---

## Security

- JWT tokens stored in `expo-secure-store` (encrypted native storage)
- 401 responses automatically clear token and redirect to login
- Input validation on all form screens (email, password, phone format)
- No sensitive data in AsyncStorage (only product/category cache)
- API requests include Bearer token via Axios interceptor
