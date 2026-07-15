/**
 * AnimatedCounter Component
 * Displays numbers with a smooth count-up animation.
 *
 * Renders a real <Text> (not an animated `text` prop, which only TextInput
 * supports) so the value always shows and aligns to the baseline next to
 * sibling labels. The count-up runs once per value change via requestAnimationFrame.
 */

import { LoyaltyTypography } from "@/src/constants/loyaltyTheme";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export default function AnimatedCounter({
  value,
  style,
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;

    if (from === to) {
      setDisplay(to);
      return;
    }

    const duration = 600;
    const start = Date.now();

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value]);

  return (
    <Text style={[styles.text, style]}>
      {prefix}
      {formatNumber(display)}
      {suffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...LoyaltyTypography.number,
  },
});
