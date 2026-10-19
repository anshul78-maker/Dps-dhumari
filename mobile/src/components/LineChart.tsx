import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import { colors, fonts } from "@/theme";
import { Text } from "./Text";

interface Point {
  label: string;
  value: number;
}

interface Props {
  data: Point[];
  height?: number;
}

/**
 * Marks-growth line chart (% across the year's exams). Self-measures width so
 * it fills whatever card it sits in. Area fill + smooth line + value dots.
 */
export function LineChart({ data, height = 180 }: Props) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View onLayout={onLayout} style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text variant="small">No exam data yet.</Text>
      </View>
    );
  }

  const padX = 14;
  const padTop = 16;
  const padBottom = 28;
  const w = Math.max(width, 1);
  const innerW = Math.max(w - padX * 2, 1);
  const innerH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const maxV = Math.max(100, ...values);
  const minV = Math.min(0, ...values);
  const range = maxV - minV || 1;

  const x = (i: number) =>
    padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padTop + innerH - ((v - minV) / range) * innerH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padTop + innerH).toFixed(1)}` +
    ` L ${x(0).toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  // horizontal gridlines at 0 / 50 / 100
  const gridValues = [0, 50, 100].filter((g) => g >= minV && g <= maxV);

  return (
    <View onLayout={onLayout} style={{ width: "100%" }}>
      {width > 0 && (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.gold} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {gridValues.map((g) => (
            <SvgLine
              key={g}
              x1={padX}
              x2={w - padX}
              y1={y(g)}
              y2={y(g)}
              stroke={colors.line}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          ))}

          <Path d={areaPath} fill="url(#area)" />
          <Path
            d={linePath}
            stroke={colors.navy}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((d, i) => (
            <Circle
              key={i}
              cx={x(i)}
              cy={y(d.value)}
              r={4.5}
              fill={colors.white}
              stroke={colors.navy}
              strokeWidth={2.5}
            />
          ))}

          {data.map((d, i) => (
            <SvgText
              key={`l${i}`}
              x={x(i)}
              y={height - 8}
              fontSize={10}
              fontFamily={fonts.bodyMedium}
              fill={colors.muted}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            >
              {shortLabel(d.label)}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

/** "Unit Test 1" -> "UT1", "Mid Term" -> "Mid", else first 6 chars. */
function shortLabel(label: string): string {
  const m = label.match(/\b([A-Za-z])[a-z]*\s*(\d+)?/g);
  if (/unit test/i.test(label)) {
    const n = label.match(/\d+/)?.[0] ?? "";
    return `UT${n}`;
  }
  const words = label.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 6);
  return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
}
