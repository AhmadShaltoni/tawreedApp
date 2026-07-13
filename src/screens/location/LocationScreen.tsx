import Button from "@/src/components/ui/Button";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { locationService } from "@/src/services/location.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { updateUser } from "@/src/store/slices/auth.slice";
import type { City, UpdateLocationPayload } from "@/src/types";
import { saveLocation } from "@/src/utils/locationStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Helper Functions ──────────────────────────────────────────────
/**
 * Normalize a place name for matching: lowercase, trim, collapse spaces,
 * strip Arabic diacritics and unify common letter variants so names from
 * the geocoder line up with the names stored in the database.
 */
function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .replace(/[\u0623\u0625\u0622]/g, "\u0627") // أ إ آ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whether two place names refer to the same place. Both must be non-empty
 * and match either exactly or as a whole-word phrase inside the other.
 * This deliberately avoids partial-word and empty-string matches, which
 * previously caused every location to falsely match the first listed area.
 */
function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const phraseInside = (needle: string, haystack: string) =>
    new RegExp(`(^|\\s)${escapeRegExp(needle)}(\\s|$)`).test(haystack);
  return phraseInside(a, b) || phraseInside(b, a);
}

/**
 * Haversine distance in kilometers between two GPS coordinates.
 */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Pick the closest city/area to the given GPS coordinates using stored lat/lng.
 *
 * Areas are the more granular signal, so we search for the globally nearest
 * AREA across every city and derive its parent city from that — this reliably
 * lands the user on the closest neighborhood (or their own), even when the
 * nearest city *centroid* belongs to a different city than the nearest area.
 * We only fall back to nearest-city-by-centroid when no area has coordinates.
 * Returns null when nothing in the dataset has coordinates so the caller can
 * fall back to reverse geocoding.
 */
function matchByCoordinates(
  latitude: number,
  longitude: number,
  cities: City[],
): { cityId: string; areaId?: string } | null {
  // 1) Globally nearest area (with coordinates), across all cities.
  let nearestAreaCityId: string | undefined;
  let nearestAreaId: string | undefined;
  let nearestAreaDist = Infinity;

  for (const city of cities) {
    for (const area of city.areas ?? []) {
      if (
        typeof area.latitude !== "number" ||
        typeof area.longitude !== "number"
      )
        continue;
      const dist = haversineKm(
        latitude,
        longitude,
        area.latitude,
        area.longitude,
      );
      if (dist < nearestAreaDist) {
        nearestAreaDist = dist;
        nearestAreaId = area.id;
        nearestAreaCityId = city.id;
      }
    }
  }

  if (nearestAreaCityId && nearestAreaId) {
    return { cityId: nearestAreaCityId, areaId: nearestAreaId };
  }

  // 2) No area coordinates anywhere — fall back to nearest city centroid.
  let nearestCity: City | null = null;
  let nearestCityDist = Infinity;
  for (const city of cities) {
    if (typeof city.latitude !== "number" || typeof city.longitude !== "number")
      continue;
    const dist = haversineKm(
      latitude,
      longitude,
      city.latitude,
      city.longitude,
    );
    if (dist < nearestCityDist) {
      nearestCityDist = dist;
      nearestCity = city;
    }
  }

  if (!nearestCity) return null;
  return { cityId: nearestCity.id };
}

/**
 * Resolve GPS coordinates to a city/area.
 * 1. Prefer precise distance-based matching when the backend provides
 *    coordinates for cities/areas.
 * 2. Otherwise reverse-geocode and match names with strict whole-word
 *    rules — only auto-selecting an area when we are confident, so the
 *    user is never silently dropped into the wrong neighborhood.
 */
