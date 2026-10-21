import { LIMITS, fail, ok, type Result } from "./types";

// Path separators, Windows-forbidden characters, and every control, format, surrogate, private-use or unassigned code point
const FORBIDDEN = /[\\/:*?"<>|\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}]/u;
const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

// NFC makes visually identical names byte-identical, so duplicates cannot hide behind encodings
export function normalizeName(name: string): string {
  return name.normalize("NFC").trim();
}

// Names that differ only by case or encoding count as the same name
export function nameKey(name: string): string {
  return normalizeName(name).toLowerCase();
}

// These names become real file names in a sandbox later, so the rules are strict on purpose
export function validateName(input: unknown): Result<string> {
  if (typeof input !== "string") return fail("A name must be text.");

  const name = normalizeName(input);
  if (name.length === 0) return fail("Enter a name.");
  if (Array.from(name).length > LIMITS.maxNameLength) {
    return fail(`Names can be at most ${LIMITS.maxNameLength} characters.`);
  }
  if (FORBIDDEN.test(name)) {
    return fail('Names can\'t contain / \\ : * ? " < > | or control characters.');
  }
  if (name === "." || name === "..") return fail("That name isn't allowed.");
  // A leading dash could be read as a command-line flag by a compiler
  if (name.startsWith("-")) return fail("Names can't start with a dash.");
  if (name.endsWith(".")) return fail("Names can't end with a dot.");
  if (WINDOWS_RESERVED.test(name)) return fail("That name is reserved by the operating system.");
  return ok(name);
}
