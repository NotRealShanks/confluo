import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, currentUserRequest, loginRequest, signupRequest } from "./api";
import type { User } from "./api";
import { AuthContext } from "./context";
import type { AuthContextValue, AuthStatus } from "./context";

const TOKEN_KEY = "confluo.auth.token";

function readToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [initialToken] = useState(token);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => token ? "loading" : "unauthenticated");
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // The in-memory session is still cleared if browser storage is unavailable.
    }
    setToken(null);
    setUser(null);
    setError(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    window.addEventListener("confluo:unauthorized", clearSession);
    return () => window.removeEventListener("confluo:unauthorized", clearSession);
  }, [clearSession]);

  const saveToken = useCallback((nextToken: string) => {
    try {
      window.sessionStorage.setItem(TOKEN_KEY, nextToken);
    } catch {
      throw new Error("The browser could not save this session. Check your privacy settings and try again.");
    }
    setToken(nextToken);
  }, []);

  const retrySession = useCallback(async () => {
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const restoredUser = await currentUserRequest(token);
      setUser(restoredUser);
      setStatus("authenticated");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        clearSession();
        return;
      }
      setError(cause instanceof Error ? cause.message : "Unable to restore your session.");
      setStatus("error");
    }
  }, [clearSession, token]);

  useEffect(() => {
    if (!initialToken) return;
    let active = true;
    void currentUserRequest(initialToken)
      .then((restoredUser) => {
        if (!active) return;
        setUser(restoredUser);
        setStatus("authenticated");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.status === 401) {
          clearSession();
          return;
        }
        setError(cause instanceof Error ? cause.message : "Unable to restore your session.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [clearSession, initialToken]);

  const completePasswordAuth = useCallback(async (request: Promise<{ token: string; user: User }>) => {
    setError(null);
    const result = await request;
    saveToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
  }, [saveToken]);

  const login = useCallback((email: string, password: string) =>
    completePasswordAuth(loginRequest(email, password)), [completePasswordAuth]);

  const signup = useCallback((name: string, email: string, password: string) =>
    completePasswordAuth(signupRequest(name, email, password)), [completePasswordAuth]);

  const acceptOAuthToken = useCallback(async (oauthToken: string) => {
    saveToken(oauthToken);
    setStatus("loading");
    setError(null);
    try {
      const oauthUser = await currentUserRequest(oauthToken);
      setUser(oauthUser);
      setStatus("authenticated");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        clearSession();
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to verify your account.");
        setStatus("error");
      }
      throw cause;
    }
  }, [clearSession, saveToken]);

  const value = useMemo<AuthContextValue>(() => ({
    token, user, status, error, login, signup, acceptOAuthToken, retrySession, logout: clearSession,
  }), [token, user, status, error, login, signup, acceptOAuthToken, retrySession, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
