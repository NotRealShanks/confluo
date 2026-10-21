import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createShareLink,
  exchangeShareToken,
  listShareLinks,
  revokeShareLink,
} from "./shareLinks";

describe("share link API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  function response(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 404 ? "Not Found" : "OK",
      json: vi.fn().mockResolvedValue(body),
    };
  }

  it("lists links for the encoded project", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(response([]) as unknown as Response);

    await listShareLinks("project/one");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/projects/project%2Fone/share-links",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("creates a link with its expiration", async () => {
    const fetchMock = vi.mocked(fetch);
    const link = { id: "link-1", status: "ACTIVE", token: "secret" };
    fetchMock.mockResolvedValue(response(link) as unknown as Response);

    await expect(createShareLink("project-1", "2030-01-01T23:59:59.000Z")).resolves.toEqual(link);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ expiresAt: "2030-01-01T23:59:59.000Z" }),
    });
  });

  it("revokes a link without treating the response as JSON", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(response(null, 204) as unknown as Response);

    await expect(revokeShareLink("project-1", "link-1")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });

  it("surfaces invalid-link responses from exchange", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(response({ message: "Share link is invalid or unavailable" }, 404) as unknown as Response);

    await expect(exchangeShareToken("bad-token")).rejects.toMatchObject({ status: 404 });
  });
});
