import {
  AppVersionCheckResult,
  checkAppVersion,
} from "@/src/services/appVersion.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Linking } from "react-native";

const DISMISSED_VERSION_KEY = "tawreed_update_dismissed_version";
// Don't re-hit the endpoint on every foreground; once per interval is enough
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

interface AppUpdateState {
  visible: boolean;
  forced: boolean;
  message: string;
  latestVersion: string;
  storeUrl: string;
}

const HIDDEN: AppUpdateState = {
  visible: false,
  forced: false,
  message: "",
  latestVersion: "",
  storeUrl: "",
};

/**
 * Checks for app updates on launch and whenever the app returns to the
 * foreground. The popup only appears when the backend confirms the user's
 * build is older than what is actually available on the store:
 * - updateRequired  → blocking modal (cannot be dismissed)
 * - updateAvailable → dismissible modal, shown once per new version
 */
export function useAppUpdateCheck() {
  const [state, setState] = useState<AppUpdateState>(HIDDEN);
  const lastCheckAt = useRef(0);
  const forcedRef = useRef(false);

  const applyResult = useCallback(async (result: AppVersionCheckResult) => {
    if (result.updateRequired) {
      forcedRef.current = true;
      setState({
        visible: true,
        forced: true,
        message: result.message,
        latestVersion: result.latestVersion,
        storeUrl: result.storeUrl,
      });
      return;
    }

    if (result.updateAvailable) {
      const dismissed = await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
      if (dismissed === result.latestVersion) return;
      setState({
        visible: true,
        forced: false,
        message: result.message,
        latestVersion: result.latestVersion,
        storeUrl: result.storeUrl,
      });
    }
  }, []);

  const runCheck = useCallback(async () => {
    // Never downgrade an already-forced modal based on a later response
    if (forcedRef.current) return;
    if (Date.now() - lastCheckAt.current < CHECK_INTERVAL_MS) return;
    lastCheckAt.current = Date.now();

    const result = await checkAppVersion();
    if (result) await applyResult(result);
  }, [applyResult]);

  useEffect(() => {
    runCheck();

    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") runCheck();
      },
    );
    return () => subscription.remove();
  }, [runCheck]);

  const openStore = useCallback(() => {
    if (state.storeUrl) {
      Linking.openURL(state.storeUrl).catch((err) =>
        console.warn("[appVersion] failed to open store:", err),
      );
    }
    // Forced modal stays open — user must actually install the update
  }, [state.storeUrl]);

  const dismiss = useCallback(() => {
    if (state.forced) return;
    AsyncStorage.setItem(DISMISSED_VERSION_KEY, state.latestVersion).catch(
      () => {},
    );
    setState(HIDDEN);
  }, [state.forced, state.latestVersion]);

  return {
    updateModalVisible: state.visible,
    updateForced: state.forced,
    updateMessage: state.message,
    openStore,
    dismissUpdate: dismiss,
  };
}
