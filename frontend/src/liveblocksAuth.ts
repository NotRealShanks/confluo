import { ApiError, apiFetch } from "./api/client";

type TokenResponse = { token: string };

// Asks the backend for a token scoped to this project's room; the backend decides the permissions
export function makeAuthEndpoint(projectId: string) {
  return async () => {
    try {
      return await apiFetch<TokenResponse>("/api/liveblocks/auth", {
        method: "POST",
        body: JSON.stringify({ room: projectId }),
      });
    } catch (error) {
      // Access problems are final; anything else may be transient, so let the client retry
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        return { error: "forbidden", reason: error.message };
      }
      throw error;
    }
  };
}
