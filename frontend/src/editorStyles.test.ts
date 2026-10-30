import { describe, expect, it } from "vitest";
import { cssContentValue, safeCursorColor } from "./editorStyles";

describe("collaborator cursor styles", () => {
  it("escapes control characters and quotes in remote names for CSS strings", () => {
    const value = cssContentValue('"; background: url(https://example.invalid)');
    expect(value.startsWith('"\\22 ')).toBe(true);
    expect(value).not.toContain('";');
  });

  it("only accepts six-digit hex cursor colors", () => {
    expect(safeCursorColor("#12aBcD")).toBe("#12aBcD");
    expect(safeCursorColor("red; background: url(x)")).toBe("#64748b");
    expect(safeCursorColor(null)).toBe("#64748b");
  });
});
