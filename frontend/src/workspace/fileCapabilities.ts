export type SupportedExecutionLanguage =
  | "java"
  | "javascript"
  | "typescript"
  | "python"
  | "c"
  | "cpp";

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
 * Only file types with verified backend execution support are marked executable.
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

  // Check verified backend execution runtimes: Java, Node.js/TS, Python, C, C++
  switch (ext) {
    case ".java":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "java",
      };

    case ".js":
    case ".mjs":
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

    case ".py":
      return {
        filename: cleanName,
        action: "run",
        isExecutable: true,
        isPreviewable: false,
        executionLanguage: "python",
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

    case ".html":
    case ".htm":
      // HTML browser preview is currently not implemented in Confluo
      return {
        filename: cleanName,
        action: "none",
        isExecutable: false,
        isPreviewable: false,
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

