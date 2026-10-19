import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => void;
}

/**
 * Run an async loader on mount, exposing loading / error / pull-to-refresh.
 * `deps` re-runs the loader when they change.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (mode: "load" | "refresh") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    refreshing,
    error,
    reload: () => run("load"),
    refresh: () => run("refresh"),
  };
}
