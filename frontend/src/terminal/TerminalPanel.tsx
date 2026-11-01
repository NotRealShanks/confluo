import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Plus, Trash2, Eraser, Terminal as TerminalIcon } from "lucide-react";
import * as Y from "yjs";
import { executeProject, formatExecutionError } from "../api/execution";
import { workspaceTextEntries, pathForNode } from "../workspace/fileManagement";
import { getFileCapability } from "../workspace/fileCapabilities";
import { createNode, deleteNode } from "../workspace/ops";
import type { TreeView } from "../workspace/tree";

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "system";
  text: string;
  prompt?: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  currentDir: string;
  lines: TerminalLine[];
  commandHistory: string[];
  compiledBinaries: Record<string, string>; // binaryName -> sourceFilePath (e.g. "a.out" -> "hello.cpp")
}

export interface TerminalPanelProps {
  projectId: string;
  projectName?: string;
  doc: Y.Doc;
  view: TreeView;
}

function resolvePath(currentDir: string, inputPath: string): string {
  const clean = inputPath.trim().replace(/^\.\//, "");
  if (!clean || clean === ".") return currentDir;
  if (clean === "~" || clean === "/") return "";
  if (clean.startsWith("/")) return clean.replace(/^\/+/, "");

  const parts = currentDir ? currentDir.split("/") : [];
  const inputParts = clean.split("/");
  for (const part of inputParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== "." && part !== "") {
      parts.push(part);
    }
  }
  return parts.join("/");
}

function getFolderIdForDir(view: TreeView, dir: string): string | null {
  if (!dir) return null;
  const cleanDir = dir.toLowerCase();
  const found = Array.from(view.nodes.values()).find(
    (n) => n.type === "folder" && pathForNode(view, n).toLowerCase() === cleanDir,
  );
  return found?.id ?? null;
}

