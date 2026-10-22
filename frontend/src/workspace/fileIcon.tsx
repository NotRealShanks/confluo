import type { ReactNode } from "react";
import {
  Braces,
  File,
  FileCode2,
  FileImage,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { languageForFilename } from "./language";

export function fileIcon(filename: string, type: "file" | "folder", expanded = false): ReactNode {
  if (type === "folder") return expanded ? <FolderOpen size={15} /> : <Folder size={15} />;

  const language = languageForFilename(filename);
  if (["javascript", "typescript", "java", "c", "cpp", "csharp", "python", "rust", "go"].includes(language)) {
    return <FileCode2 size={15} />;
  }
  if (language === "json") return <FileJson size={15} />;
  if (language === "markdown" || language === "plaintext" || language === "properties" || language === "ignore") {
    return <FileText size={15} />;
  }
  if (["html", "css", "xml", "yaml", "sql", "dockerfile", "make", "shell"].includes(language)) {
    return <Braces size={15} />;
  }
  if (/\.(?:png|jpe?g|gif|webp|bmp|ico)$/i.test(filename)) return <FileImage size={15} />;
  return <File size={15} />;
}
