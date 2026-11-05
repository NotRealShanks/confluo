import { useState } from "react";
import { Monitor, AlertCircle, ArrowRight, X } from "lucide-react";
import { confirmLogin } from "../api/auth";
import { useAuth } from "../auth/context";

interface SessionConflictModalProps {
  confirmationToken: string;
  activeSession?: {
    deviceInfo?: string;
    ipAddress?: string;
    createdAt?: string;
    lastUsedAt?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export default function SessionConflictModal({
  confirmationToken,
  activeSession,
  onCancel,
  onSuccess,
}: SessionConflictModalProps) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmLogin(confirmationToken);
      const ok = await signIn(response.token);
      if (ok) {
        onSuccess();
      } else {
        setError("Signed in, but could not load profile. Please try again.");
      }
    } catch {
      setError("Failed to transfer session. The confirmation request may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-[#18181b] p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 text-amber-400">
            <Monitor className="h-6 w-6 shrink-0" />
            <h2 className="text-lg font-semibold text-white">Active Session Detected</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="font-mono text-xs text-zinc-300 leading-relaxed mb-4">
          You are already signed in on another device. Confluo allows one active session at a time to protect your work and collaboration state.
        </p>

        {activeSession && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 mb-4 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Device:</span>
              <span className="text-zinc-200 font-medium">{activeSession.deviceInfo ?? "Web Browser"}</span>
            </div>
            {activeSession.ipAddress && (
              <div className="flex justify-between text-zinc-400">
                <span>IP Address:</span>
                <span className="text-zinc-200">{activeSession.ipAddress}</span>
              </div>
            )}
            {activeSession.lastUsedAt && (
              <div className="flex justify-between text-zinc-400">
                <span>Last Active:</span>
                <span className="text-zinc-200">{new Date(activeSession.lastUsedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-2.5 font-mono text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-mono text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <span>{loading ? "Switching session…" : "Continue here"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

