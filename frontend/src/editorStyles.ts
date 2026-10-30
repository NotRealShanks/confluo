export function cssContentValue(value: string) {
  const escaped = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f || character === '"' || character === "\\"
      ? `\\${code.toString(16)} `
      : character;
  }).join("");
  return `"${escaped}"`;
}

export function safeCursorColor(value: unknown) {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value) ? value : "#64748b";
}
