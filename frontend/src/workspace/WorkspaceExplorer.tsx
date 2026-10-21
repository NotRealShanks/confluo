import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import * as Y from "yjs";
import { useSelf } from "@liveblocks/react/suspense";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  Copy,
  FileCode2,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { createNode, deleteNode, renameNode, snapshot } from "./ops";
import { getContextMenuPosition } from "./contextMenu";
import { descendantIds } from "./tree";
import type { TreeNode } from "./types";

type WorkspaceExplorerProps = {
  doc: Y.Doc;
  ready: boolean;
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
};

type ContextMenu = { x: number; y: number; node: TreeNode | null };

export default function WorkspaceExplorer({
  doc,
  ready,
  selectedFileId,
  onSelectFile,
}: WorkspaceExplorerProps) {
  const canWrite = useSelf((me) => me.canWrite);
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const explorerRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (selectedFileId && view.nodes.get(selectedFileId)?.type !== "file") onSelectFile("");
  }, [selectedFileId, onSelectFile, view.nodes]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
      if (event.key === "F2" && canWrite && selectedFileId) {
        const node = view.nodes.get(selectedFileId);
        if (node) {
          event.preventDefault();
          const name = window.prompt("New name", node.name);
          if (name !== null) perform(renameNode(doc, node.id, name));
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canWrite, doc, selectedFileId, view.nodes]);

  const pathFor = (node: TreeNode) => {
    const names = [node.name];
    let parent = node.parentId ? view.nodes.get(node.parentId) : undefined;
    while (parent) {
      names.unshift(parent.name);
      parent = parent.parentId ? view.nodes.get(parent.parentId) : undefined;
    }
    return names.join("/");
  };

  const copyPath = async (node: TreeNode, relative = false) => {
    const path = pathFor(node);
    try {
      await navigator.clipboard.writeText(relative ? path : `workspace/${path}`);
    } catch {
      window.alert("Could not copy the path.");
    }
    setContextMenu(null);
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
          <div
            className={`ide-tree-row ${node.id === selectedFileId ? "is-selected" : ""}`}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                ...getContextMenuPosition(event.clientX, event.clientY, window.innerWidth, window.innerHeight),
                node,
              });
            }}
          >
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
                className="ide-tree-chevron"
              >
                {expanded.has(node.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="ide-tree-chevron" />
            )}
            <button
              type="button"
              className="ide-tree-label"
              onClick={() => node.type === "file" && onSelectFile(node.id)}
            >
              {node.type === "folder" ? <Folder size={15} /> : <FileCode2 size={15} />}
              {view.displayNames.get(node.id) ?? node.name}
            </button>
          </div>
          {children}
        </li>,
      ];
    });

  return (
    <aside ref={explorerRef} className="ide-explorer" aria-label="Workspace files">
      <div className="ide-explorer-heading">
        <h2>EXPLORER</h2>
        {canWrite && (
          <div className="ide-explorer-actions">
            <button type="button" title="New file" aria-label="New file" onClick={() => create("file", null)}><Plus size={16} /></button>
            <button type="button" title="New folder" aria-label="New folder" onClick={() => create("folder", null)}><FolderPlus size={16} /></button>
            <button type="button" title="Refresh" aria-label="Refresh" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={15} /></button>
            <button type="button" title="Collapse all" aria-label="Collapse all" onClick={() => setExpanded(new Set())}><ChevronsDownUp size={15} /></button>
          </div>
        )}
      </div>
      {!ready ? (
        <p className="ide-explorer-message">Synchronizing workspace…</p>
      ) : (
        <ul className="ide-tree" onContextMenu={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          setContextMenu({
            ...getContextMenuPosition(event.clientX, event.clientY, window.innerWidth, window.innerHeight),
            node: null,
          });
        }}>{renderNodes(null, 0)}</ul>
      )}
      {view.truncated && <p className="ide-explorer-message warning">Some items are hidden because this workspace is at its limit.</p>}
      {contextMenu && (
        <div className="ide-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu" onClick={(event) => event.stopPropagation()}>
          {canWrite && (
            <>
              <button type="button" role="menuitem" onClick={() => {
                setContextMenu(null);
                create("file", contextMenu.node?.type === "folder" ? contextMenu.node.id : null);
              }}><Plus size={14} /> New File</button>
              <button type="button" role="menuitem" onClick={() => {
                setContextMenu(null);
                create("folder", contextMenu.node?.type === "folder" ? contextMenu.node.id : null);
              }}><FolderPlus size={14} /> New Folder</button>
            </>
          )}
          {canWrite && contextMenu.node && (
            <>
              <div className="ide-menu-divider" />
              <button type="button" role="menuitem" onClick={() => { rename(contextMenu.node!); setContextMenu(null); }}><Pencil size={14} /> Rename <kbd>F2</kbd></button>
              <button type="button" role="menuitem" onClick={() => { remove(contextMenu.node!); setContextMenu(null); }}><Trash2 size={14} /> Delete</button>
            </>
          )}
          {contextMenu.node && (
            <>
              <div className="ide-menu-divider" />
              <button type="button" role="menuitem" onClick={() => copyPath(contextMenu.node!)}><Copy size={14} /> Copy Path</button>
              <button type="button" role="menuitem" onClick={() => copyPath(contextMenu.node!, true)}><Copy size={14} /> Copy Relative Path</button>
              <button type="button" role="menuitem" onClick={() => { explorerRef.current?.scrollIntoView({ block: "nearest" }); setContextMenu(null); }}><Folder size={14} /> Reveal in Workspace</button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
