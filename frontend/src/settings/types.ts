export type ThemePreference = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export type WordWrapPreference = "on" | "off";
export type LineNumbersPreference = "on" | "off";
export type CursorBlinkingPreference = "blink" | "smooth" | "phase" | "expand" | "solid";
export type RenderWhitespacePreference = "none" | "selection" | "all";
export type TabSizePreference = 2 | 4 | 8;
export type ReducedMotionPreference = "system" | "reduce" | "no-preference";

export interface IdeSettings {
  // Appearance
  theme: ThemePreference;

  // Editor
  fontSize: number; // 12-24
  fontFamily: string;
  tabSize: TabSizePreference;
  wordWrap: WordWrapPreference;
  minimap: boolean;
  lineNumbers: LineNumbersPreference;
  insertSpaces: boolean;
  cursorBlinking: CursorBlinkingPreference;
  bracketPairColorization: boolean;
  renderWhitespace: RenderWhitespacePreference;

  // Accessibility
  reducedMotion: ReducedMotionPreference;
}

export const FONT_FAMILY_PRESETS = [
  {
    label: "Modern Monospace (System)",
    value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  {
    label: "Fira Code, Menlo, Monaco",
    value: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  },
  {
    label: "JetBrains Mono, Menlo",
    value: "'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
  },
  {
    label: "Consolas, Courier New",
    value: "Consolas, 'Courier New', monospace",
  },
  {
    label: "Source Code Pro",
    value: "'Source Code Pro', Consolas, Monaco, monospace",
  },
];

export const DEFAULT_SETTINGS: IdeSettings = {
  theme: "system",
  fontSize: 14,
  fontFamily: FONT_FAMILY_PRESETS[0].value,
  tabSize: 2,
  wordWrap: "off",
  minimap: true,
  lineNumbers: "on",
  insertSpaces: true,
  cursorBlinking: "blink",
  bracketPairColorization: true,
  renderWhitespace: "selection",
  reducedMotion: "system",
};

export const SETTINGS_STORAGE_KEY = "confluo_ide_settings_v2";

export function clampFontSize(size: unknown): number {
  if (typeof size !== "number" || Number.isNaN(size)) {
    return DEFAULT_SETTINGS.fontSize;
  }
  const rounded = Math.round(size);
  return Math.max(12, Math.min(24, rounded));
}

export function validateSettings(raw: unknown): IdeSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, unknown>;

  const theme: ThemePreference =
    obj.theme === "dark" || obj.theme === "light" || obj.theme === "system"
      ? obj.theme
      : DEFAULT_SETTINGS.theme;

  const fontSize = clampFontSize(obj.fontSize);

  const fontFamily =
    typeof obj.fontFamily === "string" && obj.fontFamily.trim().length > 0
      ? obj.fontFamily.trim()
      : DEFAULT_SETTINGS.fontFamily;

  const tabSize: TabSizePreference =
    obj.tabSize === 2 || obj.tabSize === 4 || obj.tabSize === 8
      ? obj.tabSize
      : DEFAULT_SETTINGS.tabSize;

  const wordWrap: WordWrapPreference =
    obj.wordWrap === "on" || obj.wordWrap === "off"
      ? obj.wordWrap
      : DEFAULT_SETTINGS.wordWrap;

  const minimap =
    typeof obj.minimap === "boolean" ? obj.minimap : DEFAULT_SETTINGS.minimap;

  const lineNumbers: LineNumbersPreference =
    obj.lineNumbers === "on" || obj.lineNumbers === "off"
      ? obj.lineNumbers
      : DEFAULT_SETTINGS.lineNumbers;

  const insertSpaces =
    typeof obj.insertSpaces === "boolean"
      ? obj.insertSpaces
      : DEFAULT_SETTINGS.insertSpaces;

  const cursorBlinking: CursorBlinkingPreference =
    obj.cursorBlinking === "blink" ||
    obj.cursorBlinking === "smooth" ||
    obj.cursorBlinking === "phase" ||
    obj.cursorBlinking === "expand" ||
    obj.cursorBlinking === "solid"
      ? obj.cursorBlinking
      : DEFAULT_SETTINGS.cursorBlinking;

  const bracketPairColorization =
    typeof obj.bracketPairColorization === "boolean"
      ? obj.bracketPairColorization
      : DEFAULT_SETTINGS.bracketPairColorization;

  const renderWhitespace: RenderWhitespacePreference =
    obj.renderWhitespace === "none" ||
    obj.renderWhitespace === "selection" ||
    obj.renderWhitespace === "all"
      ? obj.renderWhitespace
      : DEFAULT_SETTINGS.renderWhitespace;

  const reducedMotion: ReducedMotionPreference =
    obj.reducedMotion === "system" ||
    obj.reducedMotion === "reduce" ||
    obj.reducedMotion === "no-preference"
      ? obj.reducedMotion
      : DEFAULT_SETTINGS.reducedMotion;

  return {
    theme,
    fontSize,
    fontFamily,
    tabSize,
    wordWrap,
    minimap,
    lineNumbers,
    insertSpaces,
    cursorBlinking,
    bracketPairColorization,
    renderWhitespace,
    reducedMotion,
  };
}

