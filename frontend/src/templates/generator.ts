import * as Y from "yjs";
import { newId } from "../workspace/ops";
import { getTemplateById } from "./catalog";
import { customizeTemplateFiles } from "./customizer";
import type { ProjectTemplate, TemplateConfigOptions } from "./types";

export interface TemplateApplyResult {
  applied: boolean;
  entrypointFileId: string | null;
  createdNodeCount: number;
}

/**
 * High-level workspace initializer: if allowed and not already populated,
 * applies the template by ID and optional custom options (or blank if null/unrecognized).
 */
export function initializeWorkspaceFromTemplate(
  doc: Y.Doc,
  canInitialize: boolean,
  templateId?: string | null,
  templateConfig?: string | TemplateConfigOptions | null
): TemplateApplyResult {
  if (!canInitialize) {
    return { applied: false, entrypointFileId: null, createdNodeCount: 0 };
  }
  const meta = doc.getMap("workspace");
  const tree = doc.getMap("tree");
  if (meta.get("initialized") === true || tree.size > 0) {
    return { applied: false, entrypointFileId: null, createdNodeCount: 0 };
  }

  let parsedConfig: TemplateConfigOptions | undefined;
  if (templateConfig) {
    if (typeof templateConfig === "string") {
      try {
        parsedConfig = JSON.parse(templateConfig);
      } catch {
        parsedConfig = undefined;
      }
    } else {
      parsedConfig = templateConfig;
    }
  }

  const template = getTemplateById(templateId);
  return applyTemplateToWorkspace(doc, template, parsedConfig);
}

/**
 * Atomically populates a fresh Y.Doc workspace with the folder tree and starter files
 * defined by the selected ProjectTemplate, customized with user configuration.
 */
export function applyTemplateToWorkspace(
  doc: Y.Doc,
  template: ProjectTemplate,
  config?: TemplateConfigOptions
): TemplateApplyResult {
  const tree = doc.getMap("tree");
  const contents = doc.getMap("contents");
  const meta = doc.getMap("workspace");

  // Idempotency guard: If already initialized or has files, abort safely
  if (meta.get("initialized") === true || tree.size > 0) {
    return { applied: false, entrypointFileId: null, createdNodeCount: 0 };
  }

  // Get finalized files (customized if config was provided)
  const templateFiles = customizeTemplateFiles(template, config);

  // Blank template: simply mark as initialized with empty tree
  if (templateFiles.length === 0) {
    doc.transact(() => {
      meta.set("initialized", true);
    });
    return { applied: true, entrypointFileId: null, createdNodeCount: 0 };
  }

  let entrypointFileId: string | null = null;
  let createdCount = 0;

  doc.transact(() => {
    // Map normalized directory path (e.g. "src" or "src/app") to its generated folder nodeId
    const folderIdsByPath = new Map<string, string>();

    // Helper to ensure all parent directories exist and return the immediate parentId
    function ensureDirectoryHierarchy(dirPath: string): string | null {
      if (!dirPath || dirPath === "." || dirPath === "/") return null;

      const normalized = dirPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
      if (!normalized) return null;

      if (folderIdsByPath.has(normalized)) {
        return folderIdsByPath.get(normalized)!;
      }

      const segments = normalized.split("/");
      let currentPath = "";
      let parentId: string | null = null;

      for (const segment of segments) {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        if (folderIdsByPath.has(currentPath)) {
          parentId = folderIdsByPath.get(currentPath)!;
        } else {
          const folderId = newId();
          const folderNode = new Y.Map<unknown>();
          folderNode.set("type", "folder");
          folderNode.set("name", segment);
          folderNode.set("parentId", parentId);
          tree.set(folderId, folderNode);
          createdCount++;

          folderIdsByPath.set(currentPath, folderId);
          parentId = folderId;
        }
      }

      return parentId;
    }

    // Process all files in the template
    for (const file of templateFiles) {
      const normalizedPath = file.path.replace(/\\/g, "/").replace(/^\/+/, "");
      const lastSlash = normalizedPath.lastIndexOf("/");

      let dirPath = "";
      let fileName = normalizedPath;
      if (lastSlash !== -1) {
        dirPath = normalizedPath.slice(0, lastSlash);
        fileName = normalizedPath.slice(lastSlash + 1);
      }

      const parentId = ensureDirectoryHierarchy(dirPath);
      const fileId = newId();

      const fileNode = new Y.Map<unknown>();
      fileNode.set("type", "file");
      fileNode.set("name", fileName);
      fileNode.set("parentId", parentId);
      tree.set(fileId, fileNode);
      createdCount++;

      contents.set(fileId, new Y.Text(file.content));

      if (file.isEntrypoint || !entrypointFileId) {
        entrypointFileId = fileId;
      }
    }

    meta.set("initialized", true);
  });

  return {
    applied: true,
    entrypointFileId,
    createdNodeCount: createdCount,
  };
}
