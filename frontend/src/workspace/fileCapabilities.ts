export type SupportedExecutionLanguage =
  | "python"
  | "javascript"
  | "typescript"
  | "c"
  | "cpp"
  | "csharp"
  | "java"
  | "kotlin"
  | "scala"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "dart"
  | "r"
  | "sql"
  | "shell";

export type FileAction = "run" | "preview" | "none";

export interface FileCapability {
  filename: string;
  action: FileAction;
  isExecutable: boolean;
  isPreviewable: boolean;
  executionLanguage?: SupportedExecutionLanguage;
}

/**
 * Determines whether a file has supported execution or preview actions in Confluo.
 * Supports all popular programming languages (Python, JS, TS, Java, C, C++, C#, PHP, Swift,
 * Kotlin, Go, Rust, Scala, Dart, R, Ruby, SQL, Shell) matching online multi-language compilers like Programiz.
 */
export function getFileCapability(filename?: string | null): FileCapability {
  if (!filename || typeof filename !== "string") {
    return {
      filename: "",
      action: "none",
      isExecutable: false,
      isPreviewable: false,
    };
  }

  const cleanName = filename.trim();
  const lower = cleanName.toLowerCase();

  // Exclude C/C++ header files, TS type declaration files, and config files
  if (
    lower.endsWith(".d.ts") ||
    lower.endsWith(".h") ||
    lower.endsWith(".hpp")
  ) {
    return {
      filename: cleanName,
      action: "none",
      isExecutable: false,
      isPreviewable: false,
    };
  }

  // Extract last extension
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";

  switch (ext) {
    case ".py":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "python",
      };

    case ".js":
    case ".mjs":
    case ".cjs":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "javascript",
      };

    case ".ts":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "typescript",
      };

    case ".java":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "java",
      };

    case ".c":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "c",
      };

    case ".cpp":
    case ".cc":
    case ".cxx":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "cpp",
      };

    case ".cs":
    case ".csx":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "csharp",
      };

    case ".php":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "php",
      };

    case ".swift":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "swift",
      };

    case ".kt":
    case ".kts":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "kotlin",
      };

    case ".go":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "go",
      };

    case ".rs":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "rust",
      };

    case ".scala":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "scala",
      };

    case ".dart":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "dart",
      };

    case ".r":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "r",
      };

    case ".rb":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "ruby",
      };

    case ".sql":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "sql",
      };

    case ".sh":
    case ".bash":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "shell",
      };

    case ".html":
    case ".htm":
      return {
        filename: cleanName,
        action: "preview",
        isExecutable: false,
        isPreviewable: true,
      };

    default:
      return {
        filename: cleanName,
        action: "none",
        isExecutable: false,
        isPreviewable: false,
      };
  }
}

export function isExecutableFile(filename?: string | null): boolean {
  return getFileCapability(filename).isExecutable;
}

export function isPreviewableFile(filename?: string | null): boolean {
  return getFileCapability(filename).isPreviewable;
}
