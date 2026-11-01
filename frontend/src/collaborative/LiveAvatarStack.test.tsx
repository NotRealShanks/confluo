// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveAvatarStack } from "./LiveAvatarStack";

let mockOthers: Array<{
  connectionId: number;
  id: string;
  info: { name: string };
  canWrite: boolean;
  presence: { activeFileId?: string | null };
}> = [];

vi.mock("@liveblocks/react/suspense", () => ({
  useOthers: () => mockOthers,
}));

describe("LiveAvatarStack component", () => {
  afterEach(() => {
    cleanup();
    mockOthers = [];
  });

  it("renders null when no other collaborators are in the project (hides self)", () => {
    mockOthers = [];
    const { container } = render(<LiveAvatarStack />);
    expect(container.firstChild).toBeNull();
  });

  it("renders active collaborator avatars with online indicator and tooltip", () => {
    mockOthers = [
      {
        connectionId: 1,
        id: "other-1",
        info: { name: "Bob Jones" },
        canWrite: true,
        presence: { activeFileId: "file-2" },
      },
    ];

    render(<LiveAvatarStack />);

    const avatar = screen.getByTestId("avatar-other-1");
    expect(avatar).toBeDefined();
    expect(avatar.getAttribute("title")).toContain("Bob Jones");
    expect(avatar.getAttribute("title")).toContain("Editor");
    expect(screen.getByText("BJ")).toBeDefined();
  });

  it("displays overflow counter when collaborators exceed maxVisible and toggles dropdown", () => {
    mockOthers = [
      { connectionId: 1, id: "u-1", info: { name: "Bob" }, canWrite: true, presence: {} },
      { connectionId: 2, id: "u-2", info: { name: "Charlie" }, canWrite: false, presence: {} },
      { connectionId: 3, id: "u-3", info: { name: "Diana" }, canWrite: true, presence: {} },
      { connectionId: 4, id: "u-4", info: { name: "Evan" }, canWrite: true, presence: {} },
    ];

    render(<LiveAvatarStack maxVisible={2} />);

    // Total 4 collaborators, maxVisible=2 -> 2 overflow
    const overflowBtn = screen.getByTestId("avatar-overflow-button");
    expect(overflowBtn.textContent).toBe("+2");

    // Click to open dropdown
    fireEvent.click(overflowBtn);
    expect(screen.getByTestId("avatar-overflow-dropdown")).toBeDefined();
    expect(screen.getByText("Online Collaborators (4)")).toBeDefined();
  });

  it("triggers onSelectUser callback when an avatar is clicked", () => {
    const onSelect = vi.fn();
    mockOthers = [
      {
        connectionId: 1,
        id: "target-user",
        info: { name: "Bob" },
        canWrite: true,
        presence: { activeFileId: "file-xyz" },
      },
    ];

    render(<LiveAvatarStack onSelectUser={onSelect} />);

    fireEvent.click(screen.getByTestId("avatar-target-user"));
    expect(onSelect).toHaveBeenCalledWith("target-user", "file-xyz");
  });
});
