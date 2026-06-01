/**
 * CelebrationOverlay
 * Fullscreen confetti/celebration overlay
 *
 * USAGE: Mounted ONCE in root layout, triggered via Redux state
 * PERFORMANCE: Conditionally rendered only when needed
 */

import { ParticleConfig } from "@/src/constants/loyaltyTheme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { resetRedemption } from "@/src/store/slices/loyalty.slice";
import { haptics } from "@/src/utils/haptics";
import React, { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";
// import LottieView from "lottie-react-native"; // Uncomment when Lottie asset is ready

export default function CelebrationOverlay() {
  const dispatch = useAppDispatch();
  const { success } = useAppSelector((state) => state.loyalty.redemption);

  // const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (success) {
      // Trigger haptic celebration
      haptics.celebration();

      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        dispatch(resetRedemption());
      }, ParticleConfig.duration);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  if (!success) return null;

  return (
    <Modal
      visible={success}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay} pointerEvents="none">
        {/* 
        TODO: Add Lottie confetti animation
        <LottieView
          ref={lottieRef}
          source={require('@/assets/lottie/confetti.json')}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
        */}

        {/* Placeholder: Simple celebration feedback */}
        <View style={styles.placeholder}>
          {/* Confetti will render here */}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
  },
});
