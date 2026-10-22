import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import { createZip, importBinaryEntry, importEntry, normalizeImportPath, workspaceTextEntries } from "./fileManagement";
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
});
