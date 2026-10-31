/* oxlint-disable react/only-export-components */
import type { ReactNode } from "react";
import {
  renderFileIconNode,
  renderFolderIconNode,
} from "./fileIconMap";

export * from "./fileIconMap";

export interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

export function FileIcon({ filename, size = 15 }: FileIconProps) {
  return renderFileIconNode(filename, size);
}

export interface FolderIconProps {
  name: string;
  expanded?: boolean;
  size?: number;
  className?: string;
}

export function FolderIcon({ name, expanded = false, size = 15 }: FolderIconProps) {
  return renderFolderIconNode(name, expanded, size);
}

export function fileIcon(filename: string, type: "file" | "folder", expanded = false, size = 15): ReactNode {
  if (type === "folder") {
    return renderFolderIconNode(filename, expanded, size);
  }
  return renderFileIconNode(filename, size);
}
