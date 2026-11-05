// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { InboxNotificationMenu } from "./InboxNotificationMenu";

const mockMarkInboxNotificationAsRead = vi.fn();
const mockMarkAllInboxNotificationsAsRead = vi.fn();
const mockDeleteInboxNotification = vi.fn();

vi.mock("@liveblocks/react/suspense", () => ({
  LiveblocksProvider: ({ children }: { children: React.ReactNode }) => children,
  useInboxNotifications: () => ({
    inboxNotifications: [
      {
        id: "notif-1",
        kind: "thread",
        subjectId: "th-1",
        threadId: "th-1",
        readAt: null,
        notifiedAt: new Date("2026-11-01T10:00:00Z"),
        activities: [
          {
            id: "act-1",
            createdAt: new Date("2026-11-01T10:00:00Z"),
            data: {
              commentId: "c-1",
            },
          },
        ],
      },
    ],
  }),
  useThreads: () => ({
    threads: [
      {
        id: "th-1",
        metadata: { fileId: "file-abc", lineNumber: 19 },
        comments: [
          {
            id: "c-1",
            userId: "user-2",
            createdAt: new Date("2026-11-01T10:00:00Z"),
            body: {
              version: 1,
              content: [{ type: "paragraph", children: [{ text: "Look at line 19" }] }],
            },
          },
        ],
      },
    ],
  }),
  useMarkInboxNotificationAsRead: () => mockMarkInboxNotificationAsRead,
  useMarkAllInboxNotificationsAsRead: () => mockMarkAllInboxNotificationsAsRead,
  useDeleteInboxNotification: () => mockDeleteInboxNotification,
  useIsInsideRoom: () => true,
}));

describe("InboxNotificationMenu", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders bell button with unread count badge", () => {
    render(
      <MemoryRouter>
        <InboxNotificationMenu onNavigateToComment={vi.fn()} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: /Inbox notifications/i });
    expect(bellBtn).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("opens popover menu and displays notifications list", () => {
    render(
      <MemoryRouter>
        <InboxNotificationMenu onNavigateToComment={vi.fn()} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: /Inbox notifications/i });
    fireEvent.click(bellBtn);

    expect(screen.getByText("Notifications")).toBeDefined();
    expect(screen.getByText("Line 19")).toBeDefined();
    expect(screen.getByText("Look at line 19")).toBeDefined();
  });

  it("marks notification as read and navigates to file and line on click", () => {
    const handleNavigate = vi.fn();
    render(
      <MemoryRouter>
        <InboxNotificationMenu onNavigateToComment={handleNavigate} />
      </MemoryRouter>
    );

    const bellBtn = screen.getByRole("button", { name: /Inbox notifications/i });
    fireEvent.click(bellBtn);

    const item = screen.getByText("Look at line 19");
    fireEvent.click(item);

    expect(mockMarkInboxNotificationAsRead).toHaveBeenCalledWith("notif-1");
    expect(handleNavigate).toHaveBeenCalledWith("file-abc", 19);
  });
});
