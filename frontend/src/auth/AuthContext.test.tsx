import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./context";
import { apiRequest, tokenFromOAuthFragment } from "./api";
import { OAuthCallbackPage } from "./AuthPages";

const tokenKey = "confluo.auth.token";
const user = {
  id: "user-1",
  email: "student@example.com",
  name: "Student",
  avatarUrl: null,
  provider: "local",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("restores a saved session through /api/users/me", async () => {
    window.sessionStorage.setItem(tokenKey, "valid-token");
    vi.mocked(fetch).mockResolvedValueOnce(response(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(user);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/users/me",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    const options = vi.mocked(fetch).mock.calls[0][1];
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer valid-token");
  });

  it("clears an expired session when the backend returns 401", async () => {
    window.sessionStorage.setItem(tokenKey, "expired-token");
    vi.mocked(fetch).mockResolvedValueOnce(response({ status: 401, message: "Unauthorized" }, 401));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(window.sessionStorage.getItem(tokenKey)).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("retains a session and offers retry when the server is unavailable", async () => {
    window.sessionStorage.setItem(tokenKey, "valid-token");
    vi.mocked(fetch).mockResolvedValueOnce(response({ message: "Service unavailable" }, 503));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(window.sessionStorage.getItem(tokenKey)).toBe("valid-token");
    expect(result.current.error).toContain("Service unavailable");
  });

  it("saves a successful login in the tab session and clears it on logout", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ token: "new-token", user }));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("student@example.com", "correct-password");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(user);
    expect(window.sessionStorage.getItem(tokenKey)).toBe("new-token");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/auth/login",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "student@example.com", password: "correct-password" }) }),
    );

    act(() => result.current.logout());
    expect(result.current.status).toBe("unauthenticated");
    expect(window.sessionStorage.getItem(tokenKey)).toBeNull();
  });

  it("signs up using the backend contract and stores the returned session", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ token: "signup-token", user: { ...user, provider: "local" } }));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup(" Student ", "student@example.com", "correct-password");
    });

    expect(result.current.status).toBe("authenticated");
    expect(window.sessionStorage.getItem(tokenKey)).toBe("signup-token");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/auth/signup",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: " Student ", email: "student@example.com", password: "correct-password" }) }),
    );
  });

  it("validates an OAuth callback token through /api/users/me", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response(user));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.acceptOAuthToken("oauth-token");
    });

    expect(result.current.status).toBe("authenticated");
    expect(window.sessionStorage.getItem(tokenKey)).toBe("oauth-token");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/users/me",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("reads the JWT from the OAuth URL fragment and handles a missing token", () => {
    expect(tokenFromOAuthFragment("#token=oauth.jwt.value")).toBe("oauth.jwt.value");
    expect(tokenFromOAuthFragment("#error=oauth_failed")).toBeNull();
  });

  it("consumes an OAuth callback token, removes it from the URL, and redirects on success", async () => {
    window.history.replaceState(null, "", "/oauth/callback#token=oauth-token");
    vi.mocked(fetch).mockResolvedValueOnce(response(user));

    render(
      <MemoryRouter initialEntries={["/oauth/callback"]}>
        <AuthProvider>
          <Routes>
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/" element={<p>Workspace</p>} />
            <Route path="/login" element={<p>Login form</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Workspace")).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(window.sessionStorage.getItem(tokenKey)).toBe("oauth-token");
  });

  it("sends an OAuth callback without a token back to login", async () => {
    window.history.replaceState(null, "", "/oauth/callback");

    render(
      <MemoryRouter initialEntries={["/oauth/callback"]}>
        <AuthProvider>
          <Routes>
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/login" element={<p>Login form</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login form")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not create a session when login is rejected", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ status: 401, message: "Invalid email or password" }, 401));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(result.current.login("student@example.com", "wrong-password"))
      .rejects.toThrow("Invalid email or password");
    expect(result.current.status).toBe("unauthenticated");
    expect(window.sessionStorage.getItem(tokenKey)).toBeNull();
  });

  it("clears an active session when a protected API request returns 401", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ token: "valid-token", user }))
      .mockResolvedValueOnce(response({ status: 401, message: "Unauthorized" }, 401));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => result.current.login("student@example.com", "correct-password"));

    await expect(apiRequest("/api/projects", { token: result.current.token ?? undefined }))
      .rejects.toThrow("Unauthorized");
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(window.sessionStorage.getItem(tokenKey)).toBeNull();
  });
});
