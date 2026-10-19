import { router } from "expo-router";
import { useAuth } from "@/auth/AuthContext";
import { HeaderButton } from "./HeaderButton";

/** Header sign-out control: clears the session and returns to login. */
export function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <HeaderButton
      icon="log-out-outline"
      label="Sign out"
      onPress={() => {
        signOut();
        router.replace("/login");
      }}
    />
  );
}
