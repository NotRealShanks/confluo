import { useCallback, useEffect, useState } from "react";
import type * as Y from "yjs";
import {
  GitBranch,
  Plus,
  RefreshCw,
  Check,
  RotateCcw,
  FileCode,
  Eye,
  History,
  FolderGit2,
  Globe,
} from "lucide-react";
import {
  gitBranches,
  gitCheckout,
  gitCommit,
  gitCreateBranch,
  gitDiff,
  gitDiscard,
  gitInit,
  gitLog,
  gitStage,
  gitStatus,
  gitSync,
  gitUnstage,
  type GitCommitDto,
  type GitStatusResponse,
} from "../api/git";
import { getFileText, snapshot } from "../workspace/ops";
import GitDiffModal from "./GitDiffModal";
import GitCommitHistoryModal from "./GitCommitHistoryModal";
import GitRemoteModal from "./GitRemoteModal";

interface GitPanelProps {
  projectId: string;
  doc?: Y.Doc;
}

export default function GitPanel({ projectId, doc }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatusResponse | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [diffModal, setDiffModal] = useState<{
    filePath: string;
    diffText: string;
    staged: boolean;
  } | null>(null);
  const [historyModal, setHistoryModal] = useState<GitCommitDto[] | null>(null);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);

  // Sync Yjs text files to backend disk before inspecting git status
  const syncFilesFromDoc = useCallback(async () => {
    if (!doc) return;
    const snap = snapshot(doc);
    const filesMap: Record<string, string> = {};

    snap.nodes.forEach((node, id) => {
      if (node.type === "file" && node.kind !== "binary") {
        const text = getFileText(doc, id)?.toString() ?? "";
        // reconstruct relative path
        const pathSegments: string[] = [node.name];
        let curr = node.parentId;
        while (curr) {
          const parent = snap.nodes.get(curr);
          if (parent) {
            pathSegments.unshift(parent.name);
            curr = parent.parentId;
          } else {
            break;
          }
        }
        filesMap[pathSegments.join("/")] = text;
      }
    });

    try {
      await gitSync(projectId, filesMap);
    } catch {
      // Ignored if sync fails
    }
  }, [doc, projectId]);

  const loadGitState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await syncFilesFromDoc();
      const statusRes = await gitStatus(projectId);
      setStatus(statusRes);
      if (statusRes.initialized) {
        const branchRes = await gitBranches(projectId);
        setBranches(branchRes.branches);
        setCurrentBranch(branchRes.currentBranch);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load git status");
    } finally {
      setLoading(false);
    }
  }, [projectId, syncFilesFromDoc]);

  useEffect(() => {
    void loadGitState();
  }, [loadGitState]);

  const handleRemoteSyncComplete = useCallback((newFiles?: Record<string, string>) => {
    if (doc && newFiles) {
      const snap = snapshot(doc);
      snap.nodes.forEach((node, id) => {
        if (node.type === "file" && node.kind !== "binary") {
          const content = newFiles[node.name];
          if (content !== undefined) {
            doc.transact(() => {
              const yText = getFileText(doc, id);
              if (yText) {
                yText.delete(0, yText.length);
                yText.insert(0, content);
              }
            });
          }
        }
      });
    }
    void loadGitState();
  }, [doc, loadGitState]);

  const handleInit = async () => {
    setLoading(true);
    setError(null);
    try {
      await gitInit(projectId);
      await syncFilesFromDoc();
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to initialize repository");
      setLoading(false);
    }
  };

  const handleStageAll = async () => {
    try {
      await gitStage(projectId);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stage changes");
    }
  };

  const handleUnstageAll = async () => {
    try {
      await gitUnstage(projectId);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unstage changes");
    }
  };

  const handleStageFile = async (path: string) => {
    try {
      await gitStage(projectId, [path]);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stage file");
    }
  };

  const handleUnstageFile = async (path: string) => {
    try {
      await gitUnstage(projectId, [path]);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to unstage file");
    }
  };

  const handleDiscardFile = async (path: string) => {
    if (!window.confirm(`Discard changes to ${path}? This cannot be undone.`)) return;
    try {
      await gitDiscard(projectId, [path]);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to discard changes");
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await gitCommit(projectId, commitMessage.trim());
      setCommitMessage("");
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to commit");
      setLoading(false);
    }
  };

  const handleViewDiff = async (path: string, staged: boolean) => {
    try {
      const diff = await gitDiff(projectId, path, staged);
      setDiffModal({ filePath: path, diffText: diff, staged });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to get diff");
    }
  };

  const handleViewHistory = async () => {
    try {
      const commits = await gitLog(projectId, 50);
      setHistoryModal(commits);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch commit history");
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    try {
      await gitCreateBranch(projectId, newBranchName.trim());
      setNewBranchName("");
      setIsCreatingBranch(false);
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
    }
  };

  const handleCheckout = async (targetBranch: string) => {
    if (targetBranch === currentBranch) return;
    setLoading(true);
    setError(null);
    try {
      const newTree = await gitCheckout(projectId, targetBranch);
      // Synchronize checked out files into collaborative Yjs doc
      if (doc) {
        const snap = snapshot(doc);
        snap.nodes.forEach((node, id) => {
          if (node.type === "file" && node.kind !== "binary") {
            const content = newTree[node.name];
            if (content !== undefined) {
              doc.transact(() => {
                const yText = getFileText(doc, id);
                if (yText) {
                  yText.delete(0, yText.length);
                  yText.insert(0, content);
                }
              });
            }
          }
        });
      }
      await loadGitState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to checkout branch");
      setLoading(false);
    }
  };

  if (!status?.initialized) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full space-y-4">
        <FolderGit2 className="h-12 w-12 text-zinc-500" />
        <div>
          <h3 className="text-sm font-semibold text-white">No Git Repository</h3>
          <p className="font-mono text-xs text-zinc-400 mt-1 max-w-xs">
            Initialize an internal source control repository to track versions and branches.
          </p>
        </div>
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 rounded font-mono text-xs max-w-xs text-left break-words">
            {error}
          </div>
        )}
        <button
          onClick={handleInit}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
        >
          <GitBranch className="h-4 w-4" />
          <span>{loading ? "Initializing…" : "Initialize Repository"}</span>
        </button>
      </div>
    );
  }

  const stagedCount = status.staged.length;
  const changesCount = status.unstaged.length + status.untracked.length;

  return (
    <div className="flex flex-col h-full bg-[#18181b] border-r border-zinc-800 text-zinc-200">
      {/* Top Header / Branch bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-emerald-400" />
          <select
            value={currentBranch}
            onChange={(e) => void handleCheckout(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 font-mono text-xs text-white focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreatingBranch(!isCreatingBranch)}
            title="Create new branch"
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => void handleViewHistory()}
            title="Commit History"
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsRemoteModalOpen(true)}
            title="Remote Git Hosting (Push / Pull to GitHub / GitLab)"
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => void loadGitState()}
            title="Refresh"
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isCreatingBranch && (
        <div className="border-b border-zinc-800 p-3 bg-zinc-900/40 flex gap-2">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="branch-name"
            className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 font-mono text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => void handleCreateBranch()}
            className="rounded bg-emerald-500 px-2.5 py-1 font-mono text-xs font-semibold text-black hover:bg-emerald-400"
          >
            Create
          </button>
        </div>
      )}

      {error && (
        <div className="border-b border-red-500/20 bg-red-950/40 px-3 py-2 text-[11px] font-mono text-red-400">
          {error}
        </div>
      )}

      {/* Commit Input */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message (Enter to commit)…"
          rows={2}
          className="w-full resize-none rounded bg-zinc-900/80 border border-zinc-800 p-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
        <button
          onClick={() => void handleCommit()}
          disabled={loading || !commitMessage.trim() || stagedCount === 0}
          className="w-full flex items-center justify-center gap-1.5 rounded bg-emerald-500 py-1.5 font-mono text-xs font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Commit ({stagedCount})</span>
        </button>
      </div>

      {/* Changes View */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 font-mono text-xs">
        {/* Staged Section */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/40 text-zinc-400 font-semibold text-[11px]">
            <span>STAGED CHANGES ({stagedCount})</span>
            {stagedCount > 0 && (
              <button
                onClick={() => void handleUnstageAll()}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Unstage All
              </button>
            )}
          </div>
          {status.staged.map((f) => (
            <div
              key={f.path}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 group"
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate text-zinc-200">{f.path}</span>
                <span className="text-[10px] text-emerald-400 font-bold">{f.status}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => void handleViewDiff(f.path, true)}
                  title="View Diff"
                  className="p-1 hover:text-white"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  onClick={() => void handleUnstageFile(f.path)}
                  title="Unstage"
                  className="p-1 hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Unstaged / Working Tree Section */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/40 text-zinc-400 font-semibold text-[11px]">
            <span>CHANGES ({changesCount})</span>
            {changesCount > 0 && (
              <button
                onClick={() => void handleStageAll()}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Stage All
              </button>
            )}
          </div>
          {status.unstaged.map((f) => (
            <div
              key={f.path}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 group"
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate text-zinc-200">{f.path}</span>
                <span className="text-[10px] text-amber-400 font-bold">{f.status}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => void handleViewDiff(f.path, false)}
                  title="View Diff"
                  className="p-1 hover:text-white"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  onClick={() => void handleDiscardFile(f.path)}
                  title="Discard Changes"
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={() => void handleStageFile(f.path)}
                  title="Stage"
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {status.untracked.map((path) => (
            <div
              key={path}
              className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 group"
            >
              <div className="flex items-center gap-2 truncate">
                <FileCode className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-zinc-200">{path}</span>
                <span className="text-[10px] text-blue-400 font-bold">U</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => void handleStageFile(path)}
                  title="Stage Untracked File"
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {diffModal && (
        <GitDiffModal
          filePath={diffModal.filePath}
          diffText={diffModal.diffText}
          staged={diffModal.staged}
          onClose={() => setDiffModal(null)}
        />
      )}

      {historyModal && (
        <GitCommitHistoryModal
          commits={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {isRemoteModalOpen && (
        <GitRemoteModal
          projectId={projectId}
          currentBranch={currentBranch}
          isOpen={isRemoteModalOpen}
          onClose={() => setIsRemoteModalOpen(false)}
          onSyncComplete={handleRemoteSyncComplete}
        />
      )}
    </div>
  );
}
