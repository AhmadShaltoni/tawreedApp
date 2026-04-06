import { STORAGE_KEYS } from "@/src/constants/api";
import { Platform } from "react-native";

/**
 * Platform-aware token storage.
 * Uses expo-secure-store on native (iOS/Android) and localStorage on web.
 */

async function getNativeStore() {
  const mod = await import("expo-secure-store");
  return mod;
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  const store = await getNativeStore();
  return store.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    return;
  }
  const store = await getNativeStore();
  await store.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    return;
  }
  const store = await getNativeStore();
  await store.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
}
