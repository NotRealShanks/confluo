import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Maximize2,
  Minimize2,
  RotateCw,
  X,
} from "lucide-react";
import type { TreeView } from "../workspace/tree";
import { pathForNode } from "../workspace/fileManagement";
import { getFileText } from "../workspace/ops";
import {
  bundleHtmlForPreview,
  findNodeByWorkspacePath,
  resolveRelativePath,
  type PreviewBundleResult,
} from "./htmlResolver";

export interface BrowserPreviewProps {
  doc: Y.Doc;
  view: TreeView;
  initialPath: string;
  projectId?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onClose: () => void;
  onNavigateFile?: (fileId: string) => void;
}

export function BrowserPreview({
  doc,
  view,
  initialPath,
  projectId,
  isMaximized = false,
  onToggleMaximize,
  onClose,
  onNavigateFile,
}: BrowserPreviewProps) {
  const [history, setHistory] = useState<string[]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([]);
  const [dismissErrors, setDismissErrors] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentPath = history[historyIndex] ?? initialPath;

  // Sync history when initialPath changes from parent selection
  const [prevInitialPath, setPrevInitialPath] = useState(initialPath);
  if (initialPath && initialPath !== prevInitialPath) {
    setPrevInitialPath(initialPath);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), initialPath]);
    setHistoryIndex((prev) => prev + 1);
    setRuntimeErrors([]);
    setDismissErrors(false);
  }

  // Find all available HTML files in the workspace for quick selection
  const htmlFiles = useMemo(() => {
    const list: Array<{ id: string; path: string; name: string }> = [];
    for (const node of view.nodes.values()) {
      if (node.type === "file") {
        const lower = node.name.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) {
          list.push({
            id: node.id,
            path: pathForNode(view, node),
            name: node.name,
          });
        }
      }
    }
    return list.sort((a, b) => a.path.localeCompare(b.path));
  }, [view]);

  // Find current node in workspace
  const currentNode = useMemo(() => {
    return findNodeByWorkspacePath(view, currentPath);
  }, [view, currentPath]);

  // Bundle the HTML document with resolved workspace assets
  const bundleResult: PreviewBundleResult = useMemo(() => {
    void refreshTrigger;
    if (!currentNode || currentNode.type !== "file") {
      return {
        html: `<!DOCTYPE html><html><body style="font-family: sans-serif; padding: 24px; color: #888; background: #18181b;"><h3>Page not found</h3><p>Could not locate "${currentPath}" in the workspace.</p></body></html>`,
        resolvedAssets: [],
        missingAssets: [],
        errors: [`File "${currentPath}" not found in workspace`],
      };
    }

    const htmlContent = getFileText(doc, currentNode.id)?.toString() ?? "";
    return bundleHtmlForPreview({
      htmlContent,
      htmlPath: currentPath,
      view,
      doc,
      projectId,
    });
  }, [currentNode, currentPath, view, doc, projectId, refreshTrigger]);

  // Handle postMessage navigation & error reports strictly from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Strictly accept only messages originating from this preview iframe's contentWindow
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;

      // Must be an object message matching expected schemas
      if (!event.data || typeof event.data !== "object") return;

      const { type } = event.data as { type?: unknown };
      if (type === "CONFLUO_PREVIEW_NAVIGATE") {
        const href = (event.data as { href?: unknown }).href;
        if (typeof href === "string" && href.trim().length > 0) {
          const targetPath = resolveRelativePath(currentPath, href);
          if (targetPath) {
            const targetNode = findNodeByWorkspacePath(view, targetPath);
            if (targetNode) {
              setHistory((prev) => [...prev.slice(0, historyIndex + 1), targetPath]);
              setHistoryIndex((prev) => prev + 1);
              setRuntimeErrors([]);
              setDismissErrors(false);
              if (onNavigateFile) {
                onNavigateFile(targetNode.id);
              }
            }
          }
        }
      } else if (type === "CONFLUO_PREVIEW_ERROR") {
        const rawMsg = (event.data as { message?: unknown }).message;
        const msg = typeof rawMsg === "string" && rawMsg.trim().length > 0 ? rawMsg.trim() : "Script execution error";
        const lineno = (event.data as { lineno?: unknown }).lineno;
        const line = typeof lineno === "number" && lineno > 0 ? ` (line ${lineno})` : "";
        setRuntimeErrors((prev) => Array.from(new Set([...prev, `${msg}${line}`])));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentPath, view, historyIndex, onNavigateFile]);

  // Navigation handlers
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      setHistoryIndex((prev) => prev - 1);
      setRuntimeErrors([]);
      setDismissErrors(false);
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      setHistoryIndex((prev) => prev + 1);
      setRuntimeErrors([]);
      setDismissErrors(false);
    }
  }, [canGoForward]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    setRuntimeErrors([]);
    setDismissErrors(false);
  }, []);

  const handleSelectPath = useCallback(
    (newPath: string) => {
      if (newPath !== currentPath) {
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newPath]);
        setHistoryIndex((prev) => prev + 1);
        setRuntimeErrors([]);
        setDismissErrors(false);
        const node = findNodeByWorkspacePath(view, newPath);
        if (node && onNavigateFile) {
          onNavigateFile(node.id);
        }
      }
    },
    [currentPath, historyIndex, view, onNavigateFile],
  );

  const handleOpenInNewTab = useCallback(() => {
    try {
      const blob = new Blob([bundleResult.html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");
      if (!newWindow) {
        console.warn("Popup blocked while opening preview in a new tab.");
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      console.error("Failed to open preview in new tab", err);
    }
  }, [bundleResult.html]);

  return (
    <div
      className="ide-browser-preview flex flex-col h-full w-full bg-[#1e1e1e] border-l border-[#2d2d2d] overflow-hidden"
      data-testid="browser-preview-panel"
    >
      {/* Browser Chrome Toolbar */}
      <header
        className="ide-browser-toolbar flex items-center justify-between px-2 py-1.5 bg-[#252526] border-b border-[#2d2d2d] gap-2 select-none shrink-0"
        aria-label="Browser Preview Toolbar"
      >
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#858585] transition-colors"
            onClick={handleGoBack}
            disabled={!canGoBack}
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#858585] transition-colors"
            onClick={handleGoForward}
            disabled={!canGoForward}
            title="Forward"
            aria-label="Forward"
          >
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] transition-colors"
            onClick={handleRefresh}
            title="Reload preview"
            aria-label="Reload preview"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Address / Path Bar */}
        <div className="flex-1 min-w-0 max-w-xl mx-1">
          <div className="flex items-center bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-xs text-[#cccccc] shadow-inner focus-within:border-[#007fd4]">
            <Globe size={12} className="text-emerald-400 mr-1.5 shrink-0" />
            <select
              className="bg-transparent border-0 text-xs text-[#cccccc] focus:outline-none w-full truncate cursor-pointer"
              value={currentPath}
              onChange={(e) => handleSelectPath(e.target.value)}
              title="Previewed workspace file"
              aria-label="Select preview file"
            >
              {htmlFiles.map((file) => (
                <option key={file.id} value={file.path} className="bg-[#252526] text-[#cccccc]">
                  /{file.path}
                </option>
              ))}
              {!htmlFiles.some((f) => f.path === currentPath) && (
                <option value={currentPath} className="bg-[#252526] text-[#cccccc]">
                  /{currentPath}
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Panel Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] transition-colors"
            onClick={handleOpenInNewTab}
            title="Open in new tab"
            aria-label="Open preview in new tab"
          >
            <ExternalLink size={13} />
          </button>
          {onToggleMaximize && (
            <button
              type="button"
              className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] transition-colors"
              onClick={onToggleMaximize}
              title={isMaximized ? "Restore size" : "Maximize preview"}
              aria-label={isMaximized ? "Restore size" : "Maximize preview"}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
          <button
            type="button"
            className="p-1 rounded text-[#858585] hover:text-[#cccccc] hover:bg-[#333333] transition-colors"
            onClick={onClose}
            title="Close preview"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Warnings & Diagnostics Banner */}
      {bundleResult.missingAssets.length > 0 && (
        <div className="bg-[#382800] border-b border-[#634800] px-3 py-1 text-[11px] text-[#ffd666] flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle size={12} className="shrink-0" />
            <span>Missing assets: {bundleResult.missingAssets.join(", ")}</span>
          </div>
        </div>
      )}

      {/* Runtime errors badge */}
      {runtimeErrors.length > 0 && !dismissErrors && (
        <div className="bg-[#441818] border-b border-[#772222] px-3 py-1 text-[11px] text-[#ff9999] flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle size={12} className="shrink-0 text-red-400" />
            <span>{runtimeErrors[0]}</span>
          </div>
          <button
            type="button"
            className="text-[10px] text-[#ffaaaa] hover:text-white underline ml-2 shrink-0"
            onClick={() => setDismissErrors(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sandboxed Browser Viewport */}
      <div className="flex-1 min-h-0 w-full relative bg-white">
        <iframe
          ref={iframeRef}
          key={`${currentPath}-${refreshTrigger}`}
          title="Browser Preview"
          srcDoc={bundleResult.html}
          sandbox="allow-scripts allow-modals allow-forms allow-popups"
          className="w-full h-full border-0"
          data-testid="browser-preview-iframe"
        />
      </div>
    </div>
  );
}
