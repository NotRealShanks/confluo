// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollaborativeWorkspace } from "./ProjectPage";
import { SettingsProvider } from "../settings";

// ResizeObserver mock for JSDOM environment
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const testDoc = new Y.Doc();
const mockProvider = {
  getYDoc: () => testDoc,
  synced: true,
  on: vi.fn(),
  off: vi.fn(),
  awareness: {
    setLocalStateField: vi.fn(),
    getStates: () => new Map(),
    on: vi.fn(),
    off: vi.fn(),
  },
};

vi.mock("@liveblocks/react/suspense", () => ({
  useRoom: () => ({ id: "room-test" }),
  useSelf: (selector?: (user: { id: string; info: { name: string; email?: string }; canWrite: boolean }) => unknown) => {
    const user = { id: "user-1", info: { name: "Alice", email: "alice@example.com" }, canWrite: true };
    return typeof selector === "function" ? selector(user) : user;
  },
  useOthers: (selector?: (others: readonly unknown[]) => unknown) => {
    const others = [{ id: "user-2", info: { name: "Bob", email: "bob@example.com" } }];
    return typeof selector === "function" ? selector(others) : others;
  },
  useOthersListener: vi.fn(),
  useBroadcastEvent: () => vi.fn(),
  useEventListener: vi.fn(),
}));

vi.mock("@liveblocks/yjs", () => ({
  getYjsProviderForRoom: () => mockProvider,
}));

vi.mock("../Editor", () => ({
  default: () => <div data-testid="editor-mock">Mock Editor</div>,
}));

vi.mock("../api/chat", () => ({
  fetchChatMessages: vi.fn().mockResolvedValue({
    messages: [
      {
        id: "msg-1",
        projectId: "p-123",
        senderId: "u1",
        senderName: "Alice",
        senderEmail: "alice@example.com",
        senderRole: "OWNER",
        content: "Welcome everyone!",
        createdAt: "2026-10-31T12:00:00Z",
      },
    ],
    nextCursor: null,
    hasMore: false,
    limit: 50,
  }),
  sendChatMessage: vi.fn(),
  fetchChatMessage: vi.fn(),
}));

describe("ProjectPage Chat & Activity integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Chat button in ActivityBar for project members and toggles Chat panel", async () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" />
      </SettingsProvider>,
    );

    const chatButton = screen.getByRole("button", { name: "Chat" });
    expect(chatButton).toBeDefined();
    expect(chatButton.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByTestId("project-chat-panel")).toBeNull();

    // Click to open
    fireEvent.click(chatButton);

    expect(chatButton.getAttribute("aria-pressed")).toBe("true");
    const chatPanel = screen.getByTestId("project-chat-panel");
    expect(chatPanel).toBeDefined();
    expect(screen.getByText("Project Communication")).toBeDefined();

    // Editor is still rendered alongside
    expect(screen.getByTestId("editor-mock")).toBeDefined();

    // Click again to toggle closed
    fireEvent.click(chatButton);
    expect(chatButton.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByTestId("project-chat-panel")).toBeNull();
  });

  it("allows closing the chat panel via its close header button", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" />
      </SettingsProvider>,
    );

    const chatButton = screen.getByRole("button", { name: "Chat" });
    fireEvent.click(chatButton);

    expect(screen.getByTestId("project-chat-panel")).toBeDefined();

    const closeBtn = screen.getByRole("button", { name: /Close chat panel/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId("project-chat-panel")).toBeNull();
    expect(chatButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not render Chat button or panel for guests", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" isGuest={true} />
      </SettingsProvider>,
    );

    expect(screen.queryByRole("button", { name: "Chat" })).toBeNull();
    expect(screen.queryByTestId("project-chat-panel")).toBeNull();
  });
});
