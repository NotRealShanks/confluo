import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import {
  createNode,
  deleteNode,
  ensureWorkspaceIfAllowed,
  getFileText,
  moveNode,
  renameNode,
  snapshot,
} from "./ops";
import { pathOf } from "./tree";
import { tabReducer, type TabState } from "./tabState";
import { importEntry, workspaceTextEntries } from "./fileManagement";

function syncSessions(clientA: Y.Doc, clientB: Y.Doc) {
  const updateA = Y.encodeStateAsUpdate(clientA);
  const updateB = Y.encodeStateAsUpdate(clientB);
  Y.applyUpdate(clientB, updateA);
  Y.applyUpdate(clientA, updateB);
}

describe("Real-time two-user collaboration session", () => {
  it("allows both users to open the same project and synchronizes edits between them", () => {
    // User A (Editor) and User B (Editor) open the same project room
    const userADoc = new Y.Doc();
    const userBDoc = new Y.Doc();

    // User A creates a file
    const fileResult = createNode(userADoc, {
      type: "file",
      name: "main.py",
      parentId: null,
      content: "def add(a, b):\n    return a + b\n",
    });
    expect(fileResult.ok).toBe(true);
    if (!fileResult.ok) return;
    const fileId = fileResult.value;

    // Changes sync to User B
    syncSessions(userADoc, userBDoc);

    // User B verifies the file exists and content matches
    expect(snapshot(userBDoc).nodes.has(fileId)).toBe(true);
    expect(getFileText(userBDoc, fileId)?.toString()).toBe("def add(a, b):\n    return a + b\n");

    // Simultaneous edits: User A edits line 1, User B appends a test call
    const textA = getFileText(userADoc, fileId)!;
    const textB = getFileText(userBDoc, fileId)!;

    textA.insert(0, "# Math utils\n");
    textB.insert(textB.length, "print(add(2, 3))\n");

    // Network sync happens
    syncSessions(userADoc, userBDoc);

    // Both converge on identical combined text
    const finalContentA = getFileText(userADoc, fileId)!.toString();
    const finalContentB = getFileText(userBDoc, fileId)!.toString();
    expect(finalContentA).toBe(finalContentB);
    expect(finalContentA).toContain("# Math utils");
    expect(finalContentA).toContain("def add(a, b):");
    expect(finalContentA).toContain("print(add(2, 3))");
  });

  it("synchronizes file and folder creation, renaming, moving, and deletion", () => {
    const userADoc = new Y.Doc();
    const userBDoc = new Y.Doc();

    // User A creates folder structure
    const srcResult = createNode(userADoc, { type: "folder", name: "src", parentId: null });
    expect(srcResult.ok).toBe(true);
    if (!srcResult.ok) return;
    const srcId = srcResult.value;

    const fileResult = createNode(userADoc, {
      type: "file",
      name: "temp.js",
      parentId: srcId,
      content: "console.log('test')",
    });
    expect(fileResult.ok).toBe(true);
    if (!fileResult.ok) return;
    const fileId = fileResult.value;

    syncSessions(userADoc, userBDoc);

    // User B renames file
    expect(renameNode(userBDoc, fileId, "index.js").ok).toBe(true);

    // User A creates another folder and moves index.js into it
    const libResult = createNode(userADoc, { type: "folder", name: "lib", parentId: null });
    if (!libResult.ok) throw new Error(libResult.error);
    const libId = libResult.value;

    syncSessions(userADoc, userBDoc);

    // User A moves the renamed file
    expect(moveNode(userADoc, fileId, libId).ok).toBe(true);

    syncSessions(userADoc, userBDoc);

    // Both users see the file at lib/index.js
    expect(pathOf(snapshot(userADoc), fileId)).toBe("lib/index.js");
    expect(pathOf(snapshot(userBDoc), fileId)).toBe("lib/index.js");

    // User B deletes the lib folder
    expect(deleteNode(userBDoc, libId).ok).toBe(true);

    syncSessions(userADoc, userBDoc);

    // Both see the deleted folder and nested file removed
    expect(snapshot(userADoc).nodes.has(libId)).toBe(false);
    expect(snapshot(userADoc).nodes.has(fileId)).toBe(false);
    expect(getFileText(userADoc, fileId)).toBeNull();
  });

  it("maintains tab states when files are deleted remotely across users", () => {
    const userADoc = new Y.Doc();
    const userBDoc = new Y.Doc();

    const f1 = (createNode(userADoc, { type: "file", name: "f1.js", parentId: null, content: "1" }) as { value: string }).value;
    const f2 = (createNode(userADoc, { type: "file", name: "f2.js", parentId: null, content: "2" }) as { value: string }).value;
    const f3 = (createNode(userADoc, { type: "file", name: "f3.js", parentId: null, content: "3" }) as { value: string }).value;

    syncSessions(userADoc, userBDoc);

    // User B has f1, f2, f3 open in tabs, currently viewing f2
    let userBTabs: TabState = { openFileIds: [f1, f2, f3], selectedFileId: f2 };

    // User A deletes f2
    deleteNode(userADoc, f2);

    syncSessions(userADoc, userBDoc);

    // User B reconciles open tabs against available files
    const validIds = Array.from(snapshot(userBDoc).nodes.values())
      .filter((n) => n.type === "file")
      .map((n) => n.id);

    userBTabs = tabReducer(userBTabs, { type: "reconcile", validFileIds: validIds });

    expect(userBTabs.openFileIds).toEqual([f1, f3]);
    // Active tab shifts cleanly to adjacent tab f3 without errors
    expect(userBTabs.selectedFileId).toBe(f3);
  });

  it("handles multi-file imports concurrently with local editing", () => {
    const userADoc = new Y.Doc();
    const userBDoc = new Y.Doc();

    // User A is actively working on a readme
    const readme = createNode(userADoc, { type: "file", name: "README.md", parentId: null, content: "# Welcome" });
    expect(readme.ok).toBe(true);

    // User B imports complete folder of files
    importEntry(userBDoc, { path: "src/utils.js", content: "export const pi = 3.14;" });
    importEntry(userBDoc, { path: "src/math.js", content: "export const sq = x => x*x;" });

    syncSessions(userADoc, userBDoc);

    // User A's work is preserved, and User B's imports appear in User A's workspace
    const entriesA = workspaceTextEntries(userADoc);
    expect(entriesA).toContainEqual({ path: "README.md", content: "# Welcome" });
    expect(entriesA).toContainEqual({ path: "src/utils.js", content: "export const pi = 3.14;" });
    expect(entriesA).toContainEqual({ path: "src/math.js", content: "export const sq = x => x*x;" });
  });

  it("prevents viewers from initializing an empty workspace", () => {
    const viewerDoc = new Y.Doc();
    // VIEWER (canInitialize = false)
    expect(ensureWorkspaceIfAllowed(viewerDoc, false)).toBe(false);
    expect(snapshot(viewerDoc).nodes.size).toBe(0);

    // EDITOR (canInitialize = true) on empty workspace also leaves it clean
    const editorDoc = new Y.Doc();
    expect(ensureWorkspaceIfAllowed(editorDoc, true)).toBe(false);
    expect(snapshot(editorDoc).nodes.size).toBe(0);
  });
});
