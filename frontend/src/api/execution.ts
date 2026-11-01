import { apiFetch, ApiError } from "./client";

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

/**
 * Maps raw backend/runner errors into friendly, safe messages without exposing
 * internal exception names, URLs, or stack traces to end users.
 */
export function formatExecutionError(error: unknown): string {
  if (error instanceof ApiError || (error && typeof error === "object" && "status" in error)) {
    const status = (error as { status: number; message?: string }).status;
    const msg = (error as { message?: string }).message || "";

    if (status === 429) {
      return "Execution limit reached: The runner is busy or your rate limit was exceeded. Please wait a moment and try again.";
    }
    if (status === 503) {
      return "Execution service unavailable: The code execution runner is offline or not configured. Please ensure the runner service is running.";
    }
    if (status === 504) {
      return "Execution timed out: The code took too long to complete.";
    }
    if (status === 403) {
      return "Permission denied: Only project editors can execute code.";
    }
    if (status === 401) {
      return "Authentication error: Execution service token is invalid or missing.";
    }
    if (status === 400) {
      const cleanMsg = msg.replace(/^Invalid execution request:\s*/i, "").trim();
      return `Execution rejected: ${cleanMsg || "Invalid execution payload."}`;
    }
    if (msg && !msg.includes("Exception") && !msg.includes("at ") && !msg.startsWith("http")) {
      return `Execution error: ${msg}`;
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return "Cannot connect to server: The execution runner or backend is unreachable.";
    }
    if (!msg.includes("Exception") && !msg.includes("at ") && !msg.startsWith("http")) {
      return `Execution error: ${msg}`;
    }
  }

  return "Code execution failed. Please check your runner service status and try again.";
}
