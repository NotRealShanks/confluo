import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProjectActivities } from "./activity";

afterEach(() => vi.unstubAllGlobals());

describe("activity API client", () => {
  it("fetches project activities with pagination params", async () => {
    const mockPage = {
      activities: [
        {
          id: "a1",
          projectId: "proj-1",
          actorId: "u1",
          actorName: "Alice",
          actionType: "MEMBER_INVITED",
          targetUserId: "u2",
          targetUserName: "Bob",
          metadata: { role: "EDITOR" },
          timestamp: "2026-11-01T10:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasMore: false,
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockPage), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProjectActivities("proj-1", 0, 20);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].actionType).toBe("MEMBER_INVITED");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/projects/proj-1/activity?page=0&size=20");
  });
});

