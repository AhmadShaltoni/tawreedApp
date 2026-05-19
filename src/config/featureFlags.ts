/**
 * Feature Flags System
 * Controls visibility of loyalty features without code changes
 * 
 * V1: Hardcoded local flags
 * V2: Remote override capability via API
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "loyalty_feature_flags";

export interface FeatureFlags {
  // Core loyalty features
  loyalty: boolean;
  campaigns: boolean;
  referral: boolean;
  rewardRarity: boolean;
  
  // Future features (hidden/locked initially)
  vipTiers: boolean;
  streaks: boolean;
  spinWheel: boolean;
  achievements: boolean;
  dailyRewards: boolean;
  leaderboards: boolean;
  missions: boolean;
  
  // Advanced features
  socialSharing: boolean;
  qrCodes: boolean;
  pushNotificationsForLoyalty: boolean;
}

// Default flags (V1 configuration)
const DEFAULT_FLAGS: FeatureFlags = {
  // Enabled in V1
  loyalty: true,
  campaigns: true,
  referral: true,
  rewardRarity: true,
  
  // Disabled in V1 (UI shells built, but locked/hidden)
  vipTiers: false,
  streaks: false,
  spinWheel: false,
  achievements: false,
  dailyRewards: false,
  leaderboards: false,
  missions: false,
  
  // Advanced features
  socialSharing: true,
  qrCodes: false,
  pushNotificationsForLoyalty: true,
};

class FeatureFlagsService {
  private flags: FeatureFlags = DEFAULT_FLAGS;
  private initialized = false;

  /**
   * Initialize feature flags from storage
   * Call during app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...DEFAULT_FLAGS, ...parsed };
      } else {
        this.flags = DEFAULT_FLAGS;
      }
      
      this.initialized = true;
      console.log("[FeatureFlags] Initialized:", this.flags);
    } catch (error) {
      console.error("[FeatureFlags] Initialization error:", error);
      this.flags = DEFAULT_FLAGS;
    }
  }

  /**
   * Get current flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] ?? false;
  }

  /**
   * Update flags (for testing or remote override)
   */
  async updateFlags(updates: Partial<FeatureFlags>): Promise<void> {
    this.flags = { ...this.flags, ...updates };
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.flags));
      console.log("[FeatureFlags] Updated:", updates);
    } catch (error) {
      console.error("[FeatureFlags] Update error:", error);
    }
  }

  /**
   * Reset to defaults
   */
  async reset(): Promise<void> {
    this.flags = DEFAULT_FLAGS;
    
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[FeatureFlags] Reset to defaults");
    } catch (error) {
      console.error("[FeatureFlags] Reset error:", error);
    }
  }

  /**
   * Fetch flags from remote (V2 feature)
   * Currently returns defaults, but architecture ready for API integration
   */
  async fetchRemoteFlags(): Promise<FeatureFlags> {
    // TODO: Implement API call to fetch remote flags
    // const response = await apiClient.get('/api/v1/feature-flags');
    // return response.data;
    
    console.log("[FeatureFlags] Remote fetch not implemented yet");
    return DEFAULT_FLAGS;
  }
}

export const featureFlagsService = new FeatureFlagsService();

/**
 * Helper hook-like function for checking features
 * Can be used directly in components
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlagsService.isEnabled(feature);
};

/**
 * Get all flags (for debugging)
 */
export const getAllFlags = (): FeatureFlags => {
  return featureFlagsService.getFlags();
};
