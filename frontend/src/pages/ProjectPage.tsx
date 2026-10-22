import { useEffect, useReducer, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import {
  AlertCircle,
  Braces,
  ChevronDown,
  Files,
  GitBranch,
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
import ShareDialog from "../components/ShareDialog";
import { useAuth } from "../auth/context";
import { useProject } from "../projects/hooks";
import { ensureWorkspaceIfAllowed, snapshot } from "../workspace/ops";
import WorkspaceExplorer from "../workspace/WorkspaceExplorer";
import { useRoom } from "@liveblocks/react/suspense";
import { initialTabState, tabReducer } from "../workspace/tabState";
import { executeProject, type ExecutionResult } from "../api/execution";
import { languageForFilename } from "../workspace/language";
import { pathForNode, workspaceTextEntries } from "../workspace/fileManagement";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_STEP,
  clampSidebarWidth,
  sidebarWidthBounds,
} from "./sidebarResize";

type PanelTab = "terminal" | "output" | "problems";

function ActivityBar({ onToggleExplorer, explorerOpen }: { onToggleExplorer: () => void; explorerOpen: boolean }) {
  return (
    <nav className="ide-activity-bar" aria-label="Workspace navigation">
      <button className={explorerOpen ? "is-active" : ""} type="button" aria-label="Explorer" aria-pressed={explorerOpen} title="Explorer" onClick={onToggleExplorer}><Files size={21} /></button>
      <button type="button" aria-label="Search" title="Search"><Search size={21} /></button>
      <button type="button" aria-label="Source control" title="Source control"><GitBranch size={21} /></button>
      <button type="button" aria-label="Run and debug" title="Run and debug"><Play size={21} /></button>
      <button className="ide-activity-spacer" type="button" aria-label="Settings" title="Settings"><Settings size={20} /></button>
    </nav>
  );
}

function BottomPanel({ open, onToggle, output, running }: {
  open: boolean;
  onToggle: () => void;
  output: string;
  running: boolean;
}) {
  const [tab, setTab] = useState<PanelTab>("output");
  return (
    <section className={`ide-bottom-panel ${open ? "is-open" : "is-collapsed"}`} aria-label="Bottom panel">
      <div className="ide-panel-tabs">
        <button type="button" className="ide-panel-toggle" onClick={onToggle} aria-label={open ? "Collapse panel" : "Open panel"}>
          <PanelBottom size={16} />
        </button>
        {(["terminal", "output", "problems"] as PanelTab[]).map((item) => (
          <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => { setTab(item); if (!open) onToggle(); }}>
            {item === "terminal" ? <Terminal size={14} /> : item === "problems" ? <AlertCircle size={14} /> : null}
            {item[0].toUpperCase() + item.slice(1)}
            {item === "problems" && <span className="ide-panel-count">0</span>}
          </button>
        ))}
      </div>
      {open && <div className="ide-panel-empty">
        {tab === "terminal" ? <Terminal size={24} /> : tab === "problems" ? <AlertCircle size={24} /> : null}
        <strong>{running ? "Running…" : tab === "terminal" ? "No terminal sessions" : tab === "output" ? "Output" : "No problems detected"}</strong>
        {tab === "output" ? <pre className="ide-output">{output || "Run a supported file to see output here."}</pre> : <span>{tab === "terminal" ? "Interactive terminal is deferred." : "Activity will appear here when available."}</span>}
      </div>}
    </section>
  );
}

