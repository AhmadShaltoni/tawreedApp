import {
    BorderRadius,
    Colors,
    FontSize,
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
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    phone: string;
    username: string;
    storeName: string;
    password: string;
    confirmPassword: string;
    channel: string;
    expiresIn: string;
  }>();

  const { otpVerifying, error, verificationToken, loading } = useAppSelector(
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
            router.replace("/location");
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

  const channelIcon =
    currentChannel === "whatsapp" ? "logo-whatsapp" : "chatbubble-outline";
  const channelColor =
    currentChannel === "whatsapp" ? "#25D366" : Colors.primary;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: Math.max(insets.bottom, Spacing.xxl),
          },
        ]}
      >
        {/* Back Button */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.header}
          >
            <Text style={styles.title}>{t("auth.otpVerification")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.otpSentTo")}{" "}
              <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
            </Text>

            {/* Channel Indicator */}
            <View
              style={[
                styles.channelBadge,
                { backgroundColor: `${channelColor}15` },
              ]}
            >
              <Ionicons
                name={channelIcon as any}
                size={16}
                color={channelColor}
              />
              <Text style={[styles.channelText, { color: channelColor }]}>
                {currentChannel === "whatsapp"
                  ? t("auth.otpViaWhatsApp")
                  : t("auth.otpViaSMS")}
              </Text>
            </View>
          </Animated.View>

          {/* OTP Inputs */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(250)}
            style={[styles.otpContainer, shakeStyle]}
          >
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
                    style={[
                      styles.otpInput,
                      verified && styles.otpInputSuccess,
                    ]}
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
                  />
                </View>
              );
            })}
          </Animated.View>

          {/* Verifying indicator */}
          {otpVerifying && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.verifyingContainer}
            >
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.verifyingText}>{t("auth.otpVerifying")}</Text>
            </Animated.View>
          )}

          {/* Success indicator */}
          {verified && !loading && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.verifyingContainer}
            >
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={Colors.success}
              />
              <Text style={[styles.verifyingText, { color: Colors.success }]}>
                {t("auth.otpVerified")}
              </Text>
            </Animated.View>
          )}

          {/* Registering indicator */}
          {verified && loading && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.verifyingContainer}
            >
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.verifyingText}>
                {t("auth.profileStartShopping")}
              </Text>
            </Animated.View>
          )}

          {/* Error */}
          {error && !otpVerifying && (
            <Animated.View entering={FadeInUp.duration(300)}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Resend Section */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            style={styles.resendSection}
          >
            {!canResend ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>
                  {t("auth.otpResendIn")}
                </Text>
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
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                    <Text
                      style={[styles.resendButtonText, { color: "#25D366" }]}
                    >
                      WhatsApp
                    </Text>
                  </Pressable>

                  <View style={styles.resendDivider} />

                  <Pressable
                    style={styles.resendButton}
                    onPress={() => handleResend("sms")}
                    disabled={resending}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={Colors.primary}
                    />
                    <Text
                      style={[
                        styles.resendButtonText,
                        { color: Colors.primary },
                      ]}
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
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginTop: -Spacing.xxxxl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl + Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  phoneHighlight: {
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: 0.5,
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
    fontSize: FontSize.xs,
    fontWeight: "600",
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
    backgroundColor: Colors.white,
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
    backgroundColor: "#fef2f2",
  },
  otpBoxSuccess: {
    borderColor: Colors.success,
    backgroundColor: "#f0fdf4",
  },
  otpInput: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
    width: "100%",
    height: "100%",
  },
  otpInputSuccess: {
    color: Colors.success,
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  verifyingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  resendSection: {
    alignItems: "center",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  countdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  countdownTimer: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primary,
    minWidth: 40,
  },
  resendActions: {
    alignItems: "center",
  },
  didntReceiveText: {
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
  },
  resendButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  resendDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
});