async function matchLocationToCityAndArea(
  latitude: number,
  longitude: number,
  cities: City[],
): Promise<{ cityId: string; areaId?: string } | null> {
  const byCoords = matchByCoordinates(latitude, longitude, cities);
  if (byCoords) return byCoords;

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results || results.length === 0) return null;

    const result = results[0];

    const cityCandidates = [result.city, result.region, result.subregion]
      .map(normalizeString)
      .filter(Boolean);
    const areaCandidates = [
      result.district,
      result.name,
      result.street,
      result.subregion,
    ]
      .map(normalizeString)
      .filter(Boolean);

    // Match a city using its Arabic or English name
    let matchedCity: City | null = null;
    for (const city of cities) {
      const cityNames = [
        normalizeString(city.name),
        normalizeString(city.nameEn),
      ].filter(Boolean);
      const matched = cityCandidates.some((cand) =>
        cityNames.some((cn) => namesMatch(cn, cand)),
      );
      if (matched) {
        matchedCity = city;
        break;
      }
    }

    if (!matchedCity) return null;

    // Match an area only on a confident, non-empty name match
    if (matchedCity.areas?.length) {
      for (const area of matchedCity.areas) {
        const areaNames = [
          normalizeString(area.name),
          normalizeString(area.nameEn),
        ].filter(Boolean);
        const matched = areaCandidates.some((cand) =>
          areaNames.some((an) => namesMatch(an, cand)),
        );
        if (matched) {
          return { cityId: matchedCity.id, areaId: area.id };
        }
      }
    }

    // City matched but no confident area → return city only so the user
    // confirms the exact area manually instead of getting a wrong one.
    return { cityId: matchedCity.id };
  } catch {
    return null;
  }
}

