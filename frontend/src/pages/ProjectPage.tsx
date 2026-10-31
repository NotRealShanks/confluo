import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import {
  AlertCircle,
  Braces,
  ChevronDown,
  Compass,
  Files,
  GitBranch,
  Maximize2,
  Minimize2,
  MessageSquare,
  MoreHorizontal,
  PanelBottom,
  Play,
  Search,
  Settings,
  Share2,
  Terminal,
  X,
} from "lucide-react";
import { ApiError } from "../api/client";
import type { Project } from "../api/types";
import Editor from "../Editor";
import Presence from "../Presence";
import { Room } from "../Room";
import RoleBadge from "../components/RoleBadge";
import { RoomErrorBoundary } from "../components/RoomErrorBoundary";
import { EditorErrorBoundary } from "../components/EditorErrorBoundary";
import { SettingsPanel, useSettings } from "../settings";
import { fileIcon } from "../workspace/fileIcon";
import ShareDialog from "../components/ShareDialog";
import AccountMenu from "../components/AccountMenu";
import { useProject } from "../projects/hooks";
import { ensureWorkspaceIfAllowed, snapshot } from "../workspace/ops";
import WorkspaceExplorer from "../workspace/WorkspaceExplorer";
import { useRoom } from "@liveblocks/react/suspense";
import { initialTabState, tabReducer } from "../workspace/tabState";
import { executeProject, type ExecutionResult } from "../api/execution";
import { getFileCapability } from "../workspace/fileCapabilities";
import { pathForNode, workspaceTextEntries } from "../workspace/fileManagement";
import { BrowserPreview } from "../preview/BrowserPreview";
import { ProjectChatPanel } from "../chat/ProjectChatPanel";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_STEP,
  clampSidebarWidth,
  sidebarWidthBounds,
} from "./sidebarResize";
import {
  PANEL_DEFAULT_HEIGHT,
  PANEL_STEP,
  clampPanelHeight,
  defaultPanelHeight,
  panelHeightBounds,
} from "./panelResize";

type PanelTab = "terminal" | "output" | "problems";

function ActivityBar({
  onToggleExplorer,
  explorerOpen,
  onToggleSettings,
  settingsOpen,
  onToggleChat,
  chatOpen,
  isGuest = false,
}: {
  onToggleExplorer: () => void;
  explorerOpen: boolean;
  onToggleSettings?: () => void;
  settingsOpen?: boolean;
  onToggleChat?: () => void;
  chatOpen?: boolean;
  isGuest?: boolean;
}) {
  return (
    <nav className="ide-activity-bar" aria-label="Workspace navigation">
      <button
        className={explorerOpen ? "is-active" : ""}
        type="button"
        aria-label="Explorer"
        aria-pressed={explorerOpen}
        title="Explorer (Files)"
        onClick={onToggleExplorer}
      >
        <Files size={21} />
      </button>
      {!isGuest && onToggleChat && (
        <button
          className={chatOpen ? "is-active" : ""}
          type="button"
          aria-label="Chat"
          aria-pressed={Boolean(chatOpen)}
          title="Project Communication (Chat & Activity)"
          onClick={onToggleChat}
        >
          <MessageSquare size={21} />
        </button>
      )}
      <button
        type="button"
        className="is-disabled"
        aria-label="Search (Unavailable)"
        title="Search (Coming soon)"
        aria-disabled="true"
        disabled
      >
        <Search size={21} />
      </button>
      <button
        type="button"
        className="is-disabled"
        aria-label="Source Control (Unavailable)"
        title="Source Control (Coming soon)"
        aria-disabled="true"
        disabled
      >
        <GitBranch size={21} />
      </button>
      <button
        type="button"
        className="is-disabled"
        aria-label="Run and Debug (Unavailable)"
        title="Run and Debug (Debugger unavailable — use editor Run button)"
        aria-disabled="true"
        disabled
      >
        <Play size={21} />
      </button>
      <button
        className={`ide-activity-spacer ${settingsOpen ? "is-active" : ""}`}
        type="button"
        aria-label="Settings"
        aria-pressed={Boolean(settingsOpen)}
        title="Settings (Preferences)"
        onClick={onToggleSettings}
      >
        <Settings size={20} />
      </button>
    </nav>
  );
}

