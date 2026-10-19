import { describe, expect, it } from "vitest";
import { safeCursorColor, safeCursorName } from "./cursorCss";

describe("safeCursorName", () => {
  it.each([
    ["Maya", "Maya"],
    ["Dev Patel", "Dev Patel"],
    ["O'Brien-Smith_2", "O'Brien-Smith_2"],
    ["शशांक यादव", "शशांक यादव"],
    ["محمد علي", "محمد علي"],
    ["李小龙", "李小龙"],
  ])("keeps the legitimate name %s", (input, expected) => {
    expect(safeCursorName(input)).toBe(expected);
  });

  it("strips everything that could break out of a CSS string", () => {
    const payload = '"}\n.page{display:none}/*';
    const result = safeCursorName(payload);
    expect(result).not.toMatch(/["{}:;*\\/\n]/);
  });

  it("removes backslash escapes, closing quotes and bidi override characters", () => {
    expect(safeCursorName('a\\"b')).toBe("ab");
    expect(safeCursorName("evil\u202Eexe")).toBe("evilexe");
    expect(safeCursorName("zero\u200Bwidth")).toBe("zerowidth");
  });

  it("limits the length by characters, not UTF-16 units", () => {
    expect(Array.from(safeCursorName("a".repeat(100)))).toHaveLength(40);
    expect(Array.from(safeCursorName("𠮷".repeat(100)))).toHaveLength(40);
  });

  it.each([undefined, null, 42, {}, ["x"], true])("returns an empty string for non-string %j", (input) => {
    expect(safeCursorName(input)).toBe("");
  });
});

describe("safeCursorColor", () => {
  it.each(["hsl(210 70% 45%)", "hsl(0 0% 0%)", "oklch(0.56 0.17 25)", "oklch(0.6 0.2 340)"])(
    "accepts the color we hand out: %s",
    (color) => {
      expect(safeCursorColor(color)).toBe(color);
    },
  );

  it.each([
    "red; } body { display: none } .x {",
    "red",
    "#ff0000",
    "url(https://evil.example/x.png)",
    "hsl(210 70% 45%); background: url(x)",
    "hsl(210 70% 45%)\n",
    "hsl(210,70%,45%)",
    "oklch(0.5 0.1 20 / 50%)",
    "var(--canvas)",
    "expression(alert(1))",
  ])("rejects %j and falls back to a safe color", (color) => {
    expect(safeCursorColor(color)).toBe("hsl(210 70% 45%)");
  });

  it.each([undefined, null, 5, {}, ["hsl(1 1% 1%)"]])("falls back for non-string %j", (color) => {
    expect(safeCursorColor(color)).toBe("hsl(210 70% 45%)");
  });
});
