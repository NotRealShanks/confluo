import { useState, useRef, useEffect } from "react";
import { useOthers } from "@liveblocks/react/suspense";
import { colorFor } from "../lib/color";

export interface LiveAvatarStackProps {
  maxVisible?: number;
  onSelectUser?: (userId: string, fileId?: string | null) => void;
  className?: string;
}

interface UserItem {
  id: string;
  name: string;
  isSelf: boolean;
  canWrite: boolean;
  activeFileId?: string | null;
  connectionId?: number;
}

function getInitials(name: string): string {
  const clean = name.replace(/\(you\)/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LiveAvatarStack({
  maxVisible = 4,
  onSelectUser,
  className = "",
}: LiveAvatarStackProps) {
  const others = useOthers();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  // Exactly like Google Docs / Slides: hide avatar stack when no other collaborators are in the project
  if (others.length === 0) {
    return null;
  }

  const allUsers: UserItem[] = others.map((other) => ({
    id: other.id,
    name: other.info?.name || "Collaborator",
    isSelf: false,
    canWrite: other.canWrite,
    activeFileId: other.presence?.activeFileId,
    connectionId: other.connectionId,
  }));

  const visibleUsers = allUsers.slice(0, maxVisible);
  const overflowUsers = allUsers.slice(maxVisible);

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 select-none ${className}`}
      data-testid="live-avatar-stack"
    >
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => {
          const color = colorFor(user.id);
          const initials = getInitials(user.name);
          const tooltip = `${user.name} • ${user.canWrite ? "Editor" : "View only"}${
            user.activeFileId ? " • Active" : ""
          }`;

          return (
            <button
              key={user.isSelf ? "self" : user.connectionId}
              type="button"
              className="group relative flex items-center justify-center rounded-full text-white font-bold transition-all duration-150 hover:scale-115 hover:z-30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              style={{
                backgroundColor: color,
                width: "28px",
                height: "28px",
                fontSize: "10px",
                boxShadow: "0 0 0 2px #18181b",
              }}
              title={tooltip}
              aria-label={tooltip}
              onClick={() => onSelectUser?.(user.id, user.activeFileId)}
              data-testid={`avatar-${user.id}`}
            >
              <span>{initials}</span>

              {/* Online indicator ring */}
              <span
                className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-[#18181b] bg-emerald-500 shadow-sm"
                aria-hidden="true"
              />
            </button>
          );
        })}

        {overflowUsers.length > 0 && (
          <button
            type="button"
            className="relative flex items-center justify-center rounded-full bg-[#27272a] text-[#d4d4d8] text-xs font-semibold hover:bg-[#3f3f46] hover:text-white transition-all duration-150 hover:scale-115 hover:z-30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              width: "28px",
              height: "28px",
              fontSize: "10px",
              boxShadow: "0 0 0 2px #18181b",
            }}
            title={`${overflowUsers.length} more online collaborators`}
            aria-label={`${overflowUsers.length} more online collaborators`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            data-testid="avatar-overflow-button"
          >
            +{overflowUsers.length}
          </button>
        )}
      </div>

      {/* Overflow Dropdown */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-[#1e1e20] border border-[#2e2e32] shadow-xl py-1.5 z-50 text-xs"
          role="menu"
          aria-label="Online collaborators"
          data-testid="avatar-overflow-dropdown"
        >
          <div className="px-3 py-1 font-semibold text-[#a1a1aa] border-b border-[#2e2e32] uppercase tracking-wider text-[10px]">
            Online Collaborators ({allUsers.length})
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {allUsers.map((user) => {
              const color = colorFor(user.id);
              return (
                <button
                  key={user.isSelf ? "self" : user.connectionId}
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-[#27272a] transition-colors text-left text-[#e4e4e7]"
                  onClick={() => {
                    onSelectUser?.(user.id, user.activeFileId);
                    setDropdownOpen(false);
                  }}
                >
                  <span
                    className="relative flex items-center justify-center rounded-full text-white font-bold shrink-0"
                    style={{
                      backgroundColor: color,
                      width: "20px",
                      height: "20px",
                      fontSize: "9px",
                    }}
                  >
                    {getInitials(user.name)}
                    <span className="absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full border border-[#1e1e20] bg-emerald-500" />
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-[10px] text-[#71717a]">
                      {user.canWrite ? "Editor" : "View only"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

