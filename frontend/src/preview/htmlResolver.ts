import * as Y from "yjs";
import { assetUrl } from "../api/assets";
import { nameKey } from "../workspace/names";
import { getFileText } from "../workspace/ops";
import { pathForNode } from "../workspace/fileManagement";
import type { TreeNode } from "../workspace/types";
import type { TreeView } from "../workspace/tree";

export interface ResolvePreviewHtmlOptions {
  htmlContent: string;
  htmlPath: string;
  view: TreeView;
  doc: Y.Doc;
  projectId?: string;
}

export interface PreviewBundleResult {
  html: string;
  resolvedAssets: string[];
  missingAssets: string[];
  errors: string[];
}

/**
 * Normalizes a slash-separated path, resolving '.' and '..' segments.
 * Returns null if the path attempts to break out above the root.
 */
export function normalizePathSegments(path: string): string | null {
  const clean = path.replaceAll("\\", "/").trim();
  if (!clean) return "";

  const segments = clean.split("/").filter(Boolean);
  const resolved: string[] = [];

  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") {
      if (resolved.length === 0) {
        return null; // Cannot traverse above root
      }
      resolved.pop();
    } else {
      resolved.push(seg);
    }
  }

  return resolved.join("/");
}

/**
 * Resolves a relative or root-relative path against the base HTML file's path.
 * Strips query strings and URL fragments for filesystem matching.
 */
