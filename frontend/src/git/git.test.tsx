// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import GitRemoteModal from "./GitRemoteModal";
import * as gitApi from "../api/git";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Git Remote Modal & API Integration", () => {
  it("renders remote repository inputs and allows saving remote URL", async () => {
    vi.spyOn(gitApi, "getGitRemote").mockResolvedValue({
      remoteUrl: "https://github.com/org/repo.git",
    });
    const setRemoteSpy = vi.spyOn(gitApi, "setGitRemote").mockResolvedValue();

    render(
      <GitRemoteModal
        projectId="proj-123"
        currentBranch="feature-test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Verify modal heading
    expect(screen.getByRole("heading", { name: /Remote Repository/i })).toBeDefined();
    await waitFor(() => {
      expect(screen.getByDisplayValue("https://github.com/org/repo.git")).toBeDefined();
    });

    expect(screen.getByDisplayValue("feature-test")).toBeDefined();

    // Click Save
    const saveBtn = screen.getByRole("button", { name: /^Save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(setRemoteSpy).toHaveBeenCalledWith("proj-123", "https://github.com/org/repo.git");
      expect(screen.getByText(/Remote 'origin' updated successfully/i)).toBeDefined();
    });
  });

  it("triggers git push with credentials and displays output", async () => {
    vi.spyOn(gitApi, "getGitRemote").mockResolvedValue({
      remoteUrl: "https://github.com/org/repo.git",
    });
    const pushSpy = vi.spyOn(gitApi, "gitPush").mockResolvedValue({
      output: "To https://github.com/org/repo.git\n * [new branch] feature-test -> feature-test",
    });

    render(
      <GitRemoteModal
        projectId="proj-123"
        currentBranch="feature-test"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("https://github.com/org/repo.git")).toBeDefined();
    });

    const patInput = screen.getByPlaceholderText(/ghp_/i);
    fireEvent.change(patInput, { target: { value: "ghp_mockSecretToken123" } });

    const pushBtn = screen.getByRole("button", { name: /Push to Remote/i });
    fireEvent.click(pushBtn);

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith("proj-123", {
        remoteUrl: "https://github.com/org/repo.git",
        branch: "feature-test",
        username: undefined,
        token: "ghp_mockSecretToken123",
      });
      expect(screen.getByText(/Successfully pushed branch 'feature-test' to remote/i)).toBeDefined();
      expect(screen.getByText(/To https:\/\/github\.com\/org\/repo\.git/i)).toBeDefined();
    });
  });
});
