import type { Notice } from "@/src/types";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { NoticeCard } from "./NoticeCard";

interface NoticeCarouselProps {
  notices: Notice[];
  currentIndex: number;
  onNextNotice: () => void;
}

const ROTATION_INTERVAL = 10000; // 10 seconds
const FADE_DURATION = 300; // 300ms

export function NoticeCarousel({
  notices,
  currentIndex,
  onNextNotice,
}: NoticeCarouselProps) {
  const opacityRef = useRef(new Animated.Value(1));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle rotation with fade animation
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }

    // If no notices or only one notice, don't set timer
    if (notices.length <= 1) {
      // For single notice, reset opacity to full (no animation)
      opacityRef.current.setValue(1);
      return;
    }

    // Set new timer only if more than one notice
    timerRef.current = setInterval(() => {
      // Fade out
      Animated.timing(opacityRef.current, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Rotate to next notice
        onNextNotice();

        // Fade in
        Animated.timing(opacityRef.current, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATION_INTERVAL);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [notices.length, onNextNotice]);

  // If no notices, return null
  if (notices.length === 0) {
    return null;
  }

  // Get current notice
  const currentNotice = notices[currentIndex];

  return <NoticeCard notice={currentNotice} opacity={opacityRef.current} />;
}
