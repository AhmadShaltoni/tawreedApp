import { openWhatsApp } from "@/src/utils/whatsapp";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface WhatsAppFABProps {
  /** Shrinks the button away (e.g. while the screen is scrolling). */
  hidden?: boolean;
}

export default function WhatsAppFAB({ hidden = false }: WhatsAppFABProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: hidden ? 0 : 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [hidden, scaleAnim]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={() => openWhatsApp()}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t("contact.openWhatsApp")}
      >
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    // `end` follows the reading direction: left edge in Arabic, right in English
    end: 16,
    zIndex: 999,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
