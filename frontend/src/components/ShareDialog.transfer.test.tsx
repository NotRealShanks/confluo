// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ShareDialog from "../components/ShareDialog";
import * as membersApi from "../api/members";
import * as shareLinksApi from "../api/shareLinks";

const mockMembers: membersApi.ProjectMember[] = [
  { userId: "owner-id", name: "Project Owner", email: "owner@example.com", role: "OWNER" },
  { userId: "alice-id", name: "Alice Developer", email: "alice@example.com", role: "EDITOR" },
];

describe("ShareDialog Ownership Transfer", () => {
  beforeEach(() => {
    vi.spyOn(membersApi, "listMembers").mockResolvedValue(mockMembers);
    vi.spyOn(shareLinksApi, "listShareLinks").mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows Transfer button for owner and executes transfer ownership", async () => {
    const transferSpy = vi.spyOn(membersApi, "transferOwnership").mockResolvedValue(undefined);
    const onRoleChangedMock = vi.fn();

    render(
      <ShareDialog
        projectId="project-abc"
        projectRole="OWNER"
        onClose={vi.fn()}
        onRoleChanged={onRoleChangedMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Developer")).toBeDefined();
    });

    const transferBtn = screen.getByRole("button", { name: "Transfer" });
    expect(transferBtn).toBeDefined();

    fireEvent.click(transferBtn);

    expect(screen.getByText("Transfer ownership?")).toBeDefined();
    expect(screen.getByText(/They will become the project/i)).toBeDefined();

    const confirmTransferBtn = screen.getByRole("button", { name: "Transfer ownership" });
    fireEvent.click(confirmTransferBtn);

    await waitFor(() => {
      expect(transferSpy).toHaveBeenCalledWith("project-abc", "alice-id");
      expect(onRoleChangedMock).toHaveBeenCalledWith("EDITOR");
    });
  });
});

