const extensionLanguages: Readonly<Record<string, string>> = {
  ".c": "c",
  ".cc": "cpp",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".cs": "csharp",
  ".csx": "csharp",
  ".css": "css",
  ".dart": "dart",
  ".go": "go",
  ".h": "cpp",
  ".hpp": "cpp",
  ".html": "html",
  ".htm": "html",
  ".java": "java",
  ".js": "javascript",
  ".jsx": "javascript",
  ".json": "json",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".md": "markdown",
  ".markdown": "markdown",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".php": "php",
  ".py": "python",
  ".r": "r",
  ".rb": "ruby",
  ".rs": "rust",
  ".scala": "scala",
  ".sh": "shell",
  ".bash": "shell",
  ".sql": "sql",
  ".svg": "xml",
  ".swift": "swift",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".xml": "xml",
  ".yml": "yaml",
  ".yaml": "yaml",
};

const filenameLanguages: Readonly<Record<string, string>> = {
  ".env": "properties",
  ".gitignore": "ignore",
  dockerfile: "dockerfile",
  license: "plaintext",
  makefile: "make",
  readme: "markdown",
};

export function languageForFilename(filename: string): string {
  const basename = filename.trim().split(/[\\/]/).pop()?.toLowerCase() ?? "";
  const specialLanguage = filenameLanguages[basename];
  if (specialLanguage) return specialLanguage;

  const dot = basename.lastIndexOf(".");
  return dot > 0 ? extensionLanguages[basename.slice(dot)] ?? "plaintext" : "plaintext";
}
