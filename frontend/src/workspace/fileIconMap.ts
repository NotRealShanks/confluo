import type { ComponentType, ReactNode } from "react";
import React from "react";
import {
  SiCss,
  SiDocker,
  SiGit,
  SiGnubash,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiMarkdown,
  SiNodedotjs,
  SiPython,
  SiReact,
  SiSass,
  SiTypescript,
  SiVite,
  SiVuedotjs,
  SiYaml,
  SiC,
  SiCplusplus,
} from "react-icons/si";
import {
  VscBeaker,
  VscBrowser,
  VscCode,
  VscDatabase,
  VscFile,
  VscFileMedia,
  VscFileText,
  VscFolder,
  VscFolderOpened,
  VscGear,
  VscGlobe,
  VscLaw,
  VscPackage,
  VscServer,
  VscSymbolClass,
  VscSymbolMethod,
  VscTools,
} from "react-icons/vsc";
import { FaFilePdf, FaJava } from "react-icons/fa";
import { TbBrandCSharp } from "react-icons/tb";

export type IconComponent = ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;

export interface FileIconInfo {
  icon: IconComponent;
  color: string;
  label: string;
}

export interface FolderIconInfo {
  color: string;
  badge?: IconComponent;
  type: string;
}

// Special exact filenames mapping (checked case-insensitively)
export const SPECIAL_FILES: Record<string, FileIconInfo> = {
  "package.json": { icon: SiNodedotjs, color: "#cb3837", label: "package.json" },
  "tsconfig.json": { icon: SiTypescript, color: "#3178c6", label: "tsconfig" },
  "vite.config.ts": { icon: SiVite, color: "#646cff", label: "vite" },
  "vite.config.js": { icon: SiVite, color: "#646cff", label: "vite" },
  "vite.config.mjs": { icon: SiVite, color: "#646cff", label: "vite" },
  "dockerfile": { icon: SiDocker, color: "#2496ed", label: "docker" },
  "docker-compose.yml": { icon: SiDocker, color: "#2496ed", label: "docker" },
  "docker-compose.yaml": { icon: SiDocker, color: "#2496ed", label: "docker" },
  "readme.md": { icon: SiMarkdown, color: "#42a5f5", label: "readme" },
  "readme": { icon: SiMarkdown, color: "#42a5f5", label: "readme" },
  "license": { icon: VscLaw, color: "#d0bf41", label: "license" },
  "license.md": { icon: VscLaw, color: "#d0bf41", label: "license" },
  "license.txt": { icon: VscLaw, color: "#d0bf41", label: "license" },
  "makefile": { icon: VscTools, color: "#6d8086", label: "makefile" },
  "gnumakefile": { icon: VscTools, color: "#6d8086", label: "makefile" },
  ".gitignore": { icon: SiGit, color: "#f05032", label: "gitignore" },
  ".dockerignore": { icon: SiDocker, color: "#2496ed", label: "dockerignore" },
  ".env": { icon: VscGear, color: "#ecd53f", label: "env" },
};

