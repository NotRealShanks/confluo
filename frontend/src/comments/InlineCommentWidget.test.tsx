// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { InlineCommentWidget } from "./InlineCommentWidget";
import type { ThreadData } from "@liveblocks/client";
import type { CodeThreadMetadata } from "./types";

describe("InlineCommentWidget", () => {
  afterEach(() => {
    cleanup();
  });

  const mockThreads: ThreadData<CodeThreadMetadata>[] = [
    {
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
            content: [{ type: "paragraph", children: [{ text: "Consider refactoring this type declaration." }] }],
          },
          reactions: [],
          attachments: [],
          metadata: {},
        },
      ],
    },
  ];

  it("renders existing thread comments and line header", () => {
    render(
      <InlineCommentWidget
        lineNumber={19}
        threads={mockThreads}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onReply={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText("Line 19")).toBeDefined();
    expect(screen.getByText("Consider refactoring this type declaration.")).toBeDefined();
    expect(screen.getByPlaceholderText(/Reply to thread/i)).toBeDefined();
  });

  it("submits a reply when clicking Reply or pressing Ctrl+Enter", () => {
    const handleReply = vi.fn();
    render(
      <InlineCommentWidget
        lineNumber={19}
        threads={mockThreads}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onReply={handleReply}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
        currentUserId="user-1"
      />,
    );

    const input = screen.getByPlaceholderText(/Reply to thread/i);
    fireEvent.change(input, { target: { value: "Agreed, fixing now!" } });
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });

    expect(handleReply).toHaveBeenCalledWith("th-1", "Agreed, fixing now!");
  });

  it("calls resolve/unresolve and delete when clicking action buttons", () => {
    const handleResolve = vi.fn();
    const handleDelete = vi.fn();

    render(
      <InlineCommentWidget
        lineNumber={19}
        threads={mockThreads}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onReply={vi.fn()}
        onResolve={handleResolve}
        onUnresolve={vi.fn()}
        onDeleteThread={handleDelete}
        currentUserId="user-1"
      />,
    );

    const resolveBtn = screen.getByTitle("Mark as resolved");
    fireEvent.click(resolveBtn);
    expect(handleResolve).toHaveBeenCalledWith("th-1");

    const deleteBtn = screen.getByTitle("Delete entire thread");
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("th-1");
  });

  it("renders new comment composer when no threads exist on line", () => {
    const handleAdd = vi.fn();
    render(
      <InlineCommentWidget
        lineNumber={25}
        threads={[]}
        onClose={vi.fn()}
        onAddComment={handleAdd}
        onReply={vi.fn()}
        onResolve={vi.fn()}
        onUnresolve={vi.fn()}
        onDeleteThread={vi.fn()}
        currentUserId="user-1"
      />,
    );

    const textarea = screen.getByPlaceholderText(/Add a comment on line 25/i);
    fireEvent.change(textarea, { target: { value: "New comment on line 25" } });

    const submitBtn = screen.getByRole("button", { name: "Post" });
    fireEvent.click(submitBtn);

    expect(handleAdd).toHaveBeenCalledWith("New comment on line 25");
  });
});
