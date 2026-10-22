import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import * as Y from "yjs";
import { useSelf } from "@liveblocks/react/suspense";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  Copy,
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
import { fileIcon } from "./fileIcon";

type WorkspaceExplorerProps = {
  doc: Y.Doc;
  ready: boolean;
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  createFileRequest?: number;
};

type ContextMenu = { x: number; y: number; node: TreeNode | null };
type InlineOperation =
  | { kind: "create"; type: "file" | "folder"; parentId: string | null; name: string; error: string }
  | { kind: "rename"; nodeId: string; name: string; error: string };

export default function WorkspaceExplorer({
  doc,
  ready,
  selectedFileId,
  onSelectFile,
  createFileRequest = 0,
}: WorkspaceExplorerProps) {
  const canWrite = useSelf((me) => me.canWrite);
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [inlineOperation, setInlineOperation] = useState<InlineOperation | null>(null);
  const [deleteNodeTarget, setDeleteNodeTarget] = useState<TreeNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const lastCreateFileRequest = useRef(0);
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
    if (selectedFolderId && view.nodes.get(selectedFolderId)?.type !== "folder") {
      setSelectedFolderId(null);
    }
  }, [selectedFolderId, view.nodes]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (inlineOperation) {
      inlineInputRef.current?.focus();
      if (inlineOperation.kind === "rename") inlineInputRef.current?.select();
    }
  }, [inlineOperation]);

  const beginNewFile = (parentId: string | null) => {
    setContextMenu(null);
    setInlineOperation({ kind: "create", type: "file", parentId, name: "", error: "" });
    if (parentId) setExpanded((current) => new Set(current).add(parentId));
  };

  useEffect(() => {
    if (createFileRequest > 0 && createFileRequest !== lastCreateFileRequest.current) {
      lastCreateFileRequest.current = createFileRequest;
      beginNewFile(selectedFolderId);
    }
  }, [createFileRequest, selectedFolderId]);

  const create = (type: "file" | "folder", parentId: string | null) => {
    setContextMenu(null);
    setInlineOperation({ kind: "create", type, parentId, name: "", error: "" });
    if (parentId) setExpanded((current) => new Set(current).add(parentId));
  };

  const rename = (node: TreeNode) => {
    setContextMenu(null);
    setInlineOperation({ kind: "rename", nodeId: node.id, name: node.name, error: "" });
  };

  const cancelInlineOperation = () => setInlineOperation(null);

  const confirmInlineOperation = () => {
    if (!inlineOperation) return;
    if (inlineOperation.kind === "create") {
      const result = createNode(doc, {
        type: inlineOperation.type,
        name: inlineOperation.name,
        parentId: inlineOperation.parentId,
      });
      if (!result.ok) {
        setInlineOperation((current) => current ? { ...current, error: result.error } : current);
        return;
      }
      if (inlineOperation.type === "file" && result.value) {
        setSelectedFolderId(null);
        onSelectFile(result.value);
      }
      const parentId = inlineOperation.parentId;
      if (parentId) setExpanded((current) => new Set(current).add(parentId));
      if (inlineOperation.type === "folder") {
        setExpanded((current) => new Set(current).add(result.value));
      }
    } else {
      const result = renameNode(doc, inlineOperation.nodeId, inlineOperation.name);
      if (!result.ok) {
        setInlineOperation((current) => current ? { ...current, error: result.error } : current);
        return;
      }
    }
    cancelInlineOperation();
  };

  useEffect(() => {
    if (!inlineOperation) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !inlineInputRef.current?.contains(event.target)) {
        cancelInlineOperation();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [inlineOperation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setDeleteNodeTarget(null);
        cancelInlineOperation();
      }
      if (event.key === "F2" && canWrite && selectedFileId) {
        const node = view.nodes.get(selectedFileId);
        if (node) {
          event.preventDefault();
          rename(node);
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
      setMessage("Could not copy the path.");
    }
    setContextMenu(null);
  };

  const remove = (node: TreeNode) => {
    setDeleteNodeTarget(node);
    setContextMenu(null);
  };

  const confirmDelete = () => {
    if (!deleteNodeTarget || deleting) return;
    setDeleting(true);
    const node = deleteNodeTarget;
    const removedIds = new Set([node.id, ...descendantIds(view, node.id)]);
    const result = deleteNode(doc, node.id);
    if (!result.ok) {
      setMessage(result.error);
      setDeleting(false);
      return;
    }
    if (selectedFileId && removedIds.has(selectedFileId)) {
      onSelectFile("");
    }
    setDeleteNodeTarget(null);
    setDeleting(false);
  };

  const renderNodes = (parentId: string | null, depth: number): ReactElement[] => {
    const nodes = (view.children.get(parentId) ?? []).flatMap((node) => {
      const children = node.type === "folder" && expanded.has(node.id)
        ? renderNodes(node.id, depth + 1)
        : [];
      return [
        <li key={node.id}>
          <div
            className={`ide-tree-row ${node.id === selectedFileId || node.id === selectedFolderId ? "is-selected" : ""}`}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({
                ...getContextMenuPosition(event.clientX, event.clientY, window.innerWidth, window.innerHeight),
                node,
              });
            }}
          >
            {inlineOperation?.kind === "rename" && inlineOperation.nodeId === node.id ? (
              <div className="ide-inline-editor">
                <input
                  ref={inlineInputRef}
                  aria-label={`Rename ${node.name}`}
                  value={inlineOperation.name}
                  onChange={(event) => setInlineOperation((current) => current && { ...current, name: event.target.value, error: "" })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") confirmInlineOperation();
                    if (event.key === "Escape") cancelInlineOperation();
                  }}
                  className="ide-new-file-input"
                />
                {inlineOperation.error && <span className="ide-new-file-error">{inlineOperation.error}</span>}
              </div>
            ) : node.type === "folder" ? (
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
              onClick={() => {
                if (node.type === "file") {
                  setSelectedFolderId(null);
                  onSelectFile(node.id);
                } else {
                  setSelectedFolderId(node.id);
                  onSelectFile("");
                }
              }}
            >
              {fileIcon(node.name, node.type, expanded.has(node.id))}
              {view.displayNames.get(node.id) ?? node.name}
            </button>
          </div>
          {children}
        </li>,
      ];
    });
    if (inlineOperation?.kind === "create" && inlineOperation.parentId === parentId) {
      nodes.unshift(
        <li key="new-file" className="ide-new-file-entry" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          {fileIcon(inlineOperation.type === "folder" ? "folder" : "new-file", inlineOperation.type)}
          <div className="ide-new-file-editor">
            <input
              ref={inlineInputRef}
              aria-label={`New ${inlineOperation.type} name`}
              value={inlineOperation.name}
              onChange={(event) => {
                setInlineOperation((current) => current && { ...current, name: event.target.value, error: "" });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirmInlineOperation();
                if (event.key === "Escape") cancelInlineOperation();
              }}
              placeholder={inlineOperation.type === "file" ? "filename.ext" : "folder name"}
              className="ide-new-file-input"
            />
            {inlineOperation.error && <span className="ide-new-file-error">{inlineOperation.error}</span>}
          </div>
        </li>,
      );
    }
    return nodes;
  };

  return (
    <aside ref={explorerRef} className="ide-explorer" aria-label="Workspace files">
      <div className="ide-explorer-heading">
        <h2>EXPLORER</h2>
        {canWrite && (
          <div className="ide-explorer-actions">
            <button type="button" title="New file" aria-label="New file" onClick={() => beginNewFile(selectedFolderId)}><Plus size={16} /></button>
            <button type="button" title="New folder" aria-label="New folder" onClick={() => create("folder", selectedFolderId)}><FolderPlus size={16} /></button>
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
        }}>
          {renderNodes(null, 0)}
        </ul>
      )}
      {view.truncated && <p className="ide-explorer-message warning">Some items are hidden because this workspace is at its limit.</p>}
      {message && <p className="ide-explorer-message" role="status">{message}</p>}
      {contextMenu && (
        <div className="ide-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu" onClick={(event) => event.stopPropagation()}>
          {canWrite && (
            <>
              <button type="button" role="menuitem" onClick={() => {
                beginNewFile(contextMenu.node?.type === "folder" ? contextMenu.node.id : null);
              }}><Plus size={14} /> New File</button>
              <button type="button" role="menuitem" onClick={() => {
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
      {deleteNodeTarget && (
        <div className="ide-confirm-backdrop" role="presentation">
          <section className="ide-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <h2 id="delete-title">Delete {deleteNodeTarget.type}?</h2>
            <p>This will permanently delete <strong>{deleteNodeTarget.name}</strong>{deleteNodeTarget.type === "folder" ? " and everything inside it" : ""}.</p>
            <div className="ide-confirm-actions">
              <button type="button" onClick={() => setDeleteNodeTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
