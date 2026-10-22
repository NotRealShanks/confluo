import { describe, expect, it } from "vitest";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  sidebarWidthBounds,
} from "./sidebarResize";

describe("sidebar resizing", () => {
  it("uses the requested default within the available bounds", () => {
    expect(clampSidebarWidth(SIDEBAR_DEFAULT_WIDTH, 1200)).toBe(SIDEBAR_DEFAULT_WIDTH);
  });

  it("caps the sidebar at 45% while preserving editor space", () => {
    const bounds = sidebarWidthBounds(1000);
    expect(bounds.max).toBe(450);
    expect(clampSidebarWidth(900, 1000)).toBe(450);
  });

  it("keeps the minimum width even at narrow sizes", () => {
    expect(clampSidebarWidth(80, 400)).toBe(SIDEBAR_MIN_WIDTH);
  });
});
