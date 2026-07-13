import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persisted "preferred delivery location" for the current device.
 *
 * This is the source of truth for the default delivery location used at
 * checkout and for the location shown on the Home bar. It survives app
 * restarts and logout (so re-logging in on the same device keeps the last
 * chosen location) and is only cleared when the account is deleted, which
 * calls AsyncStorage.clear().
 */
export interface SavedLocation {
  cityId?: string | null;
  areaId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: { id: string; name: string; nameEn: string } | null;
  area?: { id: string; name: string; nameEn: string } | null;
}

const LOCATION_KEY = "tawreed_saved_location";

export async function getSavedLocation(): Promise<SavedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedLocation;
  } catch {
    return null;
  }
}

/**
 * Merge the given fields into the saved location. Only defined fields are
 * written, so callers can update just the pieces they know about (e.g. a
 * checkout update carries city/area/address but not coordinates).
 */
export async function saveLocation(patch: SavedLocation): Promise<void> {
  try {
    const current = (await getSavedLocation()) ?? {};
    const next: SavedLocation = { ...current };
    for (const key of Object.keys(patch) as (keyof SavedLocation)[]) {
      const value = patch[key];
      if (value !== undefined) {
        // @ts-expect-error index assignment across the union is safe here
        next[key] = value;
      }
    }
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(next));
  } catch {
    // Silently ignore write errors — location is a convenience, not critical.
  }
}

export async function clearSavedLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_KEY);
  } catch {
    // Silently ignore.
  }
}
