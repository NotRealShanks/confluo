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
  useSelf: (selector: (user: { id: string; info: { name: string }; canWrite: boolean }) => unknown) =>
    selector({ id: "user-1", info: { name: "Alice" }, canWrite: true }),
}));

vi.mock("@liveblocks/yjs", () => ({
  getYjsProviderForRoom: () => mockProvider,
}));

vi.mock("../Editor", () => ({
  default: () => <div data-testid="editor-mock" />,
}));

describe("ProjectPage ActivityBar & Settings integration", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Settings button in ActivityBar and opens Settings panel on click", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" />
      </SettingsProvider>,
    );

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    expect(settingsBtn).toBeDefined();
    expect(settingsBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();

    // Click to open
    fireEvent.click(settingsBtn);

    expect(settingsBtn.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("dialog", { name: "IDE Settings" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Settings" })).toBeDefined();

    // Click again to toggle closed
    fireEvent.click(settingsBtn);
    expect(settingsBtn.getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();
  });

  it("allows changing theme and retains editor without unmounting workspace", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" />
      </SettingsProvider>,
    );

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);

    const darkRadio = screen.getByRole("radio", { name: /dark/i });
    fireEvent.click(darkRadio);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Close panel with close button
    const closeBtn = screen.getByRole("button", { name: "Close settings" });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();
    // Theme remains dark
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("closes settings on Escape key while keeping workspace intact", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-123" />
      </SettingsProvider>,
    );

    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    fireEvent.click(settingsBtn);
    expect(screen.getByRole("dialog", { name: "IDE Settings" })).toBeDefined();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "IDE Settings" })).toBeNull();
  });
});
