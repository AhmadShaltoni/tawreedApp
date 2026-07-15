import { AuthLayout } from "@/src/components/auth";
import {
  BorderRadius,
  Colors,
  Fonts,
  FontSize,
  LineHeight,
  Motion,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  clearError,
  register,
  resendSmsOtp,
  sendOtp,
  verifyOtp,
} from "@/src/store/slices/auth.slice";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * OTP verification step (phone → otp → register). Currently OUT of the
 * active sign-up journey — kept working and restyled so the flow can be
 * re-enabled once the WhatsApp/SMS provider is configured.
 */

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    username: string;
    storeName: string;
    password: string;
    confirmPassword: string;
    channel: string;
    expiresIn: string;
  }>();

  const { otpVerifying, error, loading } = useAppSelector(
    (state) => state.auth,
  );

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(
    parseInt(params.expiresIn || "120", 10),
  );
  const [canResend, setCanResend] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string>(
    params.channel || "whatsapp",
  );
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hasSubmitted = useRef(false);

  // Shake animation for errors
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  // Trigger shake on error
  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 100 }), 3, true),
        withTiming(0, { duration: 50 }),
      );
    }
  }, [error, shakeX]);

  const handleSubmit = useCallback(
    async (otpCode: string) => {
      if (hasSubmitted.current || otpVerifying || loading) return;
      hasSubmitted.current = true;

      dispatch(clearError());

      // Step 1: Verify OTP
      const verifyResult = await dispatch(
        verifyOtp({ phone: params.phone!, code: otpCode }),
      );

      if (!verifyOtp.fulfilled.match(verifyResult)) {
        hasSubmitted.current = false;
        setCode(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      setVerified(true);

      // Step 2: Register with verificationToken
      const token = verifyResult.payload.verificationToken;
      const registerResult = await dispatch(
        register({
          username: params.username!,
          phone: params.phone!,
          storeName: params.storeName!,
          password: params.password!,
          confirmPassword: params.confirmPassword!,
          verificationToken: token,
        }),
      );

      if (register.fulfilled.match(registerResult)) {
        const user = registerResult.payload.user;
        setTimeout(() => {
          if (!user.cityId && user.latitude == null) {
            router.replace("/location?flow=onboarding");
          } else {
            router.replace("/(tabs)");
          }
        }, 400);
      } else {
        // Registration failed — allow retry
        hasSubmitted.current = false;
        setVerified(false);
      }
    },
    [dispatch, params, router, otpVerifying, loading],
  );

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      if (verified) return;

      // Handle paste of full OTP
      if (value.length > 1) {
        const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (digits.length === OTP_LENGTH) {
          const newCode = digits.split("");
          setCode(newCode);
          inputRefs.current[OTP_LENGTH - 1]?.focus();
          handleSubmit(digits);
          return;
        }
      }

      const digit = value.replace(/\D/g, "").slice(-1);
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      if (error) dispatch(clearError());

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all digits filled
      if (digit && index === OTP_LENGTH - 1) {
        const fullCode = newCode.join("");
        if (fullCode.length === OTP_LENGTH) {
          handleSubmit(fullCode);
        }
      }
    },
    [code, error, dispatch, handleSubmit, verified],
  );

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace") {
        if (!code[index] && index > 0) {
          const newCode = [...code];
          newCode[index - 1] = "";
          setCode(newCode);
          inputRefs.current[index - 1]?.focus();
        } else {
          const newCode = [...code];
          newCode[index] = "";
          setCode(newCode);
        }
      }
    },
    [code],
  );

  const handleResend = useCallback(
    async (channel: "whatsapp" | "sms") => {
      setResending(true);
      dispatch(clearError());

      let success = false;

      if (channel === "sms") {
        const result = await dispatch(resendSmsOtp({ phone: params.phone! }));
        if (resendSmsOtp.fulfilled.match(result)) {
          setCurrentChannel("sms");
          setCountdown(result.payload.expiresIn || 120);
          success = true;
        }
      } else {
        const result = await dispatch(
          sendOtp({ phone: params.phone!, channel: "whatsapp" }),
        );
        if (sendOtp.fulfilled.match(result)) {
          setCurrentChannel(result.payload.channel);
          setCountdown(result.payload.expiresIn || 120);
          success = true;
        }
      }

      setResending(false);

      if (success) {
        setCanResend(false);
        setCode(Array(OTP_LENGTH).fill(""));
        hasSubmitted.current = false;
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    },
    [dispatch, params.phone],
  );

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const maskedPhone = params.phone
    ? `${params.phone.slice(0, 3)}****${params.phone.slice(-3)}`
    : "";

  const isWhatsApp = currentChannel === "whatsapp";
  const channelColor = isWhatsApp ? Colors.whatsapp : Colors.primary;

  return (
    <AuthLayout
      title={t("auth.otpVerification")}
      onBack={() => router.back()}
      centered
    >
      {/* Sent-to line + channel badge */}
      <View style={styles.sentToBlock}>
        <Text style={styles.subtitle}>
          {t("auth.otpSentTo")}{" "}
          <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        </Text>
        <View
          style={[
            styles.channelBadge,
            { backgroundColor: `${channelColor}15` },
          ]}
        >
          <Ionicons
            name={isWhatsApp ? "logo-whatsapp" : "chatbubble-outline"}
            size={16}
            color={channelColor}
          />
          <Text style={[styles.channelText, { color: channelColor }]}>
            {isWhatsApp ? t("auth.otpViaWhatsApp") : t("auth.otpViaSMS")}
          </Text>
        </View>
      </View>

      {/* OTP Inputs — always LTR: codes read left-to-right in Arabic too */}
      <Animated.View style={[styles.otpContainer, shakeStyle]}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const isFilled = !!code[index];
          const isActive = !verified && !otpVerifying;

          return (
            <View
              key={index}
              style={[
                styles.otpBox,
                isFilled && styles.otpBoxFilled,
                error ? styles.otpBoxError : undefined,
                verified && styles.otpBoxSuccess,
              ]}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, verified && styles.otpInputSuccess]}
                value={code[index]}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={index === 0 ? OTP_LENGTH : 1}
                editable={isActive}
                selectTextOnFocus
                caretHidden
                accessibilityLabel={`${t("auth.otpVerification")} ${index + 1}/${OTP_LENGTH}`}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* Verifying indicator */}
      {otpVerifying && (
        <Animated.View
          entering={FadeIn.duration(Motion.base)}
          style={styles.statusRow}
        >
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.statusText}>{t("auth.otpVerifying")}</Text>
        </Animated.View>
      )}

      {/* Success indicator */}
      {verified && !loading && (
        <Animated.View
          entering={FadeIn.duration(Motion.slow)}
          style={styles.statusRow}
        >
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
          <Text style={[styles.statusText, { color: Colors.success }]}>
            {t("auth.otpVerified")}
          </Text>
        </Animated.View>
      )}

      {/* Registering indicator */}
      {verified && loading && (
        <Animated.View
          entering={FadeIn.duration(Motion.base)}
          style={styles.statusRow}
        >
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.statusText}>
            {t("auth.profileStartShopping")}
          </Text>
        </Animated.View>
      )}

      {/* Error */}
      {error && !otpVerifying && (
        <Animated.View entering={FadeInUp.duration(Motion.slow)}>
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Animated.View>
      )}

      {/* Resend Section */}
      <View style={styles.resendSection}>
        {!canResend ? (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>{t("auth.otpResendIn")}</Text>
            <Text style={styles.countdownTimer}>
              {formatCountdown(countdown)}
            </Text>
          </View>
        ) : (
          <View style={styles.resendActions}>
            <Text style={styles.didntReceiveText}>
              {t("auth.otpDidntReceive")}
            </Text>

            <View style={styles.resendButtons}>
              <Pressable
                style={styles.resendButton}
                onPress={() => handleResend("whatsapp")}
                disabled={resending}
                accessibilityRole="button"
                accessibilityLabel={`${t("auth.otpDidntReceive")} WhatsApp`}
                accessibilityState={{ disabled: resending }}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={18}
                  color={Colors.whatsapp}
                />
                <Text
                  style={[styles.resendButtonText, { color: Colors.whatsapp }]}
                >
                  WhatsApp
                </Text>
              </Pressable>

              <View style={styles.resendDivider} />

              <Pressable
                style={styles.resendButton}
                onPress={() => handleResend("sms")}
                disabled={resending}
                accessibilityRole="button"
                accessibilityLabel={`${t("auth.otpDidntReceive")} ${t("auth.otpSMS")}`}
                accessibilityState={{ disabled: resending }}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text
                  style={[styles.resendButtonText, { color: Colors.primary }]}
                >
                  {t("auth.otpSMS")}
                </Text>
              </Pressable>
            </View>

            {resending && (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </View>
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sentToBlock: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.md * LineHeight.base,
  },
  phoneHighlight: {
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: 0.5,
    writingDirection: "ltr",
  },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  channelText: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.xs,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm + 2,
    marginBottom: Spacing.xxl,
    direction: "ltr",
  },
  otpBox: {
    width: 50,
    height: 58,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryXLight,
  },
  otpBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorSurface,
  },
  otpBoxSuccess: {
    borderColor: Colors.success,
    backgroundColor: Colors.successSurface,
  },
  otpInput: {
    fontFamily: Fonts.bold,
    fontSize: FontSize.xxl,
    color: Colors.text,
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
  otpInputSuccess: {
    color: Colors.success,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: FontSize.sm * LineHeight.base,
  },
  resendSection: {
    alignItems: "center",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 44,
  },
  countdownLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  countdownTimer: {
    fontFamily: Fonts.bold,
    fontSize: FontSize.md,
    color: Colors.primary,
    minWidth: 40,
    writingDirection: "ltr",
  },
  resendActions: {
    alignItems: "center",
  },
  didntReceiveText: {
    fontFamily: Fonts.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  resendButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  resendButtonText: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
  },
  resendDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
