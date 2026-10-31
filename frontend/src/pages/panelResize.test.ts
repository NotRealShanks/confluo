import { describe, expect, it } from "vitest";
import {
  EDITOR_MIN_HEIGHT,
  PANEL_DEFAULT_HEIGHT,
  PANEL_MIN_HEIGHT,
  clampPanelHeight,
  defaultPanelHeight,
  panelHeightBounds,
} from "./panelResize";

describe("panel resizing", () => {
  it("uses the requested default within the available bounds", () => {
    expect(clampPanelHeight(PANEL_DEFAULT_HEIGHT, 800)).toBe(PANEL_DEFAULT_HEIGHT);
  });

  it("caps the panel at 70% while preserving editor space", () => {
    const bounds = panelHeightBounds(1000);
    expect(bounds.max).toBe(700);
    expect(clampPanelHeight(950, 1000)).toBe(700);
  });

  it("keeps the minimum height even at small window heights", () => {
    expect(clampPanelHeight(40, 300)).toBe(PANEL_MIN_HEIGHT);
  });

  it("respects editor minimum height constraint", () => {
    const available = 200;
    const bounds = panelHeightBounds(available);
    // 200 - 120 = 80, bounds.min = 80
    expect(bounds.max).toBe(Math.max(PANEL_MIN_HEIGHT, available - EDITOR_MIN_HEIGHT));
  });

  it("computes a sensible default height that does not overwhelm small screens", () => {
    // Large screen: standard 180px
    expect(defaultPanelHeight(800)).toBe(PANEL_DEFAULT_HEIGHT);
    // Small screen (350px): 40% is 140px, never taking up almost the whole screen
    expect(defaultPanelHeight(350)).toBe(140);
  });
});
