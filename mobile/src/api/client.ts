/**
 * Thin fetch client for the Dr. Lokmandas ERP backend.
 *
 * The token (returned by POST /api/login) is sent in the Authorization header
 * on every request — never in the URL, matching the backend's contract.
 */
import Constants from "expo-constants";

/** Resolve the API base URL from env, with sensible dev fallbacks. */
function resolveBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  // Fallback: derive the dev machine's host from the Expo packager URL so a
  // phone on the same Wi-Fi can reach the Express server at :3000.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as any)?.debuggerHost ||
    "";
  const host = hostUri.split(":")[0];
  if (host) return `http://${host}:3000`;
  return "http://localhost:3000";
}

export const API_BASE = resolveBase();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  /** Called on a 401 so the app can sign the user out. */
  onUnauthorized?: () => void;
};

export async function apiRequest<T = any>(
  path: string,
  { method = "GET", body, token, onUnauthorized }: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Can't reach the school server. Check your connection and that the ERP is running at ${API_BASE}.`,
      0
    );
  }

  if (res.status === 401 && onUnauthorized) onUnauthorized();

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON (e.g. an HTML error page) — surface a generic message.
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      (res.status === 0
        ? "Network error"
        : `Something went wrong (${res.status}).`);
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/** Full URL for an authenticated file endpoint (fetched with the token). */
export function fileUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
