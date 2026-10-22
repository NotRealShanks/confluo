import { apiFetch } from "./client";

export type ExecutionFile = { path: string; content: string };
export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
};

export function executeProject(
  projectId: string,
  request: { language: string; entrypoint: string; files: ExecutionFile[] },
): Promise<ExecutionResult> {
  return apiFetch<ExecutionResult>(`/api/projects/${encodeURIComponent(projectId)}/run`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
