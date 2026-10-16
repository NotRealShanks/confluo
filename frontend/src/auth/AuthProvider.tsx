import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiFetch } from "../api/client";
import type { User } from "../api/types";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./context";
import { clearToken, getToken, setToken } from "./token";

// Returns null when signed out; only an explicit 401 discards the stored token
async function fetchCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/api/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? "loading" : "anonymous"));

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void fetchCurrentUser().then((current) => {
      if (cancelled) return;
      setUser(current);
      setStatus(current ? "authenticated" : "anonymous");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (token: string) => {
    setToken(token);
    setStatus("loading");
    const current = await fetchCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "anonymous");
    return current !== null;
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
