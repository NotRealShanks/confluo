export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: string;
};

type AuthResponse = {
  token: string;
  user: User;
};

type ApiErrorBody = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

export async function apiRequest<T>(
  path: string,
  options: { method?: string; token?: string; body?: unknown } = {},
): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  }

  const data = response.status === 204
    ? undefined
    : await response.json().catch(() => undefined) as ApiErrorBody | undefined;

  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("confluo:unauthorized"));
  }

  if (!response.ok) {
    const body = data as ApiErrorBody | undefined;
    throw new ApiError(
      body?.message || `Request failed (${response.status}). Please try again.`,
      response.status,
      body?.fieldErrors ?? {},
    );
  }

  return data as T;
}

export function loginRequest(email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function signupRequest(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
}

export function currentUserRequest(token: string) {
  return apiRequest<User>("/api/users/me", { token });
}

export function oauthStartUrl(provider: "google" | "github") {
  return `${apiBaseUrl}/oauth2/authorization/${provider}`;
}

export function tokenFromOAuthFragment(fragment: string) {
  return new URLSearchParams(fragment.replace(/^#/, "")).get("token");
}
