import { FileClock, GitCompare, Check, Trash2 } from "lucide-react";

interface RecoveryBannerProps {
  timestamp: string;
  onPreviewDiff: () => void;
  onApply: () => void;
  onDiscard: () => void;
}

export default function RecoveryBanner({
  timestamp,
  onPreviewDiff,
  onApply,
  onDiscard,
}: RecoveryBannerProps) {
  return (
    <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 font-mono text-xs text-amber-200">
      <div className="flex items-center gap-2">
        <FileClock className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          Recovered unsaved draft from <strong className="text-white font-medium">{timestamp}</strong>.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPreviewDiff}
          className="flex items-center gap-1 rounded bg-amber-500/20 px-2.5 py-1 text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          <GitCompare className="h-3.5 w-3.5" />
          <span>Preview Diff</span>
        </button>
        <button
          onClick={onApply}
          className="flex items-center gap-1 rounded bg-amber-500 px-2.5 py-1 text-black font-semibold hover:bg-amber-400 transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Apply</span>
        </button>
        <button
          onClick={onDiscard}
          title="Discard recovered draft"
          className="flex items-center gap-1 rounded px-2 py-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Discard</span>
        </button>
      </div>
    </div>
  );
}

