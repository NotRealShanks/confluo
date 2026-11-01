// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { CollaborativeWorkspace } from "./ProjectPage";
import { SettingsProvider } from "../settings";
import { PANEL_DEFAULT_HEIGHT, PANEL_MIN_HEIGHT, PANEL_STEP } from "./panelResize";

// ResizeObserver mock for JSDOM environment
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

let testDoc = new Y.Doc();
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
  useUpdateMyPresence: () => vi.fn(),
  useOthers: () => [],
}));

vi.mock("@liveblocks/yjs", () => ({
  getYjsProviderForRoom: () => mockProvider,
}));

vi.mock("../Editor", () => ({
  default: () => <div data-testid="editor-mock" />,
}));

describe("Terminal / BottomPanel Expansion, Layout & Accessibility", () => {
  beforeEach(() => {
    testDoc = new Y.Doc();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders panel resize handle and maximize action when panel is open", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Toggle panel open using tab header toggle button
    const toggleBtn = screen.getByTitle("Toggle bottom panel");
    fireEvent.click(toggleBtn);

    const panel = container.querySelector(".ide-bottom-panel");
    expect(panel?.classList.contains("is-open")).toBe(true);

    // Resize handle exists with accessible ARIA attributes
    const handle = container.querySelector(".ide-panel-resize-handle");
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute("role")).toBe("separator");
    expect(handle?.getAttribute("aria-orientation")).toBe("horizontal");

    // Maximize button exists
    const maximizeBtn = screen.getByTitle("Maximize panel size");
    expect(maximizeBtn).toBeDefined();
  });

  it("maximizes and restores the terminal window via the maximize button", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open panel
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));

    const panel = container.querySelector(".ide-bottom-panel") as HTMLElement;
    expect(panel.classList.contains("is-maximized")).toBe(false);

    // Click maximize button
    const maximizeBtn = screen.getByTitle("Maximize panel size");
    fireEvent.click(maximizeBtn);

    // Panel is now maximized
    expect(panel.classList.contains("is-maximized")).toBe(true);
    expect(screen.getByTitle("Restore panel size")).toBeDefined();

    // Click restore button
    fireEvent.click(screen.getByTitle("Restore panel size"));
    expect(panel.classList.contains("is-maximized")).toBe(false);
    expect(screen.getByTitle("Maximize panel size")).toBeDefined();
  });

  it("toggles maximize / restore on double-clicking the resize handle or tabs bar", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open panel
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));

    const panel = container.querySelector(".ide-bottom-panel") as HTMLElement;
    const handle = container.querySelector(".ide-panel-resize-handle") as HTMLElement;

    // Double-click resize handle to maximize
    fireEvent.doubleClick(handle);
    expect(panel.classList.contains("is-maximized")).toBe(true);

    // Double-click resize handle to restore
    fireEvent.doubleClick(handle);
    expect(panel.classList.contains("is-maximized")).toBe(false);

    // Double-click tabs bar to maximize
    const tabsBar = container.querySelector(".ide-panel-tabs") as HTMLElement;
    fireEvent.doubleClick(tabsBar);
    expect(panel.classList.contains("is-maximized")).toBe(true);

    // Double-click again restores
    fireEvent.doubleClick(tabsBar);
    expect(panel.classList.contains("is-maximized")).toBe(false);
  });

  it("resizes panel with keyboard arrow keys on the resize handle", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open panel
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));

    const handle = container.querySelector(".ide-panel-resize-handle") as HTMLElement;
    expect(handle).not.toBeNull();

    const initialHeight = Number(handle.getAttribute("aria-valuenow"));
    expect(initialHeight).toBe(PANEL_DEFAULT_HEIGHT);

    // ArrowUp expands panel height by PANEL_STEP
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    const expandedHeight = Number(handle.getAttribute("aria-valuenow"));
    expect(expandedHeight).toBe(initialHeight + PANEL_STEP);

    // ArrowDown shrinks panel height
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(initialHeight);

    // Home minimizes to bounds.min
    fireEvent.keyDown(handle, { key: "Home" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(PANEL_MIN_HEIGHT);
  });

  it("handles mouse drag to resize terminal panel height", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open panel
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));

    const panel = container.querySelector(".ide-bottom-panel") as HTMLElement;
    const handle = container.querySelector(".ide-panel-resize-handle") as HTMLElement;

    // Mock bounding client rect for panel
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      top: 500,
      bottom: 700,
      left: 0,
      right: 1000,
      width: 1000,
      height: 200,
      x: 0,
      y: 500,
      toJSON: () => {},
    });

    // Start resize drag at clientY = 500
    fireEvent.pointerDown(handle, { clientY: 500 });
    expect(document.body.classList.contains("is-resizing-panel")).toBe(true);

    // Drag up to clientY = 400 (deltaY = 100, 200 + 100 = 300px height)
    fireEvent(window, new PointerEvent("pointermove", { clientY: 400 }));
    expect(Number(handle.getAttribute("aria-valuenow"))).toBe(300);

    // Release mouse
    fireEvent(window, new PointerEvent("pointerup"));
    expect(document.body.classList.contains("is-resizing-panel")).toBe(false);
  });

  it("clarifies activity bar icons: enables functional buttons and disables placeholders", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Explorer and Settings are functional and enabled
    const explorerBtn = screen.getByLabelText("Explorer");
    const settingsBtn = screen.getByLabelText("Settings");
    expect(explorerBtn.hasAttribute("disabled")).toBe(false);
    expect(settingsBtn.hasAttribute("disabled")).toBe(false);

    // Search, Source Control, and Run and Debug are disabled placeholders
    const searchBtn = screen.getByLabelText("Search (Unavailable)");
    const sourceControlBtn = screen.getByLabelText("Source Control (Unavailable)");
    const runDebugBtn = screen.getByLabelText("Run and Debug (Unavailable)");

    expect(searchBtn.hasAttribute("disabled")).toBe(true);
    expect(sourceControlBtn.hasAttribute("disabled")).toBe(true);
    expect(runDebugBtn.hasAttribute("disabled")).toBe(true);

    expect(searchBtn.getAttribute("title")).toMatch(/Coming soon/i);
    expect(sourceControlBtn.getAttribute("title")).toMatch(/Coming soon/i);
    expect(runDebugBtn.getAttribute("title")).toMatch(/Debugger unavailable/i);
  });

  it("displays clear deferred explanation for interactive terminal tab", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open bottom panel
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));

    // Switch to Terminal tab
    fireEvent.click(screen.getByTitle(/Terminal/i));

    // Verifies the interactive cloud terminal is rendered with prompt and sessions
    expect(screen.getAllByText(/confluo:~\/project\$/).length).toBeGreaterThan(0);
    expect(screen.getByTitle("New Terminal")).toBeDefined();
    expect(screen.getByText("1: bash")).toBeDefined();
  });

  it("ensures the editor area is rendered and visible alongside the bottom panel", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Editor area must exist in DOM
    const editorArea = container.querySelector(".ide-editor-area");
    expect(editorArea).not.toBeNull();
    expect(screen.getByTestId("editor-mock")).toBeDefined();

    // Opening the bottom panel keeps editor area rendered and visible
    fireEvent.click(screen.getByTitle("Toggle bottom panel"));
    expect(container.querySelector(".ide-editor-area")).not.toBeNull();
    expect(screen.getByTestId("editor-mock")).toBeDefined();
  });
});
