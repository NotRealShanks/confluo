import * as Y from "yjs";
import { createNode, getFileText, snapshot } from "./ops";
import { nameKey, validateName } from "./names";
import type { TreeNode } from "./types";

export type TextImportEntry = { path: string; content: string };
export type BinaryImportEntry = { path: string; bytes: Uint8Array; mimeType: string };
export type ZipEntry = { path: string; bytes: Uint8Array };

export function normalizeImportPath(path: string): string | null {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\/+/, "");
  const parts = normalized.split("/");
  if (!normalized || parts.some((part) => !part || part === "." || part === ".." || part.includes("\0"))) {
    return null;
  }
  return parts.join("/");
}

export function isTextBuffer(buffer: ArrayBuffer): boolean {
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    for (const character of decoded) {
      const code = character.codePointAt(0)!;
      if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || (code >= 127 && code <= 159)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function pathForNode(view: ReturnType<typeof snapshot>, node: TreeNode): string {
  const names = [node.name];
  let parent = node.parentId ? view.nodes.get(node.parentId) : undefined;
  while (parent) {
    names.unshift(parent.name);
    parent = parent.parentId ? view.nodes.get(parent.parentId) : undefined;
  }

  return names.join("/");
}

export function nodeForPath(doc: Y.Doc, path: string): TreeNode | null {
  const normalized = normalizeImportPath(path);
  if (!normalized) return null;
  const view = snapshot(doc);
  return Array.from(view.nodes.values()).find((node) => nameKey(pathForNode(view, node)) === nameKey(normalized)) ?? null;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff);
}

function u32(value: number): Uint8Array {
  return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export function createZip(entries: ReadonlyArray<ZipEntry>): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.path);
    const data = entry.bytes;
    const crc = crc32(data);
    const header = concat([
      u32(0x04034b50), u16(20), u16(0x800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name,
    ]);
    local.push(header, data);
    central.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x800), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0),
      u16(0), u32(0), u32(offset), name,
    ]));
    offset += header.length + data.length;
  }

  const centralBytes = concat(central);
  return concat([
    concat(local),
    centralBytes,
    concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(centralBytes.length), u32(offset), u16(0)]),
  ]);
}

export function workspaceTextEntries(doc: Y.Doc): TextImportEntry[] {
  const view = snapshot(doc);
  return Array.from(view.nodes.values())
    .filter((node) => node.type === "file" && node.kind !== "binary")
    .map((node) => ({ path: pathForNode(view, node), content: getFileText(doc, node.id)?.toString() ?? "" }));
}

export function workspaceTextZipEntries(doc: Y.Doc): ZipEntry[] {
  return workspaceTextEntries(doc).map((entry) => ({ path: entry.path, bytes: new TextEncoder().encode(entry.content) }));
}

function parentForPath(doc: Y.Doc, parts: string[]): { ok: true; id: string | null } | { ok: false; error: string } {
  let parentId: string | null = null;
  for (const folderName of parts.slice(0, -1)) {
    const existing = Array.from(snapshot(doc).nodes.values()).find(
      (node) => node.type === "folder" && node.parentId === parentId && nameKey(node.name) === nameKey(folderName),
    );
    if (existing) parentId = existing.id;
    else {
      const created = createNode(doc, { type: "folder", name: folderName, parentId });
      if (!created.ok) return created;
      parentId = created.value;
    }
  }
  return { ok: true, id: parentId };
}

