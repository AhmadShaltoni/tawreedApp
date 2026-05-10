/**
 * Firebase Initialization Module
 * Must be called before using any Firebase services
 */

import firebase from "@react-native-firebase/app";
import { Platform } from "react-native";

let firebaseInitialized = false;

/**
 * Initialize Firebase once at app startup
 * This must be called BEFORE using messaging() or any other Firebase service
 */
export async function initializeFirebase(): Promise<void> {
  if (firebaseInitialized) {
    console.log("[Firebase Init] Already initialized, skipping...");
    return;
  }

  try {
    console.log("[Firebase Init] Starting Firebase initialization...");

    // Firebase auto-initializes with config from:
    // - android/app/google-services.json (Android)
    // - ios/GoogleService-Info.plist (iOS)
    // These files are configured via app.json plugins

    // Check if already initialized
    if (!firebase.apps.length) {
      console.log("[Firebase Init] No Firebase apps found, auto-initializing...");
    } else {
      console.log(
        "[Firebase Init] Firebase already initialized with",
        firebase.apps.length,
        "app(s)"
      );
    }

    // Verify initialization
    const defaultApp = firebase.app();
    console.log("[Firebase Init] ✅ Firebase initialized successfully!");
    console.log("[Firebase Init] App name:", defaultApp.name);
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
  return firebaseInitialized || (firebase.apps.length > 0);
}

/**
 * Get Firebase app instance (throws if not initialized)
 */
export function getFirebaseApp() {
  if (!isFirebaseInitialized()) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first."
    );
  }
  return firebase.app();
}
