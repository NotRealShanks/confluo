// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router";
import Home from "./Home";
import NotFoundPage from "./NotFoundPage";
import { AuthContext } from "../auth/context";
import * as hooks from "../projects/hooks";
import * as projectsApi from "../api/projects";
import type { Project, User } from "../api/types";

const mockUser: User = {
  id: "user-42",
  email: "dev@confluo.io",
  name: "Marcus Aurelius",
  avatarUrl: null,
  provider: "google",
};

const mockProjects: Project[] = [
  {
    id: "proj-1",
    title: "distributed-raft-consensus",
    role: "OWNER",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-02T12:00:00Z",
  },
  {
    id: "proj-2",
    title: "compiler-frontend-llvm",
    role: "EDITOR",
    createdAt: "2026-02-15T10:00:00Z",
    updatedAt: "2026-03-01T08:00:00Z",
  },
  {
    id: "proj-3",
    title: "kernel-ebpf-tracer",
    role: "VIEWER",
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-02-28T14:00:00Z",
  },
];

const mockAuthValue = {
  status: "authenticated" as const,
  user: mockUser,
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
};

describe("Dashboard & Navigation (Stage 4)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders welcome header, project counts, and projects list", () => {
    vi.spyOn(hooks, "useProjects").mockReturnValue({
      state: { status: "ready", data: mockProjects },
      reload: vi.fn(),
      addProject: vi.fn(),
      removeProject: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Home />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome back, Marcus/i)).toBeDefined();
    expect(screen.getByText(/3 total projects/i)).toBeDefined();
    expect(screen.getByText("distributed-raft-consensus")).toBeDefined();
    expect(screen.getByText("compiler-frontend-llvm")).toBeDefined();
    expect(screen.getByText("kernel-ebpf-tracer")).toBeDefined();
  });

  it("filters projects by category (My Projects & Shared with me)", () => {
    vi.spyOn(hooks, "useProjects").mockReturnValue({
      state: { status: "ready", data: mockProjects },
      reload: vi.fn(),
      addProject: vi.fn(),
      removeProject: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Home />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    // Click My Projects (Owner)
    const myProjectsBtn = screen.getByRole("button", { name: /My Projects/i });
    fireEvent.click(myProjectsBtn);

    expect(screen.getByText("distributed-raft-consensus")).toBeDefined();
    expect(screen.queryByText("compiler-frontend-llvm")).toBeNull();
    expect(screen.queryByText("kernel-ebpf-tracer")).toBeNull();

    // Click Shared with me (Editor / Viewer)
    const sharedBtn = screen.getByRole("button", { name: /Shared with me/i });
    fireEvent.click(sharedBtn);

    expect(screen.queryByText("distributed-raft-consensus")).toBeNull();
    expect(screen.getByText("compiler-frontend-llvm")).toBeDefined();
    expect(screen.getByText("kernel-ebpf-tracer")).toBeDefined();
  });

  it("filters projects dynamically via live search input", () => {
    vi.spyOn(hooks, "useProjects").mockReturnValue({
      state: { status: "ready", data: mockProjects },
      reload: vi.fn(),
      addProject: vi.fn(),
      removeProject: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Home />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search projects by title…/i);
    fireEvent.change(searchInput, { target: { value: "ebpf" } });

    expect(screen.getByText("kernel-ebpf-tracer")).toBeDefined();
    expect(screen.queryByText("distributed-raft-consensus")).toBeNull();
    expect(screen.queryByText("compiler-frontend-llvm")).toBeNull();

    // Clear search
    const clearBtn = screen.getByRole("button", { name: /CLEAR/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText("distributed-raft-consensus")).toBeDefined();
    expect(screen.getByText("compiler-frontend-llvm")).toBeDefined();
  });

  it("provides link to create project wizard on Create Workspace action", () => {
    vi.spyOn(hooks, "useProjects").mockReturnValue({
      state: { status: "ready", data: mockProjects },
      reload: vi.fn(),
      addProject: vi.fn(),
      removeProject: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Home />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole("button", { name: /Create Workspace/i });
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.getAttribute("href")).toBe("/projects/new");
  });

  it("opens delete confirmation modal and triggers deleteProject when confirmed", async () => {
    const removeProjectMock = vi.fn();
    vi.spyOn(hooks, "useProjects").mockReturnValue({
      state: { status: "ready", data: mockProjects },
      reload: vi.fn(),
      addProject: vi.fn(),
      removeProject: removeProjectMock,
    });
    const deleteProjectSpy = vi.spyOn(projectsApi, "deleteProject").mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <Home />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const deleteBtn = screen.getByRole("button", { name: "Delete distributed-raft-consensus" });
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Delete Project Workspace/i)).toBeDefined();
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeDefined();

    const confirmBtn = screen.getByRole("button", { name: "Delete Project" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteProjectSpy).toHaveBeenCalledWith("proj-1");
      expect(removeProjectMock).toHaveBeenCalledWith("proj-1");
    });
  });

  it("renders 404 NotFoundPage with navigation actions", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Workspace Not Found")).toBeDefined();
    expect(screen.getByText(/ROUTE_NOT_FOUND/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Return to Workspaces/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Back to Homepage/i })).toBeDefined();
  });
});
