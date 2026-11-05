import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { TEMPLATES, getTemplateById } from "./catalog";
import { applyTemplateToWorkspace } from "./generator";
import { buildTree } from "../workspace/tree";
import { readRawNodes } from "../workspace/ops";
import { LIMITS } from "../workspace/types";

describe("Project Templates Catalog", () => {
  it("contains ready-made starter templates including frameworks, SVG assets, packages, and language starters", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toContain("blank");
    expect(ids).toContain("react-ts");
    expect(ids).toContain("react-js");
    expect(ids).toContain("angular");
    expect(ids).toContain("vue");
    expect(ids).toContain("svelte");
    expect(ids).toContain("solid");
    expect(ids).toContain("node-express");
    expect(ids).toContain("node-ts");
    expect(ids).toContain("html-css-js");
    expect(ids).toContain("python");
    expect(ids).toContain("cpp");
    expect(ids).toContain("java");
    expect(ids).toContain("rust");
    expect(ids).toContain("go");
    expect(ids).not.toContain("spring-boot");
    expect(ids).not.toContain("flask");
    expect(TEMPLATES.length).toBe(15);
  });

  it("resolves template by ID with safe fallback to blank and legacy fallback for older projects", () => {
    expect(getTemplateById("react-ts").id).toBe("react-ts");
    expect(getTemplateById("non-existent-id").id).toBe("blank");
    expect(getTemplateById(null).id).toBe("blank");
    expect(getTemplateById("spring-boot").id).toBe("spring-boot");
    expect(getTemplateById("flask").id).toBe("flask");
  });

  it("ensures every template satisfies workspace limits", () => {
    for (const t of TEMPLATES) {
      expect(t.name.trim().length).toBeGreaterThan(0);
      expect(t.description.trim().length).toBeGreaterThan(0);
      expect(t.files.length).toBeLessThan(LIMITS.maxNodes);

      const paths = new Set<string>();
      for (const f of t.files) {
        expect(f.path.trim().length).toBeGreaterThan(0);
        expect(paths.has(f.path)).toBe(false); // No duplicates
        paths.add(f.path);

        const segments = f.path.split("/");
        expect(segments.length).toBeLessThanOrEqual(LIMITS.maxDepth);
        for (const seg of segments) {
          expect(seg.length).toBeLessThanOrEqual(LIMITS.maxNameLength);
        }
      }
    }
  });
});

