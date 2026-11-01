import { useCallback, useEffect, useRef } from "react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";

const THROTTLE_MS = 35; // ~30 fps balances low latency with zero socket saturation

export function useLiveCursorTracker() {
  const updateMyPresence = useUpdateMyPresence();
  const lastSentTimeRef = useRef(0);
  const pendingCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

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
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      pendingCoordsRef.current = { x, y };

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
    [flush],
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
