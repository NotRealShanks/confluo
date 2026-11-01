// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilePresenceBadge } from "./FilePresenceBadge";

let mockOthers: Array<{
  connectionId: number;
  id: string;
  info: { name: string };
  presence: { activeFileId?: string | null };
}> = [];

vi.mock("@liveblocks/react/suspense", () => ({
  useOthers: () => mockOthers,
}));

describe("FilePresenceBadge component", () => {
  afterEach(() => {
    cleanup();
    mockOthers = [];
  });

  it("renders null when no collaborators are viewing the file", () => {
    mockOthers = [
      {
        connectionId: 1,
        id: "user-1",
        info: { name: "Alice" },
        presence: { activeFileId: "other-file" },
      },
    ];

    const { container } = render(<FilePresenceBadge fileId="target-file" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a collaborator avatar with initials and tooltip when viewing the file", () => {
    mockOthers = [
      {
        connectionId: 1,
        id: "user-1",
        info: { name: "Alice Smith" },
        presence: { activeFileId: "target-file" },
      },
    ];

    render(<FilePresenceBadge fileId="target-file" />);

    const badge = screen.getByTestId("file-presence-badge");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("title")).toBe("Alice Smith is viewing this file");
    expect(screen.getByText("AS")).toBeDefined();
  });

  it("renders multiple collaborators in a group", () => {
    mockOthers = [
      {
        connectionId: 1,
        id: "user-1",
        info: { name: "Alice" },
        presence: { activeFileId: "target-file" },
      },
      {
        connectionId: 2,
        id: "user-2",
        info: { name: "Bob" },
        presence: { activeFileId: "target-file" },
      },
      {
        connectionId: 3,
        id: "user-3",
        info: { name: "Charlie" },
        presence: { activeFileId: "different-file" },
      },
    ];

    render(<FilePresenceBadge fileId="target-file" />);

    const badge = screen.getByTestId("file-presence-badge");
    expect(badge.getAttribute("title")).toBe("Alice, Bob are viewing this file");
    expect(screen.getByText("AL")).toBeDefined();
    expect(screen.getByText("BO")).toBeDefined();
    expect(screen.queryByText("CH")).toBeNull();
  });

  it("displays +N badge when more than 3 collaborators are on the same file", () => {
    mockOthers = [
      { connectionId: 1, id: "u-1", info: { name: "Alice" }, presence: { activeFileId: "file-x" } },
      { connectionId: 2, id: "u-2", info: { name: "Bob" }, presence: { activeFileId: "file-x" } },
      { connectionId: 3, id: "u-3", info: { name: "Charlie" }, presence: { activeFileId: "file-x" } },
      { connectionId: 4, id: "u-4", info: { name: "Diana" }, presence: { activeFileId: "file-x" } },
      { connectionId: 5, id: "u-5", info: { name: "Evan" }, presence: { activeFileId: "file-x" } },
    ];

    render(<FilePresenceBadge fileId="file-x" />);

    expect(screen.getByTestId("file-presence-extra-badge")).toBeDefined();
    expect(screen.getByText("+2")).toBeDefined();
  });
});

