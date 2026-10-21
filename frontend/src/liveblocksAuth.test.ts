import { describe, expect, it, vi } from "vitest";
import { makeAuthEndpoint } from "./liveblocksAuth";

describe("Liveblocks guest authorization", () => {
  it("sends the guest session token and requested room", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ token: "read-only-token" }),
    }));

    const result = await makeAuthEndpoint("project-1", "guest-session")();
    expect(result).toEqual({ token: "read-only-token" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/liveblocks/auth",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ room: "project-1" }),
      }),
    );
  });

  it("returns a forbidden result for revoked or invalid guest sessions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: vi.fn().mockResolvedValue({ message: "Unauthorized" }),
    }));

    await expect(makeAuthEndpoint("project-1", "revoked-session")())
      .resolves.toEqual({ error: "forbidden", reason: "Unauthorized" });
  });
});
