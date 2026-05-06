/**
 * Environment Configuration Module
 *
 * Centralizes all environment-dependent configuration.
 * Loaded at app startup and validates required variables.
 *
 * Environment variables are injected at JavaScript bundle time by Expo.
 * - Local dev: read from .env.development automatically
 * - Production: read from .env.production automatically
 * - EAS builds: read from eas.json env section
 */

// Validate and extract environment variables at module load time
// This ensures we fail fast with a clear error before the app starts
const getApiUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url || url.trim() === "") {
    throw new Error(
      "❌ EXPO_PUBLIC_API_URL is not defined!\n\n" +
        "This environment variable must be set in one of:\n" +
        "  • .env.development (for local development)\n" +
        "  • .env.production (for production builds)\n" +
        "  • eas.json (for EAS cloud builds)\n\n" +
        "Without it, the app cannot communicate with the backend.\n" +
        "See .env.example for the required format.",
    );
  }

  return url;
};

const getAppEnv = (): "development" | "production" => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || "development";

  if (!["development", "production"].includes(env)) {
    console.warn(
      `⚠️  EXPO_PUBLIC_APP_ENV is set to "${env}", expected "development" or "production"`,
    );
  }

  return (env as "development" | "production") || "development";
};

const getProjectId = (): string => {
  return process.env.EXPO_PUBLIC_PROJECT_ID || "tawreed";
};

/**
 * Validated configuration object
 * Exported as constant — safe to import anywhere
 */
export const Config = {
  /** Base URL for all API calls */
  API_BASE_URL: getApiUrl(),

  /** Current environment: "development" or "production" */
  APP_ENV: getAppEnv(),

  /** Expo Push Notifications Project ID */
  PROJECT_ID: getProjectId(),

  /** Is development mode? (Convenience flag) */
  IS_DEV: __DEV__,
} as const;

/**
 * Type definitions for environment variables
 * Use this for type-safe env access where needed
 */
export type ConfigType = typeof Config;

// Log config in development mode (debug aid)
if (__DEV__) {
  console.log(
    "🔧 App Config Loaded:",
    `\n  API: ${Config.API_BASE_URL}`,
    `\n  ENV: ${Config.APP_ENV}`,
    `\n  DEV: ${Config.IS_DEV}`,
  );
}
