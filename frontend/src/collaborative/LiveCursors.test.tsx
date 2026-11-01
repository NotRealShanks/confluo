// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveCursors } from "./LiveCursors";

const mockOthers = [
  {
    connectionId: 1,
    id: "user-1",
    info: { name: "Alice" },
    presence: { cursor: { x: 100, y: 150, fileId: "file-1" } },
    canWrite: true,
  },
  {
    connectionId: 2,
    id: "user-2",
    info: { name: "Bob" },
    presence: { cursor: { x: 100, y: 150, fileId: "file-2" } },
    canWrite: true,
  },
  {
    connectionId: 3,
    id: "user-3",
    info: { name: "Charlie" },
    presence: { cursor: { x: 100, y: 4500, fileId: "file-1" } },
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

  it("renders cursors only for collaborators on the same file within visible viewport", () => {
    const fakeContainerRef = {
      current: {
        clientWidth: 800,
        clientHeight: 600,
      } as unknown as HTMLDivElement,
    };

    render(
      <LiveCursors
        fileId="file-1"
        containerRef={fakeContainerRef}
      />,
    );

    expect(screen.getByTestId("live-cursors-overlay")).toBeDefined();
    // Alice is on file-1 at y=150 (in bounds [0, 600]) -> visible
    expect(screen.getByText("Alice")).toBeDefined();
    // Bob is on file-2 -> hidden
    expect(screen.queryByText("Bob")).toBeNull();
    // Charlie is on file-1 but at y=4500 (out of bounds > 600) -> hidden
    expect(screen.queryByText("Charlie")).toBeNull();
  });

  it("adjusts visible cursors according to editor scroll position", () => {
    let scrollCallback: (() => void) | null = null;
    let currentScrollTop = 4400;

    const fakeEditor = {
      getScrollTop: () => currentScrollTop,
      getScrollLeft: () => 0,
      onDidScrollChange: (fn: () => void) => {
        scrollCallback = fn;
        return { dispose: () => {} };
      },
    };

    const fakeContainerRef = {
      current: {
        clientWidth: 800,
        clientHeight: 600,
      } as unknown as HTMLDivElement,
    };

    render(
      <LiveCursors
        fileId="file-1"
        editorInstance={fakeEditor}
        containerRef={fakeContainerRef}
      />,
    );

    // Scrolled to 4400:
    // Charlie is at y=4500 -> screenY = 4500 - 4400 = 100 (in bounds) -> visible!
    expect(screen.getByText("Charlie")).toBeDefined();
    // Alice is at y=150 -> screenY = 150 - 4400 = -4250 (out of bounds) -> hidden!
    expect(screen.queryByText("Alice")).toBeNull();
    expect(scrollCallback).toBeDefined();
  });
});
