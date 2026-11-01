import { describe, expect, it } from "vitest";
import { languageForFilename } from "./language";

describe("languageForFilename", () => {
  it.each([
    ["Main.java", "java"],
    ["main.rs", "rust"],
    ["main.go", "go"],
    ["index.php", "php"],
    ["app.rb", "ruby"],
    ["Main.kt", "kotlin"],
    ["main.swift", "swift"],
    ["main.dart", "dart"],
    ["Main.scala", "scala"],
    ["analysis.r", "r"],
    ["Program.cs", "csharp"],
    ["component.TSX", "typescript"],
    ["script.py", "python"],
    ["query.SQL", "sql"],
    ["Dockerfile", "dockerfile"],
    ["Makefile", "make"],
    [".gitignore", "ignore"],
    [".env", "properties"],
    ["README", "markdown"],
    ["guide.MARKDOWN", "markdown"],
    ["LICENSE", "plaintext"],
    ["extensionless", "plaintext"],
    ["unknown.custom", "plaintext"],
  ])("detects %s as %s", (filename, language) => {
    expect(languageForFilename(filename)).toBe(language);
  });
});
