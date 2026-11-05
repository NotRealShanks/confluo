import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { logout as apiLogout } from "../api/auth";
import { ApiError, API_URL, apiFetch, setCsrfToken, silentRefresh } from "../api/client";
import type { User } from "../api/types";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./context";
import { clearToken, getToken, setToken } from "./token";
import { AlertTriangle, LogIn } from "lucide-react";

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
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [sessionEndedReason, setSessionEndedReason] = useState<string | null>(null);

  // Initialize session on mount via silent refresh
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      // First check if a token is already present or attempt silent refresh from cookie
      let token = getToken();
      if (!token) {
        token = await silentRefresh();
      }

      if (cancelled) return;

      if (!token) {
        setStatus("anonymous");
        return;
      }

      const current = await fetchCurrentUser();
      if (cancelled) return;

      setUser(current);
      setStatus(current ? "authenticated" : "anonymous");
    }

    void initSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for displaced session events via SSE
  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    const token = getToken();
    if (!token) return;

    const eventSource = new EventSource(
      `${API_URL}/api/auth/events/session?token=${encodeURIComponent(token)}`,
      { withCredentials: true },
    );

    eventSource.addEventListener("SESSION_TERMINATED", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { reason?: string };
        setSessionEndedReason(payload.reason ?? "Another device signed in to your account");
      } catch {
        setSessionEndedReason("Your session was terminated on another device.");
      }
      clearToken();
      setUser(null);
      setStatus("anonymous");
      eventSource.close();
    });

    eventSource.onerror = () => {
      // EventSource automatically retries on network blips
    };

    return () => {
      eventSource.close();
    };
  }, [status, user]);

  const signIn = useCallback(async (token: string) => {
    setToken(token);
    setSessionEndedReason(null);
    setStatus("loading");
    const current = await fetchCurrentUser();
    setUser(current);
    setStatus(current ? "authenticated" : "anonymous");
    return current !== null;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Best-effort logout
    }
    clearToken();
    setCsrfToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const updateUser = useCallback((updated: User) => setUser(updated), []);
  const clearSessionEndedReason = useCallback(() => setSessionEndedReason(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      sessionEndedReason,
      clearSessionEndedReason,
      signIn,
      signOut,
      updateUser,
    }),
    [status, user, sessionEndedReason, clearSessionEndedReason, signIn, signOut, updateUser],
  );

  return (
    <AuthContext value={value}>
      {children}
      {sessionEndedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-[#18181b] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h2 className="text-lg font-semibold text-white">Session Terminated</h2>
            </div>
            <p className="font-mono text-xs text-zinc-300 leading-relaxed mb-6">
              {sessionEndedReason}
            </p>
            <div className="flex justify-end">
              <button
                onClick={clearSessionEndedReason}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-zinc-200 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext>
  );
}
