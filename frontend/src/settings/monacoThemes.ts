import type { Monaco } from "@monaco-editor/react";

export const THEME_PRESETS = [
  {
    id: "vs-dark",
    name: "VS Code Dark+",
    type: "dark" as const,
    bg: "#1e1e1e",
    accent: "#007acc",
    description: "Classic Microsoft Visual Studio Code dark theme",
  },
  {
    id: "github-dark",
    name: "GitHub Dark",
    type: "dark" as const,
    bg: "#0d1117",
    accent: "#58a6ff",
    description: "GitHub official high-contrast modern dark theme",
  },
  {
    id: "one-dark",
    name: "One Dark Pro",
    type: "dark" as const,
    bg: "#282c34",
    accent: "#61afef",
    description: "Atom One Dark with iconic cyan and purple syntax",
  },
  {
    id: "dracula",
    name: "Dracula",
    type: "dark" as const,
    bg: "#282a36",
    accent: "#bd93f9",
    description: "Vibrant dark theme with high-contrast pastel highlights",
  },
  {
    id: "github-light",
    name: "GitHub Light",
    type: "light" as const,
    bg: "#ffffff",
    accent: "#0969da",
    description: "GitHub crisp, clean white theme",
  },
  {
    id: "vs-light",
    name: "VS Code Light+",
    type: "light" as const,
    bg: "#ffffff",
    accent: "#007acc",
    description: "Standard clean light editor theme",
  },
] as const;

export type EditorThemeId = (typeof THEME_PRESETS)[number]["id"];

let themesRegistered = false;

export function registerMonacoThemes(monaco: Monaco) {
  if (themesRegistered) return;

  // GitHub Dark
  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "variable", foreground: "ffa657" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "tag", foreground: "7ee787" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editorCursor.foreground": "#58a6ff",
      "editor.lineHighlightBackground": "#161b22",
      "editorLineNumber.foreground": "#484f58",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.selectionBackground": "#1f6feb44",
      "editor.inactiveSelectionBackground": "#1f6feb22",
      "editorIndentGuide.background": "#21262d",
      "editorIndentGuide.activeBackground": "#30363d",
      "editorGutter.background": "#0d1117",
    },
  });

  // One Dark Pro
  monaco.editor.defineTheme("one-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      { token: "keyword", foreground: "c678dd" },
      { token: "string", foreground: "98c379" },
      { token: "variable", foreground: "e06c75" },
      { token: "type", foreground: "e5c07b" },
      { token: "function", foreground: "61afef" },
      { token: "number", foreground: "d19a66" },
      { token: "tag", foreground: "e06c75" },
    ],
    colors: {
      "editor.background": "#282c34",
      "editor.foreground": "#abb2bf",
      "editorCursor.foreground": "#528bff",
      "editor.lineHighlightBackground": "#2c313a",
      "editorLineNumber.foreground": "#4b5263",
      "editorLineNumber.activeForeground": "#abb2bf",
      "editor.selectionBackground": "#3e4451",
      "editor.inactiveSelectionBackground": "#3e445166",
      "editorIndentGuide.background": "#3b4048",
      "editorIndentGuide.activeBackground": "#5c6370",
      "editorGutter.background": "#282c34",
    },
  });

  // Dracula
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6272a4", fontStyle: "italic" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "string", foreground: "f1fa8c" },
      { token: "variable", foreground: "f8f8f2" },
      { token: "type", foreground: "8be9fd" },
      { token: "function", foreground: "50fa7b" },
      { token: "number", foreground: "bd93f9" },
      { token: "tag", foreground: "ff79c6" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editorCursor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#44475a55",
      "editorLineNumber.foreground": "#6272a4",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.selectionBackground": "#44475a",
      "editor.inactiveSelectionBackground": "#44475a88",
      "editorIndentGuide.background": "#44475a44",
      "editorIndentGuide.activeBackground": "#6272a4",
      "editorGutter.background": "#282a36",
    },
  });

  // GitHub Light
  monaco.editor.defineTheme("github-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6e7781", fontStyle: "italic" },
      { token: "keyword", foreground: "cf222e" },
      { token: "string", foreground: "0a3069" },
      { token: "variable", foreground: "953800" },
      { token: "type", foreground: "953800" },
      { token: "function", foreground: "8250df" },
      { token: "number", foreground: "0550ae" },
      { token: "tag", foreground: "116329" },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292f",
      "editorCursor.foreground": "#0969da",
      "editor.lineHighlightBackground": "#f6f8fa",
      "editorLineNumber.foreground": "#8c959f",
      "editorLineNumber.activeForeground": "#24292f",
      "editor.selectionBackground": "#0969da22",
      "editor.inactiveSelectionBackground": "#0969da11",
      "editorIndentGuide.background": "#d0d7de",
      "editorIndentGuide.activeBackground": "#8c959f",
      "editorGutter.background": "#ffffff",
    },
  });

  themesRegistered = true;
}

