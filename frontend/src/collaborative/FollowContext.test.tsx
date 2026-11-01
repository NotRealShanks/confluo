// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FollowProvider, useFollow } from "./FollowContext";
import { FollowingBanner } from "./FollowingBanner";

const mockOthers = [
  {
    connectionId: 1,
    id: "user-alice",
    info: { name: "Alice" },
    canWrite: true,
    presence: { activeFileId: "file-1", cursor: { x: 100, y: 500, fileId: "file-1" } },
  },
];

vi.mock("@liveblocks/react/suspense", () => ({
  useOthers: () => mockOthers,
}));

function TestFollowComponent() {
  const { followingUserId, startFollowing, stopFollowing } = useFollow();
  return (
    <div>
      <FollowingBanner />
      <span data-testid="status">{followingUserId || "idle"}</span>
      <button type="button" onClick={() => startFollowing("user-alice", "file-1")}>
        Follow Alice
      </button>
      <button type="button" onClick={stopFollowing}>
        Stop
      </button>
    </div>
  );
}

describe("FollowContext and FollowingBanner", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render FollowingBanner by default when idle", () => {
    render(
      <FollowProvider>
        <TestFollowComponent />
      </FollowProvider>,
    );

    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.queryByTestId("following-banner")).toBeNull();
  });

  it("renders FollowingBanner when following a user and clears on Unfollow click", () => {
    render(
      <FollowProvider>
        <TestFollowComponent />
      </FollowProvider>,
    );

    fireEvent.click(screen.getByText("Follow Alice"));

    expect(screen.getByTestId("status").textContent).toBe("user-alice");
    const banner = screen.getByTestId("following-banner");
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain("Following Alice");

    // Click Unfollow
    const unfollowBtn = screen.getByTestId("unfollow-button");
    fireEvent.click(unfollowBtn);

    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(screen.queryByTestId("following-banner")).toBeNull();
  });

  it("clears follow mode when Escape key is pressed", () => {
    render(
      <FollowProvider>
        <TestFollowComponent />
      </FollowProvider>,
    );

    fireEvent.click(screen.getByText("Follow Alice"));
    expect(screen.getByTestId("following-banner")).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("following-banner")).toBeNull();
  });
});
