import { View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { colors, fonts } from "@/theme";

/**
 * Vector school medallion used on the splash and login hero. A faithful stand-in
 * for the Dr. Lokmandas crest — drop the real crest PNG at assets/crest.png and
 * swap this out if you prefer the photographic emblem.
 */
export function Crest({ size = 96 }: { size?: number }) {
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#ffe14d" />
            <Stop offset="1" stopColor="#ffb800" />
          </LinearGradient>
        </Defs>
        {/* outer gold ring */}
        <Circle cx="50" cy="50" r="48" fill="url(#goldRing)" />
        <Circle cx="50" cy="50" r="41" fill={colors.navy} />
        <Circle cx="50" cy="50" r="41" fill="none" stroke="#ffd400" strokeWidth="1.5" />
        {/* globe meridians */}
        <G stroke="rgba(255,212,0,0.55)" strokeWidth="1" fill="none">
          <Circle cx="50" cy="50" r="26" />
          <Path d="M24 50 H76" />
          <Path d="M50 24 V76" />
          <Path d="M31 33 Q50 44 69 33" />
          <Path d="M31 67 Q50 56 69 67" />
          <Path d="M33 31 Q44 50 33 69" />
          <Path d="M67 31 Q56 50 67 69" />
        </G>
        {/* monogram */}
        <SvgText
          x="50"
          y="57"
          fontSize="22"
          fontFamily={fonts.display}
          fontWeight="800"
          fill="#ffd400"
          textAnchor="middle"
        >
          DL
        </SvgText>
      </Svg>
    </View>
  );
}
