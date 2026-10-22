import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import { createZip, importBinaryEntry, importEntry, isTextBuffer, normalizeImportPath, workspaceTextEntries } from "./fileManagement";
import { getFileText, snapshot } from "./ops";

describe("file management", () => {
  it("rejects traversal and preserves nested imports", () => {
    expect(normalizeImportPath("../secret")).toBeNull();
    const doc = new Y.Doc();
    expect(importEntry(doc, { path: "src/main.js", content: "console.log(1)" }).ok).toBe(true);
    expect(workspaceTextEntries(doc)).toEqual([{ path: "src/main.js", content: "console.log(1)" }]);
    expect(snapshot(doc).nodes.size).toBe(2);
  });

  it("requires explicit overwrite for duplicate files", () => {
    const doc = new Y.Doc();
    importEntry(doc, { path: "README.md", content: "old" });
    expect(importEntry(doc, { path: "README.md", content: "new" }).ok).toBe(false);
    expect(importEntry(doc, { path: "README.md", content: "new" }, true).ok).toBe(true);
    expect(workspaceTextEntries(doc)[0].content).toBe("new");
  });

  it("imports UTF-8 Markdown under nested paths and leaves no folder behind for a skipped duplicate", () => {
    const doc = new Y.Doc();
    const content = "# नमस्ते 🌍\r\n";
    expect(importEntry(doc, { path: "docs/guide.markdown", content }).ok).toBe(true);
    expect(importEntry(doc, { path: "skipped/guide.markdown", content: "present" }).ok).toBe(true);
    const beforeSkip = snapshot(doc).nodes.size;
    expect(importEntry(doc, { path: "skipped/guide.markdown", content: "duplicate" }).ok).toBe(false);
    expect(snapshot(doc).nodes.size).toBe(beforeSkip);
    expect(importEntry(doc, { path: "docs/guide.markdown", content: "replacement" }).ok).toBe(false);
    expect(snapshot(doc).nodes.size).toBe(4);
    expect(workspaceTextEntries(doc)).toContainEqual({ path: "docs/guide.markdown", content });
  });

  it("rejects invalid UTF-8 and binary control bytes as text", () => {
    expect(isTextBuffer(Uint8Array.from([0xc3, 0x28]).buffer)).toBe(false);
    expect(isTextBuffer(Uint8Array.from([0x00, 0x01, 0x41]).buffer)).toBe(false);
    expect(isTextBuffer(new TextEncoder().encode("line one\r\nline two\t✓").buffer)).toBe(true);
  });

  it("creates a ZIP signature for project entries", () => {
    const pdfBytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff]);
    const doc = new Y.Doc();
    const imported = importBinaryEntry(doc, {
      path: "docs/manual.pdf",
      bytes: pdfBytes,
      mimeType: "application/pdf",
      assetId: "507f1f77bcf86cd799439011",
    });
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(getFileText(doc, imported.id)).toBeNull();
    const zip = createZip([
      { path: "src/main.js", bytes: new TextEncoder().encode("console.log(1)") },
      { path: "docs/manual.pdf", bytes: pdfBytes },
    ]);
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(Array.from(zip)).toContain(0xff);
  });

  it("can overwrite a binary asset with text without leaving it in binary state", () => {
    const doc = new Y.Doc();
    const bytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const binary = importBinaryEntry(doc, { path: "docs/guide.pdf", bytes, mimeType: "application/pdf", assetId: "asset-1" });
    expect(binary.ok).toBe(true);
    const text = importEntry(doc, { path: "docs/guide.pdf", content: "markdown text" }, true);
    expect(text.ok).toBe(true);
    if (!text.ok) return;
    expect(snapshot(doc).nodes.get(text.id)?.kind).toBeUndefined();
    expect(snapshot(doc).nodes.get(text.id)?.assetId).toBeUndefined();
    expect(getFileText(doc, text.id)?.toString()).toBe("markdown text");
  });
});
