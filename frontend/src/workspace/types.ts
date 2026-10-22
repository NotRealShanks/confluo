export type NodeType = "file" | "folder";
export type FileKind = "text" | "binary";

export type TreeNode = {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  kind?: FileKind;
  assetId?: string;
  mimeType?: string;
  size?: number;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// Caps keep a malicious or buggy client from flooding every collaborator's explorer
export const LIMITS = { maxNodes: 500, maxDepth: 8, maxNameLength: 100 } as const;

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T = never>(error: string): Result<T> {
  return { ok: false, error };
}
