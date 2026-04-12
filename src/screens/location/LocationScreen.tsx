import Button from "@/src/components/ui/Button";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { locationService } from "@/src/services/location.service";
import { useAppDispatch } from "@/src/store";
import { updateUser } from "@/src/store/slices/auth.slice";
import type { City, UpdateLocationPayload } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
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
 * Normalize string for matching: lowercase, trim, remove extra spaces
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Match GPS coordinates to city and area IDs using reverse geocoding
 * Uses fuzzy matching with normalization to handle different naming conventions
 */
async function matchLocationToCityAndArea(
  latitude: number,
  longitude: number,
  cities: City[],
): Promise<{ cityId: string; areaId?: string } | null> {
  try {
    console.log(
      "🗺️ [Location Matching] Reverse geocoding coordinates:",
      { latitude, longitude },
    );

    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (!results || results.length === 0) {
      console.warn("⚠️ [Location Matching] No geocoding results found");
      return null;
    }

    const primaryResult = results[0];
    console.log("📍 [Location Matching] Geocoding result:", {
      city: primaryResult.city,
      region: primaryResult.region,
      district: primaryResult.district,
      country: primaryResult.country,
    });

    // Extract and normalize potential city/area names
    const geocodedCity = normalizeString(primaryResult.city || "");
    const geocodedRegion = normalizeString(primaryResult.region || "");
    const geocodedDistrict = normalizeString(primaryResult.district || "");

    console.log(
      "🔍 [Location Matching] Extracted normalized names:",
      {
        city: geocodedCity,
        region: geocodedRegion,
        district: geocodedDistrict,
      },
    );

    // Try to match with available cities
    for (const city of cities) {
      const cityNameAr = normalizeString(city.name);
      const cityNameEn = normalizeString(city.nameEn);

      // Multiple matching strategies for robustness
      const cityMatched =
        cityNameAr === geocodedCity ||
        cityNameAr === geocodedRegion ||
        cityNameEn === geocodedCity ||
        cityNameEn === geocodedRegion ||
        geocodedCity.includes(cityNameAr) ||
        geocodedRegion.includes(cityNameAr) ||
        cityNameAr.includes(geocodedCity) ||
        cityNameAr.includes(geocodedRegion);

      if (cityMatched) {
        console.log(
          "✅ [Location Matching] City matched:",
          `${city.name} / ${city.nameEn}`,
        );

        // Try to match area within matched city
        if (city.areas && city.areas.length > 0) {
          for (const area of city.areas) {
            const areaNormalizedAr = normalizeString(area.name);
            const areaEnNormalized = normalizeString(area.nameEn);

            const areaMatched =
              areaNormalizedAr === geocodedDistrict ||
              areaEnNormalized === geocodedDistrict ||
              areaNormalizedAr === geocodedRegion ||
              areaEnNormalized === geocodedRegion ||
              geocodedDistrict.includes(areaNormalizedAr) ||
              geocodedRegion.includes(areaNormalizedAr) ||
              areaNormalizedAr.includes(geocodedDistrict);

            if (areaMatched) {
              console.log(
                "✅ [Location Matching] Area matched:",
                `${area.name} / ${area.nameEn}`,
              );
              return {
                cityId: city.id,
                areaId: area.id,
              };
            }
          }

          console.log(
            "⚠️ [Location Matching] City matched but no area found - returning city only",
          );
        }

        // Return city match even if area not found
        return {
          cityId: city.id,
        };
      }
    }

    console.warn(
      "❌ [Location Matching] No city match found for geocoded location",
      {
        geocodedCity,
        geocodedRegion,
        availableCities: cities
          .slice(0, 3)
          .map((c) => c.name),
      },
    );
    return null;
  } catch (error) {
    console.error(
      "🚨 [Location Matching] Error during matching:",
      error,
    );
    return null;
  }
}

export default function LocationScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isArabic = i18n.language === "ar";

  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const selectedCity = cities.find((c) => c.id === selectedCityId) ?? null;
  const areas = selectedCity?.areas ?? [];
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? null;

  const canConfirm = selectedCityId !== null || coordinates !== null;

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

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  const handleAutoDetect = useCallback(async () => {
    setDetectingLocation(true);
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("", t("location.permissionDenied"));
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      // Store coordinates first
      setCoordinates(coords);
      console.log("📍 GPS Coordinates obtained:", coords);

      // Try to match coordinates to city and area
      if (cities.length > 0) {
        console.log(
          "🔄 Attempting to match coordinates to city/area...",
        );
        const match = await matchLocationToCityAndArea(
          coords.latitude,
          coords.longitude,
          cities,
        );

        if (match) {
          console.log(
            "🎯 Match successful - updating selections",
            match,
          );
          setSelectedCityId(match.cityId);
          if (match.areaId) {
            setSelectedAreaId(match.areaId);
          } else {
            // Clear area if only city matched
            setSelectedAreaId(null);
          }
        } else {
          console.log(
            "ℹ️ No match found - keeping coordinates only",
          );
          // Coordinates are set but no city/area match
          // User can still proceed with just GPS coords
          Alert.alert(
            t("location.infoTitle"),
            t("location.nearbyLocationInfo"),
          );
        }
      } else {
        console.warn("⚠️ Cities not loaded yet - coordinates stored");
      }
    } catch (error) {
      console.error("💥 GPS detection error:", error);
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
      router.replace("/(tabs)");
    } catch {
      Alert.alert("", t("location.saveError"));
    } finally {
      setSaving(false);
    }
  }, [selectedCityId, selectedAreaId, coordinates, dispatch, router, t]);

  const getCityDisplayName = (city: City) =>
    isArabic ? city.name : city.nameEn;
  const getAreaDisplayName = (area: { name: string; nameEn: string }) =>
    isArabic ? area.name : area.nameEn;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          <Ionicons
            name="location-sharp"
            size={64}
            color={Colors.secondary}
          />
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
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={Colors.primary}
                  />
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