export function TerminalPanel({ projectId, projectName = "project", doc, view }: TerminalPanelProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>(() => [
    {
      id: "term-1",
      name: "1: bash",
      currentDir: "",
      lines: [
        {
          id: "sys-welcome",
          type: "system",
          text: "Confluo Cloud Terminal (E2B Sandboxed Environment)\nType 'help' for available commands, or run 'g++ <file>', './a.out', 'python <file>', 'ls', 'cd <dir>'.",
        },
      ],
      commandHistory: [],
      compiledBinaries: {},
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("term-1");
  const [inputCommand, setInputCommand] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const getPrompt = (dir: string = activeSession?.currentDir ?? "") => {
    const dirPart = dir ? `/${dir}` : "";
    return `confluo:~/${projectName}${dirPart}$`;
  };

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
      currentDir: "",
      lines: [
        {
          id: `sys-${Date.now()}`,
          type: "system",
          text: `Confluo Cloud Terminal (Session ${nextNumber})\nType 'help' for available commands.`,
        },
      ],
      commandHistory: [],
      compiledBinaries: {},
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const killCurrentSession = () => {
    if (sessions.length <= 1) {
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

  const updateActiveSessionDir = (newDir: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, currentDir: newDir } : s)),
    );
  };

  const recordCompiledBinary = (binaryName: string, sourcePath: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, compiledBinaries: { ...s.compiledBinaries, [binaryName]: sourcePath } }
          : s,
      ),
    );
  };

  // Helper to resolve a node by relative or absolute project path
  const resolveTargetNode = (targetPath: string) => {
    const currentDir = activeSession?.currentDir ?? "";
    const resolved = resolvePath(currentDir, targetPath);
    const cleanResolved = resolved.replace(/^\/+/, "");
    const cleanTarget = targetPath.replace(/^[./]+/, "").replace(/['"]/g, "");

    // Match exact path or filename within current directory
    return Array.from(view.nodes.values()).find((n) => {
      const nodePath = pathForNode(view, n);
      return (
        nodePath.toLowerCase() === cleanResolved.toLowerCase() ||
        (n.name.toLowerCase() === cleanTarget.toLowerCase() &&
          (!currentDir || nodePath.toLowerCase().startsWith(currentDir.toLowerCase())))
      );
    });
  };

  const executeSingleCommand = async (rawCmd: string): Promise<boolean> => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return true;

    const currentDir = activeSession?.currentDir ?? "";

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "clear" || cmd === "cls") {
      clearCurrentTerminal();
      return true;
    }

    if (cmd === "help") {
      appendLinesToActive([
        {
          type: "system",
          text: [
            "Confluo Cloud Terminal — Available Commands:",
            "  Directory & File Navigation:",
            "    cd <dir>               Change directory (e.g. cd test, cd ..)",
            "    pwd                    Print current working directory",
            "    ls [-l|-la] [dir]      List files and folders in directory",
            "    cat <file>             Display file contents",
            "    touch <file>           Create a new file in workspace",
            "    mkdir <folder>         Create a new folder in workspace",
            "    rm [-r] <path>         Remove a file or folder",
            "    echo <text> [> file]   Print or write text to file",
            "",
            "  Compilation & Execution:",
            "    g++ <file.cpp>         Compile C++ file (creates a.out)",
            "    ./a.out                Execute compiled C++ binary",
            "    g++ <f> && ./a.out     Compile and execute in sequence",
            "    gcc <file.c>           Compile C file",
            "    python / python3 <f>   Execute Python script via E2B microVM",
            "    node <file.js>         Execute JavaScript via E2B microVM",
            "    javac <file.java>      Compile Java file via E2B",
            "    run <file>             Auto-detect language, compile & execute",
            "",
            "  System & Utility:",
            "    whoami                 Print active user identity",
            "    uname -a               Print kernel & environment information",
            "    date                   Display current date and time",
            "    history                List terminal command history",
            "    clear / cls            Clear terminal display",
          ].join("\n"),
        },
      ]);
      return true;
    }

    // pwd command
    if (cmd === "pwd") {
      const dirPart = currentDir ? `/${currentDir}` : "";
      appendLinesToActive([{ type: "output", text: `/home/user/${projectName}${dirPart}` }]);
      return true;
    }

    // cd command
    if (cmd === "cd") {
      if (args.length === 0 || args[0] === "~" || args[0] === "/") {
        updateActiveSessionDir("");
        return true;
      }
      const targetDir = args[0];
      const resolved = resolvePath(currentDir, targetDir);

      if (resolved === "") {
        updateActiveSessionDir("");
        return true;
      }

      const folderNode = Array.from(view.nodes.values()).find(
        (n) => n.type === "folder" && pathForNode(view, n).toLowerCase() === resolved.toLowerCase(),
      );

      if (folderNode) {
        updateActiveSessionDir(pathForNode(view, folderNode));
      } else {
        appendLinesToActive([
          { type: "error", text: `bash: cd: ${targetDir}: No such file or directory` },
        ]);
        return false;
      }
      return true;
    }

    // ls / dir command
    if (cmd === "ls" || cmd === "dir") {
      const isDetailed = args.some((a) => a.startsWith("-") && a.includes("l"));
      const targetArg = args.find((a) => !a.startsWith("-"));
      const targetDir = targetArg ? resolvePath(currentDir, targetArg) : currentDir;

      let folderChildren: string[] = [];
      if (!targetDir) {
        folderChildren = Array.from(view.nodes.values())
          .filter((n) => n.parentId === null)
          .map((n) => n.name + (n.type === "folder" ? "/" : ""));
      } else {
        const folderNode = Array.from(view.nodes.values()).find(
          (n) => n.type === "folder" && pathForNode(view, n).toLowerCase() === targetDir.toLowerCase(),
        );
        if (folderNode) {
          folderChildren = Array.from(view.nodes.values())
            .filter((n) => n.parentId === folderNode.id)
            .map((n) => n.name + (n.type === "folder" ? "/" : ""));
        } else {
          appendLinesToActive([
            { type: "error", text: `ls: cannot access '${targetArg}': No such file or directory` },
          ]);
          return false;
        }
      }

      // If compiled binaries exist in this directory, display them
      if (!targetDir && Object.keys(activeSession.compiledBinaries).length > 0) {
        for (const binName of Object.keys(activeSession.compiledBinaries)) {
          if (!folderChildren.includes(binName) && !folderChildren.includes(`${binName}*`)) {
            folderChildren.push(`${binName}*`);
          }
        }
      }

      if (folderChildren.length === 0) {
        return true;
      }

      if (isDetailed) {
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        const lines = folderChildren.map((item) => {
          const isDir = item.endsWith("/");
          const isExe = item.endsWith("*");
          const perms = isDir ? "drwxr-xr-x 2 user user 4096" : isExe ? "-rwxr-xr-x 1 user user 16384" : "-rw-r--r-- 1 user user  1024";
          return `${perms} ${dateStr} 08:00 ${item}`;
        });
        appendLinesToActive([{ type: "output", text: `total ${folderChildren.length * 4}\n` + lines.join("\n") }]);
      } else {
        appendLinesToActive([{ type: "output", text: folderChildren.join("    ") }]);
      }
      return true;
    }

    // cat command
    if (cmd === "cat") {
      if (args.length === 0) {
        appendLinesToActive([{ type: "error", text: "Usage: cat <filename>" }]);
        return false;
      }
      const targetNode = resolveTargetNode(args[0]);
      if (!targetNode || targetNode.type !== "file") {
        appendLinesToActive([{ type: "error", text: `cat: ${args[0]}: No such file or directory` }]);
        return false;
      }
      const text = doc.getText(`file-${targetNode.id}`).toString();
      appendLinesToActive([{ type: "output", text: text || "(empty file)" }]);
      return true;
    }

    // touch command
    if (cmd === "touch") {
      if (args.length === 0) {
        appendLinesToActive([{ type: "error", text: "Usage: touch <filename>" }]);
        return false;
      }
      const fileName = args[0].replace(/^[./]+/, "");
      const parentId = getFolderIdForDir(view, currentDir);
      const res = createNode(doc, { type: "file", name: fileName, parentId });
      if (!res.ok) {
        appendLinesToActive([{ type: "error", text: `touch: cannot touch '${fileName}': ${res.error}` }]);
        return false;
      }
      return true;
    }

    // mkdir command
    if (cmd === "mkdir") {
      if (args.length === 0) {
        appendLinesToActive([{ type: "error", text: "Usage: mkdir <foldername>" }]);
        return false;
      }
      const folderName = args[0].replace(/^[./]+/, "");
      const parentId = getFolderIdForDir(view, currentDir);
      const res = createNode(doc, { type: "folder", name: folderName, parentId });
      if (!res.ok) {
        appendLinesToActive([{ type: "error", text: `mkdir: cannot create directory '${folderName}': ${res.error}` }]);
        return false;
      }
      return true;
    }

    // rm command
    if (cmd === "rm") {
      const targetArg = args.find((a) => !a.startsWith("-"));
      if (!targetArg) {
        appendLinesToActive([{ type: "error", text: "Usage: rm <filename>" }]);
        return false;
      }
      const targetNode = resolveTargetNode(targetArg);
      if (!targetNode) {
        appendLinesToActive([{ type: "error", text: `rm: cannot remove '${targetArg}': No such file or directory` }]);
        return false;
      }
      deleteNode(doc, targetNode.id);
      return true;
    }

    // echo command
    if (cmd === "echo") {
      const rest = args.join(" ");
      const redirectMatch = rest.match(/^(.*?)\s*>\s*([^\s]+)$/);
      if (redirectMatch) {
        const content = redirectMatch[1].replace(/^["'](.*)["']$/, "$1");
        const fileName = redirectMatch[2].replace(/^[./]+/, "");
        const existingNode = resolveTargetNode(fileName);
        if (existingNode && existingNode.type === "file") {
          const yText = doc.getText(`file-${existingNode.id}`);
          doc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, content + "\n");
          });
        } else {
          const parentId = getFolderIdForDir(view, currentDir);
          createNode(doc, { type: "file", name: fileName, parentId, content: content + "\n" });
        }
      } else {
        const cleanContent = rest.replace(/^["'](.*)["']$/, "$1");
        appendLinesToActive([{ type: "output", text: cleanContent }]);
      }
      return true;
    }

    // whoami command
    if (cmd === "whoami") {
      appendLinesToActive([{ type: "output", text: "confluo-dev" }]);
      return true;
    }

    // uname command
    if (cmd === "uname") {
      appendLinesToActive([{ type: "output", text: "Linux confluo-e2b 6.1.158-cloud x86_64 GNU/Linux" }]);
      return true;
    }

    // date command
    if (cmd === "date") {
      appendLinesToActive([{ type: "output", text: new Date().toUTCString() }]);
      return true;
    }

    // history command
    if (cmd === "history") {
      const historyLines = activeSession.commandHistory.map((h, i) => `  ${i + 1}  ${h}`).join("\n");
      appendLinesToActive([{ type: "output", text: historyLines || "No history yet" }]);
      return true;
    }

    // which command
    if (cmd === "which") {
      if (!args[0]) return true;
      const target = args[0];
      const paths: Record<string, string> = {
        "g++": "/usr/bin/g++",
        "gcc": "/usr/bin/gcc",
        "python": "/usr/bin/python3",
        "python3": "/usr/bin/python3",
        "node": "/usr/bin/node",
        "javac": "/usr/bin/javac",
        "java": "/usr/bin/java",
        "rustc": "/usr/bin/rustc",
        "go": "/usr/bin/go",
        "php": "/usr/bin/php",
        "ruby": "/usr/bin/ruby",
        "kotlinc": "/usr/bin/kotlinc",
        "swift": "/usr/bin/swift",
        "dart": "/usr/bin/dart",
        "scala": "/usr/bin/scala",
        "mcs": "/usr/bin/mcs",
        "dotnet": "/usr/bin/dotnet",
        "Rscript": "/usr/bin/Rscript",
        "sqlite3": "/usr/bin/sqlite3",
        "bash": "/bin/bash",
        "sh": "/bin/sh",
      };
      if (paths[target]) {
        appendLinesToActive([{ type: "output", text: paths[target] }]);
      } else {
        appendLinesToActive([{ type: "error", text: `${target} not found` }]);
      }
      return true;
    }

    // Executing compiled binary: ./a.out or ./<bin>
    if (trimmed.startsWith("./")) {
      const binName = trimmed.replace(/^\.\//, "").split(/\s+/)[0];
      const sourceFile = activeSession.compiledBinaries[binName];

      if (!sourceFile) {
        appendLinesToActive([
          {
            type: "error",
            text: `bash: ./${binName}: No such file or directory. Compile first with 'g++ <file.cpp>' or 'run <file.cpp>'.`,
          },
        ]);
        return false;
      }

      setRunning(true);
      try {
        const result = await executeProject(projectId, {
          language: "cpp-run",
          entrypoint: sourceFile,
          files: workspaceTextEntries(doc),
        });

        const outputs: Omit<TerminalLine, "id">[] = [];
        if (result.stdout) {
          outputs.push({ type: "output", text: result.stdout });
        }
        if (result.stderr) {
          outputs.push({ type: "error", text: result.stderr });
        }
        if (result.exitCode !== 0 || result.timedOut) {
          outputs.push({
            type: "error",
            text: result.timedOut ? "Execution timed out (15s limit)" : `Process exited with code ${result.exitCode}`,
          });
        }
        appendLinesToActive(outputs);
        return (result.exitCode ?? 0) === 0;
      } catch (err: unknown) {
        appendLinesToActive([
          { type: "error", text: formatExecutionError(err) },
        ]);
        return false;
      } finally {
        setRunning(false);
      }
    }

    // Compiling with g++ or gcc: DOES NOT auto-run; outputs nothing on success, sets binary
    if (cmd === "g++" || cmd === "gcc") {
      let targetSource = args.find((a) => !a.startsWith("-") && (a.endsWith(".cpp") || a.endsWith(".cc") || a.endsWith(".c")));
      if (!targetSource) {
        targetSource = args.find((a) => !a.startsWith("-"));
      }

      if (!targetSource) {
        appendLinesToActive([{ type: "error", text: `${cmd}: fatal error: no input files\ncompilation terminated.` }]);
        return false;
      }

      const targetNode = resolveTargetNode(targetSource);
      if (!targetNode || targetNode.type !== "file") {
        appendLinesToActive([
          { type: "error", text: `${cmd}: error: ${targetSource}: No such file or directory\ncompilation terminated.` },
        ]);
        return false;
      }

      // Check if -o was provided for custom binary name
      let binaryName = "a.out";
      const oIndex = args.indexOf("-o");
      if (oIndex !== -1 && args[oIndex + 1]) {
        binaryName = args[oIndex + 1];
      }

      setRunning(true);
      try {
        const compileLang = cmd === "gcc" ? "c-compile" : "cpp-compile";
        const result = await executeProject(projectId, {
          language: compileLang,
          entrypoint: pathForNode(view, targetNode),
          files: workspaceTextEntries(doc),
        });

        if (result.exitCode === 0) {
          // Standard Linux GCC/G++ behavior: silent on clean compile
          if (result.stderr) {
            appendLinesToActive([{ type: "output", text: result.stderr }]);
          }
          recordCompiledBinary(binaryName, pathForNode(view, targetNode));
          return true;
        } else {
          // Compilation failed - show compiler diagnostics
          const errorMsg = result.stderr || result.stdout || "Compilation failed";
          appendLinesToActive([
            { type: "error", text: errorMsg },
            { type: "error", text: `Exit code: ${result.exitCode ?? 1}` },
          ]);
          return false;
        }
      } catch (err: unknown) {
        appendLinesToActive([
          { type: "error", text: formatExecutionError(err) },
        ]);
        return false;
      } finally {
        setRunning(false);
      }
    }

    // Auto-compile & run convenience command: run <file>
    if (cmd === "run") {
      if (args.length === 0) {
        appendLinesToActive([{ type: "error", text: "Usage: run <filename>" }]);
        return false;
      }
      const targetNode = resolveTargetNode(args[0]);
      if (!targetNode || targetNode.type !== "file") {
        appendLinesToActive([{ type: "error", text: `run: ${args[0]}: File not found in workspace` }]);
        return false;
      }

      const capability = getFileCapability(targetNode.name);
      if (!capability.executionLanguage) {
        appendLinesToActive([{ type: "error", text: `Run is not supported for ${targetNode.name}` }]);
        return false;
      }

      setRunning(true);
      appendLinesToActive([
        { type: "system", text: `Compiling & running ${targetNode.name} in E2B cloud sandbox…` },
      ]);

      try {
        const result = await executeProject(projectId, {
          language: capability.executionLanguage,
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
        return (result.exitCode ?? 0) === 0;
      } catch (err: unknown) {
        appendLinesToActive([
          { type: "error", text: formatExecutionError(err) },
        ]);
        return false;
      } finally {
        setRunning(false);
      }
    }

    // Language runners: python, node, rust, go, php, ruby, java, kotlin, csharp, swift, dart, scala, r, sql, etc.
    const directLangMap: Record<string, string> = {
      python: "python",
      python3: "python",
      py: "python",
      node: "javascript",
      tsx: "typescript",
      "ts-node": "typescript",
      javac: "java",
      java: "java",
      rustc: "rust",
      cargo: "rust",
      go: "go",
      php: "php",
      ruby: "ruby",
      swift: "swift",
      kotlin: "kotlin",
      kotlinc: "kotlin",
      dotnet: "csharp",
      mcs: "csharp",
      cs: "csharp",
      dart: "dart",
      scala: "scala",
      rscript: "r",
      r: "r",
      sqlite3: "sql",
      sql: "sql",
      bash: "shell",
      sh: "shell",
    };

    if (directLangMap[cmd]) {
      const targetArg = args.find((a) => !a.startsWith("-") && a !== "run");
      if (!targetArg) {
        appendLinesToActive([{ type: "error", text: `Usage: ${cmd} <filename>` }]);
        return false;
      }

      const targetNode = resolveTargetNode(targetArg);
      if (!targetNode || targetNode.type !== "file") {
        appendLinesToActive([{ type: "error", text: `${cmd}: ${targetArg}: No such file or directory` }]);
        return false;
      }

      setRunning(true);
      try {
        const result = await executeProject(projectId, {
          language: directLangMap[cmd],
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
        if (result.exitCode !== 0 || result.timedOut) {
          outputs.push({
            type: "error",
            text: result.timedOut ? "Execution timed out" : `Process exited with code ${result.exitCode}`,
          });
        }
        appendLinesToActive(outputs);
        return (result.exitCode ?? 0) === 0;
      } catch (err: unknown) {
        appendLinesToActive([
          { type: "error", text: formatExecutionError(err) },
        ]);
        return false;
      } finally {
        setRunning(false);
      }
    }

    // General fallback: shell execution via E2B runner
    setRunning(true);
    try {
      const result = await executeProject(projectId, {
        language: "shell",
        entrypoint: trimmed,
        files: workspaceTextEntries(doc),
      });

      const outputs: Omit<TerminalLine, "id">[] = [];
      if (result.stdout) {
        outputs.push({ type: "output", text: result.stdout });
      }
      if (result.stderr) {
        outputs.push({ type: "error", text: result.stderr });
      }
      if (result.exitCode !== 0) {
        outputs.push({
          type: "error",
          text: `Process exited with code ${result.exitCode ?? 1}`,
        });
      }
      if (outputs.length === 0) {
        appendLinesToActive([
          { type: "error", text: `confluo: command not found: ${cmd}. Type 'help' for available commands.` },
        ]);
      } else {
        appendLinesToActive(outputs);
      }
      return (result.exitCode ?? 0) === 0;
    } catch (err: unknown) {
      appendLinesToActive([
        { type: "error", text: formatExecutionError(err) },
      ]);
      return false;
    } finally {
      setRunning(false);
    }
  };

  const handleCommand = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    const currentPrompt = getPrompt(activeSession?.currentDir ?? "");

    // Append user input line with active prompt
    appendLinesToActive([{ type: "input", text: trimmed, prompt: currentPrompt }]);

    // Update command history
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, commandHistory: [...s.commandHistory, trimmed] }
          : s,
      ),
    );
    setHistoryIndex(null);

    // Support command chaining with && (e.g. "g++ hello.cpp && ./a.out")
    if (trimmed.includes("&&")) {
      const subCommands = trimmed.split("&&").map((c) => c.trim()).filter(Boolean);
      for (const sub of subCommands) {
        const success = await executeSingleCommand(sub);
        if (!success) break;
      }
    } else {
      await executeSingleCommand(trimmed);
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

  const currentPrompt = getPrompt(activeSession?.currentDir ?? "");

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
                <span className="text-[#34d399] shrink-0">{line.prompt || currentPrompt}</span>
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
          <span className="text-[#34d399] font-medium shrink-0">{currentPrompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            placeholder={
              running
                ? "Executing in cloud sandbox…"
                : "Type a command (e.g. g++ hello.cpp, ./a.out, ls, cd, help)..."
            }
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
