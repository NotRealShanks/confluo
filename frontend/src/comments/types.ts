export interface CodeThreadMetadata {
  fileId: string;
  lineNumber: number;
  quote?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CommentBodyContent {
  type: "paragraph";
  children: Array<{ text?: string; type?: string; id?: string }>;
}

export interface CommentBodyStructure {
  version: 1;
  content: CommentBodyContent[];
}

export function createCommentBody(text: string): CommentBodyStructure {
  const lines = text.split("\n");
  return {
    version: 1,
    content: lines.map((line) => ({
      type: "paragraph",
      children: [{ text: line }],
    })),
  };
}

export function extractCommentText(body: unknown): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  const b = body as { content?: Array<{ children?: Array<{ text?: string; type?: string; id?: string }> }> };
  if (!b.content || !Array.isArray(b.content)) return "";

  return b.content
    .map((block) => {
      if (!block.children || !Array.isArray(block.children)) return "";
      return block.children
        .map((child) => {
          if (child.text) return child.text;
          if (child.type === "mention" && child.id) return `@${child.id}`;
          return "";
        })
        .join("");
    })
    .join("\n");
}

export function formatCommentTime(dateOrString: Date | string): string {
  try {
    const date = typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
