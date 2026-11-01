import { useCallback, useEffect, useRef } from "react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";

const THROTTLE_MS = 35; // ~30 fps balances low latency with zero socket saturation

export interface UseLiveCursorTrackerOptions {
  fileId?: string | null;
  editorInstance?: {
    getScrollTop: () => number;
    getScrollLeft: () => number;
  } | null;
}

export function useLiveCursorTracker(options?: UseLiveCursorTrackerOptions) {
  const updateMyPresence = useUpdateMyPresence();
  const lastSentTimeRef = useRef(0);
  const pendingCoordsRef = useRef<{ x: number; y: number; fileId: string | null } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const fileId = options?.fileId ?? null;
  const editorInstance = options?.editorInstance;

  // Clear cursor presence immediately when switching files so stale cursors don't linger
  useEffect(() => {
    updateMyPresence({ cursor: null });
  }, [fileId, updateMyPresence]);

  const flush = useCallback(() => {
    if (pendingCoordsRef.current) {
      updateMyPresence({ cursor: pendingCoordsRef.current });
      lastSentTimeRef.current = performance.now();
      pendingCoordsRef.current = null;
    }
    rafIdRef.current = null;
  }, [updateMyPresence]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = editorInstance?.getScrollLeft() ?? 0;
      const scrollTop = editorInstance?.getScrollTop() ?? 0;
      const x = Math.round(e.clientX - rect.left + scrollLeft);
      const y = Math.round(e.clientY - rect.top + scrollTop);
      pendingCoordsRef.current = { x, y, fileId };

      const now = performance.now();
      const timeSinceLastSend = now - lastSentTimeRef.current;

      if (timeSinceLastSend >= THROTTLE_MS) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
        flush();
      } else if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          flush();
        });
      }
    },
    [editorInstance, fileId, flush],
  );

  const handlePointerLeave = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingCoordsRef.current = null;
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useEffect(() => {
    const handleWindowBlur = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingCoordsRef.current = null;
      updateMyPresence({ cursor: null });
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateMyPresence]);

  return {
    handlePointerMove,
    handlePointerLeave,
  };
}
