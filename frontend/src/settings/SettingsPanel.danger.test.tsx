// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsProvider } from "./SettingsContext";
import { useSettings } from "./useSettings";
import { SettingsPanel } from "./SettingsPanel";
import * as membersApi from "../api/members";
import * as projectsApi from "../api/projects";
import { AuthContext, type AuthContextValue } from "../auth/context";

const mockAuthUser = {
  id: "user-owner",
  name: "Current Owner",
  email: "owner@example.com",
  avatarUrl: null,
  provider: "google",
};

const mockMembers: membersApi.ProjectMember[] = [
  { userId: "user-owner", name: "Current Owner", email: "owner@example.com", role: "OWNER" },
  { userId: "user-editor", name: "Alice Collaborator", email: "alice@example.com", role: "EDITOR" },
  { userId: "user-viewer", name: "Bob Viewer", email: "bob@example.com", role: "VIEWER" },
];

function createMockAuth(user: { id: string; name: string; email: string }): AuthContextValue {
  return {
    status: "authenticated",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: null,
      provider: "google",
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
  };
}

function Harness({
  projectRole = "OWNER" as const,
  onRoleChanged,
  onProjectDeleted,
}: {
  projectRole?: "OWNER" | "EDITOR" | "VIEWER";
  onRoleChanged?: (role: "OWNER" | "EDITOR" | "VIEWER") => void;
  onProjectDeleted?: () => void;
}) {
  const { openSettings } = useSettings();
  return (
    <div>
      <button type="button" onClick={openSettings} data-testid="open-btn">
        Open
      </button>
      <SettingsPanel
        projectId="proj-123"
        projectName="Awesome Project"
        projectRole={projectRole}
        onRoleChanged={onRoleChanged}
        onProjectDeleted={onProjectDeleted}
      />
    </div>
  );
}

describe("SettingsPanel Danger Zone & Ownership Transfer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(membersApi, "listMembers").mockResolvedValue(mockMembers);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders Danger Zone category when projectId is provided and switches to it", async () => {
    render(
      <AuthContext.Provider value={createMockAuth(mockAuthUser)}>
        <SettingsProvider>
          <Harness projectRole="OWNER" />
        </SettingsProvider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("open-btn"));

    const dangerNav = screen.getByRole("button", { name: /Danger Zone/i });
    expect(dangerNav).toBeDefined();

    fireEvent.click(dangerNav);

    expect(screen.getByText("Transfer Project Ownership")).toBeDefined();
    expect(screen.getAllByText("Leave Project").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delete Project").length).toBeGreaterThan(0);
  });

  it("prevents owner from leaving and shows clear transfer ownership notice", async () => {
    render(
      <AuthContext.Provider value={createMockAuth(mockAuthUser)}>
        <SettingsProvider>
          <Harness projectRole="OWNER" />
        </SettingsProvider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("open-btn"));
    fireEvent.click(screen.getByRole("button", { name: /Danger Zone/i }));

    expect(screen.getByText(/Transfer ownership before leaving/i)).toBeDefined();

    const leaveBtn = screen.getByRole("button", { name: "Leave Project" });
    expect(leaveBtn.hasAttribute("disabled")).toBe(true);
  });

  it("allows non-owner to click leave project and triggers removeMember", async () => {
    const removeSpy = vi.spyOn(membersApi, "removeMember").mockResolvedValue(undefined);

    render(
      <AuthContext.Provider value={createMockAuth({ id: "user-editor", name: "Alice", email: "alice@example.com" })}>
        <SettingsProvider>
          <Harness projectRole="EDITOR" />
        </SettingsProvider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("open-btn"));
    fireEvent.click(screen.getByRole("button", { name: /Danger Zone/i }));

    const leaveBtn = screen.getByRole("button", { name: "Leave Project" });
    expect(leaveBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(leaveBtn);

    expect(screen.getByText(/Confirm leaving this collaborative workspace/i)).toBeDefined();

    // Confirm button inside modal
    const confirmLeave = screen.getAllByRole("button", { name: "Leave Project" }).pop()!;
    fireEvent.click(confirmLeave);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith("proj-123", "user-editor");
    });
  });

  it("requires typing exact project title before Delete Project button is enabled", async () => {
    const deleteSpy = vi.spyOn(projectsApi, "deleteProject").mockResolvedValue(undefined);
    const onDeletedMock = vi.fn();

    render(
      <AuthContext.Provider value={createMockAuth(mockAuthUser)}>
        <SettingsProvider>
          <Harness projectRole="OWNER" onProjectDeleted={onDeletedMock} />
        </SettingsProvider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("open-btn"));
    fireEvent.click(screen.getByRole("button", { name: /Danger Zone/i }));

    const openDeleteBtn = screen.getByRole("button", { name: /Delete Project/i });
    fireEvent.click(openDeleteBtn);

    expect(screen.getByText(/Please type/i)).toBeDefined();

    const confirmDeleteBtn = screen.getAllByRole("button", { name: "Delete Project" }).pop()!;
    expect(confirmDeleteBtn.hasAttribute("disabled")).toBe(true);

    // Typing wrong title keeps it disabled
    const input = screen.getByPlaceholderText("Awesome Project");
    fireEvent.change(input, { target: { value: "Wrong Title" } });
    expect(confirmDeleteBtn.hasAttribute("disabled")).toBe(true);

    // Typing exact title enables it
    fireEvent.change(input, { target: { value: "Awesome Project" } });
    expect(confirmDeleteBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("proj-123");
      expect(onDeletedMock).toHaveBeenCalled();
    });
  });

  it("handles transfer ownership flow and notifies role change", async () => {
    const transferSpy = vi.spyOn(membersApi, "transferOwnership").mockResolvedValue(undefined);
    const onRoleChangedMock = vi.fn();

    render(
      <AuthContext.Provider value={createMockAuth(mockAuthUser)}>
        <SettingsProvider>
          <Harness projectRole="OWNER" onRoleChanged={onRoleChangedMock} />
        </SettingsProvider>
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByTestId("open-btn"));
    fireEvent.click(screen.getByRole("button", { name: /Danger Zone/i }));

    const openTransferBtn = screen.getByRole("button", { name: /Transfer Ownership/i });
    fireEvent.click(openTransferBtn);

    await waitFor(() => {
      expect(screen.getByLabelText(/Select new owner:/i)).toBeDefined();
    });

    const select = screen.getByLabelText(/Select new owner:/i);
    fireEvent.change(select, { target: { value: "user-editor" } });

    const confirmTransferBtn = screen.getByRole("button", { name: "Confirm Transfer" });
    fireEvent.click(confirmTransferBtn);

    await waitFor(() => {
      expect(transferSpy).toHaveBeenCalledWith("proj-123", "user-editor");
      expect(onRoleChangedMock).toHaveBeenCalledWith("EDITOR");
    });
  });
});
