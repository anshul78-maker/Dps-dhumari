import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as loginRequest, makeApi, type Api } from "@/api/endpoints";
import type { Role } from "@/api/types";
import { clearSession, loadSession, saveSession } from "./storage";

interface Session {
  token: string;
  name: string;
  role: Role;
}

interface AuthValue {
  session: Session | null;
  loading: boolean; // restoring persisted session on launch
  api: Api;
  signIn: (username: string, password: string) => Promise<Session>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    setSession(null);
    void clearSession();
  }, []);

  // Restore a persisted session on launch.
  useEffect(() => {
    (async () => {
      const stored = await loadSession();
      if (stored) {
        setSession({
          token: stored.token,
          name: stored.name,
          role: stored.role as Role,
        });
      }
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const res = await loginRequest(username.trim(), password);
      const next: Session = { token: res.token, name: res.name, role: res.role };
      setSession(next);
      await saveSession(next);
      return next;
    },
    []
  );

  const api = useMemo(
    () => makeApi(session?.token ?? null, signOut),
    [session?.token, signOut]
  );

  const value = useMemo<AuthValue>(
    () => ({ session, loading, api, signIn, signOut }),
    [session, loading, api, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Convenience: the token-bound API for the current session. */
export function useApi(): Api {
  return useAuth().api;
}
