import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  clampFontSize,
  validateSettings,
} from "./types";

describe("Settings validation & defaults", () => {
  it("returns default settings for null or non-object input", () => {
    expect(validateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings("string")).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings(123)).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps font size to 12-24 range", () => {
    expect(clampFontSize(8)).toBe(12);
    expect(clampFontSize(10)).toBe(12);
    expect(clampFontSize(16.4)).toBe(16);
    expect(clampFontSize(24)).toBe(24);
    expect(clampFontSize(32)).toBe(24);
    expect(clampFontSize("invalid")).toBe(DEFAULT_SETTINGS.fontSize);
  });

  it("validates theme options and falls back to default on invalid value", () => {
    expect(validateSettings({ theme: "dark" }).theme).toBe("dark");
    expect(validateSettings({ theme: "light" }).theme).toBe("light");
    expect(validateSettings({ theme: "system" }).theme).toBe("system");
    expect(validateSettings({ theme: "neon-blue" }).theme).toBe(DEFAULT_SETTINGS.theme);
  });

  it("validates tab size to 2, 4, or 8 spaces", () => {
    expect(validateSettings({ tabSize: 2 }).tabSize).toBe(2);
    expect(validateSettings({ tabSize: 4 }).tabSize).toBe(4);
    expect(validateSettings({ tabSize: 8 }).tabSize).toBe(8);
    expect(validateSettings({ tabSize: 3 }).tabSize).toBe(DEFAULT_SETTINGS.tabSize);
    expect(validateSettings({ tabSize: 10 }).tabSize).toBe(DEFAULT_SETTINGS.tabSize);
  });

  it("validates cursor blinking options", () => {
    expect(validateSettings({ cursorBlinking: "smooth" }).cursorBlinking).toBe("smooth");
    expect(validateSettings({ cursorBlinking: "solid" }).cursorBlinking).toBe("solid");
    expect(validateSettings({ cursorBlinking: "glow" }).cursorBlinking).toBe(DEFAULT_SETTINGS.cursorBlinking);
  });

  it("validates whitespace rendering options", () => {
    expect(validateSettings({ renderWhitespace: "none" }).renderWhitespace).toBe("none");
    expect(validateSettings({ renderWhitespace: "all" }).renderWhitespace).toBe("all");
    expect(validateSettings({ renderWhitespace: "selection" }).renderWhitespace).toBe("selection");
    expect(validateSettings({ renderWhitespace: "trailing" }).renderWhitespace).toBe(DEFAULT_SETTINGS.renderWhitespace);
  });

  it("validates boolean flags like minimap, insertSpaces, bracketPairColorization", () => {
    expect(validateSettings({ minimap: true }).minimap).toBe(true);
    expect(validateSettings({ minimap: "yes" }).minimap).toBe(DEFAULT_SETTINGS.minimap);
    expect(validateSettings({ insertSpaces: false }).insertSpaces).toBe(false);
    expect(validateSettings({ insertSpaces: null }).insertSpaces).toBe(DEFAULT_SETTINGS.insertSpaces);
    expect(validateSettings({ bracketPairColorization: false }).bracketPairColorization).toBe(false);
  });

  it("validates reduced motion preference", () => {
    expect(validateSettings({ reducedMotion: "reduce" }).reducedMotion).toBe("reduce");
    expect(validateSettings({ reducedMotion: "no-preference" }).reducedMotion).toBe("no-preference");
    expect(validateSettings({ reducedMotion: "system" }).reducedMotion).toBe("system");
    expect(validateSettings({ reducedMotion: "fast" }).reducedMotion).toBe(DEFAULT_SETTINGS.reducedMotion);
  });

  it("preserves valid customized settings and supplements missing ones", () => {
    const custom = validateSettings({
      theme: "dark",
      fontSize: 18,
      tabSize: 4,
      wordWrap: "on",
      minimap: true,
      lineNumbers: "off",
    });

    expect(custom.theme).toBe("dark");
    expect(custom.fontSize).toBe(18);
    expect(custom.tabSize).toBe(4);
    expect(custom.wordWrap).toBe("on");
    expect(custom.minimap).toBe(true);
    expect(custom.lineNumbers).toBe("off");
    expect(custom.cursorBlinking).toBe(DEFAULT_SETTINGS.cursorBlinking);
    expect(custom.bracketPairColorization).toBe(DEFAULT_SETTINGS.bracketPairColorization);
  });
});

