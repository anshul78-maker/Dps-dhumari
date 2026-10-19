import { View } from "react-native";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors } from "@/theme";

/** Entry point: route to the right place once the session is known. */
export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;

  switch (session.role) {
    case "student":
      return <Redirect href="/(student)" />;
    case "teacher":
      return <Redirect href="/(teacher)" />;
    case "accountant":
      return <Redirect href="/(accountant)" />;
    default:
      // admin (or anything else) has no mobile portal yet.
      return <Redirect href="/login" />;
  }
}