export default function LocationScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";
  const user = useAppSelector((state) => state.auth.user);

  // "onboarding" when opened during registration (no screen to go back to);
  // otherwise the screen was pushed from Home/Cart and should return there.
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isOnboarding = flow === "onboarding";

  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoDetectFailed, setAutoDetectFailed] = useState(false);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const areas = selectedCity?.areas ?? [];
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  const canConfirm =
    selectedCityId !== null && (areas.length === 0 || selectedAreaId !== null);

  // Fetch cities on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await locationService.getCities();
        if (mounted) setCities(data);
      } catch {
        // silent — user can still use GPS
      } finally {
        if (mounted) setLoadingCities(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Open with the customer's current/last delivery location pre-selected so
  // confirming is one tap and changing feels closer to the user.
  useEffect(() => {
    if (prefilled || cities.length === 0) return;
    if (user?.cityId && cities.some((c) => c.id === user.cityId)) {
      setSelectedCityId(user.cityId);
      setSelectedAreaId(user.areaId ?? null);
    }
    setPrefilled(true);
  }, [cities, prefilled, user?.cityId, user?.areaId]);

  // Return to wherever the user came from (Home/Cart), not the home tab —
  // except during onboarding where there is no previous screen.
  const goToOrigin = useCallback(() => {
    if (!isOnboarding && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [isOnboarding, router]);

  const handleSkip = useCallback(() => {
    goToOrigin();
  }, [goToOrigin]);

  const handleAutoDetect = useCallback(async () => {
    setDetectingLocation(true);
    setAutoDetectFailed(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("", t("location.permissionDenied"));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      // Keep the precise coordinates regardless of name matching so the
      // backend can resolve the exact location server-side.
      setCoordinates(coords);

      if (cities.length > 0) {
        const match = await matchLocationToCityAndArea(
          coords.latitude,
          coords.longitude,
          cities,
        );

        if (match) {
          setSelectedCityId(match.cityId);
          setSelectedAreaId(match.areaId ?? null);
          if (!match.areaId) {
            // City detected but the exact area is uncertain — ask the
            // user to confirm the nearest area instead of guessing.
            setShowAreaPicker(true);
          }
        } else {
          // Could not confidently match — keep coordinates and let the
          // user pick the nearest city/area manually.
          setAutoDetectFailed(true);
          Alert.alert(t("location.noMatchTitle"), t("location.noMatchMessage"));
        }
      }
    } catch {
      Alert.alert("", t("location.fetchError"));
    } finally {
      setDetectingLocation(false);
    }
  }, [t, cities]);

  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedAreaId(null);
    setShowCityPicker(false);
  }, []);

  const handleAreaSelect = useCallback((areaId: string) => {
    setSelectedAreaId(areaId);
    setShowAreaPicker(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      const payload: UpdateLocationPayload = {};
      if (selectedCityId) payload.cityId = selectedCityId;
      if (selectedAreaId) payload.areaId = selectedAreaId;
      if (coordinates) {
        payload.latitude = coordinates.latitude;
        payload.longitude = coordinates.longitude;
      }

      const response = await locationService.updateLocation(payload);
      // Update user in Redux
      dispatch(
        updateUser({
          cityId: response.user.cityId,
          areaId: response.user.areaId,
          latitude: response.user.latitude,
          longitude: response.user.longitude,
          city: response.user.city,
          area: response.user.area,
        }),
      );
      // Persist on the device so this becomes the default delivery location
      // and survives restarts/logout.
      void saveLocation({
        cityId: response.user.cityId,
        areaId: response.user.areaId,
        latitude: response.user.latitude,
        longitude: response.user.longitude,
        city: response.user.city,
        area: response.user.area,
      });
      goToOrigin();
    } catch {
      Alert.alert("", t("location.saveError"));
    } finally {
      setSaving(false);
    }
  }, [selectedCityId, selectedAreaId, coordinates, dispatch, goToOrigin, t]);

  const getCityDisplayName = (city: City) =>
    isArabic ? city.name : city.nameEn;
  const getAreaDisplayName = (area: { name: string; nameEn: string }) =>
    isArabic ? area.name : area.nameEn;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + Spacing.xl, Spacing.xxxl) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Close / Skip button */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)}>
          <Pressable
            onPress={handleSkip}
            style={styles.closeButton}
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={Colors.text} />
          </Pressable>
        </Animated.View>

        {/* Icon + Title */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.header}
        >
          <Ionicons name="location-sharp" size={64} color={Colors.secondary} />
          <Text style={styles.title}>{t("location.title")}</Text>
        </Animated.View>

        {/* Auto-detect GPS */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Button
            title={
              detectingLocation
                ? t("location.detecting")
                : coordinates
                  ? t("location.detected")
                  : t("location.autoDetect")
            }
            onPress={handleAutoDetect}
            loading={detectingLocation}
            disabled={detectingLocation}
            variant={coordinates ? "primary" : "accent"}
            style={styles.gpsButton}
          />
        </Animated.View>

        {/* Manual-selection hint shown when GPS could not pinpoint the area */}
        {autoDetectFailed && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.hintRow}>
              <Ionicons
                name="information-circle"
                size={16}
                color={Colors.secondary}
              />
              <Text style={styles.hintText}>
                {t("location.manualSelectHint")}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Divider */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={styles.divider}
        >
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("location.or")}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* City Dropdown */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)}>
          {loadingCities ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>
                {t("location.loadingCities")}
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.dropdown}
              onPress={() => setShowCityPicker(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedCity && styles.dropdownPlaceholder,
                ]}
              >
                {selectedCity
                  ? getCityDisplayName(selectedCity)
                  : t("location.selectCity")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>
          )}
        </Animated.View>

        {/* Area Dropdown — only if a city is selected and has areas */}
        {selectedCity && areas.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Pressable
              style={[styles.dropdown, { marginTop: Spacing.md }]}
              onPress={() => setShowAreaPicker(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedArea && styles.dropdownPlaceholder,
                ]}
              >
                {selectedArea
                  ? getAreaDisplayName(selectedArea)
                  : t("location.selectArea")}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* Confirm Button */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)}>
          <Button
            title={saving ? t("location.saving") : t("location.confirm")}
            onPress={handleConfirm}
            loading={saving}
            disabled={!canConfirm || saving}
            variant="primary"
            style={styles.confirmButton}
          />
        </Animated.View>
      </ScrollView>

      {/* City Picker Modal */}
      <PickerModal
        visible={showCityPicker}
        title={t("location.selectCity")}
        items={cities.map((c) => ({
          id: c.id,
          label: getCityDisplayName(c),
        }))}
        selectedId={selectedCityId}
        onSelect={handleCitySelect}
        onClose={() => setShowCityPicker(false)}
      />

      {/* Area Picker Modal */}
      <PickerModal
        visible={showAreaPicker}
        title={t("location.selectArea")}
        items={areas.map((a) => ({
          id: a.id,
          label: getAreaDisplayName(a),
        }))}
        selectedId={selectedAreaId}
        onSelect={handleAreaSelect}
        onClose={() => setShowAreaPicker(false)}
      />
    </View>
  );
}

// ── Picker Modal ──────────────────────────────────────────────────
interface PickerModalProps {
  visible: boolean;
  title: string;
  items: { id: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function PickerModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: PickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={() => {
            /* prevent dismiss */
          }}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.modalItem,
                  item.id === selectedId && styles.modalItemSelected,
                ]}
                onPress={() => onSelect(item.id)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    item.id === selectedId && styles.modalItemTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {item.id === selectedId && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  gpsButton: {
    marginBottom: Spacing.lg,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#fff7ed",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  hintText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.textLight,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  confirmButton: {
    marginTop: Spacing.xxl,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.xxl,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  modalScroll: {
    paddingHorizontal: Spacing.xxl,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalItemSelected: {
    backgroundColor: Colors.primaryXLight,
    marginHorizontal: -Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
  },
  modalItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  modalItemTextSelected: {
    fontWeight: "700",
    color: Colors.primary,
  },
});
