// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { RoomErrorBoundary } from "./RoomErrorBoundary";

let shouldThrow = true;
function BrokenEditor(): ReactElement {
  if (shouldThrow) throw new Error("Monaco model is disposed");
  return <p>Recovered editor</p>;
}

describe("RoomErrorBoundary", () => {
  it("labels local rendering failures separately from connection failures and retries by remount callback", () => {
    shouldThrow = true;
    const retry = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<RoomErrorBoundary onRetry={retry}><BrokenEditor /></RoomErrorBoundary>);
    expect(screen.getByRole("alert").textContent).toContain("could not render the selected file");
    shouldThrow = false;
    screen.getByRole("button", { name: "Try again" }).click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
