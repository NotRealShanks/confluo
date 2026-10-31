// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { createNode, snapshot } from "../workspace/ops";
import {
  bundleHtmlForPreview,
  normalizePathSegments,
  resolveRelativePath,
} from "./htmlResolver";

describe("htmlResolver", () => {
  describe("normalizePathSegments", () => {
    it("handles simple paths and current directory segments", () => {
      expect(normalizePathSegments("index.html")).toBe("index.html");
      expect(normalizePathSegments("./style.css")).toBe("style.css");
      expect(normalizePathSegments("assets/./css/main.css")).toBe("assets/css/main.css");
    });

    it("handles parent directory traversal", () => {
      expect(normalizePathSegments("assets/../style.css")).toBe("style.css");
      expect(normalizePathSegments("a/b/c/../../d.js")).toBe("a/d.js");
    });

    it("returns null when attempting to escape root", () => {
      expect(normalizePathSegments("../index.html")).toBeNull();
      expect(normalizePathSegments("a/../../index.html")).toBeNull();
    });

    it("handles empty or root paths", () => {
      expect(normalizePathSegments("")).toBe("");
      expect(normalizePathSegments("/")).toBe("");
    });
  });

  describe("resolveRelativePath", () => {
    it("resolves paths relative to root HTML file", () => {
      expect(resolveRelativePath("index.html", "style.css")).toBe("style.css");
      expect(resolveRelativePath("index.html", "./script.js")).toBe("script.js");
      expect(resolveRelativePath("index.html", "assets/logo.png")).toBe("assets/logo.png");
    });

    it("resolves paths relative to nested HTML file", () => {
      expect(resolveRelativePath("pages/about.html", "about.css")).toBe("pages/about.css");
      expect(resolveRelativePath("pages/about.html", "../shared.css")).toBe("shared.css");
      expect(resolveRelativePath("src/views/item.html", "../../assets/logo.svg")).toBe("assets/logo.svg");
    });

    it("resolves root-relative paths starting with /", () => {
      expect(resolveRelativePath("pages/deep/index.html", "/style.css")).toBe("style.css");
      expect(resolveRelativePath("pages/deep/index.html", "/assets/banner.png")).toBe("assets/banner.png");
    });

    it("strips queries and hashes for filesystem lookup", () => {
      expect(resolveRelativePath("index.html", "style.css?v=1.2.3")).toBe("style.css");
      expect(resolveRelativePath("index.html", "about.html#section-2")).toBe("about.html");
    });

    it("ignores external and non-workspace URLs", () => {
      expect(resolveRelativePath("index.html", "https://cdn.example.com/app.js")).toBeNull();
      expect(resolveRelativePath("index.html", "http://localhost:3000/api")).toBeNull();
      expect(resolveRelativePath("index.html", "//fonts.googleapis.com/css")).toBeNull();
      expect(resolveRelativePath("index.html", "data:text/css;base64,...")).toBeNull();
      expect(resolveRelativePath("index.html", "mailto:test@example.com")).toBeNull();
      expect(resolveRelativePath("index.html", "javascript:void(0)")).toBeNull();
      expect(resolveRelativePath("index.html", "#top")).toBeNull();
    });
  });

  describe("bundleHtmlForPreview", () => {
    it("inlines linked CSS and script files and injects runtime bridge", () => {
      const doc = new Y.Doc();
      const cssResult = createNode(doc, {
        type: "file",
        name: "style.css",
        parentId: null,
        content: "body { background: #121212; color: #fff; }",
      });
      const jsResult = createNode(doc, {
        type: "file",
        name: "app.js",
        parentId: null,
        content: "console.log('confluo preview test');",
      });

      expect(cssResult.ok).toBe(true);
      expect(jsResult.ok).toBe(true);

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello Confluo</h1>
  <script src="app.js"></script>
</body>
</html>`;

      const view = snapshot(doc);
      const result = bundleHtmlForPreview({
        htmlContent: html,
        htmlPath: "index.html",
        view,
        doc,
      });

      expect(result.resolvedAssets).toContain("style.css");
      expect(result.resolvedAssets).toContain("app.js");
      expect(result.missingAssets).toHaveLength(0);
      expect(result.html).toContain("body { background: #121212; color: #fff; }");
      expect(result.html).toContain("console.log('confluo preview test');");
      expect(result.html).toContain("data-confluo-runtime");
      expect(result.html).toContain("CONFLUO_PREVIEW_NAVIGATE");
    });

    it("reports missing assets when files do not exist in workspace", () => {
      const doc = new Y.Doc();
      const view = snapshot(doc);
      const html = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="missing.css">
</head>
<body>
  <script src="missing.js"></script>
</body>
</html>`;

      const result = bundleHtmlForPreview({
        htmlContent: html,
        htmlPath: "index.html",
        view,
        doc,
      });

      expect(result.missingAssets).toContain("missing.css");
      expect(result.missingAssets).toContain("missing.js");
    });

    it("inlines text SVG images as data URLs and links binary assets", () => {
      const doc = new Y.Doc();
      createNode(doc, {
        type: "file",
        name: "icon.svg",
        parentId: null,
        content: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>',
      });
      createNode(doc, {
        type: "file",
        name: "photo.jpg",
        parentId: null,
        contentKind: "binary",
        assetId: "asset-123",
        mimeType: "image/jpeg",
      });

      const view = snapshot(doc);
      const html = `<img src="icon.svg"><img src="photo.jpg">`;

      const result = bundleHtmlForPreview({
        htmlContent: html,
        htmlPath: "index.html",
        view,
        doc,
        projectId: "proj-1",
      });

      expect(result.resolvedAssets).toContain("icon.svg");
      expect(result.resolvedAssets).toContain("photo.jpg");
      expect(result.html).toContain("data:image/svg+xml;charset=utf-8");
      expect(result.html).toContain("/api/projects/proj-1/assets/asset-123");
    });
  });
});
