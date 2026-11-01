// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { createNode, snapshot } from "../workspace/ops";
import { BrowserPreview } from "./BrowserPreview";

describe("BrowserPreview Component", () => {
  afterEach(() => {
    cleanup();
  });
  function setupTestWorkspace() {
    const doc = new Y.Doc();
    createNode(doc, {
      type: "file",
      name: "index.html",
      parentId: null,
      content: "<!DOCTYPE html><html><body><h1>Index Page</h1><a href=\"about.html\">About</a></body></html>",
    });
    createNode(doc, {
      type: "file",
      name: "about.html",
      parentId: null,
      content: "<!DOCTYPE html><html><body><h1>About Page</h1></body></html>",
    });
    createNode(doc, {
      type: "file",
      name: "style.css",
      parentId: null,
      content: "body { background: #000; }",
    });

    const view = snapshot(doc);
    return { doc, view };
  }

  it("renders toolbar controls and sandboxed iframe without allow-same-origin", () => {
    const { doc, view } = setupTestWorkspace();
    const onClose = vi.fn();
    const onToggleMaximize = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={onClose}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    expect(screen.getByTestId("browser-preview-panel")).toBeDefined();
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Forward" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Reload preview" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Open preview in new tab" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Close preview" })).toBeDefined();

    const iframe = screen.getByTestId("browser-preview-iframe") as HTMLIFrameElement;
    expect(iframe).toBeDefined();
    const sandbox = iframe.getAttribute("sandbox") || "";
    expect(sandbox).toContain("allow-scripts");
    expect(sandbox).toContain("allow-modals");
    expect(sandbox).toContain("allow-forms");
    expect(sandbox).toContain("allow-popups");
    expect(sandbox).not.toContain("allow-popups-to-escape-sandbox");
    expect(sandbox).not.toContain("allow-same-origin");
  });

  it("calls onClose when the close button is clicked", () => {
    const { doc, view } = setupTestWorkspace();
    const onClose = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleMaximize when maximize/restore is clicked", () => {
    const { doc, view } = setupTestWorkspace();
    const onToggleMaximize = vi.fn();

    const { rerender } = render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        isMaximized={false}
        onClose={vi.fn()}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Maximize preview" }));
    expect(onToggleMaximize).toHaveBeenCalledTimes(1);

    rerender(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        isMaximized={true}
        onClose={vi.fn()}
        onToggleMaximize={onToggleMaximize}
      />,
    );

    expect(screen.getByRole("button", { name: "Restore size" })).toBeDefined();
  });

  it("supports switching HTML file from the address bar selector", () => {
    const { doc, view } = setupTestWorkspace();
    const onNavigateFile = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
        onNavigateFile={onNavigateFile}
      />,
    );

    const select = screen.getByRole("combobox", { name: "Select preview file" }) as HTMLSelectElement;
    expect(select.value).toBe("index.html");

    fireEvent.change(select, { target: { value: "about.html" } });
    expect(select.value).toBe("about.html");
    expect(onNavigateFile).toHaveBeenCalledTimes(1);

    // Now Back button should be enabled
    const backBtn = screen.getByRole("button", { name: "Back" });
    expect(backBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(backBtn);
    expect(select.value).toBe("index.html");
  });

  it("opens preview in new tab via window.open and Blob URL", () => {
    const { doc, view } = setupTestWorkspace();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open preview in new tab" }));
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("handles iframe link navigation messages strictly from preview iframe contentWindow", () => {
    const { doc, view } = setupTestWorkspace();
    const onNavigateFile = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
        onNavigateFile={onNavigateFile}
      />,
    );

    const iframe = screen.getByTestId("browser-preview-iframe") as HTMLIFrameElement;

    // Simulate postMessage sent by the preview runtime script from the iframe
    fireEvent(
      window,
      new MessageEvent("message", {
        source: iframe.contentWindow,
        data: {
          type: "CONFLUO_PREVIEW_NAVIGATE",
          href: "about.html",
        },
      }),
    );

    const select = screen.getByRole("combobox", { name: "Select preview file" }) as HTMLSelectElement;
    expect(select.value).toBe("about.html");
    expect(onNavigateFile).toHaveBeenCalled();
  });

  it("ignores postMessage from untrusted sources or other windows", () => {
    const { doc, view } = setupTestWorkspace();
    const onNavigateFile = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
        onNavigateFile={onNavigateFile}
      />,
    );

    // Event without iframe contentWindow source (e.g. from parent window or foreign frame)
    fireEvent(
      window,
      new MessageEvent("message", {
        source: window,
        data: {
          type: "CONFLUO_PREVIEW_NAVIGATE",
          href: "about.html",
        },
      }),
    );

    const select = screen.getByRole("combobox", { name: "Select preview file" }) as HTMLSelectElement;
    // Must remain on index.html, not navigated
    expect(select.value).toBe("index.html");
    expect(onNavigateFile).not.toHaveBeenCalled();
  });

  it("ignores postMessage with invalid or unexpected schema", () => {
    const { doc, view } = setupTestWorkspace();
    const onNavigateFile = vi.fn();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
        onNavigateFile={onNavigateFile}
      />,
    );

    const iframe = screen.getByTestId("browser-preview-iframe") as HTMLIFrameElement;

    // String message
    fireEvent(
      window,
      new MessageEvent("message", {
        source: iframe.contentWindow,
        data: "SOME_RAW_STRING_MESSAGE",
      }),
    );

    // Unrecognized type
    fireEvent(
      window,
      new MessageEvent("message", {
        source: iframe.contentWindow,
        data: {
          type: "MALICIOUS_INJECTED_TYPE",
          action: "eval",
        },
      }),
    );

    const select = screen.getByRole("combobox", { name: "Select preview file" }) as HTMLSelectElement;
    expect(select.value).toBe("index.html");
    expect(onNavigateFile).not.toHaveBeenCalled();
  });

  it("displays missing assets warnings when dependencies are not found", () => {
    const doc = new Y.Doc();
    createNode(doc, {
      type: "file",
      name: "page.html",
      parentId: null,
      content: '<!DOCTYPE html><html><head><link rel="stylesheet" href="missing.css"></head><body><h1>Missing</h1></body></html>',
    });
    const view = snapshot(doc);

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="page.html"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/Missing assets: missing.css/)).toBeDefined();
  });

  it("displays runtime errors reported by the iframe and supports dismissing them", () => {
    const { doc, view } = setupTestWorkspace();

    render(
      <BrowserPreview
        doc={doc}
        view={view}
        initialPath="index.html"
        onClose={vi.fn()}
      />,
    );

    const iframe = screen.getByTestId("browser-preview-iframe") as HTMLIFrameElement;

    fireEvent(
      window,
      new MessageEvent("message", {
        source: iframe.contentWindow,
        data: {
          type: "CONFLUO_PREVIEW_ERROR",
          message: "Uncaught ReferenceError: foo is not defined",
          lineno: 42,
        },
      }),
    );

    expect(screen.getByText(/Uncaught ReferenceError: foo is not defined \(line 42\)/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/Uncaught ReferenceError/)).toBeNull();
  });
});
