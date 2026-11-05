import { apiFetch } from "./client";
import type { AuthResponse, User } from "./types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function confirmLogin(confirmationToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login/confirm", {
    method: "POST",
    body: JSON.stringify({ confirmationToken }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function updateProfile(name: string): Promise<User> {
  return apiFetch<User>("/api/users/me", { method: "PATCH", body: JSON.stringify({ name }) });
}

export function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "REVOKED" | "SUPERSEDED";
  current: boolean;
}

export function getSessions(): Promise<UserSession[]> {
  return apiFetch<UserSession[]>("/api/auth/sessions");
}

export function revokeSession(sessionId: string): Promise<void> {
  return apiFetch<void>(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export function revokeOtherSessions(): Promise<void> {
  return apiFetch<void>("/api/auth/sessions/other", {
    method: "DELETE",
  });
}
