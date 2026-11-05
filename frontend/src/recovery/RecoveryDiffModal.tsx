import { DiffEditor } from "@monaco-editor/react";
import { X, Check, Copy, Trash2 } from "lucide-react";
import { useSettings } from "../settings";

interface RecoveryDiffModalProps {
  originalContent: string;
  recoveredContent: string;
  fileName: string;
  timestamp: string;
  onApply: () => void;
  onRestoreAsCopy: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export default function RecoveryDiffModal({
  originalContent,
  recoveredContent,
  fileName,
  timestamp,
  onApply,
  onRestoreAsCopy,
  onDiscard,
  onClose,
}: RecoveryDiffModalProps) {
  const { settings } = useSettings();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[80vh] rounded-xl border border-zinc-800 bg-[#18181b] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Compare Recovered Draft</span>
              <span className="font-mono text-xs text-amber-400 font-normal">({fileName})</span>
            </h2>
            <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
              Left: Current Collaborative State | Right: Recovered Unsaved Draft ({timestamp})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Diff Editor */}
        <div className="flex-1 overflow-hidden">
          <DiffEditor
            original={originalContent}
            modified={recoveredContent}
            theme={settings.theme === "light" ? "vs" : "vs-dark"}
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontSize: settings.fontSize ?? 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3 bg-zinc-900/80">
          <button
            onClick={onDiscard}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs text-red-400 hover:bg-red-950/40 border border-red-900/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Discard Draft</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 font-mono text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Keep Current
            </button>
            <button
              onClick={onRestoreAsCopy}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 font-mono text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Save as Copy</span>
            </button>
            <button
              onClick={onApply}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 font-mono text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply to Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
