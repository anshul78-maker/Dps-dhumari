import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing } from "@/theme";
import { Text } from "./Text";

interface Props extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  password?: boolean;
  error?: string | null;
}

/** Labelled input with a leading icon and an optional password reveal toggle. */
export function Field({ label, icon, password, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!password);

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={styles.label} color={colors.ink}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          !!error && styles.boxError,
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={18} color={colors.muted} style={styles.icon} />
        )}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
        />
        {password && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={19}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text variant="small" color={colors.red}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.field,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  boxFocused: { borderColor: colors.blue, backgroundColor: "#fbfcff" },
  boxError: { borderColor: colors.red },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15.5,
    color: colors.ink,
    paddingVertical: 0,
  },
});
