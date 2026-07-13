/**
 * Firebase Initialization Module
 * Must be called before using any Firebase services
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * ⚠️ Firebase native modules are NOT available in Expo Go.
 * Lazily require @react-native-firebase/app so importing this file
 * never crashes in Expo Go.
 */
const isExpoGo = Constants.executionEnvironment === "storeClient";

type FirebaseAppModule = typeof import("@react-native-firebase/app");

let firebaseAppModule: FirebaseAppModule | null = null;

function getFirebaseAppModule(): FirebaseAppModule | null {
  if (isExpoGo) return null;
  if (!firebaseAppModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      firebaseAppModule = require("@react-native-firebase/app");
    } catch (error) {
      console.warn(
        "[Firebase Init] App native module unavailable. Use a development build for Firebase.",
        error,
      );
      return null;
    }
  }
  return firebaseAppModule;
}

let firebaseInitialized = false;

/**
 * Initialize Firebase once at app startup
 * This must be called BEFORE using Firebase services like Messaging
 */
export async function initializeFirebase(): Promise<void> {
  if (firebaseInitialized) {
    console.log("[Firebase Init] Already initialized, skipping...");
    return;
  }

  const firebaseApp = getFirebaseAppModule();
  if (!firebaseApp) {
    console.warn(
      "[Firebase Init] Skipping — native module unavailable (Expo Go?).",
    );
    return;
  }

  try {
    console.log("[Firebase Init] Starting Firebase initialization...");

    const apps = firebaseApp.getApps();
    if (apps.length === 0) {
      console.error(
        "[Firebase Init] No Firebase apps found. Check google-services.json/GoogleService-Info.plist and package name.",
      );
      throw new Error("Firebase app not initialized");
    }

    console.log(
      "[Firebase Init] Firebase already initialized with",
      apps.length,
      "app(s)",
    );

    const app = firebaseApp.getApp();

    console.log("[Firebase Init] ✅ Firebase initialized successfully!");
    console.log("[Firebase Init] App name:", app.name);
    console.log("[Firebase Init] Platform:", Platform.OS);

    firebaseInitialized = true;
  } catch (error) {
    console.error("[Firebase Init] ❌ Initialization failed:", error);
    throw error;
  }
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  const firebaseApp = getFirebaseAppModule();
  if (!firebaseApp) return false;
  return firebaseInitialized || firebaseApp.getApps().length > 0;
}

/**
 * Get Firebase app instance (throws if not initialized)
 */
export function getFirebaseApp() {
  const firebaseApp = getFirebaseAppModule();
  if (!firebaseApp || !isFirebaseInitialized()) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }

  return firebaseApp.getApp();
}
