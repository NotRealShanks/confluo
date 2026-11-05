import { Editor } from "@monaco-editor/react";
import { X } from "lucide-react";
import { useSettings } from "../settings";

interface GitDiffModalProps {
  filePath: string;
  diffText: string;
  staged: boolean;
  onClose: () => void;
}

export default function GitDiffModal({
  filePath,
  diffText,
  staged,
  onClose,
}: GitDiffModalProps) {
  const { settings } = useSettings();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[75vh] rounded-xl border border-zinc-800 bg-[#18181b] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-900/60">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>{staged ? "Staged Changes" : "Working Tree Changes"}</span>
              <span className="font-mono text-xs text-emerald-400 font-normal">({filePath})</span>
            </h2>
            <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
              Unified diff format
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Editor
            value={diffText || "No changes detected."}
            language="diff"
            theme={settings.theme === "light" ? "vs" : "vs-dark"}
            options={{
              readOnly: true,
              fontSize: settings.fontSize ?? 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
