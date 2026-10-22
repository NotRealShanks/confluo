import { describe, expect, it } from "vitest";
import { languageForFilename } from "./language";

describe("languageForFilename", () => {
  it.each([
    ["Main.java", "java"],
    ["component.TSX", "typescript"],
    ["script.py", "python"],
    ["query.SQL", "sql"],
    ["Dockerfile", "dockerfile"],
    ["Makefile", "make"],
    [".gitignore", "ignore"],
    [".env", "properties"],
    ["README", "markdown"],
    ["LICENSE", "plaintext"],
    ["extensionless", "plaintext"],
    ["unknown.custom", "plaintext"],
  ])("detects %s as %s", (filename, language) => {
    expect(languageForFilename(filename)).toBe(language);
  });
});
