import Button from "@/src/components/ui/Button";
import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function NotificationPermissionModal({
  visible,
  onClose,
  onOpenSettings,
}: NotificationPermissionModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const handleOpenSettings = async () => {
    onOpenSettings();
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error(
        "[NotificationPermissionModal] Failed to open settings:",
        error,
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </Pressable>

          {/* Illustration */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="notifications" size={48} color={Colors.primary} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {t("notifications.permissionModal.title")}
            </Text>

            <Text style={styles.description}>
              {t("notifications.permissionModal.description")}
            </Text>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              <BenefitItem
                icon="gift"
                text={t("notifications.permissionModal.benefit1")}
              />
              <BenefitItem
                icon="trending-up"
                text={t("notifications.permissionModal.benefit2")}
              />
              <BenefitItem
                icon="flash"
                text={t("notifications.permissionModal.benefit3")}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <Button
              title={t("notifications.permissionModal.enableNow")}
              onPress={handleOpenSettings}
              variant="accent"
              style={styles.enableButton}
            />
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            {t("notifications.permissionModal.footer")}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

interface BenefitItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <View style={styles.benefit}>
      <Ionicons
        name={icon}
        size={20}
        color={Colors.primary}
        style={styles.benefitIcon}
      />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    ...Shadows.medium,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  benefitsList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  benefit: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  benefitIcon: {
    marginRight: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  benefitText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  enableButton: {
    marginTop: Spacing.sm,
  },
  footerNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