// Extension to icon mapping
export const EXTENSION_ICONS: Record<string, FileIconInfo> = {
  // Programming languages
  java: { icon: FaJava, color: "#ea2d2e", label: "java" },
  jar: { icon: FaJava, color: "#ea2d2e", label: "java" },
  js: { icon: SiJavascript, color: "#f7df1e", label: "javascript" },
  mjs: { icon: SiJavascript, color: "#f7df1e", label: "javascript" },
  cjs: { icon: SiJavascript, color: "#f7df1e", label: "javascript" },
  jsx: { icon: SiReact, color: "#00d8ff", label: "react-js" },
  ts: { icon: SiTypescript, color: "#3178c6", label: "typescript" },
  mts: { icon: SiTypescript, color: "#3178c6", label: "typescript" },
  cts: { icon: SiTypescript, color: "#3178c6", label: "typescript" },
  tsx: { icon: SiReact, color: "#3178c6", label: "react-ts" },
  py: { icon: SiPython, color: "#3776ab", label: "python" },
  pyw: { icon: SiPython, color: "#3776ab", label: "python" },
  ipynb: { icon: SiPython, color: "#ffca28", label: "jupyter" },
  c: { icon: SiC, color: "#659ad2", label: "c" },
  h: { icon: SiC, color: "#659ad2", label: "c-header" },
  cpp: { icon: SiCplusplus, color: "#00599c", label: "cpp" },
  hpp: { icon: SiCplusplus, color: "#00599c", label: "cpp-header" },
  cc: { icon: SiCplusplus, color: "#00599c", label: "cpp" },
  cxx: { icon: SiCplusplus, color: "#00599c", label: "cpp" },
  cs: { icon: TbBrandCSharp, color: "#68217a", label: "csharp" },
  csx: { icon: TbBrandCSharp, color: "#68217a", label: "csharp" },
  html: { icon: SiHtml5, color: "#e34f26", label: "html" },
  htm: { icon: SiHtml5, color: "#e34f26", label: "html" },
  css: { icon: SiCss, color: "#1572b6", label: "css" },
  scss: { icon: SiSass, color: "#cf649a", label: "scss" },
  sass: { icon: SiSass, color: "#cf649a", label: "sass" },
  less: { icon: SiCss, color: "#1d365d", label: "less" },
  json: { icon: SiJson, color: "#fbc02d", label: "json" },
  jsonc: { icon: SiJson, color: "#fbc02d", label: "jsonc" },
  xml: { icon: VscCode, color: "#e37933", label: "xml" },
  plist: { icon: VscCode, color: "#e37933", label: "plist" },
  xsd: { icon: VscCode, color: "#e37933", label: "xsd" },
  vue: { icon: SiVuedotjs, color: "#41b883", label: "vue" },

  // Other file formats
  md: { icon: SiMarkdown, color: "#42a5f5", label: "markdown" },
  markdown: { icon: SiMarkdown, color: "#42a5f5", label: "markdown" },
  mdx: { icon: SiMarkdown, color: "#00d8ff", label: "mdx" },
  yaml: { icon: SiYaml, color: "#cb171e", label: "yaml" },
  yml: { icon: SiYaml, color: "#cb171e", label: "yaml" },
  sql: { icon: VscDatabase, color: "#e38c00", label: "sql" },
  pgsql: { icon: VscDatabase, color: "#e38c00", label: "sql" },
  mysql: { icon: VscDatabase, color: "#e38c00", label: "sql" },
  sh: { icon: SiGnubash, color: "#4eaa25", label: "shell" },
  bash: { icon: SiGnubash, color: "#4eaa25", label: "bash" },
  zsh: { icon: SiGnubash, color: "#4eaa25", label: "zsh" },
  png: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  jpg: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  jpeg: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  svg: { icon: VscFileMedia, color: "#ffb300", label: "svg" },
  webp: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  gif: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  ico: { icon: VscFileMedia, color: "#ffb300", label: "image" },
  bmp: { icon: VscFileMedia, color: "#a074c4", label: "image" },
  pdf: { icon: FaFilePdf, color: "#e53935", label: "pdf" },
  txt: { icon: VscFileText, color: "#8e8e8e", label: "text" },
  log: { icon: VscFileText, color: "#8e8e8e", label: "log" },
};

export const GENERIC_FILE_ICON: FileIconInfo = {
  icon: VscFile,
  color: "#8e8e8e",
  label: "file",
};

