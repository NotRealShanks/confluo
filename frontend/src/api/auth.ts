import { apiFetch } from "./client";
import type { AuthResponse, User } from "./types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
