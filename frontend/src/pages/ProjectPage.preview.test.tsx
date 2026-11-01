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

describe("HTML Preview and Inbuilt Browser Integration in ProjectPage", () => {
  beforeEach(() => {
    testDoc = new Y.Doc();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Preview button and hides Run button when an HTML file is selected", () => {
    createNode(testDoc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<!DOCTYPE html><html><body><h1>Home</h1></body></html>",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("index.html");

    expect(screen.getByRole("button", { name: "Live browser preview" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Run selected file" })).toBeNull();
  });

  it("hides Preview button for non-previewable files (e.g. style.css, script.py)", () => {
    createNode(testDoc, {
      type: "file",
      name: "style.css",
      parentId: null,
      content: "body { background: #000; }",
    });
    createNode(testDoc, {
      type: "file",
      name: "script.py",
      parentId: null,
      content: "print('hello')",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={true} />
      </SettingsProvider>,
    );

    // CSS file: Neither Run nor Preview
    clickFileInExplorer("style.css");
    expect(screen.queryByRole("button", { name: "Live browser preview" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Run selected file" })).toBeNull();

    // Python file: Run button is shown, Preview button is hidden
    clickFileInExplorer("script.py");
    expect(screen.getByRole("button", { name: "Run selected file" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Live browser preview" })).toBeNull();
  });

  it("opens BrowserPreview side-by-side with editor when Preview button is clicked", () => {
    createNode(testDoc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<h1>Hello Preview</h1>",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("index.html");

    const previewButton = screen.getByRole("button", { name: "Live browser preview" });
    fireEvent.click(previewButton);

    // Both editor and browser preview panel should be visible
    expect(screen.getByTestId("editor-mock")).toBeDefined();
    expect(screen.getByTestId("browser-preview-panel")).toBeDefined();
    expect(screen.getByTestId("browser-preview-iframe")).toBeDefined();
  });

  it("closes the preview panel when close button is clicked", () => {
    createNode(testDoc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<h1>Test</h1>",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("index.html");
    fireEvent.click(screen.getByRole("button", { name: "Live browser preview" }));

    expect(screen.getByTestId("browser-preview-panel")).toBeDefined();

    // Close preview
    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
    expect(screen.queryByTestId("browser-preview-panel")).toBeNull();
  });

  it("supports maximizing and restoring preview panel", () => {
    createNode(testDoc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<h1>Test</h1>",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("index.html");
    fireEvent.click(screen.getByRole("button", { name: "Live browser preview" }));

    // Click maximize
    fireEvent.click(screen.getByRole("button", { name: "Maximize preview" }));
    // In maximized state, editor is hidden
    expect(screen.queryByTestId("editor-mock")).toBeNull();
    expect(screen.getByTestId("browser-preview-panel")).toBeDefined();

    // Click restore
    fireEvent.click(screen.getByRole("button", { name: "Restore size" }));
    expect(screen.getByTestId("editor-mock")).toBeDefined();
    expect(screen.getByTestId("browser-preview-panel")).toBeDefined();
  });

  it("allows viewers with canRun=false to preview HTML files", () => {
    createNode(testDoc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<h1>Viewer can preview</h1>",
    });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="test-project" canRun={false} />
      </SettingsProvider>,
    );

    clickFileInExplorer("index.html");

    // Preview button is visible even when canRun is false
    expect(screen.getByRole("button", { name: "Live browser preview" })).toBeDefined();
  });
});
