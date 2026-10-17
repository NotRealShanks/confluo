import { useMemo, type ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { makeAuthEndpoint } from "./liveblocksAuth";

// One Liveblocks room per project; the room id is the project id
export function Room({ projectId, children }: { projectId: string; children: ReactNode }) {
  const authEndpoint = useMemo(() => makeAuthEndpoint(projectId), [projectId]);

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider id={projectId} initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={<p className="text-gray-600">Connecting to the editor…</p>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
