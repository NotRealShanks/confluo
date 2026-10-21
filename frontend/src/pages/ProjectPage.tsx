import { useEffect, useReducer, useState } from "react";
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
import { ensureWorkspace, snapshot } from "../workspace/ops";
import WorkspaceExplorer from "../workspace/WorkspaceExplorer";
import { useRoom } from "@liveblocks/react/suspense";
import { initialTabState, tabReducer } from "../workspace/tabState";

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

function BottomPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [tab, setTab] = useState<PanelTab>("terminal");
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
      {open && <div className="ide-panel-empty"><Terminal size={24} /><strong>{tab === "terminal" ? "No terminal sessions" : tab === "output" ? "No output yet" : "No problems detected"}</strong><span>{tab === "terminal" ? "Terminal execution will be available in a future release." : "Activity will appear here when available."}</span></div>}
    </section>
  );
}

export function CollaborativeWorkspace() {
  const room = useRoom();
  const provider = getYjsProviderForRoom(room);
  const doc = provider.getYDoc();
  const [ready, setReady] = useState(provider.synced);
  const [{ selectedFileId, openFileIds }, dispatchTabs] = useReducer(tabReducer, initialTabState);
  const [panelOpen, setPanelOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const view = snapshot(doc);

  useEffect(() => {
    const onSynced = (synced: boolean) => {
      if (!synced) { setReady(false); return; }
      ensureWorkspace(doc);
      setReady(true);
    };
    provider.on("synced", onSynced);
    if (provider.synced) onSynced(true);
    return () => provider.off("synced", onSynced);
  }, [doc, provider]);

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

  return (
    <div className="ide-workspace">
      <ActivityBar explorerOpen={explorerOpen} onToggleExplorer={() => setExplorerOpen((open) => !open)} />
      {explorerOpen && <aside className="ide-sidebar">
        <WorkspaceExplorer doc={doc} ready={ready} selectedFileId={selectedFileId} onSelectFile={selectFile} />
      </aside>}
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
          <Editor doc={doc} fileId={selectedFileId} workspaceReady={ready} />
        </div>
        <BottomPanel open={panelOpen} onToggle={() => setPanelOpen((open) => !open)} />
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
      {shareOpen && <ShareDialog projectId={project.id} onClose={() => setShareOpen(false)} />}
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
          <CollaborativeWorkspace />
        </Room>
      </RoomErrorBoundary>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <ProjectView key={id} id={id} /> : <div className="ide-error">Missing project id.</div>;
}
