import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Plus, Trash2, Eraser, Terminal as TerminalIcon } from "lucide-react";
import * as Y from "yjs";
import { executeProject } from "../api/execution";
import { workspaceTextEntries, pathForNode } from "../workspace/fileManagement";
import { getFileCapability } from "../workspace/fileCapabilities";
import type { TreeView } from "../workspace/tree";

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system";
  text: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  lines: TerminalLine[];
  commandHistory: string[];
}

export interface TerminalPanelProps {
  projectId: string;
  doc: Y.Doc;
  view: TreeView;
}

export function TerminalPanel({ projectId, doc, view }: TerminalPanelProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [
    {
      id: "term-1",
      name: "1: bash",
      lines: [
        {
          id: "sys-welcome",
          type: "system",
          text: "Confluo Cloud Terminal (E2B Sandboxed Environment)\nType 'help' for available commands, or run 'g++ <file>', 'python <file>', 'ls', 'cat <file>'.",
        },
      ],
      commandHistory: [],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("term-1");
  const [inputCommand, setInputCommand] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Auto-scroll on new output
  useEffect(() => {
    if (typeof terminalEndRef.current?.scrollIntoView === "function") {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.lines]);

  const addSession = () => {
    const nextNumber = sessions.length + 1;
    const newSession: TerminalSession = {
      id: `term-${Date.now()}`,
      name: `${nextNumber}: bash`,
      lines: [
        {
          id: `sys-${Date.now()}`,
          type: "system",
          text: `Confluo Cloud Terminal (Session ${nextNumber})\nType 'help' for available commands.`,
        },
      ],
      commandHistory: [],
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const killCurrentSession = () => {
    if (sessions.length <= 1) {
      // If only one, just clear it
      clearCurrentTerminal();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== activeSessionId);
    setSessions(filtered);
    setActiveSessionId(filtered[filtered.length - 1].id);
  };

  const clearCurrentTerminal = () => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, lines: [] } : s)),
    );
  };

  const appendLinesToActive = (newLines: Omit<TerminalLine, "id">[]) => {
    const stamped = newLines.map((l) => ({
      ...l,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, lines: [...s.lines, ...stamped] } : s,
      ),
    );
  };

  const handleCommand = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    // Append user input line
    appendLinesToActive([{ type: "input", text: trimmed }]);

    // Update history
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, commandHistory: [...s.commandHistory, trimmed] }
          : s,
      ),
    );
    setHistoryIndex(null);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "clear" || cmd === "cls") {
      clearCurrentTerminal();
      return;
    }

    if (cmd === "help") {
      appendLinesToActive([
        {
          type: "system",
          text: [
            "Available commands:",
            "  ls                     List files in workspace",
            "  cat <file>             Display file contents",
            "  run <file>             Compile & execute file (auto-detects language)",
            "  g++ / gcc <file>       Compile & execute C/C++ file via E2B",
            "  python / python3 <file>Execute Python script via E2B",
            "  node <file>            Execute JavaScript via E2B",
            "  javac <file>           Compile & execute Java class via E2B",
            "  clear                  Clear terminal window",
            "  help                   Display this help message",
          ].join("\n"),
        },
      ]);
      return;
    }

    if (cmd === "ls" || cmd === "dir") {
      const files: string[] = [];
      for (const node of view.nodes.values()) {
        files.push(pathForNode(view, node) + (node.type === "folder" ? "/" : ""));
      }
      appendLinesToActive([
        {
          type: "output",
          text: files.length > 0 ? files.join("    ") : "Empty workspace",
        },
      ]);
      return;
    }

    if (cmd === "cat") {
      if (args.length === 0) {
        appendLinesToActive([{ type: "error", text: "Usage: cat <filename>" }]);
        return;
      }
      const targetName = args[0];
      const foundNode = Array.from(view.nodes.values()).find(
        (n) => n.name === targetName || pathForNode(view, n) === targetName,
      );
      if (!foundNode || foundNode.type !== "file") {
        appendLinesToActive([{ type: "error", text: `cat: ${targetName}: No such file` }]);
        return;
      }
      const text = doc.getText(`file-${foundNode.id}`).toString();
      appendLinesToActive([{ type: "output", text: text || "(empty file)" }]);
      return;
    }

    // Execution commands: run, g++, gcc, python, python3, node, javac
    let targetFileName: string | undefined;
    let explicitLanguage: "cpp" | "c" | "python" | "javascript" | "java" | undefined;

    if (cmd === "run") {
      targetFileName = args[0];
    } else if (cmd === "g++") {
      targetFileName = args.find((a) => !a.startsWith("-") && a.endsWith(".cpp") || a.endsWith(".cc")) || args[0];
      explicitLanguage = "cpp";
    } else if (cmd === "gcc") {
      targetFileName = args.find((a) => !a.startsWith("-") && a.endsWith(".c")) || args[0];
      explicitLanguage = "c";
    } else if (cmd === "python" || cmd === "python3" || cmd === "py") {
      targetFileName = args.find((a) => a.endsWith(".py")) || args[0];
      explicitLanguage = "python";
    } else if (cmd === "node") {
      targetFileName = args.find((a) => a.endsWith(".js") || a.endsWith(".mjs")) || args[0];
      explicitLanguage = "javascript";
    } else if (cmd === "javac" || cmd === "java") {
      targetFileName = args.find((a) => a.endsWith(".java")) || args[0];
      explicitLanguage = "java";
    } else {
      appendLinesToActive([
        {
          type: "error",
          text: `confluo: command not found: ${cmd}. Type 'help' for available commands.`,
        },
      ]);
      return;
    }

    if (!targetFileName) {
      appendLinesToActive([
        { type: "error", text: `Usage: ${cmd} <filename>` },
      ]);
      return;
    }

    // Clean target filename from possible compile flags or quotes
    const cleanFileName = targetFileName.replace(/^[./]+/, "").replace(/['"]/g, "");
    const targetNode = Array.from(view.nodes.values()).find(
      (n) => n.name === cleanFileName || pathForNode(view, n) === cleanFileName,
    );

    if (!targetNode || targetNode.type !== "file") {
      appendLinesToActive([
        { type: "error", text: `${cmd}: ${cleanFileName}: File not found in workspace` },
      ]);
      return;
    }

    const capability = getFileCapability(targetNode.name);
    const execLanguage = explicitLanguage || capability.executionLanguage;

    if (!execLanguage) {
      appendLinesToActive([
        { type: "error", text: `Run is not supported for ${targetNode.name}` },
      ]);
      return;
    }

    setRunning(true);
    appendLinesToActive([
      { type: "system", text: `Executing ${targetNode.name} in E2B cloud sandbox…` },
    ]);

    try {
      const result = await executeProject(projectId, {
        language: execLanguage,
        entrypoint: pathForNode(view, targetNode),
        files: workspaceTextEntries(doc),
      });

      const outputs: Omit<TerminalLine, "id">[] = [];
      if (result.stdout) {
        outputs.push({ type: "output", text: result.stdout });
      }
      if (result.stderr) {
        outputs.push({ type: "error", text: result.stderr });
      }
      outputs.push({
        type: result.exitCode === 0 ? "system" : "error",
        text: result.timedOut
          ? "Execution timed out (15s limit)"
          : `Process finished with exit code ${result.exitCode ?? 0}`,
      });
      appendLinesToActive(outputs);
    } catch (err: unknown) {
      appendLinesToActive([
        {
          type: "error",
          text: err instanceof Error ? err.message : "Execution failed.",
        },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = inputCommand;
      setInputCommand("");
      void handleCommand(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const history = activeSession?.commandHistory || [];
      if (history.length === 0) return;
      const nextIdx = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputCommand(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const history = activeSession?.commandHistory || [];
      if (historyIndex === null) return;
      if (historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputCommand(history[nextIdx] || "");
      } else {
        setHistoryIndex(null);
        setInputCommand("");
      }
    }
  };

  return (
    <div
      className="ide-terminal-container flex flex-col h-full w-full bg-[#18181b] text-[#e4e4e7] font-mono text-xs overflow-hidden select-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Sub-bar for Multi-Terminals */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#202023] border-b border-[#2d2d30] shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                s.id === activeSessionId
                  ? "bg-[#2d2d30] text-white font-medium shadow-sm"
                  : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSessionId(s.id);
              }}
            >
              <TerminalIcon size={12} className="text-blue-400" />
              <span>{s.name}</span>
            </button>
          ))}
          <button
            type="button"
            className="p-1 rounded text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              addSession();
            }}
            title="New Terminal"
            aria-label="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              clearCurrentTerminal();
            }}
            title="Clear Terminal Output"
            aria-label="Clear Terminal Output"
          >
            <Eraser size={14} />
          </button>
          <button
            type="button"
            className="p-1 rounded text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              killCurrentSession();
            }}
            title="Kill Terminal Session"
            aria-label="Kill Terminal Session"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {activeSession?.lines.map((line) => (
          <div key={line.id} className="leading-relaxed break-words whitespace-pre-wrap">
            {line.type === "input" && (
              <div className="flex items-start gap-1 text-[#60a5fa]">
                <span className="text-[#34d399] shrink-0">confluo:~/project$</span>
                <span className="text-white font-medium">{line.text}</span>
              </div>
            )}
            {line.type === "output" && (
              <div className="text-[#f4f4f5]">{line.text}</div>
            )}
            {line.type === "error" && (
              <div className="text-[#f87171]">{line.text}</div>
            )}
            {line.type === "system" && (
              <div className="text-[#9ca3af] italic">{line.text}</div>
            )}
          </div>
        ))}

        {/* Active Command Input Line */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[#34d399] font-medium shrink-0">confluo:~/project$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            placeholder={running ? "Executing command in cloud sandbox…" : "Type a command (e.g. g++ hello.cpp, ls, help)..."}
            className="flex-1 bg-transparent border-0 text-[#f4f4f5] placeholder-[#71717a] focus:outline-none p-0 text-xs font-mono"
            autoFocus
            aria-label="Terminal command prompt"
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

