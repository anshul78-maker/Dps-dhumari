/**
 * Persist the signed-in session. Uses expo-secure-store on device (encrypted)
 * and falls back to localStorage on web (where SecureStore isn't available).
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "lokmandas.session";

export interface StoredSession {
  token: string;
  name: string;
  role: string;
}

export async function saveSession(s: StoredSession): Promise<void> {
  const value = JSON.stringify(s);
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(KEY, value);
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      raw = globalThis.localStorage?.getItem(KEY) ?? null;
    } else {
      raw = await SecureStore.getItemAsync(KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.role) return parsed as StoredSession;
    return null;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
