import { describe, expect, it } from "vitest";
import { getContextMenuPosition } from "./contextMenu";

describe("getContextMenuPosition", () => {
  it("keeps menus inside the viewport", () => {
    expect(getContextMenuPosition(995, 795, 1024, 768)).toEqual({ x: 800, y: 484 });
  });

  it("keeps positions usable near the top-left corner", () => {
    expect(getContextMenuPosition(-10, -8, 1024, 768)).toEqual({ x: 4, y: 4 });
  });
});
