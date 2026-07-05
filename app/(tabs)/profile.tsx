import Button from "@/src/components/ui/Button";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { changeLanguage, getCurrentLanguage } from "@/src/localization/i18n";
import { notificationService } from "@/src/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { deleteAccount, logout } from "@/src/store/slices/auth.slice";
import { fetchBalance } from "@/src/store/slices/loyalty.slice";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
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
  const { user, isAuthenticated, deletingAccount } = useAppSelector(
    (state) => state.auth,
  );
  const { balance, balanceLoading } = useAppSelector((state) => state.loyalty);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  // Fetch loyalty balance when screen is focused (for authenticated users)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        dispatch(fetchBalance());
      }
    }, [dispatch, isAuthenticated]),
  );

  const handleLanguageToggle = async () => {
    const newLang = currentLang === "ar" ? "en" : "ar";
    setCurrentLang(newLang);
    // Applies the new layout direction and reloads the app automatically
    await changeLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(t("profile.signOutTitle"), t("profile.signOutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.signOut"),
        style: "destructive",
        onPress: () => {
          // Fire and forget — don't block logout on network call
          notificationService.unregisterToken().catch(() => {});
          dispatch(logout()).then(() => {
            router.replace("/(auth)/login");
          });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccountTitle"),
      t("profile.deleteAccountMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccount"),
          style: "destructive",
          onPress: () => {
            dispatch(deleteAccount())
              .unwrap()
              .then(() => {
                Alert.alert("", t("profile.deleteAccountSuccess"));
                router.replace("/(auth)/login");
              })
              .catch((error: string) => {
                Alert.alert(t("common.error"), error);
              });
          },
        },
      ],
    );
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

      {/* Loyalty Points Card */}
      {isAuthenticated && (
        <Pressable
          style={styles.loyaltyCard}
          onPress={() => router.push("/loyalty")}
        >
          <View style={styles.loyaltyCardContent}>
            <View style={styles.loyaltyLeft}>
              <Ionicons name="trophy" size={28} color={Colors.warning} />
              <View style={styles.loyaltyInfo}>
                <Text style={styles.loyaltyTitle}>{t("loyalty.title")}</Text>
                {balanceLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : balance && balance.currentBalance != null ? (
                  <Text style={styles.loyaltyBalance}>
                    {balance.currentBalance.toLocaleString()}{" "}
                    {t("loyalty.points")}
                  </Text>
                ) : (
                  <Text style={styles.loyaltyBalance}>
                    {t("loyalty.viewAll")}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textLight}
            />
          </View>
        </Pressable>
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
          <>
            <Button
              title={t("profile.signOut")}
              onPress={handleLogout}
              variant="outline"
              style={styles.logoutButton}
            />
            <Pressable
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Colors.error}
                  />
                  <Text style={styles.deleteAccountText}>
                    {t("profile.deleteAccount")}
                  </Text>
                </>
              )}
            </Pressable>
          </>
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
  loyaltyCard: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  loyaltyCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loyaltyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  loyaltyInfo: {
    flex: 1,
  },
  loyaltyTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  loyaltyBalance: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
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
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
  },
  deleteAccountText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});
