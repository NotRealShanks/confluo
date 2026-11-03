export type TemplateCategory =
  | "all"
  | "frontend"
  | "backend"
  | "fullstack"
  | "vanilla"
  | "general";

export interface TemplateFile {
  /** Relative path in workspace, e.g. "src/App.tsx" or "package.json" */
  path: string;
  /** Initial starter file content */
  content: string;
  /** Whether to automatically open this file in active editor tab upon creation */
  isEntrypoint?: boolean;
}

export interface TemplateDependency {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSelected?: boolean;
  version?: string;
}

export interface TemplateConfigOptions {
  groupId?: string;
  artifactId?: string;
  packageName?: string;
  javaVersion?: string;
  packaging?: string;
  bootVersion?: string;
  dependencies?: string[];
  cssOption?: string;
  moduleType?: string;
  port?: string;
}

export interface ProjectTemplate {
  /** Unique identifier, e.g. "react-ts" */
  id: string;
  /** User-facing display title */
  name: string;
  /** Brief description of what the template provides */
  description: string;
  /** High-level category for tab filtering */
  category: TemplateCategory;
  /** Primary programming language */
  language: string;
  /** Icon identifier key */
  icon: string;
  /** Key tech badges displayed on the card */
  tags: string[];
  /** Optional configurable fields and available dependencies for the creation wizard */
  availableDependencies?: TemplateDependency[];
  defaultConfig?: TemplateConfigOptions;
  /** Structured files included in this template */
  files: TemplateFile[];
}

