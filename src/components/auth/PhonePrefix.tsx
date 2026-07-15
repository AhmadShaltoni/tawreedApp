import { Colors, Fonts, FontSize, Spacing } from "@/src/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Jordan country-code prefix rendered inside the phone AuthInput. Kept LTR
 * so "+962" reads correctly in both languages.
 */
export default function PhonePrefix() {
  return (
    <View style={styles.container}>
      <Text style={styles.flag}>🇯🇴</Text>
      <Text style={styles.code}>+962</Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingStart: Spacing.lg,
  },
  flag: {
    fontSize: 18,
  },
  code: {
    fontFamily: Fonts.medium,
    fontSize: FontSize.sm,
    color: Colors.text,
    writingDirection: "ltr",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginStart: Spacing.sm,
  },
});
