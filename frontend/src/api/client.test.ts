import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch request bodies", () => {
  it("leaves multipart content type and boundary to the browser", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ assetId: "asset" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = new FormData();
    body.append("file", new Blob(["%PDF-1.7"], { type: "application/pdf" }), "file.pdf");

    await apiFetch("/api/assets", { method: "POST", body });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(request.headers).has("Content-Type")).toBe(false);
    expect(request.body).toBe(body);
  });

  it("keeps JSON content type for JSON bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/api/data", { method: "POST", body: JSON.stringify({ value: 1 }) });

    expect(new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).get("Content-Type")).toBe("application/json");
  });
});
