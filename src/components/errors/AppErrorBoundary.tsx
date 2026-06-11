import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { openWhatsApp } from "@/src/utils/whatsapp";
import { Ionicons } from "@expo/vector-icons";
import React, { Component, ErrorInfo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WHATSAPP_GREEN = "#25D366";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Global Error Boundary - catches unhandled JS errors
 * Shows a beautiful crash screen with retry and WhatsApp contact
 */
export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleWhatsApp = () => {
    const { error } = this.state;
    const message = error
      ? `مرحباً، واجهت مشكلة في التطبيق:\n${error.name}: ${error.message}`
      : "مرحباً، واجهت مشكلة في التطبيق";
    openWhatsApp(message);
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Background decoration */}
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />

          {/* Crash icon */}
          <View style={styles.iconArea}>
            <View style={styles.outerGlow} />
            <View style={styles.iconCircle}>
              <Ionicons name="skull-outline" size={44} color={Colors.white} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>عُذراً! حدث خطأ غير متوقع</Text>
          <Text style={styles.subtitle}>
            حدث خطأ تقني في التطبيق. يمكنك إعادة المحاولة أو التواصل معنا لإصلاح
            المشكلة.
          </Text>

          {/* Error details toggle */}
          {error && (
            <Pressable
              onPress={this.toggleDetails}
              style={styles.detailsToggle}
            >
              <Ionicons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.detailsToggleText}>
                {showDetails ? "إخفاء التفاصيل" : "عرض تفاصيل الخطأ"}
              </Text>
            </Pressable>
          )}

          {showDetails && error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorName}>{error.name}</Text>
              <Text style={styles.errorMessage}>{error.message}</Text>
              {errorInfo?.componentStack && (
                <Text style={styles.errorStack} numberOfLines={8}>
                  {errorInfo.componentStack.trim()}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsArea}>
            {/* Retry button */}
            <Pressable
              onPress={this.handleRetry}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryPressed,
              ]}
            >
              <Ionicons name="refresh" size={22} color={Colors.white} />
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </Pressable>

            {/* WhatsApp button */}
            <Pressable
              onPress={this.handleWhatsApp}
              style={({ pressed }) => [
                styles.whatsappButton,
                pressed && styles.whatsappPressed,
              ]}
            >
              <View style={styles.whatsappContent}>
                <View style={styles.whatsappIcon}>
                  <Ionicons
                    name="logo-whatsapp"
                    size={24}
                    color={Colors.white}
                  />
                </View>
                <View style={styles.whatsappTextArea}>
                  <Text style={styles.whatsappTitle}>
                    تواصل معنا عبر واتساب
                  </Text>
                  <Text style={styles.whatsappSubtitle}>
                    أخبرنا بالمشكلة وسنقوم بحلها فوراً
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={WHATSAPP_GREEN}
                />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxxl,
  },
  bgCircle1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -60,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(99,102,241,0.04)",
  },
  iconArea: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxl,
  },
  outerGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  detailsToggleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  errorCard: {
    backgroundColor: "rgba(239,68,68,0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.1)",
  },
  errorName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  errorStack: {
    fontSize: FontSize.xxs,
    color: Colors.textLight,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  actionsArea: {
    width: "100%",
    gap: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.md,
  },
  retryPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  retryText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  whatsappButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: WHATSAPP_GREEN,
    ...Shadows.sm,
  },
  whatsappPressed: {
    backgroundColor: "rgba(37,211,102,0.05)",
    transform: [{ scale: 0.98 }],
  },
  whatsappContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  whatsappIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WHATSAPP_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: Spacing.md,
  },
  whatsappTextArea: {
    flex: 1,
  },
  whatsappTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  whatsappSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
