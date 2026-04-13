import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

const WHATSAPP_NUMBER = "962798336958";
const DEFAULT_MESSAGE = "مرحبا";

export default function WhatsAppFAB() {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = async () => {
    const encoded = encodeURIComponent(DEFAULT_MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
    }
  };

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
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
    right: 16,
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
