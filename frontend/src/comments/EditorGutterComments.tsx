import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { editor } from "monaco-editor";
import { MessageSquare, Plus } from "lucide-react";
import type { ThreadData } from "@liveblocks/client";
import { InlineCommentWidget } from "./InlineCommentWidget";
import type { CodeThreadMetadata } from "./types";

export interface EditorGutterCommentsProps {
  editor: editor.IStandaloneCodeEditor | null;
  fileId?: string | null;
  readOnly?: boolean;
  threadsByLine: Map<number, ThreadData<CodeThreadMetadata>[]>;
  onAddComment: (lineNumber: number, text: string) => void;
  onReply: (threadId: string, text: string) => void;
  onResolve: (threadId: string) => void;
  onUnresolve: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  currentUserId?: string;
  focusLine?: number | null;
  onClearFocusLine?: () => void;
}

export function EditorGutterComments({
  editor,
  fileId: _fileId,
  readOnly = false,
  threadsByLine,
  onAddComment,
  onReply,
  onResolve,
  onUnresolve,
  onDeleteThread,
  currentUserId,
  focusLine,
  onClearFocusLine,
}: EditorGutterCommentsProps) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [scrollVersion, setScrollVersion] = useState(0);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Jump to focused line if specified (e.g. from inbox notification)
  useEffect(() => {
    if (focusLine) {
      setActiveLine(focusLine);
      if (editor) {
        editor.revealLineInCenter(focusLine);
      }
      onClearFocusLine?.();
    }
  }, [focusLine, editor, onClearFocusLine]);

  // Listen to Monaco editor scroll, layout, and mouse move events
  useEffect(() => {
    if (!editor) return;

    const disposables = [
      editor.onMouseMove((e) => {
        const line = e.target.position?.lineNumber;
        if (typeof line === "number" && line > 0) {
          setHoveredLine(line);
        }
      }),
      editor.onMouseLeave(() => {
        setHoveredLine(null);
      }),
      editor.onDidScrollChange(() => {
        setScrollVersion((v) => v + 1);
      }),
      editor.onDidLayoutChange(() => {
        setScrollVersion((v) => v + 1);
      }),
    ];

    return () => {
      disposables.forEach((d) => d.dispose());
    };
  }, [editor]);

  // Compute layout offsets
  const layoutInfo = useMemo(() => {
    void scrollVersion;
    if (!editor) return { contentLeft: 60, gutterWidth: 50 };
    return editor.getLayoutInfo();
  }, [editor, scrollVersion]);

  // Compute top pixel position for a given line number
  const getLineTop = useCallback(
    (line: number) => {
      void scrollVersion;
      if (!editor) return 0;
      // 12px matches Monaco top padding in options: padding: { top: 12 }
      return editor.getTopForLineNumber(line) - editor.getScrollTop() + 12;
    },
    [editor, scrollVersion],
  );

  // Visible height and bounds check
  const editorHeight = editor?.getLayoutInfo()?.height ?? 600;

  // Lines that currently have comment threads
  const commentedLines = useMemo(() => {
    return Array.from(threadsByLine.keys()).sort((a, b) => a - b);
  }, [threadsByLine]);

  const buttonLeft = Math.max(8, (layoutInfo.contentLeft || 60) - 28);

  return (
    <div
      ref={widgetContainerRef}
      className="ide-gutter-comments-overlay"
      aria-label="Editor comments overlay"
    >
      {/* Existing comment thread badges on lines */}
      {commentedLines.map((line) => {
        const lineThreads = threadsByLine.get(line) || [];
        const isResolved = lineThreads.every((t) => t.resolved);
        const commentCount = lineThreads.reduce(
          (sum, t) => sum + (t.comments?.length || 0),
          0,
        );
        const top = getLineTop(line);

        // Hide if scrolled out of visible view
        if (top < -20 || top > editorHeight + 20) return null;

        const isActive = activeLine === line;

        return (
          <button
            key={`badge-${line}`}
            type="button"
            className={`ide-gutter-comment-badge ${isActive ? "is-active" : ""} ${
              isResolved ? "is-resolved" : ""
            }`}
            style={{ top: `${top}px`, left: `${buttonLeft}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveLine(isActive ? null : line);
            }}
            title={`${commentCount} comment${commentCount > 1 ? "s" : ""} on line ${line}${
              isResolved ? " (Resolved)" : ""
            }`}
            aria-label={`View comments on line ${line}`}
          >
            <MessageSquare size={11} />
            <span className="ide-gutter-badge-count">{commentCount}</span>
          </button>
        );
      })}

      {/* Floating `+` button on hovered line (only if line does not already have an active comment badge or widget open) */}
      {!readOnly &&
        hoveredLine !== null &&
        hoveredLine !== activeLine &&
        !threadsByLine.has(hoveredLine) && (
          <button
            type="button"
            className="ide-gutter-add-comment-btn"
            style={{ top: `${getLineTop(hoveredLine)}px`, left: `${buttonLeft}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveLine(hoveredLine);
            }}
            title={`Add comment on line ${hoveredLine}`}
            aria-label={`Add comment on line ${hoveredLine}`}
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        )}

      {/* Inline Comment Thread Widget for active line */}
      {activeLine !== null && (
        <div
          className="ide-inline-widget-anchor"
          style={{
            top: `${Math.max(16, getLineTop(activeLine) + 24)}px`,
            left: `${Math.max(48, layoutInfo.contentLeft || 60)}px`,
          }}
        >
          <InlineCommentWidget
            lineNumber={activeLine}
            threads={threadsByLine.get(activeLine) || []}
            onClose={() => setActiveLine(null)}
            onAddComment={(text) => {
              onAddComment(activeLine, text);
            }}
            onReply={onReply}
            onResolve={onResolve}
            onUnresolve={onUnresolve}
            onDeleteThread={onDeleteThread}
            currentUserId={currentUserId}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
