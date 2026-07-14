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
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

interface UpdateModalProps {
  visible: boolean;
  /** When true the modal cannot be dismissed (force update) */
  forced: boolean;
  /** Popup message from the backend (admin-configurable) */
  message: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function UpdateModal({
  visible,
  forced,
  message,
  onUpdate,
  onDismiss,
}: UpdateModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android back button: dismiss only when the update is optional
      onRequestClose={forced ? () => {} : onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
          {/* Close button — optional updates only */}
          {!forced && (
            <Pressable style={styles.closeButton} onPress={onDismiss}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          )}

          {/* Illustration */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons
                name="cloud-download"
                size={48}
                color={Colors.primary}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{t("update.title")}</Text>
            <Text style={styles.description}>
              {message || t("update.description")}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title={t("update.updateNow")} onPress={onUpdate} />
            {!forced && (
              <Button
                title={t("update.later")}
                onPress={onDismiss}
                variant="ghost"
              />
            )}
          </View>

          {forced && (
            <Text style={styles.footerNote}>{t("update.requiredNote")}</Text>
          )}
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
    ...Shadows.md,
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
    lineHeight: 20,
  },
  actions: {
    gap: Spacing.sm,
  },
  footerNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