export function CollaborativeWorkspace({ projectId, canInitialize = true, canRun = true }: {
  projectId: string;
  canInitialize?: boolean;
  canRun?: boolean;
}) {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const doc = provider.getYDoc();
  const [ready, setReady] = useState(provider.synced);
  const [{ selectedFileId, openFileIds }, dispatchTabs] = useReducer(tabReducer, initialTabState);
  const [panelOpen, setPanelOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [createFileRequest, setCreateFileRequest] = useState(0);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
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
    const reconcileTabs = () => {
      const validFileIds = Array.from(snapshot(doc).nodes.values())
        .filter((node) => node.type === "file")
        .map((node) => node.id);
      dispatchTabs({ type: "reconcile", validFileIds });
    };
    doc.on("update", reconcileTabs);
    return () => doc.off("update", reconcileTabs);
  }, [doc]);

  const selectFile = (id: string) => {
    if (id) {
      dispatchTabs({ type: "select", fileId: id });
    } else if (selectedFileId) {
      dispatchTabs({ type: "remove", fileId: selectedFileId });
    }
  };

  const runSelectedFile = async () => {
    const node = selectedFileId ? view.nodes.get(selectedFileId) : undefined;
    if (!node || node.type !== "file") {
      setOutput("Select a source file before running.");
      setPanelOpen(true);
      return;
    }
    const language = languageForFilename(node.name);
    if (!["java", "javascript", "typescript", "python", "c", "cpp"].includes(language)) {
      setOutput(`Run is not supported for ${node.name}. HTML and CSS use a browser preview workflow.`);
      setPanelOpen(true);
      return;
    }
    setRunning(true);
    setOutput(`Running ${node.name}…`);
    setPanelOpen(true);
    try {
      const result: ExecutionResult = await executeProject(projectId, {
        language,
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
      <ActivityBar explorerOpen={explorerOpen} onToggleExplorer={() => setExplorerOpen((open) => !open)} />
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
        <div className="ide-tabs" role="tablist" aria-label="Open files">
          {openFileIds.map((id) => {
            const node = view.nodes.get(id);
            if (!node) return null;
            return <div key={id} className={`ide-tab ${id === selectedFileId ? "is-active" : ""}`} role="tab" aria-selected={id === selectedFileId}>
              <button type="button" onClick={() => dispatchTabs({ type: "select", fileId: id })}><Braces size={14} />{view.displayNames.get(id) ?? node.name}</button>
              <button type="button" className="ide-tab-close" aria-label={`Close ${node.name}`} onClick={() => dispatchTabs({ type: "close", fileId: id })}><X size={14} /></button>
            </div>;
          })}
          {openFileIds.length === 0 && <span className="ide-tabs-empty">No files open</span>}
        </div>
        <div className="ide-editor-area">
          <div className="ide-editor-toolbar">
            <button type="button" className="ide-run-button" onClick={() => void runSelectedFile()} disabled={running || !canRun} title="Run selected file">
              <Play size={14} /> {running ? "Running…" : "Run"}
            </button>
          </div>
          <Editor
            doc={doc}
            projectId={projectId}
            fileId={selectedFileId}
            workspaceReady={ready}
            emptyWorkspace={view.nodes.size === 0}
            onCreateFile={canInitialize ? () => setCreateFileRequest((request) => request + 1) : undefined}
          />
        </div>
        <BottomPanel open={panelOpen} onToggle={() => setPanelOpen((open) => !open)} output={output} running={running} />
      </main>
    </div>
  );
}

function ProjectHeader({ project }: { project: Project }) {
  const { user, signOut } = useAuth();
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
        {user?.avatarUrl && <img src={user.avatarUrl} alt="" className="ide-avatar" referrerPolicy="no-referrer" />}
        <button type="button" className="ide-signout" onClick={signOut}>{user?.name ?? "Account"}</button>
      </header>
      {shareOpen && <ShareDialog projectId={project.id} projectRole={project.role} onClose={() => setShareOpen(false)} />}
    </>
  );
}

function ProjectView({ id }: { id: string }) {
  const { state, reload } = useProject(id);
  if (state.status === "loading") return <div className="ide-loading">Loading project…</div>;
  if (state.status === "error") {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return <div className="ide-error" role="alert">{notFound ? "Project not found, or you don't have access to it." : "Could not load the project."} {!notFound && <button onClick={reload}>Try again</button>}</div>;
  }
  const project = state.data;
  return (
    <div className="ide-shell">
      <RoomErrorBoundary>
        <Room projectId={project.id}>
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
