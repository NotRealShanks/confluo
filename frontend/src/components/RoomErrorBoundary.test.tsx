// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoomErrorBoundary } from "./RoomErrorBoundary";

let shouldThrow = true;
let thrownError: Error = new Error("Monaco model is disposed");

function BrokenEditor(): ReactElement {
  if (shouldThrow) throw thrownError;
  return <p>Recovered editor</p>;
}

afterEach(() => {
  cleanup();
});

describe("RoomErrorBoundary", () => {
  it("labels local rendering failures separately from connection failures and retries by remount callback", () => {
    shouldThrow = true;
    thrownError = new Error("Monaco model is disposed");
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <RoomErrorBoundary onRetry={retry}>
        <BrokenEditor />
      </RoomErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("could not render the selected file");
    shouldThrow = false;
    screen.getByRole("button", { name: "Try again" }).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("distinguishes authentication errors", () => {
    shouldThrow = true;
    thrownError = new Error("Liveblocks auth failed with 401 unauthorized token");
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <RoomErrorBoundary>
        <BrokenEditor />
      </RoomErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Authentication failed");
  });

  it("distinguishes connection errors", () => {
    shouldThrow = true;
    thrownError = new Error("Liveblocks websocket connection closed");
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <RoomErrorBoundary>
        <BrokenEditor />
      </RoomErrorBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Could not connect to the collaboration service");
  });
});
