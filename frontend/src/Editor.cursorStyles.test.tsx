// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Editor from "./Editor";

const shared = vi.hoisted(() => ({ doc: null as unknown, awareness: null as unknown, model: {} as unknown, bindings: 0 }));

vi.mock("@liveblocks/react/suspense", () => ({
  useRoom: () => ({}),
  useSelf: (select?: (me: unknown) => unknown) => {
    const me = { id: "me-1", info: { name: "Me" }, canWrite: true };
    return select ? select(me) : me;
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
  getYjsProviderForRoom: () => ({ getYDoc: () => shared.doc, awareness: shared.awareness }),
}));
vi.mock("y-monaco", () => ({
  MonacoBinding: class {
    constructor() { shared.bindings++; }
    destroy() {}
  },
}));
vi.mock("@monaco-editor/react", async () => {
  const { useEffect } = await import("react");
  const fakeEditor = { getModel: () => shared.model, onDidChangeCursorSelection: () => ({ dispose: () => {} }) };
  const fakeMonaco = { editor: { CursorChangeReason: { Explicit: 3 } } };
  return {
    Editor: ({ onMount }: { onMount: (editor: unknown, monaco: unknown) => void }) => {
      useEffect(() => { onMount(fakeEditor, fakeMonaco); }, []);
      return <div />;
    },
  };
});

// Simulates another browser publishing its awareness state
function publishRemote(clientId: number, user: unknown) {
  const awareness = shared.awareness as Awareness;
  awareness.states.set(clientId, { user });
  awareness.emit("change", [{ added: [clientId], updated: [], removed: [] }, "remote"]);
}

function injectedCss(): string {
  const styles = Array.from(document.head.querySelectorAll("style"));
  return styles.map((style) => style.textContent ?? "").join("\n");
}

beforeEach(() => {
  const doc = new Y.Doc();
  shared.doc = doc;
  shared.awareness = new Awareness(doc);
  shared.model = {};
  shared.bindings = 0;
});

afterEach(() => {
  cleanup();
  document.head.innerHTML = "";
});

describe("remote cursor styles", () => {
  it("does not create a binding for a Monaco model disposed during a file switch", () => {
    shared.model = null;
    const doc = shared.doc as Y.Doc;
    doc.getMap("tree").set("file", new Y.Map());
    const node = doc.getMap("tree").get("file") as Y.Map<unknown>;
    node.set("type", "file"); node.set("name", "imported.js"); node.set("parentId", null);
    doc.getMap("contents").set("file", new Y.Text("export {}"));

    expect(() => render(<Editor doc={doc} fileId="file" workspaceReady />)).not.toThrow();
    expect(shared.bindings).toBe(0);
  });

  it("renders a legitimate collaborator's name and color", () => {
    render(<Editor />);
    publishRemote(101, { name: "Maya", color: "hsl(10 70% 45%)", showName: true });

    const css = injectedCss();
    expect(css).toContain("--user-color: hsl(10 70% 45%);");
    expect(css).toContain('.yRemoteSelectionHead-101::after');
    expect(css).toContain('content: "Maya";');
  });

  it("keeps a malicious name inside its string and never opens a new rule", () => {
    render(<Editor />);
    publishRemote(102, {
      name: '"; } body { display: none } .x::after { content: "',
      color: "hsl(10 70% 45%)",
      showName: true,
    });

    const css = injectedCss();
    // Two rules per collaborator (ours and the remote one), so four braces in total
    expect(css.match(/\{/g)).toHaveLength(4);
    expect(css.match(/\}/g)).toHaveLength(4);
    expect(css).not.toContain("display: none");
    // The leftover letters are inert text inside a quoted string with no way out of it
    for (const [, value] of css.matchAll(/content: "([^\n]*)";/g)) {
      expect(value).not.toMatch(/["{};:\\]/);
    }
  });

  it("replaces a malicious color with the safe fallback", () => {
    render(<Editor />);
    publishRemote(103, { name: "Eve", color: "red; } * { display: none } .y {", showName: true });

    const css = injectedCss();
    expect(css).not.toContain("display: none");
    expect(css).not.toContain("red");
    expect(css).toContain("--user-color: hsl(210 70% 45%);");
  });

  it("survives a state that is not even an object", () => {
    render(<Editor />);
    publishRemote(104, "not an object");
    publishRemote(105, { name: { toString: () => '"; }' }, color: 7, showName: true });

    const css = injectedCss();
    expect(css).not.toContain('"; }');
    expect(css).toContain('content: "";');
  });
});
