// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as Y from "yjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import WorkspaceExplorer from "./WorkspaceExplorer";
import { snapshot } from "./ops";

vi.mock("@liveblocks/react/suspense", () => ({
  useSelf: (selector: (value: { canWrite: boolean }) => unknown) =>
    selector({ canWrite: true }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderExplorer() {
  const doc = new Y.Doc();
  const onSelectFile = vi.fn();
  render(
    <WorkspaceExplorer
      doc={doc}
      ready
      selectedFileId={null}
      onSelectFile={onSelectFile}
    />,
  );
  return { doc, onSelectFile };
}

function renderExplorerWithRequest(createFileRequest: number) {
  const doc = new Y.Doc();
  const onSelectFile = vi.fn();
  render(
    <WorkspaceExplorer
      doc={doc}
      ready
      selectedFileId={null}
      onSelectFile={onSelectFile}
      createFileRequest={createFileRequest}
    />,
  );
  return { doc, onSelectFile };
}

function createFolder(doc: Y.Doc, name: string, parentId: string | null = null) {
  const node = snapshot(doc);
  const folder = node.children.get(parentId)?.find((item) => item.name === name);
  if (folder) return folder.id;
  const tree = doc.getMap("tree");
  const id = `${name}-id`;
  const value = new Y.Map<unknown>();
  value.set("type", "folder");
  value.set("name", name);
  value.set("parentId", parentId);
  tree.set(id, value);
  return id;
}

describe("WorkspaceExplorer new file input", () => {
  it("confirms a valid filename and selects the new file", () => {
    const { doc, onSelectFile } = renderExplorer();

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    const input = screen.getByRole("textbox", { name: "New file name" });
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: "app.js" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(snapshot(doc).nodes.size).toBe(1);
    expect(snapshot(doc).children.get(null)?.[0].name).toBe("app.js");
    expect(onSelectFile).toHaveBeenCalledWith(expect.any(String));
    expect(screen.queryByRole("textbox", { name: "New file name" })).toBeNull();
  });

  it("cancels without changing the workspace", () => {
    const { doc } = renderExplorer();

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New file name" }), {
      target: { value: "cancelled.js" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "New file name" }), { key: "Escape" });

    expect(snapshot(doc).nodes.size).toBe(0);
    expect(screen.queryByRole("textbox", { name: "New file name" })).toBeNull();
  });

  it("shows validation errors inline and keeps the input open", () => {
    const { doc } = renderExplorer();

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    const input = screen.getByRole("textbox", { name: "New file name" });
    fireEvent.change(input, { target: { value: "../invalid.js" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/invalid|name/i)).not.toBeNull();
    expect(snapshot(doc).nodes.size).toBe(0);
  });

  it("creates a folder with Enter and cancels when clicking outside", () => {
    const { doc } = renderExplorer();

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    const input = screen.getByRole("textbox", { name: "New folder name" });
    fireEvent.change(input, { target: { value: "src" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(snapshot(doc).children.get(null)?.[0].name).toBe("src");

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByRole("textbox", { name: "New folder name" }), {
      target: { value: "cancelled" },
    });
    fireEvent.pointerDown(document.body);

    expect(snapshot(doc).children.get(null)).toHaveLength(1);
    expect(screen.queryByRole("textbox", { name: "New folder name" })).toBeNull();
  });

  it("uses the selected folder as the toolbar parent for files and folders", () => {
    const { doc, onSelectFile } = renderExplorer();
    const srcId = createFolder(doc, "src");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "src" }));

    fireEvent.click(screen.getByRole("button", { name: "New file" }));
    const fileInput = screen.getByRole("textbox", { name: "New file name" });
    fireEvent.change(fileInput, { target: { value: "index.js" } });
    fireEvent.keyDown(fileInput, { key: "Enter" });

    let view = snapshot(doc);
    const file = view.children.get(srcId)?.find((item) => item.name === "index.js");
    expect(file?.parentId).toBe(srcId);
    expect(onSelectFile).toHaveBeenCalledWith(file?.id);

    fireEvent.click(screen.getByRole("button", { name: "src" }));
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    const folderInput = screen.getByRole("textbox", { name: "New folder name" });
    fireEvent.change(folderInput, { target: { value: "components" } });
    fireEvent.keyDown(folderInput, { key: "Enter" });

    view = snapshot(doc);
    const nestedFolder = view.children.get(srcId)?.find((item) => item.name === "components");
    expect(nestedFolder?.parentId).toBe(srcId);
    expect(screen.getByRole("button", { name: "Collapse components" })).not.toBeNull();
  });

  it("uses a context folder as the parent and renders the nested input", () => {
    const { doc } = renderExplorer();
    const srcId = createFolder(doc, "src");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.contextMenu(screen.getByRole("button", { name: "src" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "New File" }));

    const input = screen.getByRole("textbox", { name: "New file name" });
    fireEvent.change(input, { target: { value: "nested.js" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(snapshot(doc).children.get(srcId)?.[0].parentId).toBe(srcId);
  });

  it("creates at the root when no folder is selected", () => {
    const { doc } = renderExplorerWithRequest(1);
    const input = screen.getByRole("textbox", { name: "New file name" });

    fireEvent.change(input, { target: { value: "root.js" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const rootFile = snapshot(doc).children.get(null)?.[0];
    expect(rootFile?.name).toBe("root.js");
    expect(rootFile?.parentId).toBeNull();
  });

  it("does not reopen an existing creation request when the folder selection changes", () => {
    const { doc } = renderExplorerWithRequest(1);
    const srcId = createFolder(doc, "src");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "New file name" }), { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "src" }));

    expect(screen.queryByRole("textbox", { name: "New file name" })).toBeNull();
    expect(snapshot(doc).nodes.get(srcId)?.type).toBe("folder");
  });
});
