import Button from "@/src/components/ui/Button";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface LoginRequiredModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({
  visible,
  onClose,
}: LoginRequiredModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleGoToLogin = () => {
    onClose();
    router.push("/(auth)/login");
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
              <Ionicons name="log-in" size={48} color={Colors.primary} />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {t("auth.guestPromptTitle")}
            </Text>

            <Text style={styles.description}>
              {t("auth.guestPromptMessage")}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <Button
              title={t("auth.goToLogin")}
              onPress={handleGoToLogin}
              variant="accent"
            />
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    maxWidth: 320,
    width: "100%",
    ...Shadows.lg,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
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
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
  },
  actions: {
    gap: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
