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
});
