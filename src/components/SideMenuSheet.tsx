import {
    BorderRadius,
    Colors,
    FontSize,
    Shadows,
    Spacing,
} from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONTACT = {
  phone: "0798336958",
  email: "mr_shaltoni@icloud.com",
  facebook: "https://www.facebook.com/profile.php?id=61572922246679",
  instagram: "https://www.instagram.com/tawreedjo/",
};

interface SideMenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SideMenuSheet({
  visible,
  onClose,
}: SideMenuSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, slideAnim, backdropAnim]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const navigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path as never), 250);
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={styles.backdropPress} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Rewards */}
            <Pressable
              style={styles.rewardsCard}
              onPress={() => navigate("/loyalty")}
            >
              <View style={styles.rewardsLeft}>
                <View style={styles.rewardsIcon}>
                  <Ionicons name="trophy" size={24} color={Colors.warning} />
                </View>
                <View>
                  <Text style={styles.rewardsTitle}>{t("menu.rewards")}</Text>
                  <Text style={styles.rewardsSub}>{t("menu.rewardsSub")}</Text>
                </View>
              </View>
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.textLight}
              />
            </Pressable>

            {/* Contact us */}
            <Text style={styles.sectionTitle}>{t("menu.contactUs")}</Text>
            <View style={styles.card}>
              <ContactRow
                icon="call"
                color="#22c55e"
                label={CONTACT.phone}
                onPress={() => openLink(`tel:${CONTACT.phone}`)}
              />
              <ContactRow
                icon="mail"
                color={Colors.primary}
                label={CONTACT.email}
                onPress={() => openLink(`mailto:${CONTACT.email}`)}
              />
              <ContactRow
                icon="logo-facebook"
                color="#1877f2"
                label="Facebook"
                onPress={() => openLink(CONTACT.facebook)}
              />
              <ContactRow
                icon="logo-instagram"
                color="#e1306c"
                label="Instagram"
                onPress={() => openLink(CONTACT.instagram)}
                isLast
              />
            </View>

            {/* Terms */}
            <Pressable style={styles.row} onPress={() => navigate("/terms")}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={Colors.textSecondary}
                />
                <Text style={styles.rowLabel}>{t("menu.terms")}</Text>
              </View>
              <Ionicons
                name="chevron-back"
                size={20}
                color={Colors.textLight}
              />
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ContactRow({
  icon,
  color,
  label,
  onPress,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={[styles.contactRow, isLast && styles.contactRowLast]}
      onPress={onPress}
    >
      <View style={[styles.contactIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.contactLabel} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="open-outline" size={18} color={Colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdropPress: { flex: 1 },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Shadows.lg,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  rewardsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.warning + "12",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  rewardsLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  rewardsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  rewardsSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactRowLast: { borderBottomWidth: 0 },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  rowLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: "600" },
});
