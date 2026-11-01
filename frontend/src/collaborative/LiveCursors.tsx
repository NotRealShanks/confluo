import { useOthers } from "@liveblocks/react/suspense";
import { Cursor } from "./Cursor";
import { colorFor } from "../lib/color";

export function LiveCursors() {
  const others = useOthers();

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-30"
      aria-hidden="true"
      data-testid="live-cursors-overlay"
    >
      {others.map((other) => {
        const cursor = other.presence?.cursor;
        if (!cursor) return null;

        const color = colorFor(other.id);
        const name = other.info?.name || "Collaborator";

        return (
          <Cursor
            key={other.connectionId}
            x={cursor.x}
            y={cursor.y}
            name={name}
            color={color}
          />
        );
      })}
    </div>
  );
}
