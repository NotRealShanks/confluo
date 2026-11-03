import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import AppShell from "../components/AppShell";
import RoleBadge from "../components/RoleBadge";
import { ProjectMembersBadge } from "../components/ProjectMembersBadge";
import { formatDate } from "../lib/format";
import { useProjects } from "../projects/hooks";
import { useAuth } from "../auth/context";
import { getTemplateById, TemplateIcon } from "../templates";
import { deleteProject } from "../api/projects";
import { ApiError } from "../api/client";
import type { Project } from "../api/types";
import {
  Search,
  FolderCode,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

type ProjectFilter = "all" | "recent" | "mine" | "shared";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, reload, removeProject } = useProjects();
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete project state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter and search logic
  const filteredProjects = useMemo(() => {
    if (state.status !== "ready") return [];

    let list = [...state.data];

    // Filter by category
    if (filter === "mine") {
      list = list.filter((p) => p.role === "OWNER");
    } else if (filter === "shared") {
      list = list.filter((p) => p.role !== "OWNER");
    } else if (filter === "recent") {
      list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    return list;
  }, [state, filter, searchQuery]);

  const ownerCount = useMemo(() => {
    return state.status === "ready" ? state.data.filter((p) => p.role === "OWNER").length : 0;
  }, [state]);

  const sharedCount = useMemo(() => {
    return state.status === "ready" ? state.data.filter((p) => p.role !== "OWNER").length : 0;
  }, [state]);

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProject(deleteTarget.id);
      removeProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      if (err instanceof ApiError) {
        setDeleteError(`API Error (${err.status}): ${err.message}`);
      } else if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Failed to delete project. Please verify that the backend service is running.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell wide>
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272a]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#121214] px-3 py-0.5 font-mono text-[11px] text-[#a1a1aa] mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Liveblocks CRDT • Realtime Connected</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f5] mt-1">
            Welcome back, {user?.name?.split(" ")[0] || "Engineer"}
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1 font-mono">
            {state.status === "ready"
              ? `${state.data.length} total projects (${ownerCount} owned, ${sharedCount} shared)`
              : "Loading workspaces..."}
          </p>
        </div>

        <Link
          to="/projects/new"
          role="button"
          aria-label="Create Workspace"
          className="inline-flex items-center gap-2 rounded-lg border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Create Workspace</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filter === "all"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]"
            }`}
          >
            All Workspaces
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filter === "recent"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]"
            }`}
          >
            Recently Active
          </button>
          <button
            type="button"
            onClick={() => setFilter("mine")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filter === "mine"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]"
            }`}
          >
            My Projects ({ownerCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("shared")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              filter === "shared"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]"
            }`}
          >
            Shared with me ({sharedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            placeholder="Search projects by title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#27272a] bg-[#121214] pl-9 pr-14 py-1.5 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] focus:border-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="CLEAR"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-zinc-400 hover:text-white flex items-center gap-0.5"
            >
              <X size={11} />
              <span>CLEAR</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {state.status === "loading" && (
        <div className="mt-12 flex flex-col items-center justify-center p-12 rounded-xl border border-[#27272a] bg-[#121214] font-mono text-xs text-[#a1a1aa]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            <span>SYNCING WORKSPACE DIRECTORY…</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.status === "error" && (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-[#FF6B6B]/40 bg-[#2A1515] p-5 font-mono text-xs text-[#FF6B6B] flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#f4f4f5]">Failed to load project workspaces.</p>
              <p className="text-[11px] text-[#FF6B6B]/90 mt-1">
                Unable to contact the backend service. Check network connectivity or authentication tokens.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 rounded border border-[#FF6B6B]/50 bg-[#09090b] px-3 py-1 font-mono text-xs text-[#f4f4f5] hover:bg-[#18181b] transition-colors"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State: Zero Projects Total */}
      {state.status === "ready" && state.data.length === 0 && (
        <div className="mt-12 rounded-xl border border-[#27272a] bg-[#121214] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[#27272a] bg-[#09090b] text-white mb-4">
            <FolderCode size={22} />
          </div>
          <h3 className="font-display text-lg font-semibold text-[#f4f4f5]">No project workspaces found</h3>
          <p className="mt-1.5 text-xs text-[#a1a1aa] max-w-sm mx-auto leading-relaxed">
            Create your first workspace to start writing code, configuring dependencies, and collaborating live.
          </p>
          <div className="mt-6">
            <Link
              to="/projects/new"
              role="button"
              className="inline-flex items-center gap-2 rounded-lg border border-white bg-white text-black px-5 py-2.5 font-mono text-xs font-semibold hover:bg-zinc-200 transition-all"
            >
              <Plus size={15} />
              <span>Create Workspace</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty State: Search / Filter No Matches */}
      {state.status === "ready" && state.data.length > 0 && filteredProjects.length === 0 && (
        <div className="mt-10 rounded-xl border border-[#27272a] bg-[#121214] p-8 text-center font-mono text-xs">
          <p className="text-[#a1a1aa]">No projects match your current filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearchQuery("");
            }}
            className="mt-3 text-white hover:underline"
          >
            Reset search and filters
          </button>
        </div>
      )}

      {/* Project Cards Grid - uses div with onClick so child buttons have clean event isolation */}
      {state.status === "ready" && filteredProjects.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              role="article"
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group relative flex flex-col justify-between rounded-xl border border-[#27272a] bg-[#121214] p-5 hover:border-zinc-500 hover:bg-[#161619] cursor-pointer transition-all duration-200 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <div>
                {/* Card Header: Icon, Room ID, Live Presence, Role & Delete */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#27272a]/70">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18181b] border border-[#27272a] text-white group-hover:border-zinc-500 group-hover:bg-[#202024] transition-colors shrink-0">
                      <FolderCode size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-mono text-[10px] text-zinc-500 truncate">
                        room_{project.id.slice(-6)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Liveblocks Sync</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {project.templateId && project.templateId !== "blank" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[10px] font-mono font-medium text-zinc-300">
                        <TemplateIcon icon={getTemplateById(project.templateId).icon} className="h-3 w-3" />
                        <span>{getTemplateById(project.templateId).name}</span>
                      </span>
                    )}
                    <RoleBadge role={project.role} />
                    {project.role === "OWNER" && (
                      <button
                        type="button"
                        title="Delete project workspace"
                        aria-label={`Delete ${project.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteError(null);
                          setDeleteTarget(project);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/60 border border-transparent hover:border-red-900/50 transition-all z-20"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Title & Collaborators */}
                <div className="mt-3.5">
                  <h2 className="font-display text-base font-semibold text-[#f4f4f5] group-hover:text-white transition-colors truncate">
                    {project.title}
                  </h2>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#a1a1aa]">
                      <Clock size={12} className="text-[#71717a]" />
                      <time dateTime={project.updatedAt}>Updated {formatDate(project.updatedAt)}</time>
                    </div>

                    <ProjectMembersBadge projectId={project.id} />
                  </div>
                </div>
              </div>

              {/* Card Footer: Role & Enter Workspace action */}
              <div className="mt-4 pt-3.5 border-t border-[#27272a]/70 flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#71717a] group-hover:text-[#a1a1aa] transition-colors">
                  {project.role === "OWNER" ? "Owner Access" : "Collaborator Access"}
                </span>
                <span className="flex items-center gap-1.5 text-white font-medium group-hover:translate-x-1 transition-transform">
                  <span>Open Studio</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121214] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-950/60 border border-red-800/60">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-white">
                  Delete Project Workspace
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">"{deleteTarget.title}"</strong>? All
              collaborative files, CRDT document history, and guest share links will be removed.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 font-mono text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                disabled={deleting}
                className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
