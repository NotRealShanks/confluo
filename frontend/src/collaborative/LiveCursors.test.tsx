// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCursors } from "./LiveCursors";

const mockOthers = [
  {
    connectionId: 1,
    id: "user-1",
    info: { name: "Alice" },
    presence: { cursor: { x: 100, y: 150 } },
    canWrite: true,
  },
  {
    connectionId: 2,
    id: "user-2",
    info: { name: "Bob" },
    presence: { cursor: null },
    canWrite: true,
  },
];

vi.mock("@liveblocks/react/suspense", () => ({
  useOthers: () => mockOthers,
}));

describe("LiveCursors component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders cursors for collaborators who have an active cursor", () => {
    render(<LiveCursors />);

    expect(screen.getByTestId("live-cursors-overlay")).toBeDefined();
    // Only Alice has an active cursor
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.queryByText("Bob")).toBeNull();
  });
});
