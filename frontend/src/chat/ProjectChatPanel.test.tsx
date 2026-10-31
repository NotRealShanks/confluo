// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectChatPanel } from "./ProjectChatPanel";
import * as chatHook from "./useProjectChat";
import * as activityHook from "./useMemberActivity";

describe("ProjectChatPanel Component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockMessages = [
    {
      id: "msg-1",
      projectId: "p1",
      senderUserId: "u1",
      senderName: "Alice",
      senderAvatarUrl: null,
      message: "Hello team!",
      createdAt: "2026-10-31T10:00:00Z",
    },
    {
      id: "msg-2",
      projectId: "p1",
      senderUserId: "u2",
      senderName: "Bob",
      senderAvatarUrl: "https://example.com/bob.png",
      message: "Hi Alice!",
      createdAt: "2026-10-31T10:05:00Z",
    },
  ];

  const defaultChatHookValues: ReturnType<typeof chatHook.useProjectChat> = {
    messages: mockMessages,
    loading: false,
    loadingMore: false,
    hasMore: false,
    error: null,
    sendError: null,
    sending: false,
    isAccessRevoked: false,
    sendMessage: vi.fn().mockResolvedValue(true),
    loadMore: vi.fn(),
  };

  const defaultActivityHookValues: ReturnType<typeof activityHook.useMemberActivity> = {
    activities: [
      {
        id: "a1",
        type: "join",
        userId: "u1",
        userName: "Alice",
        timestamp: new Date("2026-10-31T10:00:00Z"),
      },
      {
        id: "a2",
        type: "leave",
        userId: "u3",
        userName: "Dave",
        timestamp: new Date("2026-10-31T10:10:00Z"),
      },
    ],
    onlineMembers: [
      { id: "u1", connectionId: 1, name: "Alice", isSelf: true },
      { id: "u2", connectionId: 2, name: "Bob", isSelf: false },
    ],
  };

  it("renders messages list and header controls", () => {
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue(defaultChatHookValues);
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    const onClose = vi.fn();
    render(<ProjectChatPanel projectId="p1" onClose={onClose} />);

    expect(screen.getByText("Project Communication")).toBeDefined();
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Hello team!")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Hi Alice!")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Close chat panel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("sends message on Enter key and calls sendMessage", async () => {
    const sendMessageMock = vi.fn().mockResolvedValue(true);
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue({
      ...defaultChatHookValues,
      sendMessage: sendMessageMock,
    });
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);

    const textarea = screen.getByLabelText("Chat message input");
    fireEvent.change(textarea, { target: { value: "New collaborative message" } });

    // Press Enter without shift
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(sendMessageMock).toHaveBeenCalledWith("New collaborative message");
  });

  it("does not send message on Shift+Enter (allows newline)", () => {
    const sendMessageMock = vi.fn();
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue({
      ...defaultChatHookValues,
      sendMessage: sendMessageMock,
    });
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);

    const textarea = screen.getByLabelText("Chat message input");
    fireEvent.change(textarea, { target: { value: "Line 1" } });

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("switches to Activity tab and displays online members and session activity", () => {
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue(defaultChatHookValues);
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);

    // Switch to Activity tab
    fireEvent.click(screen.getByRole("tab", { name: /Activity/ }));

    expect(screen.getByText("Online Members (2)")).toBeDefined();
    expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
    expect(screen.getByText(/joined the session/)).toBeDefined();
    expect(screen.getByText(/left the session/)).toBeDefined();
  });

  it("displays loading state when fetching messages", () => {
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue({
      ...defaultChatHookValues,
      loading: true,
      messages: [],
    });
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);
    expect(screen.getByText("Loading conversation…")).toBeDefined();
  });

  it("displays empty state when no messages exist", () => {
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue({
      ...defaultChatHookValues,
      loading: false,
      messages: [],
    });
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);
    expect(screen.getByText("No messages yet.")).toBeDefined();
  });

  it("handles image load failure gracefully by falling back to initial badge", () => {
    vi.spyOn(chatHook, "useProjectChat").mockReturnValue(defaultChatHookValues);
    vi.spyOn(activityHook, "useMemberActivity").mockReturnValue(defaultActivityHookValues);

    render(<ProjectChatPanel projectId="p1" onClose={vi.fn()} />);

    // Bob has an avatarUrl
    const bobImg = screen.getByAltText("Bob");
    expect(bobImg.getAttribute("referrerPolicy")).toBe("no-referrer");

    // Simulate image error
    fireEvent.error(bobImg);

    // After error, image is replaced with initials "B"
    expect(screen.queryByAltText("Bob")).toBeNull();
    expect(screen.getByText("B")).toBeDefined();
  });
});
