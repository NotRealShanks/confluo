// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import WorkspaceExplorer from "./WorkspaceExplorer";
import { createNode, renameNode } from "./ops";

vi.mock("@liveblocks/react/suspense", () => ({
  useSelf: (selector: (value: { canWrite: boolean }) => unknown) =>
    selector({ canWrite: true }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WorkspaceExplorer file and folder icons integration", () => {
  it("renders distinct icons for diverse files and folders in tree view", () => {
    const doc = new Y.Doc();
    const onSelectFile = vi.fn();

    // Create folders
    const srcFolder = createNode(doc, { type: "folder", name: "src", parentId: null });
    createNode(doc, { type: "folder", name: "tests", parentId: null });
    createNode(doc, { type: "folder", name: "docs", parentId: null });

    // Create files
    createNode(doc, { type: "file", name: "package.json", parentId: null });
    createNode(doc, { type: "file", name: "Dockerfile", parentId: null });
    createNode(doc, { type: "file", name: "App.tsx", parentId: srcFolder.ok ? srcFolder.value : null });
    createNode(doc, { type: "file", name: "index.html", parentId: null });
    createNode(doc, { type: "file", name: "styles.css", parentId: null });
    createNode(doc, { type: "file", name: "banner.png", parentId: null });
    createNode(doc, { type: "file", name: "unknown.xyz", parentId: null });

    render(
      <WorkspaceExplorer
        doc={doc}
        projectId="test-proj"
        ready
        selectedFileId={null}
        onSelectFile={onSelectFile}
      />,
    );

    // Verify folder icons
    expect(screen.getByTestId("folder-icon-src")).toBeDefined();
    expect(screen.getByTestId("folder-icon-tests")).toBeDefined();
    expect(screen.getByTestId("folder-icon-default")).toBeDefined();

    // Verify special and extension file icons
    expect(screen.getByTestId("file-icon-package.json")).toBeDefined();
    expect(screen.getByTestId("file-icon-docker")).toBeDefined();
    expect(screen.getByTestId("file-icon-html")).toBeDefined();
    expect(screen.getByTestId("file-icon-css")).toBeDefined();
    expect(screen.getByTestId("file-icon-image")).toBeDefined();
    expect(screen.getByTestId("file-icon-file")).toBeDefined(); // unknown fallback
  });

  it("updates file icon dynamically when a file is renamed to a different extension", () => {
    const doc = new Y.Doc();
    const onSelectFile = vi.fn();

    const file = createNode(doc, { type: "file", name: "script.js", parentId: null });
    if (!file.ok) throw new Error("Failed to create file");

    const { rerender } = render(
      <WorkspaceExplorer
        doc={doc}
        projectId="test-proj"
        ready
        selectedFileId={null}
        onSelectFile={onSelectFile}
      />,
    );

    expect(screen.getByTestId("file-icon-javascript")).toBeDefined();
    expect(screen.queryByTestId("file-icon-typescript")).toBeNull();

    // Rename script.js to script.ts
    renameNode(doc, file.value, "script.ts");

    rerender(
      <WorkspaceExplorer
        doc={doc}
        projectId="test-proj"
        ready
        selectedFileId={null}
        onSelectFile={onSelectFile}
      />,
    );

    expect(screen.getByTestId("file-icon-typescript")).toBeDefined();
    expect(screen.queryByTestId("file-icon-javascript")).toBeNull();
  });

  it("expands folder and reveals nested file icons", () => {
    const doc = new Y.Doc();
    const onSelectFile = vi.fn();

    const componentsFolder = createNode(doc, { type: "folder", name: "components", parentId: null });
    if (!componentsFolder.ok) throw new Error("Failed to create folder");

    createNode(doc, { type: "file", name: "Button.tsx", parentId: componentsFolder.value });

    render(
      <WorkspaceExplorer
        doc={doc}
        projectId="test-proj"
        ready
        selectedFileId={null}
        onSelectFile={onSelectFile}
      />,
    );

    // Initial folder state: closed
    const folderIcon = screen.getByTestId("folder-icon-components");
    expect(folderIcon.classList.contains("is-expanded")).toBe(false);

    // Expand folder
    const expandBtn = screen.getByLabelText("Expand components");
    fireEvent.click(expandBtn);

    // After expanding, folder is expanded and nested Button.tsx is visible
    expect(folderIcon.classList.contains("is-expanded")).toBe(true);
    expect(screen.getByTestId("file-icon-react-ts")).toBeDefined();
  });
});