export function resolveRelativePath(htmlFilePath: string, targetPath: string): string | null {
  const trimmed = targetPath.trim();
  if (!trimmed) return null;

  // External, protocol-relative, data, or special schemes are not workspace paths
  if (
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }

  // Strip query string and fragment
  const queryIndex = trimmed.search(/[?#]/);
  const cleanTarget = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  if (!cleanTarget) return null;

  // Root-relative path starts with '/'
  if (cleanTarget.startsWith("/")) {
    return normalizePathSegments(cleanTarget.slice(1));
  }

  // Relative to the directory containing htmlFilePath
  const htmlSegments = htmlFilePath.replaceAll("\\", "/").split("/").filter(Boolean);
  htmlSegments.pop(); // Remove the file name to get parent directory
  const baseDir = htmlSegments.join("/");

  const combined = baseDir ? `${baseDir}/${cleanTarget}` : cleanTarget;
  return normalizePathSegments(combined);
}

/**
 * Builds a fast lookup map from normalized path (case-insensitive key) to TreeNode.
 */
export function buildWorkspacePathMap(view: TreeView): Map<string, { path: string; node: TreeNode }> {
  const map = new Map<string, { path: string; node: TreeNode }>();
  for (const node of view.nodes.values()) {
    const fullPath = pathForNode(view, node);
    map.set(nameKey(fullPath), { path: fullPath, node });
  }
  return map;
}

/**
 * Finds a node in the tree view matching a workspace path.
 */
export function findNodeByWorkspacePath(view: TreeView, targetWorkspacePath: string): TreeNode | null {
  const normalized = normalizePathSegments(targetWorkspacePath);
  if (normalized === null) return null;

  const targetKey = nameKey(normalized);
  for (const node of view.nodes.values()) {
    if (nameKey(pathForNode(view, node)) === targetKey) {
      return node;
    }
  }
  return null;
}

const RUNTIME_INJECTION_SCRIPT = `
<script data-confluo-runtime="true">
(function() {
  window.addEventListener('error', function(event) {
    try {
      window.parent.postMessage({
        type: 'CONFLUO_PREVIEW_ERROR',
        message: event.message || 'Script error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, '*');
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', function(event) {
    try {
      window.parent.postMessage({
        type: 'CONFLUO_PREVIEW_ERROR',
        message: (event.reason && (event.reason.message || String(event.reason))) || 'Unhandled Promise Rejection'
      }, '*');
    } catch (_) {}
  });

  // Helper for internal workspace navigation
  window.navigateTo = function(path) {
    if (typeof path === 'string') {
      window.parent.postMessage({
        type: 'CONFLUO_PREVIEW_NAVIGATE',
        href: path
      }, '*');
    }
  };

  // Intercept window.open
  var originalOpen = window.open;
  window.open = function(url, target, features) {
    if (typeof url === 'string') {
      var isExternal = url.indexOf('://') !== -1 || url.startsWith('//');
      if (!isExternal && !url.startsWith('#') && !url.startsWith('javascript:')) {
        window.parent.postMessage({
          type: 'CONFLUO_PREVIEW_NAVIGATE',
          href: url
        }, '*');
        return null;
      }
    }
    return originalOpen ? originalOpen.call(window, url, target || '_blank', features) : null;
  };

  document.addEventListener('click', function(event) {
    var target = event.target;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (!target) return;
    var href = target.getAttribute('href');
    if (!href) return;

    // External link: ensure it opens in a new tab safely
    if (href.indexOf('://') !== -1 || href.startsWith('//')) {
      target.setAttribute('target', '_blank');
      target.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    if (
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }

    if (target.getAttribute('target') === '_blank') return;

    event.preventDefault();
    window.parent.postMessage({
      type: 'CONFLUO_PREVIEW_NAVIGATE',
      href: href
    }, '*');
  }, true);

  try {
    window.parent.postMessage({ type: 'CONFLUO_PREVIEW_READY' }, '*');
  } catch (_) {}
})();
</script>
`;

/**
 * Transforms an HTML document by inlining or resolving local workspace assets (CSS, JS, images).
 * Injects a lightweight message bridge for runtime errors and link navigation.
 */
export function bundleHtmlForPreview(options: ResolvePreviewHtmlOptions): PreviewBundleResult {
  const { htmlContent, htmlPath, view, doc, projectId } = options;
  const resolvedAssets: string[] = [];
  const missingAssets: string[] = [];
  const errors: string[] = [];

  const pathMap = buildWorkspacePathMap(view);

  try {
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(htmlContent, "text/html");

    // Check for parser errors
    const parserError = parsedDoc.querySelector("parsererror");
    if (parserError) {
      errors.push(`HTML parse warning: ${parserError.textContent?.slice(0, 100) ?? "syntax issue"}`);
    }

    // 1. Resolve <link rel="stylesheet" href="...">
    const linkElements = Array.from(parsedDoc.querySelectorAll("link"));
    for (const link of linkElements) {
      const rel = (link.getAttribute("rel") || "").toLowerCase().trim();
      if (!rel.includes("stylesheet")) continue;
      const href = link.getAttribute("href");
      if (!href) continue;

      const resolved = resolveRelativePath(htmlPath, href);
      if (!resolved) continue; // External or non-relative link

      const targetNode = pathMap.get(nameKey(resolved))?.node;
      if (targetNode && targetNode.type === "file") {
        const cssText = getFileText(doc, targetNode.id)?.toString() ?? "";
        const style = parsedDoc.createElement("style");
        style.setAttribute("data-confluo-href", href);
        style.setAttribute("data-confluo-path", resolved);
        style.textContent = cssText;
        link.replaceWith(style);
        resolvedAssets.push(resolved);
      } else {
        missingAssets.push(resolved);
      }
    }

    // 2. Resolve <script src="...">
    const scriptElements = Array.from(parsedDoc.querySelectorAll("script[src]"));
    for (const script of scriptElements) {
      const src = script.getAttribute("src");
      if (!src) continue;

      const resolved = resolveRelativePath(htmlPath, src);
      if (!resolved) continue; // External script

      const targetNode = pathMap.get(nameKey(resolved))?.node;
      if (targetNode && targetNode.type === "file") {
        const jsText = getFileText(doc, targetNode.id)?.toString() ?? "";
        script.removeAttribute("src");
        script.setAttribute("data-confluo-src", src);
        script.setAttribute("data-confluo-path", resolved);
        script.textContent = jsText;
        resolvedAssets.push(resolved);
      } else {
        missingAssets.push(resolved);
      }
    }

    // 3. Resolve <img src="...">
    const imgElements = Array.from(parsedDoc.querySelectorAll("img[src]"));
    for (const img of imgElements) {
      const src = img.getAttribute("src");
      if (!src) continue;

      const resolved = resolveRelativePath(htmlPath, src);
      if (!resolved) continue;

      const targetNode = pathMap.get(nameKey(resolved))?.node;
      if (targetNode && targetNode.type === "file") {
        if (targetNode.kind === "binary" && targetNode.assetId && projectId) {
          img.setAttribute("src", assetUrl(projectId, targetNode.assetId));
          resolvedAssets.push(resolved);
        } else if (targetNode.name.toLowerCase().endsWith(".svg")) {
          // Inlined text SVG
          const svgContent = getFileText(doc, targetNode.id)?.toString() ?? "";
          img.setAttribute("src", `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`);
          resolvedAssets.push(resolved);
        } else {
          resolvedAssets.push(resolved);
        }
      } else {
        missingAssets.push(resolved);
      }
    }

    // Serialise document
    let serialized = parsedDoc.documentElement ? parsedDoc.documentElement.outerHTML : htmlContent;

    // Preserve DOCTYPE if original had it
    if (/^\s*<!doctype html>/i.test(htmlContent) && !/^\s*<!doctype html>/i.test(serialized)) {
      serialized = "<!DOCTYPE html>\n" + serialized;
    }

    // Append the runtime script before </body> or at the end
    if (serialized.includes("</body>")) {
      serialized = serialized.replace("</body>", `${RUNTIME_INJECTION_SCRIPT}\n</body>`);
    } else {
      serialized = serialized + RUNTIME_INJECTION_SCRIPT;
    }

    return {
      html: serialized,
      resolvedAssets,
      missingAssets,
      errors,
    };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return {
      html: htmlContent + RUNTIME_INJECTION_SCRIPT,
      resolvedAssets,
      missingAssets,
      errors,
    };
  }
}
