import { useCallback, useEffect, useRef, useState } from "react";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react/suspense";
import {
  fetchChatMessage,
  fetchChatMessages,
  sendChatMessage,
  type ChatMessage,
} from "../api/chat";
import { ApiError } from "../api/client";

export interface UseProjectChatOptions {
  projectId: string;
  enabled?: boolean;
}

export function useProjectChat({ projectId, enabled = true }: UseProjectChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(() => Boolean(enabled && projectId));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isAccessRevoked, setIsAccessRevoked] = useState(false);

  const broadcast = useBroadcastEvent();
  const knownMessageIdsRef = useRef<Set<string>>(new Set());

  // Initial fetch
  useEffect(() => {
    if (!enabled || !projectId) return;

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setError(null);
        setIsAccessRevoked(false);
      }
    });

    fetchChatMessages(projectId, 0, 50)
      .then((res) => {
        if (!active) return;
        const ids = new Set<string>();
        for (const msg of res.messages) {
          ids.add(msg.id);
        }
        knownMessageIdsRef.current = ids;
        setMessages(res.messages);
        setHasMore(res.hasMore);
        setPage(0);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
          setIsAccessRevoked(true);
          setError("You do not have permission to view project chat.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load chat messages.");
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId, enabled]);

  // Load earlier messages (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isAccessRevoked) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetchChatMessages(projectId, nextPage, 50);
      setMessages((prev) => {
        const newBatch = res.messages.filter((m) => !knownMessageIdsRef.current.has(m.id));
        for (const m of newBatch) {
          knownMessageIdsRef.current.add(m.id);
        }
        return [...newBatch, ...prev];
      });
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
        setIsAccessRevoked(true);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, page, hasMore, loadingMore, isAccessRevoked]);

  // Send a new message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending || isAccessRevoked) return false;

      if (trimmed.length > 2000) {
        setSendError("Message cannot exceed 2000 characters.");
        return false;
      }

      setSending(true);
      setSendError(null);

      try {
        const canonical = await sendChatMessage(projectId, trimmed);

        // Add to local state if not present
        if (!knownMessageIdsRef.current.has(canonical.id)) {
          knownMessageIdsRef.current.add(canonical.id);
          setMessages((prev) => [...prev, canonical]);
        }

        // Broadcast event to other peers in room
        broadcast({ type: "CHAT_MESSAGE", messageId: canonical.id });
        return true;
      } catch (err) {
        if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
          setIsAccessRevoked(true);
          setSendError("Your project membership has been revoked.");
        } else {
          setSendError(err instanceof Error ? err.message : "Failed to send message.");
        }
        return false;
      } finally {
        setSending(false);
      }
    },
    [projectId, sending, isAccessRevoked, broadcast],
  );

  // Listen for real-time Liveblocks room events from collaborators
  useEventListener(async ({ event }) => {
    if (!event || event.type !== "CHAT_MESSAGE" || !event.messageId) return;

    const messageId = event.messageId;
    if (knownMessageIdsRef.current.has(messageId)) return; // Already present

    try {
      const canonical = await fetchChatMessage(projectId, messageId);
      if (!knownMessageIdsRef.current.has(canonical.id)) {
        knownMessageIdsRef.current.add(canonical.id);
        setMessages((prev) => [...prev, canonical]);
      }
    } catch (err) {
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
        setIsAccessRevoked(true);
      }
    }
  });

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sendError,
    sending,
    isAccessRevoked,
    sendMessage,
    loadMore,
  };
}
