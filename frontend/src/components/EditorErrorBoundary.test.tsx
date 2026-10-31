// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditorErrorBoundary } from "./EditorErrorBoundary";

let shouldThrow = true;
function FlakyChild(): ReactElement {
  if (shouldThrow) throw new Error("Monaco editor failed to mount");
  return <div>Editor content rendered</div>;
}

describe("EditorErrorBoundary", () => {
  it("catches editor errors without crashing parent UI and provides recovery", () => {
    shouldThrow = true;
    const onReset = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <EditorErrorBoundary fileName="app.js" onReset={onReset}>
        <FlakyChild />
      </EditorErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText('Could not open "app.js"')).toBeDefined();
    expect(screen.getByText(/Monaco editor failed to mount/)).toBeDefined();

    // Clicking close file invokes onReset
    fireEvent.click(screen.getByRole("button", { name: "Close file" }));
    expect(onReset).toHaveBeenCalled();

    // Changing fileName clears the error
    shouldThrow = false;
    rerender(
      <EditorErrorBoundary fileName="other.js" onReset={onReset}>
        <FlakyChild />
      </EditorErrorBoundary>,
    );
    expect(screen.getByText("Editor content rendered")).toBeDefined();
  });
});

