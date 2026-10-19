import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useAuth } from "@/auth/AuthContext";
import { colors, fonts } from "@/theme";

export default function StudentLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (session.role !== "student") return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marks"
        options={{
          title: "Marks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: "Work",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: "Fees",
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: "Notices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="megaphone" size={size} color={color} />
          ),
        }}
      />
      {/* Reachable from Home, hidden from the tab bar */}
      <Tabs.Screen name="documents" options={{ href: null }} />
    </Tabs>
  );
}