function BottomPanel({ open, onToggle, output, running, initialHeight = PANEL_DEFAULT_HEIGHT }: {
  open: boolean;
  onToggle: () => void;
  output: string;
  running: boolean;
  initialHeight?: number;
}) {
  const [tab, setTab] = useState<PanelTab>("output");
  const [panelHeight, setPanelHeight] = useState(initialHeight);
  const [availableHeight, setAvailableHeight] = useState(600);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const preMaximizeHeightRef = useRef(initialHeight);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const parent = panelRef.current?.parentElement;
    if (!parent) return;
    const update = () => {
      if (parent.clientHeight > 0) {
        setAvailableHeight(parent.clientHeight);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const bounds = panelHeightBounds(availableHeight);

  const stopPanelResize = useCallback(() => {
    resizeCleanupRef.current?.();
    resizeCleanupRef.current = null;
    setIsResizing(false);
  }, []);

  const startPanelResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    stopPanelResize();
    setIsResizing(true);
    const panel = panelRef.current;
    if (!panel) return;

    const startY = event.clientY;
    const rectHeight = panel.getBoundingClientRect().height;
    const startHeight = panel.clientHeight || (rectHeight > 0 ? rectHeight : panelHeight);

    const onMove = (moveEvent: PointerEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = clampPanelHeight(startHeight + deltaY, availableHeight);
      setPanelHeight(newHeight);
      if (isMaximized) setIsMaximized(false);
    };

    const onUp = () => stopPanelResize();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    resizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  };

  useEffect(() => () => {
    resizeCleanupRef.current?.();
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.body.classList.add("is-resizing-panel");
      return () => {
        document.body.classList.remove("is-resizing-panel");
      };
    }
  }, [isResizing]);

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setPanelHeight(preMaximizeHeightRef.current || defaultPanelHeight(availableHeight));
    } else {
      preMaximizeHeightRef.current = panelHeight;
      setIsMaximized(true);
      const currentBounds = panelHeightBounds(availableHeight);
      setPanelHeight(currentBounds.max);
    }
  };

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentBounds = panelHeightBounds(availableHeight);
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (isMaximized) setIsMaximized(false);
      setPanelHeight((h) => clampPanelHeight(h + PANEL_STEP, availableHeight));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (isMaximized) setIsMaximized(false);
      setPanelHeight((h) => clampPanelHeight(h - PANEL_STEP, availableHeight));
    } else if (event.key === "Home") {
      event.preventDefault();
      setIsMaximized(false);
      setPanelHeight(currentBounds.min);
    } else if (event.key === "End") {
      event.preventDefault();
      setIsMaximized(true);
      setPanelHeight(currentBounds.max);
    }
  };

  return (
    <section
      ref={panelRef}
      className={`ide-bottom-panel ${open ? "is-open" : "is-collapsed"} ${isMaximized ? "is-maximized" : ""} ${isResizing ? "is-resizing" : ""}`}
      style={open ? { height: `${panelHeight}px` } : undefined}
      aria-label="Bottom panel"
    >
      {open && (
        <div
          className="ide-panel-resize-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize Bottom panel"
          aria-valuemin={bounds.min}
          aria-valuemax={bounds.max}
          aria-valuenow={panelHeight}
          tabIndex={0}
          onPointerDown={startPanelResize}
          onKeyDown={resizeWithKeyboard}
          onDoubleClick={toggleMaximize}
          title="Drag to resize panel, double-click to toggle maximize"
        />
      )}
      <div
        className="ide-panel-tabs"
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (open) toggleMaximize();
        }}
      >
        <button type="button" className="ide-panel-toggle" onClick={onToggle} aria-label={open ? "Collapse panel" : "Open panel"}>
          <PanelBottom size={16} />
        </button>
        {(["terminal", "output", "problems"] as PanelTab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? "is-active" : ""}
            onClick={() => { setTab(item); if (!open) onToggle(); }}
            title={item === "terminal" ? "Terminal (Interactive terminal deferred)" : item === "output" ? "Output" : "Problems (0)"}
          >
            {item === "terminal" ? <Terminal size={14} /> : item === "problems" ? <AlertCircle size={14} /> : null}
            {item[0].toUpperCase() + item.slice(1)}
            {item === "problems" && <span className="ide-panel-count">0</span>}
          </button>
        ))}
        <div className="ide-panel-spacer" />
        <div className="ide-panel-tabs-actions">
          {open && (
            <button
              type="button"
              className="ide-panel-action-btn"
              onClick={toggleMaximize}
              title={isMaximized ? "Restore panel size" : "Maximize panel size"}
              aria-label={isMaximized ? "Restore panel size" : "Maximize panel size"}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
          <button
            type="button"
            className="ide-panel-action-btn"
            onClick={onToggle}
            title={open ? "Close panel" : "Open panel"}
            aria-label={open ? "Close panel" : "Open panel"}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="ide-panel-empty">
          {tab === "terminal" ? <Terminal size={24} /> : tab === "problems" ? <AlertCircle size={24} /> : null}
          <strong>
            {running
              ? "Running…"
              : tab === "terminal"
                ? "Interactive terminal is deferred"
                : tab === "output"
                  ? "Output"
                  : "No problems detected"}
          </strong>
          {tab === "output" ? (
            <pre className="ide-output">{output || "Run a supported file to see output here."}</pre>
          ) : (
            <span>
              {tab === "terminal"
                ? "Interactive terminal is deferred. Use the Run button in the editor header to execute programs."
                : "Activity will appear here when available."}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export function CollaborativeWorkspace({
  projectId,
  canInitialize = true,
  canRun = true,
  isGuest = false,
}: {
  projectId: string;
  canInitialize?: boolean;
  canRun?: boolean;
  isGuest?: boolean;
}) {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const doc = provider.getYDoc();
  const [ready, setReady] = useState(provider.synced);
  const [, setDocVersion] = useState(0);
  const [{ selectedFileId, openFileIds }, dispatchTabs] = useReducer(tabReducer, initialTabState);
  const { isSettingsOpen, toggleSettings } = useSettings();
  const [panelOpen, setPanelOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [createFileRequest, setCreateFileRequest] = useState(0);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMaximized, setPreviewMaximized] = useState(false);
  const [previewWidthPercent, setPreviewWidthPercent] = useState(50);
  const [activePreviewPath, setActivePreviewPath] = useState("index.html");
  const previewResizeCleanupRef = useRef<(() => void) | null>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const view = snapshot(doc);

  useEffect(() => {
    const workspace = workspaceRef.current;
    const sidebar = sidebarRef.current;
    if (!workspace || !sidebar) return;
    const updateAvailableWidth = () => {
      const nextWidth = workspace.clientWidth -
        (sidebar.getBoundingClientRect().left - workspace.getBoundingClientRect().left);
      setAvailableWidth(nextWidth);
      setSidebarWidth((current) => clampSidebarWidth(current, nextWidth));
    };
    updateAvailableWidth();
    const observer = new ResizeObserver(updateAvailableWidth);
    observer.observe(workspace);
    return () => observer.disconnect();
  }, [explorerOpen]);

  const availableSidebarWidth = () => {
    const workspace = workspaceRef.current;
    const sidebar = sidebarRef.current;
    if (!workspace || !sidebar) return 0;
    return workspace.clientWidth - (sidebar.getBoundingClientRect().left - workspace.getBoundingClientRect().left);
  };

  const updateSidebarWidth = (width: number) => {
    const available = availableSidebarWidth();
    if (available > 0) setSidebarWidth(clampSidebarWidth(width, available));
  };

  const stopSidebarResize = () => {
    resizeCleanupRef.current?.();
    resizeCleanupRef.current = null;
    setIsResizingSidebar(false);
  };

  const startSidebarResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    stopSidebarResize();
    setIsResizingSidebar(true);
    const onMove = (moveEvent: PointerEvent) => {
      const sidebar = sidebarRef.current;
      if (sidebar) updateSidebarWidth(moveEvent.clientX - sidebar.getBoundingClientRect().left);
    };
    const onUp = () => stopSidebarResize();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    resizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  };

  useEffect(() => () => {
    resizeCleanupRef.current?.();
  }, []);

  const resizeSidebarWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const bounds = sidebarWidthBounds(availableSidebarWidth());
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      updateSidebarWidth(sidebarWidth + (event.key === "ArrowLeft" ? -SIDEBAR_STEP : SIDEBAR_STEP));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSidebarWidth(bounds.min);
    } else if (event.key === "End") {
      event.preventDefault();
      setSidebarWidth(bounds.max);
    }
  };

  const startPreviewResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    previewResizeCleanupRef.current?.();
    const area = editorAreaRef.current;
    if (!area) return;

    const onMove = (moveEvent: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      if (rect.width <= 0) return;
      const offsetFromLeft = moveEvent.clientX - rect.left;
      const editorPercent = (offsetFromLeft / rect.width) * 100;
      const previewPercent = 100 - editorPercent;
      setPreviewWidthPercent(Math.min(Math.max(previewPercent, 20), 80));
    };

    const onUp = () => {
      previewResizeCleanupRef.current?.();
      previewResizeCleanupRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    previewResizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  };

  useEffect(() => () => {
    previewResizeCleanupRef.current?.();
  }, []);

  useEffect(() => {
    const onSynced = (synced: boolean) => {
      if (!synced) return;
      ensureWorkspaceIfAllowed(doc, canInitialize);
      setReady(true);
    };
    provider.on("synced", onSynced);
    if (provider.synced) onSynced(true);
    return () => provider.off("synced", onSynced);
  }, [canInitialize, doc, provider]);

  useEffect(() => {
    const handleDocUpdate = () => {
      setDocVersion((v) => v + 1);
      const validFileIds = Array.from(snapshot(doc).nodes.values())
        .filter((node) => node.type === "file")
        .map((node) => node.id);
      dispatchTabs({ type: "reconcile", validFileIds });
    };
    doc.on("update", handleDocUpdate);
    return () => doc.off("update", handleDocUpdate);
  }, [doc]);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [openFileIds, selectedFileId, checkScroll]);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => checkScroll());
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [checkScroll]);

  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);

  const handleTabsScroll = () => {
    checkScroll();
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tabsContainerRef.current;
    if (!el) return;
    if (e.deltaY !== 0 && e.deltaX === 0) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const selectFile = (id: string) => {
    if (id) {
      dispatchTabs({ type: "select", fileId: id });
      const targetNode = view.nodes.get(id);
      if (targetNode?.type === "file" && getFileCapability(targetNode.name).isPreviewable) {
        setActivePreviewPath(pathForNode(view, targetNode));
      }
    } else if (selectedFileId) {
      dispatchTabs({ type: "remove", fileId: selectedFileId });
    }
  };

  const selectedNode = selectedFileId ? view.nodes.get(selectedFileId) : undefined;
  const isSelectedFilePreviewable =
    selectedNode?.type === "file" && getFileCapability(selectedNode.name).isPreviewable;

  const togglePreview = () => {
    if (!previewOpen) {
      if (selectedNode && isSelectedFilePreviewable) {
        setActivePreviewPath(pathForNode(view, selectedNode));
      }
      setPreviewOpen(true);
    } else {
      setPreviewOpen(false);
      setPreviewMaximized(false);
    }
  };

  const runSelectedFile = async () => {
    const node = selectedFileId ? view.nodes.get(selectedFileId) : undefined;
    if (!node || node.type !== "file") {
      setOutput("Select a source file before running.");
      setPanelOpen(true);
      return;
    }
    const capability = getFileCapability(node.name);
    if (!capability.isExecutable || !capability.executionLanguage) {
      setOutput(`Run is not supported for ${node.name}.`);
      setPanelOpen(true);
      return;
    }
    setRunning(true);
    setOutput(`Running ${node.name}…`);
    setPanelOpen(true);
    try {
      const result: ExecutionResult = await executeProject(projectId, {
        language: capability.executionLanguage,
        entrypoint: pathForNode(view, node),
        files: workspaceTextEntries(doc),
      });
      const status = result.timedOut ? "Timed out" : `Exited with code ${result.exitCode ?? "unknown"}`;
      setOutput([result.stdout, result.stderr, status].filter(Boolean).join("\n"));
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Execution failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div ref={workspaceRef} className={`ide-workspace ${isResizingSidebar ? "is-resizing-sidebar" : ""}`}>
      <ActivityBar
        explorerOpen={explorerOpen}
        onToggleExplorer={() => setExplorerOpen((open) => !open)}
        settingsOpen={isSettingsOpen}
        onToggleSettings={toggleSettings}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((open) => !open)}
        isGuest={isGuest}
      />
      {explorerOpen && <aside ref={sidebarRef} className="ide-sidebar" style={{ width: `${sidebarWidth}px` }}>
        <WorkspaceExplorer
          doc={doc}
          projectId={projectId}
          ready={ready}
          selectedFileId={selectedFileId}
          onSelectFile={selectFile}
          createFileRequest={createFileRequest}
        />
      </aside>}
      {explorerOpen && <div
        className="ide-sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize Explorer sidebar"
        aria-valuemin={sidebarWidthBounds(availableWidth || 800).min}
        aria-valuemax={sidebarWidthBounds(availableWidth || 800).max}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onPointerDown={startSidebarResize}
        onKeyDown={resizeSidebarWithKeyboard}
      />}
      {chatOpen && !isGuest && (
        <aside className="ide-chat-sidebar" aria-label="Project chat and activity">
          <ProjectChatPanel projectId={projectId} onClose={() => setChatOpen(false)} />
        </aside>
      )}
      <main className="ide-main">
        <div className="ide-editor-header">
          <div
            className={`ide-tabs-container ${canScrollLeft ? "can-scroll-left" : ""} ${canScrollRight ? "can-scroll-right" : ""}`}
          >
            <div
              ref={tabsContainerRef}
              className="ide-tabs-scroll-area"
              onScroll={handleTabsScroll}
              onWheel={handleTabsWheel}
            >
              <div className="ide-tabs" role="tablist" aria-label="Open files">
                {openFileIds.map((id) => {
                  const node = view.nodes.get(id);
                  if (!node) return null;
                  const isActive = id === selectedFileId;
                  return (
                    <div
                      key={id}
                      ref={isActive ? activeTabRef : undefined}
                      className={`ide-tab ${isActive ? "is-active" : ""}`}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => selectFile(id)}
                    >
                      <button
                        type="button"
                        className="ide-tab-label"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectFile(id);
                        }}
                      >
                        {fileIcon(node.name, node.type)}
                        <span>{view.displayNames.get(id) ?? node.name}</span>
                      </button>
                      <button
                        type="button"
                        className="ide-tab-close"
                        aria-label={`Close ${node.name}`}
                        title={`Close ${node.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatchTabs({ type: "close", fileId: id });
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
                {openFileIds.length === 0 && <span className="ide-tabs-empty">No files open</span>}
              </div>
            </div>
          </div>
          <div className="ide-editor-actions" aria-label="Editor actions">
            {canRun && selectedFileId && view.nodes.get(selectedFileId)?.type === "file" && getFileCapability(view.nodes.get(selectedFileId)?.name).isExecutable && (
              <button
                type="button"
                className="ide-run-button"
                onClick={() => void runSelectedFile()}
                disabled={running}
                title="Run selected file"
                aria-label="Run selected file"
              >
                <Play size={13} />
                <span>{running ? "Running…" : "Run"}</span>
              </button>
            )}
            {selectedFileId && view.nodes.get(selectedFileId)?.type === "file" && getFileCapability(view.nodes.get(selectedFileId)?.name).isPreviewable && (
              <button
                type="button"
                className={`ide-preview-button ${previewOpen ? "is-active" : ""}`}
                onClick={togglePreview}
                title={previewOpen ? "Hide browser preview" : "Live browser preview"}
                aria-label={previewOpen ? "Hide browser preview" : "Live browser preview"}
                aria-pressed={previewOpen}
              >
                <Compass size={13} />
                <span>{previewOpen ? "Previewing" : "Preview"}</span>
              </button>
            )}
            <button
              type="button"
              className={`ide-action-button ${panelOpen ? "is-active" : ""}`}
              onClick={() => setPanelOpen((open) => !open)}
              title={panelOpen ? "Hide bottom panel" : "Toggle bottom panel"}
              aria-label={panelOpen ? "Hide bottom panel" : "Toggle bottom panel"}
              aria-pressed={panelOpen}
            >
              <PanelBottom size={15} />
            </button>
            <div className="ide-more-actions-container" ref={moreMenuRef}>
              <button
                type="button"
                className={`ide-action-button ${moreMenuOpen ? "is-active" : ""}`}
                onClick={() => setMoreMenuOpen((open) => !open)}
                title="More editor actions"
                aria-label="More editor actions"
                aria-haspopup="menu"
                aria-expanded={moreMenuOpen}
              >
                <MoreHorizontal size={15} />
              </button>
              {moreMenuOpen && (
                <div className="ide-more-actions-menu" role="menu" aria-label="More actions">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={openFileIds.length === 0}
                    onClick={() => {
                      setMoreMenuOpen(false);
                      openFileIds.forEach((id) => dispatchTabs({ type: "close", fileId: id }));
                    }}
                  >
                    Close All Tabs
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!selectedFileId || openFileIds.length <= 1}
                    onClick={() => {
                      setMoreMenuOpen(false);
                      openFileIds
                        .filter((id) => id !== selectedFileId)
                        .forEach((id) => dispatchTabs({ type: "close", fileId: id }));
                    }}
                  >
                    Close Other Tabs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="ide-editor-area" ref={editorAreaRef}>
          {(!previewOpen || !previewMaximized) && (
            <div
              className="ide-editor-pane"
              style={{
                flex: previewOpen ? `0 0 ${100 - previewWidthPercent}%` : "1 1 0%",
                width: previewOpen ? `${100 - previewWidthPercent}%` : "100%",
                minWidth: 0,
                minHeight: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <EditorErrorBoundary
                fileName={selectedFileId ? view.nodes.get(selectedFileId)?.name : undefined}
                onReset={() => selectFile("")}
              >
                <Editor
                  doc={doc}
                  projectId={projectId}
                  fileId={selectedFileId}
                  workspaceReady={ready}
                  emptyWorkspace={view.nodes.size === 0}
                  onCreateFile={canInitialize ? () => setCreateFileRequest((request) => request + 1) : undefined}
                />
              </EditorErrorBoundary>
            </div>
          )}
          {previewOpen && !previewMaximized && (
            <div
              className="ide-preview-resizer"
              onPointerDown={startPreviewResize}
              title="Drag to resize preview"
              role="separator"
              aria-orientation="vertical"
              tabIndex={0}
            />
          )}
          {previewOpen && (
            <div
              className="ide-preview-pane"
              style={{
                flex: previewMaximized ? "1 1 0%" : `0 0 ${previewWidthPercent}%`,
                width: previewMaximized ? "100%" : `${previewWidthPercent}%`,
                minWidth: 0,
                minHeight: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <BrowserPreview
                doc={doc}
                view={view}
                initialPath={activePreviewPath}
                projectId={projectId}
                isMaximized={previewMaximized}
                onToggleMaximize={() => setPreviewMaximized((m) => !m)}
                onClose={() => setPreviewOpen(false)}
                onNavigateFile={(fileId) => {
                  selectFile(fileId);
                }}
              />
            </div>
          )}
        </div>
        <BottomPanel open={panelOpen} onToggle={() => setPanelOpen((open) => !open)} output={output} running={running} />
      </main>
      <SettingsPanel />
    </div>
  );
}

function ProjectHeader({ project }: { project: Project }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <header className="ide-header">
        <Link to="/" className="ide-brand" aria-label="Back to project dashboard"><Braces size={18} /> Confluo</Link>
        <span className="ide-header-divider" />
        <Link to="/" className="ide-back">Projects</Link>
        <ChevronDown size={14} className="ide-muted-icon" />
        <strong className="ide-project-name">{project.title}</strong>
        <div className="ide-header-spacer" />
        <div className="ide-presence"><Presence /></div>
        <RoleBadge role={project.role} />
        {project.role === "OWNER" && <button type="button" className="ide-share-button" onClick={() => setShareOpen(true)}><Share2 size={15} /> Share</button>}
        <AccountMenu compact />
      </header>
      {shareOpen && <ShareDialog projectId={project.id} projectRole={project.role} onClose={() => setShareOpen(false)} />}
    </>
  );
}

function ProjectView({ id }: { id: string }) {
  const { state, reload } = useProject(id);
  const [roomAttempt, setRoomAttempt] = useState(0);
  if (state.status === "loading") return <div className="ide-loading">Loading project…</div>;
  if (state.status === "error") {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return <div className="ide-error" role="alert">{notFound ? "Project not found, or you don't have access to it." : "Could not load the project."} {!notFound && <button onClick={reload}>Try again</button>}</div>;
  }
  const project = state.data;
  return (
    <div className="ide-shell">
      <RoomErrorBoundary onRetry={() => setRoomAttempt((attempt) => attempt + 1)}>
        <Room key={roomAttempt} projectId={project.id}>
          <ProjectHeader project={project} />
          <CollaborativeWorkspace projectId={project.id} canInitialize={project.role !== "VIEWER"} canRun={project.role !== "VIEWER"} />
        </Room>
      </RoomErrorBoundary>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProjectView key={id} id={id} /> : <div className="ide-error">Missing project id.</div>;
}
