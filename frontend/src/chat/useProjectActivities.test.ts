// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useProjectActivities } from "./useProjectActivities";
import * as activityApi from "../api/activity";

describe("useProjectActivities hook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockActivities: activityApi.ProjectActivity[] = [
    {
      id: "act-1",
      projectId: "proj-1",
      actorId: "u1",
      actorName: "Alice",
      actionType: "MEMBER_INVITED",
      targetUserId: "u2",
      targetUserName: "Bob",
      metadata: { role: "EDITOR" },
      timestamp: "2026-11-01T10:00:00Z",
    },
  ];

  it("loads initial page of activities", async () => {
    vi.spyOn(activityApi, "fetchProjectActivities").mockResolvedValue({
      activities: mockActivities,
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasMore: false,
    });

    const { result } = renderHook(() => useProjectActivities({ projectId: "proj-1" }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("supports loadMore pagination", async () => {
    vi.spyOn(activityApi, "fetchProjectActivities")
      .mockResolvedValueOnce({
        activities: [mockActivities[0]],
        page: 0,
        size: 1,
        totalElements: 2,
        totalPages: 2,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        activities: [
          {
            id: "act-2",
            projectId: "proj-1",
            actorId: "u2",
            actorName: "Bob",
            actionType: "MEMBER_JOINED",
            targetUserId: null,
            targetUserName: null,
            metadata: null,
            timestamp: "2026-11-01T10:05:00Z",
          },
        ],
        page: 1,
        size: 1,
        totalElements: 2,
        totalPages: 2,
        hasMore: false,
      });

    const { result } = renderHook(() => useProjectActivities({ projectId: "proj-1" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.activities).toHaveLength(1);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.activities).toHaveLength(2);
    expect(result.current.activities[1].actionType).toBe("MEMBER_JOINED");
    expect(result.current.hasMore).toBe(false);
  });

  it("handles fetch errors gracefully", async () => {
    vi.spyOn(activityApi, "fetchProjectActivities").mockRejectedValue(
      new Error("Network failure"),
    );

    const { result } = renderHook(() => useProjectActivities({ projectId: "proj-1" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network failure");
    expect(result.current.activities).toEqual([]);
  });
});

