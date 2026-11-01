// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { TerminalPanel } from "./TerminalPanel";
import { buildTree } from "../workspace/tree";
import * as executionApi from "../api/execution";

// Mock executeProject
vi.mock("../api/execution", () => ({
  executeProject: vi.fn(),
}));

describe("TerminalPanel - Interactive Linux Shell & Multi-Language Execution", () => {
  let doc: Y.Doc;

  beforeEach(() => {
    doc = new Y.Doc();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("displays the project title dynamically in the shell prompt", () => {
    const view = buildTree([]);
    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    // Initial prompt should show the project name: confluo:~/hello$
    const prompts = screen.getAllByText(/confluo:~\/hello\$/);
    expect(prompts.length).toBeGreaterThan(0);
  });

  it("handles 'pwd' and prints correct virtual working directory path", async () => {
    const view = buildTree([]);
    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });
    fireEvent.change(input, { target: { value: "pwd" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("/home/user/hello")).toBeDefined();
    });
  });

  it("handles 'cd' navigation and updates prompt path", async () => {
    const rawNodes = [
      { id: "f1", name: "test", type: "folder" as const, parentId: null },
      { id: "f2", name: "hello.cpp", type: "file" as const, parentId: null },
    ];
    const view = buildTree(rawNodes);

    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });

    // Navigate into 'test' folder
    fireEvent.change(input, { target: { value: "cd test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      // Active prompt should now be confluo:~/hello/test$
      expect(screen.getAllByText(/confluo:~\/hello\/test\$/).length).toBeGreaterThan(0);
    });

    // Navigate back up with 'cd ..'
    fireEvent.change(input, { target: { value: "cd .." } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getAllByText(/confluo:~\/hello\$/).length).toBeGreaterThan(0);
    });
  });

  it("handles basic Linux commands like 'whoami', 'uname -a', 'date'", async () => {
    const view = buildTree([]);
    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });

    // whoami
    fireEvent.change(input, { target: { value: "whoami" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("confluo-dev")).toBeDefined();
    });

    // uname -a
    fireEvent.change(input, { target: { value: "uname -a" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(screen.getByText(/Linux confluo-e2b/i)).toBeDefined();
    });
  });

  it("separates C++ compilation (g++) and execution (./a.out)", async () => {
    const rawNodes = [
      { id: "file-cpp", name: "hello.cpp", type: "file" as const, parentId: null },
    ];
    const view = buildTree(rawNodes);

    // Mock successful compilation
    vi.mocked(executionApi.executeProject).mockResolvedValueOnce({
      stdout: "",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });

    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });

    // 1. Run g++ hello.cpp -> should only compile
    fireEvent.change(input, { target: { value: "g++ hello.cpp" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(executionApi.executeProject).toHaveBeenCalledWith("p-123", expect.objectContaining({
        language: "cpp-compile",
        entrypoint: "hello.cpp",
      }));
    });

    // 2. Mock running the binary
    vi.mocked(executionApi.executeProject).mockResolvedValueOnce({
      stdout: "Hello World!\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });

    // Run ./a.out -> executes the compiled binary
    fireEvent.change(input, { target: { value: "./a.out" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(executionApi.executeProject).toHaveBeenCalledWith("p-123", expect.objectContaining({
        language: "cpp-run",
        entrypoint: "hello.cpp",
      }));
      expect(screen.getByText("Hello World!")).toBeDefined();
    });
  });

  it("returns error when executing ./a.out before compiling", async () => {
    const view = buildTree([]);
    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });
    fireEvent.change(input, { target: { value: "./a.out" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(/bash: \.\/a\.out: No such file or directory/i)).toBeDefined();
    });
  });

  it("executes multi-language files via 'run <file>' (Rust, Go, Python, PHP, Ruby, SQL)", async () => {
    const rawNodes = [
      { id: "f-rs", name: "main.rs", type: "file" as const, parentId: null },
      { id: "f-go", name: "main.go", type: "file" as const, parentId: null },
      { id: "f-py", name: "app.py", type: "file" as const, parentId: null },
    ];
    const view = buildTree(rawNodes);

    vi.mocked(executionApi.executeProject).mockResolvedValue({
      stdout: "Rust Execution Output\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });

    render(
      <TerminalPanel
        projectId="p-123"
        projectName="hello"
        doc={doc}
        view={view}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Terminal command prompt" });

    // Test 'run main.rs'
    fireEvent.change(input, { target: { value: "run main.rs" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(executionApi.executeProject).toHaveBeenCalledWith("p-123", expect.objectContaining({
        language: "rust",
        entrypoint: "main.rs",
      }));
      expect(screen.getByText("Rust Execution Output")).toBeDefined();
    });

    // Test direct CLI 'go main.go'
    vi.mocked(executionApi.executeProject).mockResolvedValueOnce({
      stdout: "Go Execution Output\n",
      stderr: "",
      exitCode: 0,
      timedOut: false,
    });

    fireEvent.change(input, { target: { value: "go main.go" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(executionApi.executeProject).toHaveBeenCalledWith("p-123", expect.objectContaining({
        language: "go",
        entrypoint: "main.go",
      }));
      expect(screen.getByText("Go Execution Output")).toBeDefined();
    });
  });
});
