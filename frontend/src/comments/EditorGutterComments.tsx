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
  const isHoveringButtonRef = useRef(false);
  const clearHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (clearHoverTimeoutRef.current) {
        clearTimeout(clearHoverTimeoutRef.current);
      }
    };
  }, []);

  // Listen to Monaco editor scroll, layout, and mouse move events
  useEffect(() => {
    if (!editor) return;

    const disposables = [
      editor.onMouseMove((e) => {
        const line =
          e.target.position?.lineNumber ??
          (e.target as unknown as { range?: { startLineNumber?: number } }).range?.startLineNumber;
        if (typeof line === "number" && line > 0) {
          if (clearHoverTimeoutRef.current) {
            clearTimeout(clearHoverTimeoutRef.current);
            clearHoverTimeoutRef.current = null;
          }
          setHoveredLine(line);
        }
      }),
      editor.onMouseLeave(() => {
        if (clearHoverTimeoutRef.current) {
          clearTimeout(clearHoverTimeoutRef.current);
        }
        clearHoverTimeoutRef.current = setTimeout(() => {
          if (!isHoveringButtonRef.current) {
            setHoveredLine(null);
          }
        }, 400);
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
    if (!editor) return { contentLeft: 60, gutterWidth: 50, lineHeight: 19 };
    return editor.getLayoutInfo();
  }, [editor, scrollVersion]);

  const lineHeight = (layoutInfo as { lineHeight?: number }).lineHeight || 19;
  const buttonHeight = 18;
  const verticalOffset = Math.max(0, Math.floor((lineHeight - buttonHeight) / 2));

  // Compute top pixel position for a given line number (perfect vertical centering without extra offset)
  const getLineTop = useCallback(
    (line: number) => {
      void scrollVersion;
      if (!editor) return 0;
      return editor.getTopForLineNumber(line) - editor.getScrollTop() + verticalOffset;
    },
    [editor, scrollVersion, verticalOffset],
  );

  // Visible height and bounds check
  const editorHeight = editor?.getLayoutInfo()?.height ?? 600;

  // Lines that currently have comment threads
  const commentedLines = useMemo(() => {
    return Array.from(threadsByLine.keys()).sort((a, b) => a - b);
  }, [threadsByLine]);

  const buttonLeft = Math.max(8, (layoutInfo.contentLeft || 60) - 26);

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
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
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
            onMouseEnter={() => {
              isHoveringButtonRef.current = true;
              if (clearHoverTimeoutRef.current) {
                clearTimeout(clearHoverTimeoutRef.current);
                clearHoverTimeoutRef.current = null;
              }
            }}
            onMouseLeave={() => {
              isHoveringButtonRef.current = false;
              clearHoverTimeoutRef.current = setTimeout(() => {
                setHoveredLine(null);
              }, 400);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveLine(hoveredLine);
            }}
            title={`Add comment on line ${hoveredLine}`}
            aria-label={`Add comment on line ${hoveredLine}`}
          >
            <Plus size={13} strokeWidth={2.5} />
          </button>
        )}

      {/* Inline Comment Thread Widget for active line */}
      {activeLine !== null && (
        <div
          className="ide-inline-widget-anchor"
          style={{
            top: `${Math.max(16, getLineTop(activeLine) + lineHeight + 4)}px`,
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
