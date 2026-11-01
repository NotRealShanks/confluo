// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollaborativeWorkspace } from "./ProjectPage";
import { SettingsProvider } from "../settings";
import { createNode } from "../workspace/ops";

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

function clickFileInExplorer(name: string) {
  const elements = screen.getAllByText(name);
  const explorerButton = elements.find((el) => el.closest(".ide-tree-row")) ?? elements[0];
  fireEvent.click(explorerButton);
}

describe("Editor Tab Bar Redesign & Action Integration", () => {
  beforeEach(() => {
    testDoc = new Y.Doc();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a unified editor header and removes the redundant toolbar row", () => {
    const file = createNode(testDoc, { type: "file", name: "Main.java", parentId: null, content: "class Main {}" });
    if (!file.ok) throw new Error("create failed");

    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Old redundant toolbar must be gone
    expect(container.querySelector(".ide-editor-toolbar")).toBeNull();

    // Unified header must be present
    const header = container.querySelector(".ide-editor-header");
    expect(header).not.toBeNull();
    expect(header?.querySelector(".ide-tabs-container")).not.toBeNull();
    expect(header?.querySelector(".ide-editor-actions")).not.toBeNull();
  });

  it("manages multiple open tabs, switching active tab, and closing tabs", () => {
    createNode(testDoc, { type: "file", name: "fileA.ts", parentId: null, content: "const a = 1;" });
    createNode(testDoc, { type: "file", name: "fileB.py", parentId: null, content: "b = 2" });
    createNode(testDoc, { type: "file", name: "fileC.md", parentId: null, content: "# Readme" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open fileA.ts
    clickFileInExplorer("fileA.ts");
    // Open fileB.py
    clickFileInExplorer("fileB.py");
    // Open fileC.md
    clickFileInExplorer("fileC.md");

    // All 3 tabs should be rendered
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);

    // Active tab is fileC.md
    expect(screen.getByRole("tab", { name: /fileC\.md/ }).getAttribute("aria-selected")).toBe("true");

    // Switching to fileB.py tab
    fireEvent.click(screen.getByRole("tab", { name: /fileB\.py/ }));
    expect(screen.getByRole("tab", { name: /fileB\.py/ }).getAttribute("aria-selected")).toBe("true");

    // Close fileA.ts using its close button
    const closeFileA = screen.getByLabelText("Close fileA.ts");
    fireEvent.click(closeFileA);

    // Only fileB.py and fileC.md tabs remain
    expect(screen.getAllByRole("tab").length).toBe(2);
    expect(screen.queryByRole("tab", { name: /fileA\.ts/ })).toBeNull();
  });

  it("handles mouse wheel events on tabs container to scroll horizontally", () => {
    createNode(testDoc, { type: "file", name: "f1.js", parentId: null, content: "" });
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("f1.js");

    const scrollArea = container.querySelector(".ide-tabs-scroll-area");
    expect(scrollArea).not.toBeNull();

    if (scrollArea) {
      scrollArea.scrollLeft = 0;
      fireEvent.wheel(scrollArea, { deltaY: 50, deltaX: 0 });
      // deltaY is added to scrollLeft
      expect(scrollArea.scrollLeft).toBe(50);
    }
  });

  it("provides bottom panel toggle in the editor actions", () => {
    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    const toggleBtn = screen.getByTitle("Toggle bottom panel");
    expect(toggleBtn).toBeDefined();

    // Bottom panel is initially collapsed
    const bottomPanel = container.querySelector(".ide-bottom-panel");
    expect(bottomPanel?.classList.contains("is-collapsed")).toBe(true);

    // Click toggle button -> bottom panel opens
    fireEvent.click(toggleBtn);
    expect(bottomPanel?.classList.contains("is-open")).toBe(true);

    // Toggle button aria-pressed and title update
    expect(toggleBtn.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTitle("Hide bottom panel")).toBeDefined();

    // Click again -> bottom panel collapses
    fireEvent.click(toggleBtn);
    expect(bottomPanel?.classList.contains("is-collapsed")).toBe(true);
  });

  it("provides More Actions menu with 'Close All Tabs' and 'Close Other Tabs'", () => {
    createNode(testDoc, { type: "file", name: "doc1.txt", parentId: null, content: "1" });
    createNode(testDoc, { type: "file", name: "doc2.txt", parentId: null, content: "2" });
    createNode(testDoc, { type: "file", name: "doc3.txt", parentId: null, content: "3" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("doc1.txt");
    clickFileInExplorer("doc2.txt");
    clickFileInExplorer("doc3.txt");

    expect(screen.getAllByRole("tab").length).toBe(3);

    // Open More Actions menu
    const moreBtn = screen.getByTitle("More editor actions");
    fireEvent.click(moreBtn);

    // Menu is visible with functional items
    const closeOtherBtn = screen.getByRole("menuitem", { name: "Close Other Tabs" });
    const closeAllBtn = screen.getByRole("menuitem", { name: "Close All Tabs" });
    expect(closeOtherBtn).toBeDefined();
    expect(closeAllBtn).toBeDefined();

    // Click "Close Other Tabs" -> only doc3.txt remains
    fireEvent.click(closeOtherBtn);
    expect(screen.getAllByRole("tab").length).toBe(1);
    expect(screen.getByRole("tab", { name: /doc3\.txt/ })).toBeDefined();

    // Open menu again and click "Close All Tabs"
    fireEvent.click(moreBtn);
    fireEvent.click(screen.getByRole("menuitem", { name: "Close All Tabs" }));
    expect(screen.queryAllByRole("tab").length).toBe(0);
    expect(screen.getByText("No files open")).toBeDefined();
  });

  it("closes More Actions menu on Escape or click outside", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    const moreBtn = screen.getByTitle("More editor actions");
    fireEvent.click(moreBtn);
    expect(screen.getByRole("menu", { name: "More actions" })).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "More actions" })).toBeNull();

    // Open again and click outside
    fireEvent.click(moreBtn);
    expect(screen.getByRole("menu", { name: "More actions" })).toBeDefined();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu", { name: "More actions" })).toBeNull();
  });

  it("renders Preview only when supported and does not render unimplemented Debug buttons", () => {
    createNode(testDoc, { type: "file", name: "notes.txt", parentId: null, content: "text file" });
    createNode(testDoc, { type: "file", name: "index.html", parentId: null, content: "<h1>Hi</h1>" });

    const { container } = render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // For unsupported file (notes.txt): neither preview nor debug actions exist
    clickFileInExplorer("notes.txt");
    const editorActions = container.querySelector(".ide-editor-actions");
    expect(editorActions?.querySelector("[title*='Preview'], [title*='preview']")).toBeNull();
    expect(editorActions?.querySelector("[title*='Debug'], [title*='debug']")).toBeNull();

    // For supported file (index.html): preview action exists, debug still does not exist
    clickFileInExplorer("index.html");
    expect(editorActions?.querySelector("[title*='Preview'], [title*='preview']")).not.toBeNull();
    expect(editorActions?.querySelector("[title*='Debug'], [title*='debug']")).toBeNull();
  });
});
