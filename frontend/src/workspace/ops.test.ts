import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import {
  createNode,
  deleteNode,
  ensureWorkspace,
  ensureWorkspaceIfAllowed,
  getFileText,
  moveNode,
  newId,
  readRawNodes,
  renameNode,
  snapshot,
} from "./ops";
import { displayNameOf, pathOf } from "./tree";

function sync(a: Y.Doc, b: Y.Doc) {
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a));
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b));
}

function idOf(result: { ok: true; value: string } | { ok: false; error: string }): string {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe("single document operations", () => {
  it("creates folders and files and reads them back with their text", () => {
    const doc = new Y.Doc();
    const src = idOf(createNode(doc, { type: "folder", name: "src", parentId: null }));
    const main = idOf(createNode(doc, { type: "file", name: "Main.java", parentId: src, content: "class Main {}" }));

    const view = snapshot(doc);
    expect(pathOf(view, main)).toBe("src/Main.java");
    expect(getFileText(doc, main)?.toString()).toBe("class Main {}");
    expect(getFileText(doc, src)).toBeNull();
  });

  it("rejects invalid creates without changing the document", () => {
    const doc = new Y.Doc();
    expect(createNode(doc, { type: "file", name: "../evil", parentId: null }).ok).toBe(false);
    expect(createNode(doc, { type: "file", name: "a.txt", parentId: "ghost" }).ok).toBe(false);
    idOf(createNode(doc, { type: "file", name: "a.txt", parentId: null }));
    expect(createNode(doc, { type: "file", name: "A.TXT", parentId: null }).ok).toBe(false);
    expect(readRawNodes(doc)).toHaveLength(1);
  });

  it("renames and moves without touching the file's text", () => {
    const doc = new Y.Doc();
    const dir = idOf(createNode(doc, { type: "folder", name: "dir", parentId: null }));
    const file = idOf(createNode(doc, { type: "file", name: "a.txt", parentId: null, content: "hello" }));
    const text = getFileText(doc, file);

    expect(renameNode(doc, file, "b.txt").ok).toBe(true);
    expect(moveNode(doc, file, dir).ok).toBe(true);

    expect(pathOf(snapshot(doc), file)).toBe("dir/b.txt");
    expect(getFileText(doc, file)).toBe(text);
    expect(text?.toString()).toBe("hello");
  });

  it("refuses to move a folder into itself", () => {
    const doc = new Y.Doc();
    const a = idOf(createNode(doc, { type: "folder", name: "a", parentId: null }));
    const b = idOf(createNode(doc, { type: "folder", name: "b", parentId: a }));
    expect(moveNode(doc, a, b).ok).toBe(false);
    expect(moveNode(doc, a, a).ok).toBe(false);
  });

  it("deletes a folder with everything inside it, including file contents", () => {
    const doc = new Y.Doc();
    const dir = idOf(createNode(doc, { type: "folder", name: "dir", parentId: null }));
    const inner = idOf(createNode(doc, { type: "folder", name: "inner", parentId: dir }));
    const f1 = idOf(createNode(doc, { type: "file", name: "a.txt", parentId: dir }));
    const f2 = idOf(createNode(doc, { type: "file", name: "b.txt", parentId: inner }));
    const keep = idOf(createNode(doc, { type: "file", name: "keep.txt", parentId: null }));

    expect(deleteNode(doc, dir).ok).toBe(true);

    const view = snapshot(doc);
    expect(Array.from(view.nodes.keys())).toEqual([keep]);
    expect(getFileText(doc, f1)).toBeNull();
    expect(getFileText(doc, f2)).toBeNull();
    expect(doc.getMap("contents").size).toBe(1);
    expect(deleteNode(doc, dir).ok).toBe(false);
  });

  it("generates long random ids that pass the id pattern", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("two people editing at once", () => {
  it("keeps both a rename and a move of the same file", () => {
    const a = new Y.Doc();
    const dir = idOf(createNode(a, { type: "folder", name: "dir", parentId: null }));
    const file = idOf(createNode(a, { type: "file", name: "old.txt", parentId: null }));
    const b = new Y.Doc();
    sync(a, b);

    renameNode(a, file, "new.txt");
    moveNode(b, file, dir);
    sync(a, b);

    for (const doc of [a, b]) {
      expect(pathOf(snapshot(doc), file)).toBe("dir/new.txt");
    }
  });

  it("shows two files created with the same name as two distinct entries", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    idOf(createNode(a, { type: "file", name: "notes.md", parentId: null }));
    idOf(createNode(b, { type: "file", name: "notes.md", parentId: null }));
    sync(a, b);

    const viewA = snapshot(a);
    const viewB = snapshot(b);
    expect(viewA.nodes.size).toBe(2);
    expect(Array.from(viewA.displayNames.values()).sort()).toEqual(["notes (2).md", "notes.md"]);
    expect(Array.from(viewB.displayNames.entries()).sort()).toEqual(Array.from(viewA.displayNames.entries()).sort());
  });

  it("resolves opposite folder moves without a loop, losing nothing", () => {
    const a = new Y.Doc();
    const x = idOf(createNode(a, { type: "folder", name: "x", parentId: null }));
    const y = idOf(createNode(a, { type: "folder", name: "y", parentId: null }));
    const leaf = idOf(createNode(a, { type: "file", name: "leaf.txt", parentId: y }));
    const b = new Y.Doc();
    sync(a, b);

    moveNode(a, x, y);
    moveNode(b, y, x);
    sync(a, b);

    for (const doc of [a, b]) {
      const view = snapshot(doc);
      expect(view.nodes.size).toBe(3);
      expect(pathOf(view, leaf)).toMatch(/leaf\.txt$/);
      for (const node of view.nodes.values()) {
        expect(pathOf(view, node.id)?.split("/").length).toBeLessThanOrEqual(3);
      }
    }
    expect(Array.from(snapshot(a).nodes.values()).map((n) => `${n.id}:${n.parentId}`).sort()).toEqual(
      Array.from(snapshot(b).nodes.values()).map((n) => `${n.id}:${n.parentId}`).sort(),
    );
  });

  it("keeps a file created inside a folder that someone else deleted, at the top level", () => {
    const a = new Y.Doc();
    const dir = idOf(createNode(a, { type: "folder", name: "dir", parentId: null }));
    const b = new Y.Doc();
    sync(a, b);

    deleteNode(a, dir);
    const created = idOf(createNode(b, { type: "file", name: "late.txt", parentId: dir, content: "keep me" }));
    sync(a, b);

    for (const doc of [a, b]) {
      expect(snapshot(doc).nodes.get(created)?.parentId).toBeNull();
      expect(getFileText(doc, created)?.toString()).toBe("keep me");
    }
  });

  it("merges two people typing into the same file", () => {
    const a = new Y.Doc();
    const file = idOf(createNode(a, { type: "file", name: "a.txt", parentId: null, content: "base" }));
    const b = new Y.Doc();
    sync(a, b);

    getFileText(a, file)?.insert(0, "A:");
    getFileText(b, file)?.insert(4, ":B");
    sync(a, b);

    expect(getFileText(a, file)?.toString()).toBe(getFileText(b, file)?.toString());
    expect(getFileText(a, file)?.toString()).toBe("A:base:B");
  });
});

describe("ensureWorkspace", () => {
  it("does not initialize an empty workspace for a read-only guest", () => {
    const doc = new Y.Doc();

    expect(ensureWorkspaceIfAllowed(doc, false)).toBe(false);
    expect(snapshot(doc).nodes.size).toBe(0);
  });

  it.each(["owner", "editor"])("initializes an empty workspace for an authorized %s", () => {
    const doc = new Y.Doc();

    expect(ensureWorkspaceIfAllowed(doc, true)).toBe(true);
    expect(snapshot(doc).nodes.size).toBe(1);
  });

  it("creates one main file, carrying over text from before multi-file existed", () => {
    const doc = new Y.Doc();
    doc.getText("monaco").insert(0, "console.log('legacy');");

    expect(ensureWorkspace(doc)).toBe(true);
    const view = snapshot(doc);
    expect(view.nodes.size).toBe(1);
    const [node] = Array.from(view.nodes.values());
    expect(displayNameOf(view, node.id)).toBe("main.js");
    expect(getFileText(doc, node.id)?.toString()).toBe("console.log('legacy');");
  });

  it("does nothing once a workspace exists", () => {
    const doc = new Y.Doc();
    idOf(createNode(doc, { type: "file", name: "a.txt", parentId: null }));
    expect(ensureWorkspace(doc)).toBe(false);
    expect(snapshot(doc).nodes.size).toBe(1);
  });

  it("keeps the workspace empty after deleting its only file", () => {
    const doc = new Y.Doc();
    const file = idOf(createNode(doc, { type: "file", name: "main.js", parentId: null }));

    ensureWorkspace(doc);
    expect(deleteNode(doc, file).ok).toBe(true);
    expect(snapshot(doc).nodes.size).toBe(0);
    expect(ensureWorkspace(doc)).toBe(false);
    expect(snapshot(doc).nodes.size).toBe(0);
  });

  it("converges to a single main file when two people open a new project together", () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    ensureWorkspace(a);
    ensureWorkspace(b);
    sync(a, b);

    expect(snapshot(a).nodes.size).toBe(1);
    expect(snapshot(b).nodes.size).toBe(1);
  });

  it("does not reinitialize after a reconnect-style sync following deletion", () => {
    const owner = new Y.Doc();
    const editor = new Y.Doc();
    ensureWorkspace(owner);
    sync(owner, editor);

    const file = Array.from(snapshot(owner).nodes.keys())[0];
    deleteNode(owner, file);
    sync(owner, editor);

    expect(snapshot(owner).nodes.size).toBe(0);
    expect(snapshot(editor).nodes.size).toBe(0);
    expect(ensureWorkspace(editor)).toBe(false);
    expect(snapshot(editor).nodes.size).toBe(0);
  });

  it("does not migrate stale legacy text after a remote workspace arrives", () => {
    const remote = new Y.Doc();
    const remoteFile = idOf(createNode(remote, { type: "file", name: "remote.js", parentId: null, content: "remote" }));
    const local = new Y.Doc();
    local.getText("monaco").insert(0, "stale local text");

    sync(remote, local);

    expect(ensureWorkspace(local)).toBe(false);
    expect(snapshot(local).nodes.has(remoteFile)).toBe(true);
    expect(getFileText(local, remoteFile)?.toString()).toBe("remote");
    expect(snapshot(local).nodes.size).toBe(1);
  });
});

describe("a hostile collaborator writing straight into the shared document", () => {
  it("cannot get junk, unsafe names or spoofed ids into the tree", () => {
    const doc = new Y.Doc();
    const tree = doc.getMap("tree");
    tree.set("string-entry", "not a map");
    tree.set("number-entry", 7);

    const evil = new Y.Map<unknown>();
    evil.set("id", "someone-else");
    evil.set("type", "file");
    evil.set("name", "../../etc/passwd");
    evil.set("parentId", null);
    tree.set("evil", evil);

    const spoof = new Y.Map<unknown>();
    spoof.set("id", "claimed-id");
    spoof.set("type", "file");
    spoof.set("name", "fine.txt");
    spoof.set("parentId", { not: "a string" });
    tree.set("real-id", spoof);

    const view = snapshot(doc);
    expect(Array.from(view.nodes.keys())).toEqual(["real-id"]);
    expect(view.nodes.get("real-id")?.parentId).toBeNull();
  });

  it("returns no text when a file's content entry was replaced by something else", () => {
    const doc = new Y.Doc();
    const id = idOf(createNode(doc, { type: "file", name: "a.txt", parentId: null, content: "x" }));
    doc.getMap("contents").set(id, "not a Y.Text");
    expect(getFileText(doc, id)).toBeNull();
  });
});
