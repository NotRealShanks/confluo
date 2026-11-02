import { useContext, useEffect, useState } from "react";
import { listMembers, type ProjectMember } from "../api/members";
import { AuthContext } from "../auth/context";

// Cache member lists in memory so switching tabs doesn't re-fetch repeatedly
const membersCache = new Map<string, ProjectMember[]>();

const AVATAR_COLORS = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-pink-600",
  "bg-amber-600",
  "bg-indigo-600",
];

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ProjectMembersBadge({ projectId }: { projectId: string }) {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [members, setMembers] = useState<ProjectMember[]>(() => membersCache.get(projectId) || []);

  useEffect(() => {
    let active = true;
    if (membersCache.has(projectId)) {
      return;
    }

    listMembers(projectId)
      .then((data) => {
        if (!active) return;
        membersCache.set(projectId, data);
        setMembers(data);
      })
      .catch(() => {
        // If unauthenticated or failure, fallback to current user only
        if (!active) return;
        if (user) {
          const fallback: ProjectMember[] = [
            {
              userId: user.id,
              name: user.name,
              email: user.email,
              role: "OWNER",
            },
          ];
          setMembers(fallback);
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, user]);

  // If no members are loaded yet, show the logged-in user as the sole member
  const displayMembers = members.length > 0 ? members : user ? [{
    userId: user.id,
    name: user.name,
    email: user.email,
    role: "OWNER" as const,
  }] : [];

  if (displayMembers.length === 0) return null;

  const visibleMembers = displayMembers.slice(0, 3);
  const remainingCount = displayMembers.length - 3;

  const tooltip = `Members: ${displayMembers.map((m) => m.name || m.email || "Collaborator").join(", ")}`;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden" title={tooltip}>
      {visibleMembers.map((member) => (
        <span
          key={member.userId}
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${colorForId(member.userId)} text-[9px] font-bold text-white ring-2 ring-[#121214] select-none`}
          title={`${member.name} (${member.role})`}
        >
          {getInitials(member.name || member.email || "U")}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-mono font-medium text-zinc-300 ring-2 ring-[#121214] select-none"
          title={`+${remainingCount} more member${remainingCount > 1 ? "s" : ""}`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
