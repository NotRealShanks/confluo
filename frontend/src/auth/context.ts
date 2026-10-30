import { createContext, useContext } from "react";
import type { User } from "./api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export type AuthContextValue = {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  acceptOAuthToken: (token: string) => Promise<void>;
  retrySession: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
