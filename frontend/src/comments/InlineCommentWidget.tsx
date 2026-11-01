import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Check, CornerDownLeft, MessageSquare, Trash2, Undo2, X } from "lucide-react";
import type { ThreadData } from "@liveblocks/client";
import { colorFor } from "../lib/color";
import { extractCommentText, formatCommentTime, type CodeThreadMetadata } from "./types";

export interface InlineCommentWidgetProps {
  lineNumber: number;
  threads: ThreadData<CodeThreadMetadata>[];
  onClose: () => void;
  onAddComment: (text: string) => void;
  onReply: (threadId: string, text: string) => void;
  onResolve?: (threadId: string) => void;
  onUnresolve?: (threadId: string) => void;
  onDeleteThread?: (threadId: string) => void;
  currentUserId?: string;
  readOnly?: boolean;
}

function CommentAvatar({
  name,
  userId,
  avatarUrl,
}: {
  name?: string;
  userId: string;
  avatarUrl?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={name || "User"}
        onError={() => setImgFailed(true)}
        className="w-6 h-6 rounded-full shrink-0 object-cover"
      />
    );
  }

  const initial = (name?.trim() || "?").charAt(0).toUpperCase();
  return (
    <div
      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10.5px] font-bold text-white select-none"
      style={{ backgroundColor: colorFor(userId) }}
    >
      {initial}
    </div>
  );
}

export function InlineCommentWidget({
  lineNumber,
  threads,
  onClose,
  onAddComment,
  onReply,
  onResolve,
  onUnresolve,
  onDeleteThread,
  currentUserId,
  readOnly = false,
}: InlineCommentWidgetProps) {
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the input textarea when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreateSubmit = () => {
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim());
    setNewCommentText("");
  };

  const handleReplySubmit = (threadId: string) => {
    const text = (replyTextMap[threadId] || "").trim();
    if (!text) return;
    onReply(threadId, text);
    setReplyTextMap((prev) => ({ ...prev, [threadId]: "" }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>, submitFn: () => void) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitFn();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const hasExistingThreads = threads.length > 0;

  return (
    <div
      className="ide-inline-comment-widget"
      role="dialog"
      aria-label={`Comments on line ${lineNumber}`}
      data-testid="inline-comment-widget"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="ide-comment-widget-header">
        <div className="ide-comment-widget-title">
          <MessageSquare size={13} className="ide-comment-widget-icon" />
          <span>Line {lineNumber}</span>
          {hasExistingThreads && (
            <span className="ide-comment-count-badge">
              {threads.reduce((sum, t) => sum + (t.comments?.length || 0), 0)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ide-comment-close-btn"
          title="Close (Esc)"
          aria-label="Close comment widget"
        >
          <X size={14} />
        </button>
      </div>

      {/* Existing Threads */}
      {hasExistingThreads && (
        <div className="ide-comment-threads-list">
          {threads.map((thread) => {
            const isResolved = Boolean(thread.resolved);
            const comments = thread.comments || [];
            const replyText = replyTextMap[thread.id] || "";

            return (
              <div
                key={thread.id}
                className={`ide-comment-thread-item ${isResolved ? "is-resolved" : ""}`}
              >
                {/* Thread status & actions */}
                <div className="ide-comment-thread-meta">
                  <span className={`ide-thread-status ${isResolved ? "status-resolved" : "status-open"}`}>
                    {isResolved ? (
                      <>
                        <Check size={11} /> Resolved
                      </>
                    ) : (
                      "Active thread"
                    )}
                  </span>
                  <div className="ide-thread-actions">
                    {!readOnly && onResolve && onUnresolve && (
                      <button
                        type="button"
                        onClick={() =>
                          isResolved ? onUnresolve(thread.id) : onResolve(thread.id)
                        }
                        className="ide-thread-action-btn"
                        title={isResolved ? "Re-open thread" : "Mark as resolved"}
                      >
                        {isResolved ? <Undo2 size={12} /> : <Check size={12} />}
                        <span>{isResolved ? "Re-open" : "Resolve"}</span>
                      </button>
                    )}
                    {!readOnly && onDeleteThread && (
                      <button
                        type="button"
                        onClick={() => onDeleteThread(thread.id)}
                        className="ide-thread-action-btn is-danger"
                        title="Delete entire thread"
                        aria-label="Delete thread"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments in this thread */}
                <div className="ide-comment-messages">
                  {comments.map((comment) => {
                    const text = extractCommentText(comment.body);
                    const isSelf = currentUserId === comment.userId;
                    return (
                      <div key={comment.id} className="ide-comment-message">
                        <CommentAvatar
                          userId={comment.userId}
                          name={isSelf ? "You" : comment.userId}
                        />
                        <div className="ide-comment-body">
                          <div className="ide-comment-header-row">
                            <span className="ide-comment-author">
                              {isSelf ? "You" : comment.userId}
                            </span>
                            <span className="ide-comment-time">
                              {formatCommentTime(comment.createdAt)}
                            </span>
                          </div>
                          <div className="ide-comment-text">{text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply box if not resolved and not readOnly */}
                {!readOnly && !isResolved && (
                  <div className="ide-comment-reply-box">
                    <textarea
                      value={replyText}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({
                          ...prev,
                          [thread.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, () => handleReplySubmit(thread.id))
                      }
                      placeholder="Reply to thread... (Ctrl+Enter to post)"
                      className="ide-comment-textarea ide-reply-textarea"
                      rows={1}
                    />
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(thread.id)}
                      disabled={!replyText.trim()}
                      className="ide-comment-submit-btn ide-reply-submit-btn"
                      title="Post reply (Ctrl+Enter)"
                    >
                      <CornerDownLeft size={12} />
                      <span>Reply</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Thread Composer (if user clicked `+` to add a new comment or no threads exist yet) */}
      {!readOnly && (
        <div className="ide-comment-composer">
          <textarea
            ref={inputRef}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleCreateSubmit)}
            placeholder={
              hasExistingThreads
                ? "Start another thread on this line... (Ctrl+Enter)"
                : "Add a comment on line " + lineNumber + "... (Ctrl+Enter)"
            }
            className="ide-comment-textarea"
            rows={2}
          />
          <div className="ide-comment-composer-footer">
            <span className="ide-comment-shortcut-hint">Ctrl + Enter to post</span>
            <div className="ide-comment-composer-actions">
              <button
                type="button"
                onClick={onClose}
                className="ide-comment-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={!newCommentText.trim()}
                className="ide-comment-submit-btn"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

