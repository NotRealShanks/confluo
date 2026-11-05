import { apiFetch } from "./client";

export interface GitFileStatus {
  path: string;
  status: string;
}

export interface GitStatusResponse {
  initialized: boolean;
  currentBranch: string;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
}

export interface GitCommitDto {
  hash: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
  message: string;
}

export interface GitBranchesResponse {
  currentBranch: string;
  branches: string[];
}

export function gitInit(projectId: string): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/init`, { method: "POST" });
}

export function gitStatus(projectId: string): Promise<GitStatusResponse> {
  return apiFetch<GitStatusResponse>(`/api/git/${projectId}/status`);
}

export function gitSync(projectId: string, files: Record<string, string>): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/sync`, {
    method: "POST",
    body: JSON.stringify({ files }),
  });
}

export function gitStage(projectId: string, paths?: string[]): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/stage`, {
    method: "POST",
    body: JSON.stringify({ paths: paths ?? [] }),
  });
}

export function gitUnstage(projectId: string, paths?: string[]): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/unstage`, {
    method: "POST",
    body: JSON.stringify({ paths: paths ?? [] }),
  });
}

export function gitDiscard(projectId: string, paths?: string[]): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/discard`, {
    method: "POST",
    body: JSON.stringify({ paths: paths ?? [] }),
  });
}

export function gitCommit(projectId: string, message: string): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/commit`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function gitLog(projectId: string, limit = 20): Promise<GitCommitDto[]> {
  return apiFetch<GitCommitDto[]>(`/api/git/${projectId}/log?limit=${limit}`);
}

export function gitDiff(projectId: string, path: string, staged = false): Promise<string> {
  return apiFetch<string>(
    `/api/git/${projectId}/diff?path=${encodeURIComponent(path)}&staged=${staged}`,
  );
}

export function gitBranches(projectId: string): Promise<GitBranchesResponse> {
  return apiFetch<GitBranchesResponse>(`/api/git/${projectId}/branches`);
}

export function gitCreateBranch(projectId: string, branchName: string): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/branches`, {
    method: "POST",
    body: JSON.stringify({ branchName }),
  });
}

export function gitCheckout(
  projectId: string,
  branchName: string,
): Promise<Record<string, string>> {
  return apiFetch<Record<string, string>>(`/api/git/${projectId}/checkout`, {
    method: "POST",
    body: JSON.stringify({ branchName }),
  });
}

export interface GitRemoteResponse {
  remoteUrl: string;
}

export function getGitRemote(projectId: string): Promise<GitRemoteResponse> {
  return apiFetch<GitRemoteResponse>(`/api/git/${projectId}/remote`);
}

export function setGitRemote(projectId: string, remoteUrl: string): Promise<void> {
  return apiFetch<void>(`/api/git/${projectId}/remote`, {
    method: "POST",
    body: JSON.stringify({ remoteUrl }),
  });
}

export function gitPush(
  projectId: string,
  options?: { remoteUrl?: string; branch?: string; username?: string; token?: string }
): Promise<{ output: string }> {
  return apiFetch<{ output: string }>(`/api/git/${projectId}/push`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export function gitPull(
  projectId: string,
  options?: { remoteUrl?: string; branch?: string; username?: string; token?: string }
): Promise<{ output: string; files: Record<string, string> }> {
  return apiFetch<{ output: string; files: Record<string, string> }>(`/api/git/${projectId}/pull`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

