import { getToken } from "../auth/token";

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type ErrorBody = { message?: string; fieldErrors?: Record<string, string> };

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    // 401s from the filter chain have an empty body, so parsing is best-effort
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(response.status, body.message ?? response.statusText, body.fieldErrors);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

// OAuth is a full-page redirect to the backend, not an fetch call
export function oauthUrl(provider: "google" | "github"): string {
  return `${API_URL}/oauth2/authorization/${provider}`;
}
