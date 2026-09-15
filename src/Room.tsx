import type { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

// Wraps children in one shared Liveblocks room
export function Room({ children, name }: { children: ReactNode; name: string }) {
  return (
    <LiveblocksProvider publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY}>
      <RoomProvider id="confluo-room-1" initialPresence={{ name, cursor: null }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}