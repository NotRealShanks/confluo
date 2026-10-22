import type * as Y from "yjs";
import { createNode, getFileText, snapshot } from "./ops";
import type { TreeNode } from "./types";

export type ImportEntry = { path: string; content: string };

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
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
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

export function createZip(entries: ReadonlyArray<ImportEntry>): Uint8Array {
  const encoder = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = encoder.encode(entry.content);
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

export function workspaceEntries(doc: Y.Doc): ImportEntry[] {
  const view = snapshot(doc);
  return Array.from(view.nodes.values())
    .filter((node) => node.type === "file")
    .map((node) => ({ path: pathForNode(view, node), content: getFileText(doc, node.id)?.toString() ?? "" }));
}

export function importEntry(doc: Y.Doc, entry: ImportEntry, overwrite = false): { ok: true; id: string } | { ok: false; error: string } {
  const normalized = normalizeImportPath(entry.path);
  if (!normalized) return { ok: false, error: `Invalid import path: ${entry.path}` };
  const parts = normalized.split("/");
  let parentId: string | null = null;
  for (const folderName of parts.slice(0, -1)) {
    const existing = Array.from(snapshot(doc).nodes.values()).find(
      (node) => node.type === "folder" && node.parentId === parentId && node.name === folderName,
    );
    if (existing) parentId = existing.id;
    else {
      const created = createNode(doc, { type: "folder", name: folderName, parentId });
      if (!created.ok) return created;
      parentId = created.value;
    }
  }
  const filename = parts.at(-1)!;
  const existing = Array.from(snapshot(doc).nodes.values()).find(
    (node) => node.type === "file" && node.parentId === parentId && node.name === filename,
  );
  if (existing) {
    if (!overwrite) return { ok: false, error: `Duplicate file: ${normalized}` };
    const text = getFileText(doc, existing.id);
    text?.delete(0, text.length);
    text?.insert(0, entry.content);
    return { ok: true, id: existing.id };
  }
  const created = createNode(doc, { type: "file", name: filename, parentId, content: entry.content });
  return created.ok ? { ok: true, id: created.value } : created;
}
