import type { Notice } from "@/src/types";
import { Animated, Text, View } from "react-native";

interface NoticeCardProps {
  notice: Notice;
  opacity: Animated.Value;
}

export function NoticeCard({ notice, opacity }: NoticeCardProps) {
  return (
    <Animated.View style={{ opacity }}>
      <View
        style={{
          backgroundColor: notice.backgroundColor,
          paddingHorizontal: 12,
          paddingVertical: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            color: notice.textColor,
            fontSize: 14,
            fontWeight: "500",
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          {notice.text}
        </Text>
      </View>
    </Animated.View>
  );
}
