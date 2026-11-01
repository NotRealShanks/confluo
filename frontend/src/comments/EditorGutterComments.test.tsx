// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EditorGutterComments } from "./EditorGutterComments";
import type { ThreadData } from "@liveblocks/client";
import type { CodeThreadMetadata } from "./types";

describe("EditorGutterComments", () => {
  afterEach(() => {
    cleanup();
  });

  const mockEditor = {
    onMouseMove: vi.fn(() => ({ dispose: vi.fn() })),
    onMouseLeave: vi.fn(() => ({ dispose: vi.fn() })),
    onDidScrollChange: vi.fn(() => ({ dispose: vi.fn() })),
    onDidLayoutChange: vi.fn(() => ({ dispose: vi.fn() })),
    getLayoutInfo: () => ({ contentLeft: 60, gutterWidth: 50, height: 600 }),
    getTopForLineNumber: (line: number) => line * 18,
    getScrollTop: () => 0,
    revealLineInCenter: vi.fn(),
  } as any;

  const mockThread: ThreadData<CodeThreadMetadata> = {
    type: "thread",
    id: "th-1",
    roomId: "room-1",
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"),
    resolved: false,
    visibility: "public",
    metadata: { fileId: "file-1", lineNumber: 19 },
    comments: [
      {
        type: "comment",
        id: "c-1",
        threadId: "th-1",
        roomId: "room-1",
        userId: "user-1",
        createdAt: new Date("2026-11-01T10:00:00Z"),
        body: {
          version: 1,
          content: [{ type: "paragraph", children: [{ text: "Comment on line 19" }] }],
        },
        reactions: [],
        attachments: [],
        metadata: {},
      },
    ],
  };

  const threadsByLine = new Map<number, ThreadData<CodeThreadMetadata>[]>([
    [19, [mockThread]],
  ]);

  it("renders comment badge on lines with comments", () => {
    render(
      <EditorGutterComments
        editor={mockEditor}
        fileId="file-1"
        threadsByLine={threadsByLine}
        onAddComment={vi.fn()}
        onReply={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const badge = screen.getByRole("button", { name: "View comments on line 19" });
    expect(badge).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("opens inline comment widget when clicking comment badge", () => {
    render(
      <EditorGutterComments
        editor={mockEditor}
        fileId="file-1"
        threadsByLine={threadsByLine}
        onAddComment={vi.fn()}
        onReply={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
      />,
    );

    const badge = screen.getByRole("button", { name: "View comments on line 19" });
    fireEvent.click(badge);

    expect(screen.getByText("Line 19")).toBeDefined();
    expect(screen.getByText("Comment on line 19")).toBeDefined();
  });

  it("opens widget and clears focus when focusLine is provided", () => {
    const handleClearFocus = vi.fn();
    render(
      <EditorGutterComments
        editor={mockEditor}
        fileId="file-1"
        threadsByLine={threadsByLine}
        onAddComment={vi.fn()}
        onReply={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
        focusLine={19}
        onClearFocusLine={handleClearFocus}
      />,
    );

    expect(screen.getByText("Line 19")).toBeDefined();
    expect(mockEditor.revealLineInCenter).toHaveBeenCalledWith(19);
    expect(handleClearFocus).toHaveBeenCalled();
  });
});
