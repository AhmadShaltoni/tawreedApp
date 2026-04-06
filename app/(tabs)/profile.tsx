import Button from "@/src/components/ui/Button";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { changeLanguage, getCurrentLanguage } from "@/src/localization/i18n";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { logout } from "@/src/store/slices/auth.slice";
import { notificationService } from "@/src/services/notification.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLanguageToggle = async () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    await changeLanguage(newLang);
    setCurrentLang(newLang);
    Alert.alert(
      newLang === "ar" ? "تغيير اللغة" : "Language Changed",
      newLang === "ar"
        ? "يرجى إعادة تشغيل التطبيق لتطبيق اتجاه RTL بالكامل"
        : "Please restart the app to fully apply RTL direction",
    );
  };

  const handleLogout = () => {
    Alert.alert(t("profile.signOutTitle"), t("profile.signOutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: async () => {
          // Unregister device token before logout
          try {
            await notificationService.unregisterToken();
          } catch (error) {
            console.error("[ProfileScreen] Failed to unregister token:", error);
            // Continue with logout even if token unregistration fails
          }
          dispatch(logout());
        },
      },
    ]);
  };

  const renderRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
  ) => (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {rightElement ?? (
        <View style={styles.rowRight}>
          {value ? (
            <Text style={styles.rowValue} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.textLight}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.primary} />
        </View>
        {isAuthenticated ? (
          <>
            <Text style={styles.name}>{user?.name ?? ""}</Text>
            <Text style={styles.email}>{user?.email ?? ""}</Text>
            {user?.businessName ? (
              <Text style={styles.business}>{user.businessName}</Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.name}>{t("profile.guestUser")}</Text>
            <Text style={styles.email}>{t("profile.loginForMore")}</Text>
          </>
        )}
      </View>

      {/* Personal Info Section */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.personalInfo")}</Text>
          {renderRow("person-outline", t("profile.name"), user?.name)}
          {renderRow("mail-outline", t("profile.email"), user?.email)}
          {user?.phone
            ? renderRow("call-outline", t("profile.phone"), user.phone)
            : null}
          {user?.businessName
            ? renderRow(
                "business-outline",
                t("profile.businessName"),
                user.businessName,
              )
            : null}
        </View>
      )}

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.settings")}</Text>
        {renderRow(
          "language-outline",
          t("profile.language"),
          undefined,
          undefined,
          <View style={styles.langSwitch}>
            <Text
              style={[
                styles.langLabel,
                currentLang === "en" && styles.langActive,
              ]}
            >
              EN
            </Text>
            <Switch
              value={currentLang === "ar"}
              onValueChange={handleLanguageToggle}
              trackColor={{
                false: Colors.border,
                true: Colors.primary + "50",
              }}
              thumbColor={
                currentLang === "ar" ? Colors.primary : Colors.textLight
              }
            />
            <Text
              style={[
                styles.langLabel,
                currentLang === "ar" && styles.langActive,
              ]}
            >
              ع
            </Text>
          </View>,
        )}
        {isAuthenticated &&
          renderRow(
            "notifications-outline",
            t("notifications.title"),
            undefined,
            () => router.push("/notifications"),
          )}
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.appInfo")}</Text>
        {renderRow("information-circle-outline", t("profile.version"), "1.0.0")}
      </View>

      {/* Auth Actions */}
      <View style={styles.actions}>
        {isAuthenticated ? (
          <Button
            title={t("profile.signOut")}
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        ) : (
          <Button
            title={t("auth.goToLogin")}
            onPress={() => router.push("/(auth)/login")}
            style={styles.logoutButton}
          />
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryXLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  business: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    maxWidth: "50%",
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  langSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  langLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textLight,
  },
  langActive: {
    color: Colors.primary,
  },
  actions: {
    padding: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  logoutButton: {
    width: "100%",
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
