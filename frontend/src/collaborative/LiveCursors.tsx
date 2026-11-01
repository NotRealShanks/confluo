import { useEffect, useState } from "react";
import { useOthers } from "@liveblocks/react/suspense";
import { Cursor } from "./Cursor";
import { colorFor } from "../lib/color";

export interface LiveCursorsProps {
  fileId?: string | null;
  editorInstance?: {
    getScrollTop: () => number;
    getScrollLeft: () => number;
    onDidScrollChange: (listener: () => void) => { dispose: () => void };
  } | null;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function LiveCursors({ fileId, editorInstance, containerRef }: LiveCursorsProps = {}) {
  const others = useOthers();
  const [scroll, setScroll] = useState(() => ({
    scrollTop: editorInstance?.getScrollTop() ?? 0,
    scrollLeft: editorInstance?.getScrollLeft() ?? 0,
  }));

  useEffect(() => {
    if (!editorInstance) {
      setScroll({ scrollTop: 0, scrollLeft: 0 });
      return;
    }
    const update = () => {
      setScroll({
        scrollTop: editorInstance.getScrollTop(),
        scrollLeft: editorInstance.getScrollLeft(),
      });
    };
    update();
    const disposable = editorInstance.onDidScrollChange(update);
    return () => {
      disposable.dispose();
    };
  }, [editorInstance]);

  const container = containerRef?.current;
  const containerWidth = container?.clientWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1920);
  const containerHeight = container?.clientHeight ?? (typeof window !== "undefined" ? window.innerHeight : 1080);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-30"
      aria-hidden="true"
      data-testid="live-cursors-overlay"
    >
      {others.map((other) => {
        const cursor = other.presence?.cursor;
        if (!cursor) return null;

        // 1. File scoping: cursor must belong to the currently viewed file
        if (fileId && cursor.fileId && cursor.fileId !== fileId) {
          return null;
        }

        // 2. Viewport translation: convert document coordinates to viewport screen coordinates
        const screenX = cursor.x - scroll.scrollLeft;
        const screenY = cursor.y - scroll.scrollTop;

        // 3. Viewport bounds check: if collaborator is scrolled to a different section,
        // their cursor is out of bounds (above or below visible screen) -> do not display!
        if (
          screenX < -20 ||
          screenX > containerWidth + 20 ||
          screenY < -20 ||
          screenY > containerHeight + 20
        ) {
          return null;
        }

        const color = colorFor(other.id);
        const name = other.info?.name || "Collaborator";

        return (
          <Cursor
            key={other.connectionId}
            x={screenX}
            y={screenY}
            name={name}
            color={color}
          />
        );
      })}
    </div>
  );
}
