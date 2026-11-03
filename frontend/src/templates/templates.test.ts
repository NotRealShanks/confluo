import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { TEMPLATES, getTemplateById } from "./catalog";
import { applyTemplateToWorkspace } from "./generator";
import { buildTree } from "../workspace/tree";
import { readRawNodes } from "../workspace/ops";
import { LIMITS } from "../workspace/types";

describe("Project Templates Catalog", () => {
  it("contains all 9 required starter templates", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toContain("blank");
    expect(ids).toContain("react-ts");
    expect(ids).toContain("react-js");
    expect(ids).toContain("angular");
    expect(ids).toContain("vue");
    expect(ids).toContain("spring-boot");
    expect(ids).toContain("flask");
    expect(ids).toContain("node-express");
    expect(ids).toContain("html-css-js");
    expect(TEMPLATES.length).toBe(9);
  });

  it("resolves template by ID with safe fallback to blank", () => {
    expect(getTemplateById("react-ts").id).toBe("react-ts");
    expect(getTemplateById("non-existent-id").id).toBe("blank");
    expect(getTemplateById(null).id).toBe("blank");
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
    expect((appContent as Y.Text).toString()).toContain("React + TypeScript Starter");

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
    const flask = getTemplateById("flask");
    const res2 = applyTemplateToWorkspace(doc, flask);
    expect(res2.applied).toBe(false);
    expect(doc.getMap("tree").size).toBe(initialSize); // Unchanged
  });

  it("generates deeply nested Spring Boot structure with valid acyclic paths", () => {
    const doc = new Y.Doc();
    const spring = getTemplateById("spring-boot");
    const result = applyTemplateToWorkspace(doc, spring);

    expect(result.applied).toBe(true);
    const view = buildTree(readRawNodes(doc));
    expect(view.nodes.size).toBe(result.createdNodeCount);

    // Verify DemoApplication.java is reachable
    const demoApp = Array.from(view.nodes.values()).find(
      (n) => n.name === "DemoApplication.java"
    );
    expect(demoApp).toBeDefined();
    expect(demoApp?.type).toBe("file");
  });

  it("customizes Spring Boot pom.xml and packages when configuration is provided", () => {
    const doc = new Y.Doc();
    const spring = getTemplateById("spring-boot");
    const result = applyTemplateToWorkspace(doc, spring, {
      groupId: "org.acme",
      artifactId: "microservice",
      packageName: "org.acme.microservice",
      javaVersion: "21",
      bootVersion: "3.3.0",
      dependencies: ["web", "data-jpa", "postgresql", "lombok"],
    });

    expect(result.applied).toBe(true);
    const raw = readRawNodes(doc);
    const view = buildTree(raw);

    const pomNode = Array.from(view.nodes.values()).find((n) => n.name === "pom.xml");
    expect(pomNode).toBeDefined();

    const pomText = doc.getMap("contents").get(pomNode!.id)?.toString();
    expect(pomText).toContain("<groupId>org.acme</groupId>");
    expect(pomText).toContain("<artifactId>microservice</artifactId>");
    expect(pomText).toContain("<java.version>21</java.version>");
    expect(pomText).toContain("spring-boot-starter-web");
    expect(pomText).toContain("spring-boot-starter-data-jpa");
    expect(pomText).toContain("postgresql");
    expect(pomText).toContain("lombok");

    // Application.java should be in org/acme/microservice
    const appNode = Array.from(view.nodes.values()).find((n) => n.name === "Application.java");
    expect(appNode).toBeDefined();
    const appText = doc.getMap("contents").get(appNode!.id)?.toString();
    expect(appText).toContain("package org.acme.microservice;");
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
});