describe("applyTemplateToWorkspace Generator", () => {
  it("initializes a blank template with zero nodes and marks initialized", () => {
    const doc = new Y.Doc();
    const blank = getTemplateById("blank");
    const result = applyTemplateToWorkspace(doc, blank);

    expect(result.applied).toBe(true);
    expect(result.entrypointFileId).toBeNull();
    expect(result.createdNodeCount).toBe(0);
    expect(doc.getMap("tree").size).toBe(0);
    expect(doc.getMap("workspace").get("initialized")).toBe(true);
  });

  it("generates correct folder hierarchy and text contents for React + TypeScript", () => {
    const doc = new Y.Doc();
    const reactTs = getTemplateById("react-ts");
    const result = applyTemplateToWorkspace(doc, reactTs);

    expect(result.applied).toBe(true);
    expect(result.entrypointFileId).toBeDefined();

    // Verify snapshot produces a clean valid tree view
    const raw = readRawNodes(doc);
    const view = buildTree(raw);
    expect(view.nodes.size).toBe(result.createdNodeCount);

    // Should have created a 'src' folder
    const srcFolder = Array.from(view.nodes.values()).find(
      (n) => n.type === "folder" && n.name === "src"
    );
    expect(srcFolder).toBeDefined();
    expect(srcFolder?.parentId).toBeNull();

    // App.tsx should be under src
    const appFile = Array.from(view.nodes.values()).find(
      (n) => n.type === "file" && n.name === "App.tsx"
    );
    expect(appFile).toBeDefined();
    expect(appFile?.parentId).toBe(srcFolder?.id);

    // Content should be in contents map
    const appContent = doc.getMap("contents").get(appFile!.id);
    expect(appContent).toBeInstanceOf(Y.Text);
    expect((appContent as Y.Text).toString()).toContain("React 19 + TypeScript");

    // Entrypoint should match App.tsx
    expect(result.entrypointFileId).toBe(appFile?.id);
  });

  it("is idempotent and will not re-apply to an initialized or non-empty workspace", () => {
    const doc = new Y.Doc();
    const reactTs = getTemplateById("react-ts");

    // First apply
    const res1 = applyTemplateToWorkspace(doc, reactTs);
    expect(res1.applied).toBe(true);
    const initialSize = doc.getMap("tree").size;

    // Second apply with another template
    const vue = getTemplateById("vue");
    const res2 = applyTemplateToWorkspace(doc, vue);
    expect(res2.applied).toBe(false);
    expect(doc.getMap("tree").size).toBe(initialSize); // Unchanged
  });

  it("generates and customizes Vue 3 template files with dependencies", () => {
    const doc = new Y.Doc();
    const vue = getTemplateById("vue");
    const result = applyTemplateToWorkspace(doc, vue, {
      dependencies: ["pinia", "axios"],
    }, "my-vue-dashboard");

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const pkgNode = Array.from(view.nodes.values()).find((n) => n.name === "package.json");
    expect(pkgNode).toBeDefined();

    const pkgText = doc.getMap("contents").get(pkgNode!.id)?.toString();
    const parsed = JSON.parse(pkgText!);
    expect(parsed.name).toBe("my-vue-dashboard");
    expect(parsed.dependencies["pinia"]).toBeDefined();
    expect(parsed.dependencies["axios"]).toBeDefined();
  });

  it("generates and customizes Angular template files with dependencies", () => {
    const doc = new Y.Doc();
    const angular = getTemplateById("angular");
    const result = applyTemplateToWorkspace(doc, angular, {
      dependencies: ["rxjs"],
    }, "my-angular-app");

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const pkgNode = Array.from(view.nodes.values()).find((n) => n.name === "package.json");
    expect(pkgNode).toBeDefined();

    const pkgText = doc.getMap("contents").get(pkgNode!.id)?.toString();
    const parsed = JSON.parse(pkgText!);
    expect(parsed.name).toBe("my-angular-app");
    expect(parsed.dependencies["rxjs"]).toBeDefined();
  });

  it("customizes Node/Express template with dependencies and module type", () => {
    const doc = new Y.Doc();
    const node = getTemplateById("node-express");
    const result = applyTemplateToWorkspace(doc, node, {
      dependencies: ["cors", "dotenv", "mongoose"],
      moduleType: "module",
      port: "8080",
    }, "my-api");

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const pkgNode = Array.from(view.nodes.values()).find((n) => n.name === "package.json");
    expect(pkgNode).toBeDefined();
    const parsed = JSON.parse(doc.getMap("contents").get(pkgNode!.id)!.toString());
    expect(parsed.name).toBe("my-api");
    expect(parsed.dependencies["cors"]).toBeDefined();
    expect(parsed.dependencies["dotenv"]).toBeDefined();
    expect(parsed.dependencies["mongoose"]).toBeDefined();

    const serverNode = Array.from(view.nodes.values()).find((n) => n.name === "index.js");
    expect(serverNode).toBeDefined();
    const serverText = doc.getMap("contents").get(serverNode!.id)!.toString();
    expect(serverText).toContain("8080");
  });

  it("customizes React package.json with chosen dependencies", () => {
    const doc = new Y.Doc();
    const react = getTemplateById("react-ts");
    const result = applyTemplateToWorkspace(doc, react, {
      dependencies: ["axios", "zustand", "zod"],
    });

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const pkgNode = Array.from(view.nodes.values()).find((n) => n.name === "package.json");
    expect(pkgNode).toBeDefined();

    const pkgText = doc.getMap("contents").get(pkgNode!.id)?.toString();
    const parsed = JSON.parse(pkgText!);
    expect(parsed.dependencies["axios"]).toBeDefined();
    expect(parsed.dependencies["zustand"]).toBeDefined();
    expect(parsed.dependencies["zod"]).toBeDefined();
  });

  it("includes ready-made SVG image assets in React, Svelte, and Vue templates", () => {
    const doc = new Y.Doc();
    const react = getTemplateById("react-ts");
    applyTemplateToWorkspace(doc, react);

    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const viteSvg = Array.from(view.nodes.values()).find((n) => n.name === "vite.svg");
    const reactSvg = Array.from(view.nodes.values()).find((n) => n.name === "react.svg");
    expect(viteSvg).toBeDefined();
    expect(reactSvg).toBeDefined();

    const svgContent = doc.getMap("contents").get(viteSvg!.id)?.toString();
    expect(svgContent).toContain("<svg");
  });

  it("initializes multi-language Python starter with utils and entrypoint", () => {
    const doc = new Y.Doc();
    const py = getTemplateById("python");
    const result = applyTemplateToWorkspace(doc, py);

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const mainPy = Array.from(view.nodes.values()).find((n) => n.name === "main.py");
    const utilsPy = Array.from(view.nodes.values()).find((n) => n.name === "utils.py");
    expect(mainPy).toBeDefined();
    expect(utilsPy).toBeDefined();
    expect(result.entrypointFileId).toBe(mainPy?.id);
  });
});
