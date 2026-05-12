/**
 * Firebase Initialization Module
 * Must be called before using any Firebase services
 */

import { getApp, getApps } from "@react-native-firebase/app";
import { Platform } from "react-native";

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

  try {
    console.log("[Firebase Init] Starting Firebase initialization...");

    const apps = getApps();
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

    const app = getApp();

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
  return firebaseInitialized || getApps().length > 0;
}

/**
 * Get Firebase app instance (throws if not initialized)
 */
export function getFirebaseApp() {
  if (!isFirebaseInitialized()) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }

  return getApp();
}
