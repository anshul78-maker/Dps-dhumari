import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors, fonts } from "@/theme";
import { Text } from "./Text";

interface Props {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  caption?: string;
  trackColor?: string;
}

/** Circular progress dial — used for the attendance %. */
export function ProgressRing({
  value,
  size = 128,
  stroke = 12,
  caption,
  trackColor = colors.line,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.gold} />
          </LinearGradient>
        </Defs>
        <Circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke="url(#ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.display, fontSize: size * 0.26 }} color={colors.ink}>
          {Math.round(clamped)}%
        </Text>
        {caption && (
          <Text variant="small" color={colors.muted}>
            {caption}
          </Text>
        )}
      </View>
    </View>
  );
}
