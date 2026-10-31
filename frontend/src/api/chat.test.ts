import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchChatMessage, fetchChatMessages, sendChatMessage } from "./chat";

afterEach(() => vi.unstubAllGlobals());

describe("chat API client", () => {
  it("fetches chat messages with pagination params", async () => {
    const mockPage = {
      messages: [{ id: "m1", message: "Hi", senderName: "Alice" }],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
      hasMore: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockPage), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchChatMessages("proj-1", 1, 20);
    expect(result.messages).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/projects/proj-1/chat/messages?page=1&size=20");
  });

  it("sends chat message with JSON body", async () => {
    const mockMessage = { id: "m2", message: "Hello", senderName: "Bob" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockMessage), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendChatMessage("proj-1", "Hello");
    expect(result.id).toBe("m2");
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.body).toBe(JSON.stringify({ message: "Hello" }));
  });

  it("fetches single message by ID", async () => {
    const mockMessage = { id: "m3", message: "Single", senderName: "Carol" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockMessage), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchChatMessage("proj-1", "m3");
    expect(result.id).toBe("m3");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/projects/proj-1/chat/messages/m3");
  });
});

