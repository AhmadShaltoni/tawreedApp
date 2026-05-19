/**
 * RewardRevealScreen
 * FULLSCREEN reward reveal experience
 * 
 * This is NOT a modal - it's a dedicated moment
 * Sequence: dim background → card flies in → glow → code reveal → copy button
 */

import { useAppDispatch, useAppSelector } from "@/src/store";
import { hideRewardReveal } from "@/src/store/slices/loyalty.slice";
import { haptics } from "@/src/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  ZoomIn,
} from "react-native-reanimated";
import {
  BorderRadius,
  Colors,
  FontSize,
  Spacing,
} from "@/src/constants/theme";
import { LoyaltyGradients, LoyaltyShadows, LoyaltyTypography } from "@/src/constants/loyaltyTheme";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function RewardRevealScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { showReveal, lastRedeemedCoupon } = useAppSelector(
    (state) => state.loyalty.redemption,
  );

  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (showReveal) {
      // Trigger success haptic
      haptics.success();
    }
  }, [showReveal]);

  const handleCopyCode = async () => {
    if (!lastRedeemedCoupon) return;

    await Clipboard.setStringAsync(lastRedeemedCoupon.code);
    setCodeCopied(true);
    haptics.light();

    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleClose = () => {
    dispatch(hideRewardReveal());
  };

  if (!showReveal || !lastRedeemedCoupon) return null;

  return (
    <Modal
      visible={showReveal}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Dimmed Background */}
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut}
          style={styles.backdrop}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <Animated.View
            entering={ZoomIn.delay(200).duration(600)}
            style={styles.iconContainer}
          >
            <LinearGradient
              colors={LoyaltyGradients.green}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark-circle" size={64} color="#ffffff" />
            </LinearGradient>
          </Animated.View>

          {/* Success Message */}
          <Animated.Text
            entering={FadeIn.delay(400)}
            style={styles.successTitle}
          >
            {t("loyalty.redeemSuccess")}
          </Animated.Text>

          {/* Coupon Card */}
          <Animated.View
            entering={SlideInUp.delay(600).springify().damping(15)}
            style={styles.couponCard}
          >
            <LinearGradient
              colors={LoyaltyGradients.goldLight}
              style={styles.couponGradient}
            >
              <Text style={styles.couponLabel}>{t("loyalty.couponCode")}</Text>
              
              <View style={styles.codeContainer}>
                <Text style={styles.code}>{lastRedeemedCoupon.code}</Text>
              </View>

              {/* Discount Info */}
              {lastRedeemedCoupon.discountValue && (
                <Text style={styles.discountInfo}>
                  {lastRedeemedCoupon.discountValue} {t("common.currency")}{" "}
                  {t("loyalty.discount")}
                </Text>
              )}
              {lastRedeemedCoupon.discountPercentage && (
                <Text style={styles.discountInfo}>
                  {lastRedeemedCoupon.discountPercentage}% {t("loyalty.discount")}
                </Text>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Copy Button */}
          <Animated.View entering={FadeIn.delay(800)} style={styles.actions}>
            <Pressable
              style={styles.copyButton}
              onPress={handleCopyCode}
              disabled={codeCopied}
            >
              <Ionicons
                name={codeCopied ? "checkmark-circle" : "copy-outline"}
                size={20}
                color={Colors.white}
              />
              <Text style={styles.copyButtonText}>
                {codeCopied ? t("loyalty.codeCopied") : t("loyalty.copyCode")}
              </Text>
            </Pressable>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>{t("common.confirm")}</Text>
            </Pressable>
          </Animated.View>

          {/* Use at Checkout Hint */}
          <Animated.Text entering={FadeIn.delay(1000)} style={styles.hint}>
            {t("loyalty.useAtCheckout")}
          </Animated.Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    ...LoyaltyShadows.premium,
  },
  successTitle: {
    ...LoyaltyTypography.sectionTitle,
    color: Colors.white,
    marginBottom: Spacing.xxxl,
    textAlign: "center",
  },
  couponCard: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...LoyaltyShadows.premium,
    marginBottom: Spacing.xl,
  },
  couponGradient: {
    padding: Spacing.xxxl,
    alignItems: "center",
  },
  couponLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: "#f59e0b",
    borderStyle: "dashed",
  },
  code: {
    ...LoyaltyTypography.number,
    color: Colors.text,
    letterSpacing: 4,
    fontFamily: "monospace",
  },
  discountInfo: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#ea580c",
  },
  actions: {
    width: "100%",
    gap: Spacing.md,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...LoyaltyShadows.card,
  },
  copyButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  closeButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.white,
  },
  hint: {
    fontSize: FontSize.sm,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});
