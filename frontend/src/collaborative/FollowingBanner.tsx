import { useEffect } from "react";
import { useOthers } from "@liveblocks/react/suspense";
import { useFollow } from "./FollowContext";
import { colorFor } from "../lib/color";
import { Eye, X } from "lucide-react";

export function FollowingBanner() {
  const { followingUserId, stopFollowing } = useFollow();
  const others = useOthers();

  // Pressing Escape exits follow mode
  useEffect(() => {
    if (!followingUserId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopFollowing();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [followingUserId, stopFollowing]);

  if (!followingUserId) {
    return null;
  }

  const followedUser = others.find((other) => other.id === followingUserId);
  const name = followedUser?.info?.name || "Collaborator";
  const color = colorFor(followingUserId);

  return (
    <div
      className="flex items-center justify-between px-3 py-1 bg-[#1a1a24] border-b border-[#2e2e42] text-xs text-white z-20 shrink-0 shadow-sm animate-in fade-in duration-150"
      data-testid="following-banner"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-full text-white font-bold"
          style={{
            backgroundColor: color,
            width: "18px",
            height: "18px",
            fontSize: "9px",
            boxShadow: `0 0 6px ${color}88`,
          }}
        >
          <Eye size={10} />
        </span>
        <span className="font-medium text-[#e4e4e7]">
          Following <span style={{ color }}>{name}</span>
        </span>
        <span className="text-[10px] text-[#71717a] hidden sm:inline">
          (Press Esc or move editor to unfollow)
        </span>
      </div>

      <button
        type="button"
        onClick={stopFollowing}
        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#272736] hover:bg-[#343448] text-[#a1a1aa] hover:text-white transition-colors text-[11px] font-medium"
        aria-label="Stop following"
        data-testid="unfollow-button"
      >
        <X size={12} />
        <span>Unfollow</span>
      </button>
    </div>
  );
}

