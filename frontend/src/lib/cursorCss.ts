const NAME_MAX = 40;
const FALLBACK_COLOR = "hsl(210 70% 45%)";

// The exact shapes colorFor produces; digits, dots, spaces, % and parentheses cannot end a CSS declaration
const COLOR_PATTERN = /^(?:hsl\(\d{1,3} \d{1,3}% \d{1,3}%\)|oklch\(\d(?:\.\d{1,3})? \d(?:\.\d{1,3})? \d{1,3}\))$/;

// Awareness comes from other people's browsers, so nothing from it may reach a stylesheet unchecked.
// Letters, combining marks and digits are kept so names in any script survive.
export function safeCursorName(name: unknown): string {
  if (typeof name !== "string") return "";
  const cleaned = name.replace(/[^\p{L}\p{M}\p{N} .'_-]/gu, "").trim();
  return Array.from(cleaned).slice(0, NAME_MAX).join("");
}

export function safeCursorColor(color: unknown): string {
  return typeof color === "string" && COLOR_PATTERN.test(color) ? color : FALLBACK_COLOR;
}
