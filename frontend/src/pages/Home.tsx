import { useState, useMemo } from "react";
import { Link } from "react-router";
import AppShell from "../components/AppShell";
import NewProjectForm from "../components/NewProjectForm";
import RoleBadge from "../components/RoleBadge";
import { formatDate } from "../lib/format";
import { useProjects } from "../projects/hooks";
import { useAuth } from "../auth/context";
import {
  Search,
  FolderCode,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertTriangle,
  FolderGit2,
} from "lucide-react";

type ProjectFilter = "all" | "recent" | "mine" | "shared";

export default function Home() {
  const { user } = useAuth();
  const { state, reload, addProject } = useProjects();
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  return (
    <AppShell wide>
      {/* Welcome Header - Liveblocks Inspired */}
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

        <button
          type="button"
          onClick={() => setShowCreateModal((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg border border-white bg-white text-black px-4 py-2 font-mono text-xs font-semibold hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all shrink-0 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>{showCreateModal ? "Close Drawer" : "Create Workspace"}</span>
        </button>
      </div>

      {/* Inline Create Project Drawer */}
      {showCreateModal && (
        <div className="mt-6 rounded-xl border border-[#27272a] bg-[#121214] p-5 shadow-xl animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a] font-mono text-xs">
            <span className="font-semibold text-[#f4f4f5] flex items-center gap-1.5">
              <FolderGit2 size={14} className="text-white" />
              Initialize New Project Workspace
            </span>
            <span className="text-[#71717a]">E2B Sandbox Enabled</span>
          </div>
          <p className="text-xs text-[#a1a1aa] mt-2">
            Give your project a name to provision its Liveblocks CRDT room and cloud micro-VM sandbox.
          </p>
          <NewProjectForm
            onCreated={(p) => {
              addProject(p);
              setShowCreateModal(false);
            }}
          />
        </div>
      )}

      {/* Navigation Controls: Liveblocks-Inspired Segmented Tabs & Search */}
      <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Segmented Filter Control */}
        <div className="flex items-center rounded-lg bg-[#121214] border border-[#27272a] p-1 gap-1 overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all whitespace-nowrap ${
              filter === "all"
                ? "bg-[#27272a] text-white font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5]"
            }`}
          >
            All Projects ({state.status === "ready" ? state.data.length : "…"})
          </button>
          <button
            type="button"
            onClick={() => setFilter("recent")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all whitespace-nowrap ${
              filter === "recent"
                ? "bg-[#27272a] text-white font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5]"
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => setFilter("mine")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all whitespace-nowrap ${
              filter === "mine"
                ? "bg-[#27272a] text-white font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5]"
            }`}
          >
            My Projects ({ownerCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("shared")}
            className={`px-3 py-1.5 rounded-md font-mono text-xs transition-all whitespace-nowrap ${
              filter === "shared"
                ? "bg-[#27272a] text-white font-semibold shadow-sm"
                : "text-[#a1a1aa] hover:text-[#f4f4f5]"
            }`}
          >
            Shared with me ({sharedCount})
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-2.5 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title…"
            className="w-full rounded-lg border border-[#27272a] bg-[#121214] pl-9 pr-3 py-1.5 font-mono text-xs text-[#f4f4f5] placeholder-[#71717a] focus:border-white focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-[10px] text-[#71717a] hover:text-[#f4f4f5] font-mono"
            >
              CLEAR
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
            Create your first workspace to start writing code, inviting teammates, and running sandboxes.
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <NewProjectForm onCreated={addProject} />
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

      {/* Project Cards Grid - Liveblocks Room Card Aesthetic */}
      {state.status === "ready" && filteredProjects.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group relative flex flex-col justify-between rounded-xl border border-[#27272a] bg-[#121214] p-5 hover:border-zinc-500 hover:bg-[#161619] transition-all duration-200 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <div>
                {/* Card Header: Icon, Room ID, Live Presence, Role */}
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
                  <RoleBadge role={project.role} />
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

                    {/* Liveblocks-Style Collaborator Presence Avatar Stack */}
                    <div className="flex -space-x-1.5 overflow-hidden" title="Liveblocks multiplayer room presence enabled">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-[#121214]">
                        ST
                      </span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white ring-2 ring-[#121214]">
                        SC
                      </span>
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-[9px] font-bold text-white ring-2 ring-[#121214]">
                        JN
                      </span>
                    </div>
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
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
