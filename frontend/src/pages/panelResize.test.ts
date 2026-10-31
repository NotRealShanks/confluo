import { describe, expect, it } from "vitest";
import {
  PANEL_DEFAULT_HEIGHT,
  PANEL_MIN_HEIGHT,
  clampPanelHeight,
  panelHeightBounds,
} from "./panelResize";

describe("panel resizing", () => {
  it("uses the requested default within the available bounds", () => {
    expect(clampPanelHeight(PANEL_DEFAULT_HEIGHT, 800)).toBe(PANEL_DEFAULT_HEIGHT);
  });

  it("caps the panel at 85% while preserving editor space", () => {
    const bounds = panelHeightBounds(1000);
    expect(bounds.max).toBe(850);
    expect(clampPanelHeight(950, 1000)).toBe(850);
  });

  it("keeps the minimum height even at small window heights", () => {
    expect(clampPanelHeight(40, 300)).toBe(PANEL_MIN_HEIGHT);
  });

  it("respects editor minimum height constraint", () => {
    // available: 150 -> 150 - 100 = 50, but min is 80
    const bounds = panelHeightBounds(150);
    expect(bounds.min).toBe(PANEL_MIN_HEIGHT);
    expect(bounds.max).toBe(PANEL_MIN_HEIGHT);
  });
});