export function importEntry(doc: Y.Doc, entry: TextImportEntry, overwrite = false): { ok: true; id: string } | { ok: false; error: string } {
  const normalized = normalizeImportPath(entry.path);
  if (!normalized) return { ok: false, error: `Invalid import path: ${entry.path}` };
  const parts = normalized.split("/");
  for (const part of parts) {
    const valid = validateName(part);
    if (!valid.ok) return { ok: false, error: `Invalid import path: ${valid.error}` };
  }
  const filename = parts.at(-1)!;
  // Check duplicates before creating parent folders so a skipped file has no side effects.
  const before = snapshot(doc);
  const existingParent = parts.length === 1 ? null : Array.from(before.nodes.values()).find(
    (node) => node.type === "folder" && nameKey(pathForNode(before, node)) === nameKey(parts.slice(0, -1).join("/")),
  )?.id;
  const duplicate = Array.from(before.nodes.values()).find(
    (node) => node.type === "file" && node.parentId === existingParent && nameKey(node.name) === nameKey(filename),
  );
  if (duplicate && !overwrite) return { ok: false, error: `Duplicate file: ${normalized}` };
  const parent = parentForPath(doc, parts);
  if (!parent.ok) return parent;
  const existing = Array.from(snapshot(doc).nodes.values()).find(
    (node) => node.type === "file" && node.parentId === parent.id && nameKey(node.name) === nameKey(filename),
  );
  if (existing) {
    if (!overwrite) return { ok: false, error: `Duplicate file: ${normalized}` };
    const text = getFileText(doc, existing.id);
    if (text) {
      text.delete(0, text.length);
      text.insert(0, entry.content);
    } else {
      const node = doc.getMap("tree").get(existing.id);
      if (!(node instanceof Y.Map)) return { ok: false, error: "The file metadata is unavailable." };
      doc.transact(() => {
        node.delete("kind");
        node.delete("assetId");
        node.delete("mimeType");
        node.delete("size");
        doc.getMap("contents").set(existing.id, new Y.Text(entry.content));
      });
    }
    return { ok: true, id: existing.id };
  }
  const created = createNode(doc, { type: "file", name: filename, parentId: parent.id, content: entry.content });
  return created.ok ? { ok: true, id: created.value } : created;
}

export function importBinaryEntry(
  doc: Y.Doc,
  entry: BinaryImportEntry & { assetId: string },
  overwrite = false,
): { ok: true; id: string } | { ok: false; error: string } {
  const normalized = normalizeImportPath(entry.path);
  if (!normalized) return { ok: false, error: `Invalid import path: ${entry.path}` };
  const parts = normalized.split("/");
  for (const part of parts) {
    const valid = validateName(part);
    if (!valid.ok) return { ok: false, error: `Invalid import path: ${valid.error}` };
  }
  const filename = parts.at(-1)!;
  const before = snapshot(doc);
  const existingParent = parts.length === 1 ? null : Array.from(before.nodes.values()).find(
    (node) => node.type === "folder" && nameKey(pathForNode(before, node)) === nameKey(parts.slice(0, -1).join("/")),
  )?.id;
  const duplicate = Array.from(before.nodes.values()).find(
    (node) => node.type === "file" && node.parentId === existingParent && nameKey(node.name) === nameKey(filename),
  );
  if (duplicate && !overwrite) return { ok: false, error: `Duplicate file: ${normalized}` };
  const parent = parentForPath(doc, parts);
  if (!parent.ok) return parent;
  const existing = Array.from(snapshot(doc).nodes.values()).find(
    (node) => node.type === "file" && node.parentId === parent.id && nameKey(node.name) === nameKey(filename),
  );
  if (existing) {
    if (!overwrite) return { ok: false, error: `Duplicate file: ${normalized}` };
    const node = doc.getMap("tree").get(existing.id);
    if (!(node instanceof Y.Map)) return { ok: false, error: "The file metadata is unavailable." };
    node.set("kind", "binary");
    node.set("assetId", entry.assetId);
    node.set("mimeType", entry.mimeType);
    node.set("size", entry.bytes.byteLength);
    doc.getMap("contents").delete(existing.id);
    return { ok: true, id: existing.id };
  }
  const created = createNode(doc, {
    type: "file",
    name: filename,
    parentId: parent.id,
    contentKind: "binary",
    assetId: entry.assetId,
    mimeType: entry.mimeType,
    size: entry.bytes.byteLength,
  });
  return created.ok ? { ok: true, id: created.value } : created;
}
