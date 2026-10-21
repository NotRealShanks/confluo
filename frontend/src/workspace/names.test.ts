import { describe, expect, it } from "vitest";
import { nameKey, normalizeName, validateName } from "./names";

describe("validateName accepts", () => {
  it.each([
    "main.js",
    "App.java",
    "README",
    ".gitignore",
    "my file.py",
    "notes (2).md",
    "शशांक.py",
    "файл.txt",
    "李小龙.c",
    "a".repeat(100),
  ])("%s", (name) => {
    const result = validateName(name);
    expect(result.ok).toBe(true);
  });

  it("trims surrounding whitespace and normalizes to NFC", () => {
    const decomposed = "e\u0301.txt"; // e + combining acute
    const result = validateName(`  ${decomposed}  `);
    expect(result).toEqual({ ok: true, value: "\u00e9.txt" });
  });
});

describe("validateName rejects", () => {
  it.each([
    ["empty", ""],
    ["only spaces", "   "],
    ["too long", "a".repeat(101)],
    ["forward slash", "a/b.txt"],
    ["backslash", "a\\b.txt"],
    ["path traversal", ".."],
    ["current directory", "."],
    ["traversal inside a name", "../etc/passwd"],
    ["colon", "a:b"],
    ["wildcard", "a*.txt"],
    ["question mark", "a?.txt"],
    ["quote", 'a".txt'],
    ["angle brackets", "<a>.txt"],
    ["pipe", "a|b"],
    ["newline", "a\nb"],
    ["tab", "a\tb"],
    ["null byte", "a\u0000b"],
    ["bidi override", "evil\u202Eexe.txt"],
    ["zero-width space", "a\u200Bb"],
    ["leading dash", "-rf"],
    ["leading dash flag", "--version"],
    ["trailing dot", "file."],
    ["windows device", "CON"],
    ["windows device with extension", "nul.txt"],
    ["windows device lowercase", "com1"],
    ["lone surrogate", "a\uD800b"],
    ["private use", "a\uE000b"],
  ])("%s", (_label, name) => {
    expect(validateName(name).ok).toBe(false);
  });

  it.each([undefined, null, 42, {}, [], true])("a non-string: %j", (value) => {
    expect(validateName(value).ok).toBe(false);
  });

  it("counts characters, not UTF-16 units, for the length limit", () => {
    expect(validateName("𠮷".repeat(100)).ok).toBe(true);
    expect(validateName("𠮷".repeat(101)).ok).toBe(false);
  });
});

describe("nameKey", () => {
  it("treats case and encoding differences as the same name", () => {
    expect(nameKey("README.md")).toBe(nameKey("readme.MD"));
    expect(nameKey("e\u0301.txt")).toBe(nameKey("\u00e9.TXT"));
    expect(nameKey("a.txt")).not.toBe(nameKey("b.txt"));
  });

  it("normalizeName is idempotent", () => {
    const once = normalizeName("  e\u0301 ");
    expect(normalizeName(once)).toBe(once);
  });
});
