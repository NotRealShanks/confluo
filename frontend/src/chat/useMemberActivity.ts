import { useMemo, useRef, useState } from "react";
import { useOthers, useOthersListener, useSelf } from "@liveblocks/react/suspense";

export interface ActivityNotice {
  id: string;
  type: "join" | "leave";
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface OnlineMember {
  id: string;
  connectionId: number;
  name: string;
  avatar?: string;
  isSelf: boolean;
}

export function useMemberActivity() {
  const self = useSelf();
  const others = useOthers();
  const [activities, setActivities] = useState<ActivityNotice[]>([]);
  const knownConnectionsRef = useRef<Set<number>>(new Set());

  // Listen to live member join and leave events
  useOthersListener((event) => {
    if (event.type === "enter") {
      const user = event.user;
      if (!user || user.id.startsWith("guest:")) return;

      if (!knownConnectionsRef.current.has(user.connectionId)) {
        knownConnectionsRef.current.add(user.connectionId);
        const notice: ActivityNotice = {
          id: `join-${user.connectionId}-${Date.now()}`,
          type: "join",
          userId: user.id,
          userName: user.info.name || "Member",
          timestamp: new Date(),
        };
        setActivities((prev) => [notice, ...prev].slice(0, 50));
      }
    } else if (event.type === "leave") {
      const user = event.user;
      if (!user || user.id.startsWith("guest:")) return;

      knownConnectionsRef.current.delete(user.connectionId);
      const notice: ActivityNotice = {
        id: `leave-${user.connectionId}-${Date.now()}`,
        type: "leave",
        userId: user.id,
        userName: user.info.name || "Member",
        timestamp: new Date(),
      };
      setActivities((prev) => [notice, ...prev].slice(0, 50));
    } else if (event.type === "reset") {
      knownConnectionsRef.current.clear();
      for (const other of event.others) {
        if (!other.id.startsWith("guest:")) {
          knownConnectionsRef.current.add(other.connectionId);
        }
      }
    }
  });

  // Calculate distinct online registered members (excluding guests)
  const onlineMembers: OnlineMember[] = useMemo(() => {
    const list: OnlineMember[] = [];

    if (self && !self.id.startsWith("guest:")) {
      list.push({
        id: self.id,
        connectionId: -1,
        name: self.info.name,
        avatar: self.info.avatar,
        isSelf: true,
      });
    }

    for (const other of others) {
      if (!other.id.startsWith("guest:")) {
        list.push({
          id: other.id,
          connectionId: other.connectionId,
          name: other.info.name,
          avatar: other.info.avatar,
          isSelf: false,
        });
      }
    }

    return list;
  }, [self, others]);

  return {
    activities,
    onlineMembers,
  };
}

