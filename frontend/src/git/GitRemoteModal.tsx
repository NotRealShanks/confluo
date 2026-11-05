import { useState, useEffect } from "react";
import { X, UploadCloud, DownloadCloud, Link2, Key, Check, AlertCircle, Terminal } from "lucide-react";
import { getGitRemote, setGitRemote, gitPush, gitPull } from "../api/git";

interface GitRemoteModalProps {
  projectId: string;
  currentBranch: string;
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: (newFiles?: Record<string, string>) => void;
}

export default function GitRemoteModal({
  projectId,
  currentBranch,
  isOpen,
  onClose,
  onSyncComplete,
}: GitRemoteModalProps) {
  const [remoteUrl, setRemoteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [targetBranch, setTargetBranch] = useState(currentBranch || "main");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [outputLog, setOutputLog] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetBranch(currentBranch || "main");
      setStatusMsg(null);
      setOutputLog(null);
      getGitRemote(projectId)
        .then((res) => {
          if (res.remoteUrl) setRemoteUrl(res.remoteUrl);
        })
        .catch(() => {});
    }
  }, [isOpen, projectId, currentBranch]);

  if (!isOpen) return null;

  const handleSaveRemote = async () => {
    if (!remoteUrl.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a valid remote Git URL." });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      await setGitRemote(projectId, remoteUrl.trim());
      setStatusMsg({ type: "success", text: "Remote 'origin' updated successfully." });
    } catch (err: unknown) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to set remote." });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    setStatusMsg(null);
    setOutputLog(null);
    try {
      const res = await gitPush(projectId, {
        remoteUrl: remoteUrl.trim() || undefined,
        branch: targetBranch.trim() || undefined,
        username: username.trim() || undefined,
        token: token.trim() || undefined,
      });
      setOutputLog(res.output || "Push succeeded.");
      setStatusMsg({ type: "success", text: `Successfully pushed branch '${targetBranch}' to remote.` });
    } catch (err: unknown) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to push to remote." });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    setStatusMsg(null);
    setOutputLog(null);
    try {
      const res = await gitPull(projectId, {
        remoteUrl: remoteUrl.trim() || undefined,
        branch: targetBranch.trim() || undefined,
        username: username.trim() || undefined,
        token: token.trim() || undefined,
      });
      setOutputLog(res.output || "Pull succeeded.");
      setStatusMsg({ type: "success", text: `Successfully pulled latest changes from '${targetBranch}'.` });
      if (res.files && onSyncComplete) {
        onSyncComplete(res.files);
      }
    } catch (err: unknown) {
      setStatusMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to pull from remote." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#141416] p-5 shadow-2xl text-zinc-200">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-400" />
            <h3 className="font-mono text-sm font-semibold text-white">Remote Repository (GitHub / GitLab)</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1">
              Remote Repository URL (HTTPS)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://github.com/username/repository.git"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveRemote}
                disabled={loading || !remoteUrl.trim()}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-xs text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
            </div>
            <p className="mt-1 text-[11px] font-mono text-zinc-500">
              Target repository on GitHub, GitLab, or any Git hosting provider.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
            <div>
              <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                Target Branch
              </label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="main"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white focus:border-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                Username / Author
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GitHub Username"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white focus:border-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-zinc-400 mb-1 flex items-center gap-1.5">
              <Key className="h-3 w-3 text-amber-400" />
              <span>Personal Access Token (PAT) / Deploy Token</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
            <p className="mt-1 text-[11px] font-mono text-zinc-500">
              Required for private repositories or authenticated pushes. Tokens are never stored permanently.
            </p>
          </div>

          {statusMsg && (
            <div
              className={`rounded-lg p-3 font-mono text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "border border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                  : "border border-red-500/40 bg-red-950/30 text-red-300"
              }`}
            >
              {statusMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {outputLog && (
            <div className="rounded-lg border border-zinc-800 bg-[#0c0c0e] p-3">
              <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-1 mb-1">
                <Terminal size={12} />
                <span>Git Console Output</span>
              </span>
              <pre className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {outputLog}
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handlePull}
              disabled={loading || !remoteUrl.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-sky-400" />
              <span>{loading ? "Pulling…" : "Pull Changes"}</span>
            </button>

            <button
              type="button"
              onClick={handlePush}
              disabled={loading || !remoteUrl.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 text-black px-4 py-2 font-mono text-xs font-semibold hover:bg-emerald-400 disabled:opacity-40 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{loading ? "Pushing…" : "Push to Remote"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

