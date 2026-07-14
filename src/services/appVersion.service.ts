import { API_ENDPOINTS } from "@/src/constants/api";
import Constants from "expo-constants";
import { Platform } from "react-native";
import apiClient from "./api";

export interface AppVersionCheckResult {
  platform: "ios" | "android";
  minVersion: string;
  latestVersion: string;
  storeUrl: string;
  message: string;
  updateRequired: boolean;
  updateAvailable: boolean;
}

/**
 * Native app version embedded at build time (from app.json).
 * With runtimeVersion policy "appVersion", OTA updates never change this.
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

/**
 * Ask the backend whether this build needs an update.
 * The server compares against the admin-configured versions and (for iOS)
 * verifies against the version actually live on the App Store.
 *
 * Returns null on any failure — the app must never block users when the
 * check cannot be completed (offline, server down, etc.).
 */
export async function checkAppVersion(): Promise<AppVersionCheckResult | null> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.APP_VERSION.CHECK, {
      params: {
        platform: Platform.OS,
        version: getCurrentAppVersion(),
      },
    });

    const data = response.data?.data;
    if (!data || typeof data.updateRequired !== "boolean") return null;
    return data as AppVersionCheckResult;
  } catch (error) {
    console.warn("[appVersion] check failed:", error);
    return null;
  }
}
