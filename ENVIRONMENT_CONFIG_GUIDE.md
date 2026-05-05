# Environment Configuration Implementation Guide

## Overview

This document explains the production-ready environment configuration system implemented for the Tawreed app. It solves the issue where `EXPO_PUBLIC_API_URL` becomes `undefined` in production builds, causing API calls to fail on real devices.

---

## Why This Problem Occurs

### The Root Cause

Expo replaces all `process.env.EXPO_PUBLIC_*` references with their **literal values during JavaScript bundling** (Metro/Hermes compilation). This means:

1. **Build Time Replacement**: When the app is compiled, Expo scans for all `EXPO_PUBLIC_*` environment variables and embeds their values directly into the JavaScript bundle.
2. **No Runtime Evaluation**: Once bundled, these values cannot change — they're fixed strings in the compiled code.
3. **Environment Variable Not Loaded**: If the variable is missing when bundling happens, it becomes `undefined` in the binary, and no fallback can catch it at runtime.

### How This Differs by Build Method

| Build Method | Where `.env` Comes From | Result |
|---|---|---|
| `expo start` (local) | `.env.development` from your machine ✅ | Works — env vars loaded |
| `npx expo run:android` (local) | `.env.development` from your machine ✅ | Works — env vars loaded |
| `eas build --profile production` (cloud) | `eas.json` `env` section ✅ | Works — EAS provides env |
| Production APK/AAB (old system) | `.env.local` (gitignored, not in cloud) ❌ | Fails — env undefined |

### The Previous Problem

The old code had an unsafe fallback:

```typescript
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();
```

This silently fell back to `http://192.168.20.149:3000` on real devices, which:
- Doesn't exist on device networks
- Causes silent API failures (no error thrown)
- Makes debugging extremely difficult
- Masks the underlying environment configuration issue

---

## Implementation Details

### 1. Environment Files

**`.env.development`** — Used by `expo start` and local builds
```
EXPO_PUBLIC_API_URL=http://192.168.20.149:3000
EXPO_PUBLIC_APP_ENV=development
```

**`.env.production`** — Used by `eas build` and `expo export`
```
EXPO_PUBLIC_API_URL=https://tawreedportal-production.up.railway.app
EXPO_PUBLIC_APP_ENV=production
```

**`.env.example`** — Committed to git, documents required variables for new developers
```
EXPO_PUBLIC_API_URL=http://192.168.20.149:3000
EXPO_PUBLIC_APP_ENV=development
```

### 2. Central Config Module (`src/config/env.ts`)

This module is the **single source of truth** for all environment configuration:

```typescript
export const Config = {
  API_BASE_URL: getApiUrl(),        // Validated, throws if missing
  APP_ENV: getAppEnv(),              // "development" | "production"
  PROJECT_ID: getProjectId(),        // Expo notifications project ID
  IS_DEV: __DEV__,                   // Convenience flag
} as const;
```

**Key Features:**
- ✅ **Fail-Fast**: Throws a clear error at app startup if `EXPO_PUBLIC_API_URL` is undefined
- ✅ **Type-Safe**: Exports `ConfigType` for TypeScript support
- ✅ **Single Import**: Any file can `import { Config } from "@/src/config/env"`
- ✅ **Dev Logging**: Shows config values in console during development

### 3. Updated `src/constants/api.ts`

**Before:**
```typescript
const getDefaultApiUrl = () => {
  if (Platform.OS === "web") return "http://localhost:3000";
  return "http://192.168.20.149:3000"; // ❌ Silent fallback
};
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();
```

**After:**
```typescript
import { Config } from "@/src/config/env";

export const API_BASE_URL = Config.API_BASE_URL; // ✅ Throws if missing
```

### 4. `.gitignore` Updates

```gitignore
# .env.development and .env.production are committed (public URLs, no secrets)
# .env.local is ignored (for personal/local overrides only)
.env.local
.env.*.local
```

### 5. `eas.json` Updates

Each build profile now includes `EXPO_PUBLIC_APP_ENV`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://tawreedportal-production.up.railway.app",
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://tawreedportal-production.up.railway.app",
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://tawreedportal-production.up.railway.app",
        "EXPO_PUBLIC_APP_ENV": "production"
      }
    }
  }
}
```

### 6. `package.json` Build Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start",
    "build:preview": "eas build --profile preview --platform android",
    "build:production": "eas build --profile production --platform android",
    "build:preview:ios": "eas build --profile preview --platform ios",
    "build:production:ios": "eas build --profile production --platform ios"
  }
}
```

### 7. Dev Logging (`app/_layout.tsx`)

In development, the app logs the resolved configuration:

```typescript
if (__DEV__) {
  console.log("✅ App initialized with Config:", {
    API_BASE_URL: Config.API_BASE_URL,
    APP_ENV: Config.APP_ENV,
    IS_DEV: Config.IS_DEV,
  });
}
```

Console output example:
```
✅ App initialized with Config: {
  "API_BASE_URL": "http://192.168.20.149:3000",
  "APP_ENV": "development",
  "IS_DEV": true
}
```

---

## How to Use

### Local Development

```bash
# Start development server (automatically reads .env.development)
npm run dev

# Or run on Android device
npm run android

# Or run on iOS simulator
npm run ios
```

