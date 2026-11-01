import { useCallback, useEffect } from "react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";

export function useLiveCursorTracker() {
  const updateMyPresence = useUpdateMyPresence();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      updateMyPresence({ cursor: { x, y } });
    },
    [updateMyPresence],
  );

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useEffect(() => {
    const handleWindowBlur = () => {
      updateMyPresence({ cursor: null });
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [updateMyPresence]);

  return {
    handlePointerMove,
    handlePointerLeave,
  };
}
