import { X, GitCommit, Calendar, User } from "lucide-react";
import type { GitCommitDto } from "../api/git";

interface GitCommitHistoryModalProps {
  commits: GitCommitDto[];
  onClose: () => void;
}

export default function GitCommitHistoryModal({
  commits,
  onClose,
}: GitCommitHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-2xl h-[70vh] rounded-xl border border-zinc-800 bg-[#18181b] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-900/60">
          <div className="flex items-center gap-2 text-white">
            <GitCommit className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-semibold">Commit History</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {commits.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">No commits found in this branch.</div>
          ) : (
            commits.map((c) => (
              <div
                key={c.hash}
                className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5 hover:border-zinc-700 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-zinc-100 font-medium font-sans text-sm">{c.message}</span>
                  <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                    {c.hash.substring(0, 7)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-zinc-500" />
                    {c.authorName}
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

