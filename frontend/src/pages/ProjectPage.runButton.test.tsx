// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollaborativeWorkspace } from "./ProjectPage";
import { SettingsProvider } from "../settings";
import { createNode, renameNode } from "../workspace/ops";
import * as executionApi from "../api/execution";

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
  // The explorer button is inside .ide-tree
  const explorerButton = elements.find((el) => el.closest(".ide-tree-row")) ?? elements[0];
  fireEvent.click(explorerButton);
}

describe("Context-Aware Run Button in ProjectPage toolbar", () => {
  beforeEach(() => {
    testDoc = new Y.Doc();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render Run button when no file is selected", () => {
    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    expect(screen.queryByTitle("Run selected file")).toBeNull();
  });

  it("renders Run button for supported executable files (Java, JS, TS, Python, C, C++)", () => {
    createNode(testDoc, { type: "file", name: "Main.java", parentId: null, content: "class Main {}" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("Main.java");

    const runBtn = screen.getByTitle("Run selected file");
    expect(runBtn).toBeDefined();
    expect(runBtn.textContent).toContain("Run");
  });

  it("does not render Run button for unsupported files (HTML, CSS, Markdown, TXT, JSON, PNG, headers)", () => {
    createNode(testDoc, { type: "file", name: "index.html", parentId: null, content: "<h1>Hi</h1>" });
    createNode(testDoc, { type: "file", name: "style.css", parentId: null, content: "body {}" });
    createNode(testDoc, { type: "file", name: "README.md", parentId: null, content: "# Title" });
    createNode(testDoc, { type: "file", name: "package.json", parentId: null, content: "{}" });
    createNode(testDoc, { type: "file", name: "header.h", parentId: null, content: "#pragma once" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Select index.html
    clickFileInExplorer("index.html");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Select style.css
    clickFileInExplorer("style.css");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Select README.md
    clickFileInExplorer("README.md");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Select package.json
    clickFileInExplorer("package.json");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Select header.h
    clickFileInExplorer("header.h");
    expect(screen.queryByTitle("Run selected file")).toBeNull();
  });

  it("updates Run button visibility immediately when switching between tabs", () => {
    createNode(testDoc, { type: "file", name: "script.py", parentId: null, content: "print('hi')" });
    createNode(testDoc, { type: "file", name: "notes.txt", parentId: null, content: "some notes" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Open and select script.py -> Run visible
    clickFileInExplorer("script.py");
    expect(screen.getByTitle("Run selected file")).toBeDefined();

    // Open and select notes.txt -> Run hidden
    clickFileInExplorer("notes.txt");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Click back on script.py tab in open tabs -> Run visible again
    const tabs = screen.getAllByRole("tab");
    const scriptTab = tabs.find((t) => t.textContent?.includes("script.py"));
    expect(scriptTab).toBeDefined();
    fireEvent.click(scriptTab!.querySelector("button")!);

    expect(screen.getByTitle("Run selected file")).toBeDefined();
  });

  it("updates Run button visibility when a file is renamed to/from an executable extension", () => {
    const file = createNode(testDoc, { type: "file", name: "scratch.txt", parentId: null, content: "code" });
    if (!file.ok) throw new Error("create failed");

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={true} />
      </SettingsProvider>,
    );

    // Select scratch.txt -> Run hidden
    clickFileInExplorer("scratch.txt");
    expect(screen.queryByTitle("Run selected file")).toBeNull();

    // Rename scratch.txt -> scratch.ts
    act(() => {
      renameNode(testDoc, file.value, "scratch.ts");
    });

    // Run button immediately appears
    expect(screen.getByTitle("Run selected file")).toBeDefined();

    // Rename scratch.ts -> scratch.json
    act(() => {
      renameNode(testDoc, file.value, "scratch.json");
    });

    // Run button immediately disappears
    expect(screen.queryByTitle("Run selected file")).toBeNull();
  });

  it("hides Run button for viewers even when an executable file is selected", () => {
    createNode(testDoc, { type: "file", name: "App.java", parentId: null, content: "class App {}" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-1" canRun={false} />
      </SettingsProvider>,
    );

    clickFileInExplorer("App.java");

    // Viewer permissions prevent run control
    expect(screen.queryByTitle("Run selected file")).toBeNull();
  });

  it("executes the project with the correct language and entrypoint when Run is clicked", async () => {
    const executeSpy = vi.spyOn(executionApi, "executeProject").mockResolvedValue({
      stdout: "Hello from C++",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });

    createNode(testDoc, { type: "file", name: "main.cpp", parentId: null, content: "int main() {}" });

    render(
      <SettingsProvider>
        <CollaborativeWorkspace projectId="p-cpp-project" canRun={true} />
      </SettingsProvider>,
    );

    clickFileInExplorer("main.cpp");

    const runBtn = screen.getByTitle("Run selected file");
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(executeSpy).toHaveBeenCalledWith("p-cpp-project", expect.objectContaining({
        language: "cpp",
        entrypoint: "main.cpp",
      }));
    });
  });
});
