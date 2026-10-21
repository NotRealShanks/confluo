import * as Y from "yjs";
import { buildTree, descendantIds, validateCreate, validateMove, validateRename, type TreeView } from "./tree";
import { fail, ok, type NodeType, type Result } from "./types";

const TREE_KEY = "tree";
const CONTENTS_KEY = "contents";
const LEGACY_TEXT_KEY = "monaco";
const DEFAULT_FILE_ID = "default-main";

// Each node is its own Y.Map, so one person renaming and another moving the same file both survive
function treeMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(TREE_KEY);
}

function contentsMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap(CONTENTS_KEY);
}

// Everything read from the shared document is untrusted: the id comes from the map key, never from the value
export function readRawNodes(doc: Y.Doc): unknown[] {
  const raw: unknown[] = [];
  treeMap(doc).forEach((value, id) => {
    if (value instanceof Y.Map) {
      raw.push({ id, type: value.get("type"), name: value.get("name"), parentId: value.get("parentId") });
    }
  });
  return raw;
}

export function snapshot(doc: Y.Doc): TreeView {
  return buildTree(readRawNodes(doc));
}

// The text of a file, or null when the node is gone or its content was tampered with
export function getFileText(doc: Y.Doc, id: string): Y.Text | null {
  const node = snapshot(doc).nodes.get(id);
  if (node?.type !== "file") return null;
  const text = contentsMap(doc).get(id);
  return text instanceof Y.Text ? text : null;
}

// Random, unguessable ids; getRandomValues also works on non-HTTPS pages where randomUUID does not
export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createNode(
  doc: Y.Doc,
  input: { type: NodeType; name: string; parentId: string | null; content?: string },
): Result<string> {
  const checked = validateCreate(snapshot(doc), input.parentId, input.type, input.name);
  if (!checked.ok) return checked;

  const id = newId();
  doc.transact(() => {
    const node = new Y.Map<unknown>();
    node.set("type", input.type);
    node.set("name", checked.value);
    node.set("parentId", input.parentId);
    treeMap(doc).set(id, node);
    if (input.type === "file") contentsMap(doc).set(id, new Y.Text(input.content ?? ""));
  });
  return ok(id);
}

export function renameNode(doc: Y.Doc, id: string, name: string): Result<null> {
  const checked = validateRename(snapshot(doc), id, name);
  if (!checked.ok) return checked;

  const node = treeMap(doc).get(id);
  if (!(node instanceof Y.Map)) return fail("That item no longer exists.");
  node.set("name", checked.value);
  return ok(null);
}

export function moveNode(doc: Y.Doc, id: string, newParentId: string | null): Result<null> {
  const checked = validateMove(snapshot(doc), id, newParentId);
  if (!checked.ok) return checked;

  const node = treeMap(doc).get(id);
  if (!(node instanceof Y.Map)) return fail("That item no longer exists.");
  node.set("parentId", newParentId);
  return ok(null);
}

// Deleting a folder removes everything inside it, in one transaction so nobody sees half of it
export function deleteNode(doc: Y.Doc, id: string): Result<null> {
  const view = snapshot(doc);
  if (!view.nodes.has(id)) return fail("That item no longer exists.");

  doc.transact(() => {
    for (const target of [id, ...descendantIds(view, id)]) {
      treeMap(doc).delete(target);
      contentsMap(doc).delete(target);
    }
  });
  return ok(null);
}

// Gives a project that has no files yet one main file, keeping any text written before multi-file existed.
// Call it only after the room has finished syncing. The fixed id makes two simultaneous calls converge.
export function ensureWorkspace(doc: Y.Doc): boolean {
  if (treeMap(doc).size > 0) return false;

  doc.transact(() => {
    const node = new Y.Map<unknown>();
    node.set("type", "file");
    node.set("name", "main.js");
    node.set("parentId", null);
    treeMap(doc).set(DEFAULT_FILE_ID, node);
    contentsMap(doc).set(DEFAULT_FILE_ID, new Y.Text(doc.getText(LEGACY_TEXT_KEY).toString()));
  });
  return true;
}
