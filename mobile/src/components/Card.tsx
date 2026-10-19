import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadow, spacing } from "@/theme";

interface Props extends ViewProps {
  /** Draw the signature gradient top edge (as on the site's portal cards). */
  accentTop?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ accentTop, padded = true, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: "hidden",
          padding: padded ? spacing.lg : 0,
        },
        shadow.card,
        style,
      ]}
    >
      {accentTop && (
        <LinearGradient
          colors={[colors.blue, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
          }}
        />
      )}
      {children}
    </View>
  );
}
