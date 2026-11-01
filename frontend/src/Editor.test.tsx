// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Editor from "./Editor";
import { createNode } from "./workspace/ops";

const capturedProps: {
  language?: string;
  defaultLanguage?: string;
  path?: string;
  theme?: string;
  options?: Record<string, any>;
} = {};

let canWriteSelf = true;

vi.mock("@liveblocks/react/suspense", () => ({
  useRoom: () => ({}),
  useSelf: (selector?: (me: { id: string; info: { name: string }; canWrite: boolean }) => unknown) => {
    const me = { id: "user-1", info: { name: "Alice" }, canWrite: canWriteSelf };
    return selector ? selector(me) : me;
  },
  useThreads: () => ({ threads: [] }),
  useCreateThread: () => vi.fn(),
  useCreateComment: () => vi.fn(),
  useMarkThreadAsResolved: () => vi.fn(),
  useMarkThreadAsUnresolved: () => vi.fn(),
  useDeleteThread: () => vi.fn(),
  useDeleteComment: () => vi.fn(),
}));

vi.mock("@liveblocks/yjs", () => ({
  getYjsProviderForRoom: () => ({
    getYDoc: () => new Y.Doc(),
    awareness: {
      setLocalStateField: vi.fn(),
      getStates: () => new Map(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));

vi.mock("y-monaco", () => ({
  MonacoBinding: class {
    destroy() {}
  },
}));

vi.mock("@monaco-editor/react", async () => {
  const { useEffect } = await import("react");
  const fakeEditor = { getModel: () => ({ isDisposed: () => false }) };
  const fakeMonaco = {};
  return {
    Editor: (props: {
      language?: string;
      defaultLanguage?: string;
      path?: string;
      options?: { readOnly?: boolean; domReadOnly?: boolean };
      onMount?: (editor: unknown, monaco: unknown) => void;
    }) => {
      capturedProps.language = props.language;
      capturedProps.defaultLanguage = props.defaultLanguage;
      capturedProps.path = props.path;
      capturedProps.theme = (props as any).theme;
      capturedProps.options = props.options;
      useEffect(() => {
        props.onMount?.(fakeEditor, fakeMonaco);
      }, [props.onMount]);
      return <div data-testid="monaco-mock" data-path={props.path} data-lang={props.language} />;
    },
  };
});

beforeEach(() => {
  canWriteSelf = true;
  capturedProps.language = undefined;
  capturedProps.defaultLanguage = undefined;
  capturedProps.path = undefined;
  capturedProps.theme = undefined;
  capturedProps.options = undefined;
});

afterEach(() => {
  cleanup();
});

describe("Editor component", () => {
  it("renders Monaco with detected language and path for standard extension", () => {
    const doc = new Y.Doc();
    const fileId = createNode(doc, {
      type: "file",
      name: "Calculator.java",
      parentId: null,
      content: "public class Calculator {}",
    });
    if (!fileId.ok) throw new Error(fileId.error);

    render(<Editor doc={doc} fileId={fileId.value} workspaceReady />);

    expect(screen.getByTestId("monaco-mock")).toBeDefined();
    expect(capturedProps.language).toBe("java");
    expect(capturedProps.path).toBe(`workspace/${fileId.value}/Calculator.java`);
    expect(capturedProps.options?.readOnly).toBe(false);
    expect(capturedProps.theme).toBe("vs");
    expect(capturedProps.options?.fontSize).toBe(14);
    expect(capturedProps.options?.tabSize).toBe(2);
    expect(capturedProps.options?.wordWrap).toBe("off");
    expect(capturedProps.options?.automaticLayout).toBe(true);
    expect(capturedProps.options?.minimap).toEqual({
      enabled: true,
      renderCharacters: true,
      side: "right",
      showSlider: "always",
      autohide: "none",
      maxColumn: 120,
    });
    expect(capturedProps.options?.lineNumbers).toBe("on");
    expect(capturedProps.options?.insertSpaces).toBe(true);
    expect(capturedProps.options?.cursorBlinking).toBe("blink");
    expect(capturedProps.options?.bracketPairColorization).toEqual({ enabled: true });
    expect(capturedProps.options?.renderWhitespace).toBe("selection");
  });

  it("handles extensionless files like Dockerfile and Makefile correctly", () => {
    const doc = new Y.Doc();
    const dockerfileId = createNode(doc, {
      type: "file",
      name: "Dockerfile",
      parentId: null,
      content: "FROM node:20",
    });
    if (!dockerfileId.ok) throw new Error(dockerfileId.error);

    render(<Editor doc={doc} fileId={dockerfileId.value} workspaceReady />);

    expect(capturedProps.language).toBe("dockerfile");
    expect(capturedProps.path).toBe(`workspace/${dockerfileId.value}/Dockerfile`);
  });

  it("passes readOnly and displays view-only notice for viewer role", () => {
    canWriteSelf = false;
    const doc = new Y.Doc();
    const fileId = createNode(doc, {
      type: "file",
      name: "script.py",
      parentId: null,
      content: "print(1)",
    });
    if (!fileId.ok) throw new Error(fileId.error);

    render(<Editor doc={doc} fileId={fileId.value} workspaceReady />);

    expect(capturedProps.options?.readOnly).toBe(true);
    expect(capturedProps.options?.domReadOnly).toBe(true);
    expect(screen.getByText("You have view-only access to this project.")).toBeDefined();
  });

  it("auto-heals missing text in contentsMap for a known file node", async () => {
    const doc = new Y.Doc();
    const fileId = createNode(doc, {
      type: "file",
      name: "missing.ts",
      parentId: null,
      content: "const a = 1;",
    });
    if (!fileId.ok) throw new Error(fileId.error);

    // Delete the text entry from contents map
    doc.getMap("contents").delete(fileId.value);
    expect(doc.getMap("contents").has(fileId.value)).toBe(false);

    render(<Editor doc={doc} fileId={fileId.value} workspaceReady />);

    // Should be healed
    await waitFor(() => expect(doc.getMap("contents").has(fileId.value)).toBe(true));
  });

  it("displays binary file notice instead of attempting to open in Monaco", () => {
    const doc = new Y.Doc();
    const fileId = createNode(doc, {
      type: "file",
      name: "firmware.bin",
      parentId: null,
      contentKind: "binary",
      assetId: "asset-firmware-123",
      mimeType: "application/octet-stream",
    });
    if (!fileId.ok) throw new Error(fileId.error);

    render(<Editor doc={doc} fileId={fileId.value} workspaceReady />);

    expect(screen.queryByTestId("monaco-mock")).toBeNull();
    expect(screen.getByText("Binary file")).toBeDefined();
    expect(screen.getByText(/"firmware\.bin" cannot be edited/)).toBeDefined();
  });

  it("renders a clean empty state card when workspace is ready but no file is selected", () => {
    const doc = new Y.Doc();
    render(<Editor doc={doc} fileId={null} workspaceReady emptyWorkspace={false} />);

    expect(screen.queryByTestId("monaco-mock")).toBeNull();
    expect(screen.getByText("No file selected")).toBeDefined();
    expect(screen.getByText(/Select a file from the explorer sidebar/i)).toBeDefined();
  });
});
