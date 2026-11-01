import { useCallback, useMemo } from "react";
import {
  useCreateComment,
  useCreateThread,
  useDeleteComment,
  useDeleteThread,
  useMarkThreadAsResolved,
  useMarkThreadAsUnresolved,
  useSelf,
  useThreads,
} from "@liveblocks/react/suspense";
import type { ThreadData } from "@liveblocks/client";
import { type CodeThreadMetadata, createCommentBody } from "./types";

export interface UseCodeCommentsOptions {
  fileId?: string | null;
}

export function useCodeComments({ fileId }: UseCodeCommentsOptions = {}) {
  const { threads } = useThreads();
  const createThread = useCreateThread();
  const createComment = useCreateComment();
  const markThreadAsResolved = useMarkThreadAsResolved();
  const markThreadAsUnresolved = useMarkThreadAsUnresolved();
  const deleteThread = useDeleteThread();
  const deleteComment = useDeleteComment();
  const currentUser = useSelf();

  // All threads belonging to the currently active file
  const fileThreads = useMemo(() => {
    if (!threads || !fileId) return [];
    return (threads as unknown as ThreadData<CodeThreadMetadata>[]).filter(
      (t) => t.metadata && t.metadata.fileId === fileId,
    );
  }, [threads, fileId]);

  // Group file threads by line number
  const threadsByLine = useMemo(() => {
    const map = new Map<number, ThreadData<CodeThreadMetadata>[]>();
    for (const t of fileThreads) {
      const line = t.metadata?.lineNumber;
      if (typeof line === "number") {
        const list = map.get(line) ?? [];
        list.push(t);
        map.set(line, list);
      }
    }
    return map;
  }, [fileThreads]);

  // Create a new comment thread anchored on a specific line
  const addThreadOnLine = useCallback(
    (lineNumber: number, text: string, quote?: string) => {
      const trimmed = text.trim();
      if (!trimmed || !fileId) return null;

      return createThread({
        body: createCommentBody(trimmed) as any,
        metadata: {
          fileId,
          lineNumber,
          quote: quote || undefined,
        },
      });
    },
    [createThread, fileId],
  );

  // Reply to an existing thread
  const replyToThread = useCallback(
    (threadId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return null;

      return createComment({
        threadId,
        body: createCommentBody(trimmed) as any,
      });
    },
    [createComment],
  );

  // Resolve a thread
  const resolveThread = useCallback(
    (threadId: string) => {
      markThreadAsResolved(threadId);
    },
    [markThreadAsResolved],
  );

  // Unresolve a thread
  const unresolveThread = useCallback(
    (threadId: string) => {
      markThreadAsUnresolved(threadId);
    },
    [markThreadAsUnresolved],
  );

  // Delete a thread
  const removeThread = useCallback(
    (threadId: string) => {
      deleteThread(threadId);
    },
    [deleteThread],
  );

  // Delete a comment
  const removeComment = useCallback(
    (threadId: string, commentId: string) => {
      deleteComment({ threadId, commentId });
    },
    [deleteComment],
  );

  return {
    threads,
    fileThreads,
    threadsByLine,
    currentUser,
    addThreadOnLine,
    replyToThread,
    resolveThread,
    unresolveThread,
    removeThread,
    removeComment,
  };
}

