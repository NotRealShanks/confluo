import { useOthers } from "@liveblocks/react/suspense";
import { colorFor } from "../lib/color";

export interface FilePresenceBadgeProps {
  fileId: string;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function FilePresenceBadge({ fileId, className = "" }: FilePresenceBadgeProps) {
  const others = useOthers();

  const activeCollaborators = others.filter(
    (other) => other.presence?.activeFileId === fileId,
  );

  if (activeCollaborators.length === 0) {
    return null;
  }

  const names = activeCollaborators.map((c) => c.info?.name || "Collaborator");
  const tooltip =
    names.length === 1
      ? `${names[0]} is viewing this file`
      : `${names.join(", ")} are viewing this file`;

  const displayedCollaborators = activeCollaborators.slice(0, 3);
  const extraCount = activeCollaborators.length - displayedCollaborators.length;

  return (
    <div
      className={`inline-flex items-center -space-x-1 shrink-0 ${className}`}
      title={tooltip}
      aria-label={tooltip}
      data-testid="file-presence-badge"
    >
      {displayedCollaborators.map((collaborator) => {
        const name = collaborator.info?.name || "Collaborator";
        const color = colorFor(collaborator.id);
        const initials = getInitials(name);

        return (
          <span
            key={collaborator.connectionId}
            className="relative inline-flex items-center justify-center rounded-full text-white font-bold select-none ring-1 ring-[#1e1e1e] shadow-sm transition-transform hover:scale-110 hover:z-10"
            style={{
              backgroundColor: color,
              width: "16px",
              height: "16px",
              fontSize: "8px",
              lineHeight: "1",
            }}
            data-testid={`file-presence-avatar-${collaborator.id}`}
          >
            {initials}
          </span>
        );
      })}
      {extraCount > 0 && (
        <span
          className="relative inline-flex items-center justify-center rounded-full bg-[#3c3c3c] text-white font-medium select-none ring-1 ring-[#1e1e1e] shadow-sm"
          style={{
            width: "16px",
            height: "16px",
            fontSize: "8px",
            lineHeight: "1",
          }}
          data-testid="file-presence-extra-badge"
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
}