The app will use `API_BASE_URL` from `.env.development`.

### Test Locally in Production Mode

To simulate a production bundle locally:

```bash
npx expo start --no-dev --minify
```

This:
- Minifies JavaScript (like production)
- Reads `.env.production` (simulates prod config)
- Does NOT use hot reload

### Build for Testing (Preview APK/AAB)

```bash
npm run build:preview
```

This creates an internal distribution APK using the `preview` profile in `eas.json`.

### Build for Production

```bash
npm run build:production
```

This creates a production APK/AAB using the `production` profile in `eas.json`.

### Build for iOS

```bash
# Preview build
npm run build:preview:ios

# Production build
npm run build:production:ios
```

---

## Debugging Configuration

### 1. Verify Environment Variables Are Loaded

Check the console when the app starts:

```
✅ App initialized with Config: {
  "API_BASE_URL": "...",
  "APP_ENV": "...",
  "IS_DEV": true
}
```

### 2. Check `.env` File

Ensure the correct `.env` file exists:

```bash
# Check which file is being used
cat .env.development  # Should have local IP
cat .env.production   # Should have Railway URL
```

### 3. Verify EAS Configuration

```bash
eas build --profile production --dry-run --platform android
```

This shows what environment variables will be used without actually building.

### 4. Test API Connectivity

In the app, make an API call and check:
- Network tab in React Native debugger
- Console logs from `src/services/api.ts`

### 5. Force an Error (for Testing)

Temporarily break the config to verify error handling:

```typescript
// In .env.development, set:
EXPO_PUBLIC_API_URL=

# Run the app
npm run dev
```

Expected behavior: App crashes immediately with:
```
❌ EXPO_PUBLIC_API_URL is not defined!
This environment variable must be set in one of:
  • .env.development (for local development)
  • .env.production (for production builds)
  • eas.json (for EAS cloud builds)
```

---

## Extending the System

### Add a Staging Environment

1. Create `.env.staging`:
   ```
   EXPO_PUBLIC_API_URL=https://staging-api.tawreed.app
   EXPO_PUBLIC_APP_ENV=staging
   ```

2. Add to `eas.json`:
   ```json
   {
     "build": {
       "staging": {
         "distribution": "internal",
         "env": {
           "EXPO_PUBLIC_API_URL": "https://staging-api.tawreed.app",
           "EXPO_PUBLIC_APP_ENV": "staging"
         }
       }
     }
   }
   ```

3. Add to `package.json`:
   ```json
   "build:staging": "eas build --profile staging --platform android"
   ```

4. Update `src/config/env.ts`:
   ```typescript
   const getAppEnv = (): "development" | "staging" | "production" => {
     const env = process.env.EXPO_PUBLIC_APP_ENV || "development";
     if (!["development", "staging", "production"].includes(env)) {
       console.warn(`⚠️ Unknown APP_ENV: "${env}"`);
     }
     return (env as "development" | "staging" | "production") || "development";
   };
   ```

### Add Secrets (API Keys, etc.)

For actual secrets, use **EAS Secrets** instead of `.env` files:

```bash
# Create a secret
eas secret:create --name API_KEY --value "your-secret-key"

# Reference in eas.json
{
  "build": {
    "production": {
      "secrets": ["API_KEY"]
    }
  }
}

# Access in env.ts
const getApiKey = (): string => {
  const key = process.env.EXPO_SECRET_API_KEY;
  if (!key) throw new Error("API_KEY secret is not defined!");
  return key;
};
```

EAS Secrets are:
- Injected server-side during builds
- Never stored in `.env` files
- Never committed to git
- The correct way to handle sensitive data

---

## Best Practices

✅ **DO:**
- Commit `.env.development` and `.env.production` (they contain public URLs only)
- Commit `.env.example` (template for new developers)
- Use `eas secret:create` for actual secrets (API keys, tokens, etc.)
- Always validate required environment variables at app startup
- Log configuration in development mode for debugging
- Use the Config module for all environment-dependent settings

❌ **DON'T:**
- Commit `.env.local` or `.env.*.local` (personal overrides)
- Put secrets directly in `.env` files
- Use `process.env` directly in components (import from Config instead)
- Have silent fallbacks that mask configuration errors
- Change the API URL at runtime (it's baked into the bundle)

---

## References

- [Expo Environment Variables Docs](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Secrets](https://docs.expo.dev/eas-update/environment-variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)

---

## Summary of Files Changed

| File | Changes |
|---|---|
| `.env.development` | **NEW** — Local dev configuration |
| `.env.production` | **NEW** — Production configuration |
| `.env.example` | **NEW** — Template for developers |
| `src/config/env.ts` | **NEW** — Central config module with validation |
| `src/constants/api.ts` | Updated — Use Config module, remove fallback |
| `eas.json` | Updated — Add EXPO_PUBLIC_APP_ENV to all profiles |
| `package.json` | Updated — Add build convenience scripts |
| `.gitignore` | Updated — Clarify env file handling |
| `src/services/notification.service.ts` | Updated — Use Config.PROJECT_ID |
| `app/_layout.tsx` | Updated — Add Config import and dev logging |

