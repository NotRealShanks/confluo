// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Cursor } from "./Cursor";

describe("Cursor component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders cursor positioned at x, y with color and name", () => {
    render(<Cursor x={120} y={240} name="Alice" color="rgb(34, 115, 195)" />);

    const cursorEl = screen.getByTestId("live-cursor");
    expect(cursorEl.style.transform).toBe("translateX(120px) translateY(240px)");

    const badge = screen.getByTestId("cursor-name-badge");
    expect(badge.textContent).toBe("Alice");
    expect(badge.style.backgroundColor).toBe("rgb(34, 115, 195)");
  });

  it("applies subtle glow shadow styles using the user's color", () => {
    render(<Cursor x={50} y={50} name="Bob" color="rgb(255, 0, 0)" />);

    const badge = screen.getByTestId("cursor-name-badge");
    expect(badge.getAttribute("style")).toContain("box-shadow");
    expect(badge.getAttribute("style")).toContain("rgb(255, 0, 0)");
  });
});
