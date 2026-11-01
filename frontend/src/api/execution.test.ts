import { describe, expect, it } from "vitest";
import { formatExecutionError } from "./execution";
import { ApiError } from "./client";

describe("formatExecutionError", () => {
  it("formats 429 rate limit errors with friendly guidance", () => {
    const error = new ApiError(429, "Too many requests");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Execution limit reached");
    expect(formatted).not.toContain("ApiError");
    expect(formatted).not.toContain("429");
  });

  it("formats 503 unavailable runner errors with friendly guidance", () => {
    const error = new ApiError(503, "Code execution service unavailable");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Execution service unavailable");
    expect(formatted).toContain("runner service is running");
  });

  it("formats 504 gateway timeout errors", () => {
    const error = new ApiError(504, "Gateway Timeout");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Execution timed out");
  });

  it("formats 403 forbidden errors for non-editors/guests", () => {
    const error = new ApiError(403, "Guests are not allowed to execute code");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Permission denied");
  });

  it("formats 401 unauthorized errors", () => {
    const error = new ApiError(401, "Unauthorized");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Authentication error");
  });

  it("strips internal Java exception stack traces if present in raw error", () => {
    const error = new Error("org.springframework.web.server.ResponseStatusException: 503 SERVICE_UNAVAILABLE at line 12");
    const formatted = formatExecutionError(error);
    expect(formatted).not.toContain("ResponseStatusException");
    expect(formatted).not.toContain("at line 12");
    expect(formatted).toBe("Code execution failed. Please check your runner service status and try again.");
  });

  it("handles network failure errors gracefully", () => {
    const error = new TypeError("Failed to fetch");
    const formatted = formatExecutionError(error);
    expect(formatted).toContain("Cannot connect to server");
  });
});