export function getFileIconInfo(filename: string): FileIconInfo {
  if (!filename) return GENERIC_FILE_ICON;
  const trimmed = filename.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct match on special exact filenames
  if (SPECIAL_FILES[lower]) {
    return SPECIAL_FILES[lower];
  }

  // 2. Prefixes for special configurations (e.g. .env.local, .env.development)
  if (lower.startsWith(".env")) {
    return { icon: VscGear, color: "#ecd53f", label: "env" };
  }

  // 3. Dockerfile variations (e.g. Dockerfile.prod, dockerfile.dev)
  if (lower.startsWith("dockerfile")) {
    return { icon: SiDocker, color: "#2496ed", label: "docker" };
  }

  // 4. Multi-part extensions (e.g. .d.ts)
  if (lower.endsWith(".d.ts")) {
    return EXTENSION_ICONS["ts"];
  }

  // 5. Normal extension extraction (last dot)
  const lastDotIndex = lower.lastIndexOf(".");
  if (lastDotIndex > 0 && lastDotIndex < lower.length - 1) {
    const ext = lower.slice(lastDotIndex + 1);
    if (EXTENSION_ICONS[ext]) {
      return EXTENSION_ICONS[ext];
    }
  }

  return GENERIC_FILE_ICON;
}

export function getFolderIconInfo(name: string): FolderIconInfo {
  if (!name) return { color: "#dcb67a", type: "default" };
  const lower = name.trim().toLowerCase().replace(/\/+$/, "");

  switch (lower) {
    case "src":
    case "source":
      return { color: "#42a5f5", badge: VscCode, type: "src" };

    case "public":
      return { color: "#26a69a", badge: VscGlobe, type: "public" };

    case "components":
      return { color: "#7e57c2", badge: VscSymbolClass, type: "components" };

    case "assets":
    case "static":
    case "images":
    case "img":
    case "media":
      return { color: "#ab47bc", badge: VscFileMedia, type: "assets" };

    case "hooks":
      return { color: "#00bcd4", badge: VscSymbolMethod, type: "hooks" };

    case "pages":
    case "views":
      return { color: "#ff9800", badge: VscBrowser, type: "pages" };

    case "services":
      return { color: "#ef5350", badge: VscServer, type: "services" };

    case "utils":
    case "util":
    case "helpers":
    case "lib":
      return { color: "#ffa726", badge: VscTools, type: "utils" };

    case "tests":
    case "test":
    case "__tests__":
    case "spec":
    case "specs":
      return { color: "#66bb6a", badge: VscBeaker, type: "tests" };

    case "node_modules":
      return { color: "#78909c", badge: VscPackage, type: "node_modules" };

    default:
      return { color: "#dcb67a", type: "default" };
  }
}

export function renderFileIconNode(filename: string, size = 15): ReactNode {
  const info = getFileIconInfo(filename);
  const IconComponent = info.icon;
  return React.createElement(
    "span",
    {
      className: `ide-file-icon ide-icon-${info.label}`,
      "data-icon-type": info.label,
      "data-testid": `file-icon-${info.label}`,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
      },
      "aria-hidden": "true",
    },
    React.createElement(IconComponent, { size, color: info.color, style: { color: info.color } }),
  );
}

export function renderFolderIconNode(name: string, expanded = false, size = 15): ReactNode {
  const info = getFolderIconInfo(name);
  const FolderComponent = expanded ? VscFolderOpened : VscFolder;
  const BadgeComponent = info.badge;

  return React.createElement(
    "span",
    {
      className: `ide-folder-icon ide-folder-${info.type} ${expanded ? "is-expanded" : ""}`,
      "data-folder-type": info.type,
      "data-testid": `folder-icon-${info.type}`,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: size,
        height: size,
      },
      "aria-hidden": "true",
    },
    React.createElement(FolderComponent, { size, color: info.color, style: { color: info.color } }),
    BadgeComponent
      ? React.createElement(
          "span",
          {
            className: "ide-folder-badge",
            style: {
              position: "absolute",
              bottom: "-2px",
              right: "-3px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "scale(0.65)",
              color: info.color,
              filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45))",
            },
          },
          React.createElement(BadgeComponent, {
            size: Math.round(size * 0.75),
            color: info.color,
            style: { color: info.color },
          }),
        )
      : null,
  );
}

