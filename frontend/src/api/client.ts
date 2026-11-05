import { clearToken, getToken, setToken } from "../auth/token";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type ErrorBody = {
  message?: string;
  detail?: string;
  fieldErrors?: Record<string, string>;
  conflict?: boolean;
  confirmationToken?: string;
  activeSession?: {
    deviceInfo?: string;
    ipAddress?: string;
    createdAt?: string;
    lastUsedAt?: string;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;
  readonly data?: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }
}

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let refreshPromise: Promise<string | null> | null = null;

export async function silentRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const csrf = getCsrfToken();
      const headers = new Headers({ "Content-Type": "application/json" });
      if (csrf) {
        headers.set("X-XSRF-TOKEN", csrf);
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        clearToken();
        return null;
      }

      const body = (await response.json()) as { token: string };
      setToken(body.token);
      return body.token;
    } catch {
      clearToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = accessToken ?? getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const csrf = getCsrfToken();
  if (csrf && !headers.has("X-XSRF-TOKEN")) {
    headers.set("X-XSRF-TOKEN", csrf);
  }

  // Let the browser add the multipart boundary for FormData requests.
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  // Attempt silent refresh on 401 if not already hitting auth endpoints
  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    const refreshedToken = await silentRefresh();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        headers,
      });
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      response.status,
      body.detail ?? body.message ?? response.statusText,
      body.fieldErrors ?? {},
      body as Record<string, unknown>,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// OAuth is a full-page redirect to the backend, not a fetch call
export function oauthUrl(provider: "google" | "github"): string {
  return `${API_URL}/oauth2/authorization/${provider}`;
}
