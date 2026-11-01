import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import * as Y from "yjs";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import {
  AlertCircle,
  Braces,
  ChevronDown,
  Columns2,
  Compass,
  Eraser,
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
import type { editor } from "monaco-editor";
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
import { useOthers, useRoom, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { FilePresenceBadge } from "../collaborative/FilePresenceBadge";
import { initialTabState, tabReducer } from "../workspace/tabState";
import { executeProject, type ExecutionResult } from "../api/execution";
import { getFileCapability } from "../workspace/fileCapabilities";
import { pathForNode, workspaceTextEntries } from "../workspace/fileManagement";
import { BrowserPreview } from "../preview/BrowserPreview";
import { ProjectChatPanel } from "../chat/ProjectChatPanel";
import { TerminalPanel } from "../terminal/TerminalPanel";
import { LiveCursors } from "../collaborative/LiveCursors";
import { useLiveCursorTracker } from "../collaborative/useLiveCursorTracker";
import { ConnectionStatus, ConnectionOfflineBanner } from "../collaborative/ConnectionStatus";
import { FollowProvider, useFollow } from "../collaborative/FollowContext";
import { FollowingBanner } from "../collaborative/FollowingBanner";
import { InboxNotificationMenu } from "../comments";
import type { TreeView } from "../workspace/tree";
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

function BottomPanel({
  open,
  onToggle,
  output,
  running,
  initialHeight = PANEL_DEFAULT_HEIGHT,
  doc,
  view,
  projectId,
  projectName,
  onClearOutput,
}: {
  open: boolean;
  onToggle: () => void;
  output: string;
  running: boolean;
  initialHeight?: number;
  doc?: Y.Doc;
  view?: TreeView;
  projectId?: string;
  projectName?: string;
  onClearOutput?: () => void;
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
        <div className="ide-panel-body flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {tab === "terminal" && doc && view && projectId ? (
            <TerminalPanel projectId={projectId} projectName={projectName} doc={doc} view={view} />
          ) : tab === "output" ? (
            <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-[#2d2d2d] shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#858585]">Execution Console</span>
                  {running && (
                    <span className="text-[11px] text-blue-400 bg-blue-950/60 border border-blue-800 px-1.5 py-0.5 rounded animate-pulse">
                      Running…
                    </span>
                  )}
                </div>
                {onClearOutput && (
                  <button
                    type="button"
                    onClick={onClearOutput}
                    className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#333] transition-colors"
                    title="Clear Output"
                    aria-label="Clear Output"
                  >
                    <Eraser size={13} />
                  </button>
                )}
              </div>
              <pre className="flex-1 p-3 overflow-auto font-mono text-xs text-[#cccccc] leading-relaxed whitespace-pre-wrap select-text m-0">
                {output || "Run a supported file to see output here."}
              </pre>
            </div>
          ) : (
            <div className="ide-panel-empty">
              <AlertCircle size={24} />
              <strong>No problems detected</strong>
              <span>No compilation or runtime errors in the active workspace.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function CollaborativeWorkspace({
  projectId,
  projectName,
  canInitialize = true,
  canRun = true,
  isGuest = false,
  focusComment,
  onClearFocusComment,
}: {
  projectId: string;
  projectName?: string;
  canInitialize?: boolean;
  canRun?: boolean;
  isGuest?: boolean;
  focusComment?: { fileId: string; lineNumber: number } | null;
  onClearFocusComment?: () => void;
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
  const [isSplit, setIsSplit] = useState(false);
  const [splitFileId, setSplitFileId] = useState<string | null>(null);
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
  const updateMyPresence = useUpdateMyPresence();
  useEffect(() => {
    updateMyPresence({ activeFileId: selectedFileId });
  }, [selectedFileId, updateMyPresence]);
  const [activeEditor, setActiveEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
  const { handlePointerMove, handlePointerLeave } = useLiveCursorTracker({
    fileId: selectedFileId,
    editorInstance: activeEditor,
  });
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
  }, [setCanScrollLeft, setCanScrollRight]);

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

  const others = useOthers();
  const { followingUserId, stopFollowing, registerJumpHandler } = useFollow();

  const selectFile = useCallback(
    (id: string, preserveFollow = false) => {
      if (!preserveFollow && followingUserId) {
        stopFollowing();
      }
      if (id) {
        dispatchTabs({ type: "select", fileId: id });
        const targetNode = view.nodes.get(id);
        if (targetNode?.type === "file" && getFileCapability(targetNode.name).isPreviewable) {
          setActivePreviewPath(pathForNode(view, targetNode));
        }
      } else if (selectedFileId) {
        dispatchTabs({ type: "remove", fileId: selectedFileId });
      }
    },
    [followingUserId, stopFollowing, view, selectedFileId, dispatchTabs, setActivePreviewPath],
  );

  // Jump to file when selecting comment notification from Inbox
  useEffect(() => {
    if (focusComment?.fileId && focusComment.fileId !== selectedFileId) {
      queueMicrotask(() => selectFile(focusComment.fileId, true));
    }
  }, [focusComment, selectedFileId, selectFile]);

  // Jump to collaborator file and position
  useEffect(() => {
    return registerJumpHandler((userId, targetFileId) => {
      if (targetFileId) {
        selectFile(targetFileId, true);
      }
      const targetUser = others.find((o) => o.id === userId);
      const targetCursor = targetUser?.presence?.cursor;
      if (targetCursor && activeEditor) {
        activeEditor.setScrollTop(Math.max(0, targetCursor.y - 120));
      }
    });
  }, [activeEditor, others, registerJumpHandler, selectFile]);

  // Continuously track followed teammate as they switch files or scroll
  useEffect(() => {
    if (!followingUserId) return;
    const targetUser = others.find((o) => o.id === followingUserId);
    if (!targetUser) {
      stopFollowing();
      return;
    }
    const targetFile = targetUser.presence?.activeFileId;
    if (targetFile && targetFile !== selectedFileId) {
      queueMicrotask(() => selectFile(targetFile, true));
    }
    const targetCursor = targetUser.presence?.cursor;
    if (targetCursor && activeEditor) {
      activeEditor.setScrollTop(Math.max(0, targetCursor.y - 120));
    }
  }, [followingUserId, others, selectedFileId, activeEditor, stopFollowing, selectFile]);

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
      <main className="ide-main">
        <FollowingBanner />
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
                      <FilePresenceBadge fileId={id} className="mx-1" />
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
            <button
              type="button"
              className={`ide-action-button ${isSplit ? "is-active" : ""}`}
              onClick={() => {
                if (!isSplit) {
                  setIsSplit(true);
                  const otherFile = openFileIds.find((id) => id !== selectedFileId);
                  setSplitFileId(otherFile || selectedFileId || null);
                } else {
                  setIsSplit(false);
                }
              }}
              title={isSplit ? "Close split editor" : "Split editor right"}
              aria-label={isSplit ? "Close split editor" : "Split editor right"}
              aria-pressed={isSplit}
            >
              <Columns2 size={15} />
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
        <div
          className="ide-editor-area"
          ref={editorAreaRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <LiveCursors
            fileId={selectedFileId}
            editorInstance={activeEditor}
            containerRef={editorAreaRef}
          />
          {(!previewOpen || !previewMaximized) && (
            isSplit ? (
              <div className="flex-1 flex min-w-0 min-h-0 h-full w-full">
                <div
                  className="ide-editor-pane"
                  style={{
                    flex: "1 1 0%",
                    width: "50%",
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
                      onEditorMount={setActiveEditor}
                      focusCommentLine={focusComment?.fileId === selectedFileId ? focusComment.lineNumber : null}
                      onClearFocusCommentLine={onClearFocusComment}
                    />
                  </EditorErrorBoundary>
                </div>
                <div className="ide-preview-resizer" role="separator" aria-orientation="vertical" style={{ cursor: "col-resize" }} />
                <div
                  className="ide-editor-pane"
                  style={{
                    flex: "1 1 0%",
                    width: "50%",
                    minWidth: 0,
                    minHeight: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderLeft: "1px solid #2d2d30",
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#2d2d2d] text-xs text-[#cccccc] shrink-0">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-[#858585]">Split:</span>
                      <select
                        value={splitFileId || ""}
                        onChange={(e) => setSplitFileId(e.target.value || null)}
                        className="bg-[#1e1e1e] border border-[#3c3c3c] text-white rounded px-2 py-0.5 text-xs focus:outline-none"
                      >
                        {openFileIds.map((id) => (
                          <option key={id} value={id}>
                            {view.nodes.get(id)?.name || id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSplit(false)}
                      className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#333] transition-colors"
                      title="Close Split"
                      aria-label="Close Split"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <EditorErrorBoundary
                    fileName={splitFileId ? view.nodes.get(splitFileId)?.name : undefined}
                    onReset={() => setSplitFileId(null)}
                  >
                    <Editor
                      doc={doc}
                      projectId={projectId}
                      fileId={splitFileId || selectedFileId}
                      workspaceReady={ready}
                      emptyWorkspace={view.nodes.size === 0}
                      onCreateFile={canInitialize ? () => setCreateFileRequest((request) => request + 1) : undefined}
                    />
                  </EditorErrorBoundary>
                </div>
              </div>
            ) : (
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
                    onEditorMount={setActiveEditor}
                    focusCommentLine={focusComment?.fileId === selectedFileId ? focusComment.lineNumber : null}
                    onClearFocusCommentLine={onClearFocusComment}
                  />
                </EditorErrorBoundary>
              </div>
            )
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
        <BottomPanel
          open={panelOpen}
          onToggle={() => setPanelOpen((open) => !open)}
          output={output}
          running={running}
          doc={doc}
          view={view}
          projectId={projectId}
          projectName={projectName}
          onClearOutput={() => setOutput("")}
        />
      </main>
      {chatOpen && !isGuest && (
        <aside className="ide-chat-sidebar is-right" aria-label="Project chat and activity">
          <ProjectChatPanel projectId={projectId} onClose={() => setChatOpen(false)} />
        </aside>
      )}
      <SettingsPanel />
    </div>
  );
}

function ProjectHeader({
  project,
  onNavigateToComment,
}: {
  project: Project;
  onNavigateToComment?: (fileId: string, lineNumber: number) => void;
}) {
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
        <ConnectionStatus />
        <div className="ide-presence"><Presence /></div>
        <InboxNotificationMenu onNavigateToComment={onNavigateToComment} />
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
  const [focusComment, setFocusComment] = useState<{ fileId: string; lineNumber: number } | null>(null);

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
          <FollowProvider>
            <ProjectHeader
              project={project}
              onNavigateToComment={(fileId, lineNumber) => setFocusComment({ fileId, lineNumber })}
            />
            <ConnectionOfflineBanner />
            <CollaborativeWorkspace
              projectId={project.id}
              projectName={project.title}
              canInitialize={project.role !== "VIEWER"}
              canRun={project.role !== "VIEWER"}
              focusComment={focusComment}
              onClearFocusComment={() => setFocusComment(null)}
            />
          </FollowProvider>
        </Room>
      </RoomErrorBoundary>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProjectView key={id} id={id} /> : <div className="ide-error">Missing project id.</div>;
}
