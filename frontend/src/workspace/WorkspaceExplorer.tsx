import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import * as Y from "yjs";
import { useSelf } from "@liveblocks/react/suspense";
import { createNode, deleteNode, renameNode, snapshot } from "./ops";
import { descendantIds } from "./tree";
import type { TreeNode } from "./types";

type WorkspaceExplorerProps = {
  doc: Y.Doc;
  ready: boolean;
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
};

export default function WorkspaceExplorer({
  doc,
  ready,
  selectedFileId,
  onSelectFile,
}: WorkspaceExplorerProps) {
  const canWrite = useSelf((me) => me.canWrite);
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const view = snapshot(doc);

  useEffect(() => {
    const onUpdate = () => setRevision((value) => value + 1);
    doc.on("update", onUpdate);
    return () => doc.off("update", onUpdate);
  }, [doc]);

  useEffect(() => {
    if (!ready) return;
    const firstFile = Array.from(view.nodes.values()).find((node) => node.type === "file");
    if (!selectedFileId && firstFile) onSelectFile(firstFile.id);
  }, [ready, revision, selectedFileId, onSelectFile, view.nodes]);

  const perform = (result: { ok: true } | { ok: false; error: string }) => {
    if (!result.ok) window.alert(result.error);
  };

  const create = (type: "file" | "folder", parentId: string | null) => {
    const name = window.prompt(`Name for new ${type}`);
    if (name === null) return;
    const result = createNode(doc, { type, name, parentId });
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    if (type === "file") onSelectFile(result.value);
    if (parentId) setExpanded((current) => new Set(current).add(parentId));
  };

  const rename = (node: TreeNode) => {
    const name = window.prompt("New name", node.name);
    if (name !== null) perform(renameNode(doc, node.id, name));
  };

  const remove = (node: TreeNode) => {
    if (!window.confirm(`Delete ${node.name}?`)) return;
    const removedIds = new Set([node.id, ...descendantIds(view, node.id)]);
    perform(deleteNode(doc, node.id));
    if (selectedFileId && removedIds.has(selectedFileId)) {
      onSelectFile("");
    }
  };

  const renderNodes = (parentId: string | null, depth: number): ReactElement[] =>
    (view.children.get(parentId) ?? []).flatMap((node) => {
      const children = node.type === "folder" && expanded.has(node.id)
        ? renderNodes(node.id, depth + 1)
        : [];
      return [
        <li key={node.id}>
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 12}px` }}>
            {node.type === "folder" ? (
              <button
                type="button"
                aria-label={`${expanded.has(node.id) ? "Collapse" : "Expand"} ${node.name}`}
                onClick={() =>
                  setExpanded((current) => {
                    const next = new Set(current);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  })
                }
                className="w-5 text-gray-500"
              >
                {expanded.has(node.id) ? "▾" : "▸"}
              </button>
            ) : (
              <span className="w-5 text-gray-400">•</span>
            )}
            <button
              type="button"
              className={`min-w-0 flex-1 truncate rounded px-1 text-left ${
                node.id === selectedFileId ? "bg-blue-100 text-blue-900" : "text-gray-700"
              }`}
              onClick={() => node.type === "file" && onSelectFile(node.id)}
            >
              {view.displayNames.get(node.id) ?? node.name}
            </button>
            {canWrite && (
              <>
                <button type="button" aria-label={`Rename ${node.name}`} onClick={() => rename(node)} className="px-1 text-xs text-gray-500">
                  rename
                </button>
                <button type="button" aria-label={`Delete ${node.name}`} onClick={() => remove(node)} className="px-1 text-xs text-red-600">
                  delete
                </button>
              </>
            )}
          </div>
          {children}
        </li>,
      ];
    });

  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-3" aria-label="Workspace files">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Files</h2>
        {canWrite && (
          <span className="flex gap-2 text-xs">
            <button type="button" onClick={() => create("file", null)} className="text-blue-700 underline">New file</button>
            <button type="button" onClick={() => create("folder", null)} className="text-blue-700 underline">New folder</button>
          </span>
        )}
      </div>
      {!ready ? (
        <p className="text-sm text-gray-500">Synchronizing workspace…</p>
      ) : (
        <ul className="space-y-1 text-sm">{renderNodes(null, 0)}</ul>
      )}
      {view.truncated && <p className="mt-2 text-xs text-amber-700">Some items are hidden because this workspace is at its limit.</p>}
    </aside>
  );
}
