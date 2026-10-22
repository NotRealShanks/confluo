import * as Y from "yjs";
import { describe, expect, it } from "vitest";
import { createZip, importEntry, normalizeImportPath, workspaceEntries } from "./fileManagement";
import { snapshot } from "./ops";

describe("file management", () => {
  it("rejects traversal and preserves nested imports", () => {
    expect(normalizeImportPath("../secret")).toBeNull();
    const doc = new Y.Doc();
    expect(importEntry(doc, { path: "src/main.js", content: "console.log(1)" }).ok).toBe(true);
    expect(workspaceEntries(doc)).toEqual([{ path: "src/main.js", content: "console.log(1)" }]);
    expect(snapshot(doc).nodes.size).toBe(2);
  });

  it("requires explicit overwrite for duplicate files", () => {
    const doc = new Y.Doc();
    importEntry(doc, { path: "README.md", content: "old" });
    expect(importEntry(doc, { path: "README.md", content: "new" }).ok).toBe(false);
    expect(importEntry(doc, { path: "README.md", content: "new" }, true).ok).toBe(true);
    expect(workspaceEntries(doc)[0].content).toBe("new");
  });

  it("creates a ZIP signature for project entries", () => {
    const zip = createZip([{ path: "src/main.js", content: "console.log(1)" }]);
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
