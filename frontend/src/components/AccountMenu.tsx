import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, UserRound, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/context";
import UserAvatar from "./UserAvatar";

export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!user) return null;
  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };
  const leave = () => {
    setOpen(false);
    signOut();
    navigate("/login", { replace: true });
  };
  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-account-item]") ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <div ref={root} className="relative" onKeyDown={moveFocus}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((value) => !value)}
        className={
          compact
            ? "ide-account-trigger"
            : "flex items-center gap-2 rounded-md border border-[#27272a] bg-[#09090b] px-2.5 py-1 font-mono text-xs text-[#f4f4f5] hover:border-[#3f3f46] hover:bg-[#121214] focus-visible:outline-2 focus-visible:outline-[#ffffff]"
        }
      >
        <UserAvatar user={user} className="h-6 w-6" />
        <span className="max-w-36 truncate">{user.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#27272a] bg-[#121214] py-1 shadow-2xl font-mono text-xs text-[#f4f4f5]"
        >
          <div className="flex items-center gap-3 px-3.5 py-3 border-b border-[#27272a]">
            <UserAvatar user={user} className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#f4f4f5]">{user.name}</p>
              <p className="truncate text-[11px] text-[#a1a1aa]">{user.email}</p>
            </div>
          </div>

          <div className="py-1">
            <button
              data-account-item
              type="button"
              role="menuitem"
              onClick={() => go("/profile")}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-[#18181b] transition-colors"
            >
              <UserRound size={14} className="text-[#d4d4d8]" />
              <span>Your profile</span>
            </button>
            <button
              data-account-item
              type="button"
              role="menuitem"
              onClick={() => go("/settings/profile")}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-[#18181b] transition-colors"
            >
              <Settings size={14} className="text-[#d4d4d8]" />
              <span>Account settings</span>
            </button>
            <button
              data-account-item
              type="button"
              role="menuitem"
              onClick={() => go("/dashboard")}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-[#18181b] transition-colors"
            >
              <FolderKanban size={14} className="text-white" />
              <span>Projects Dashboard</span>
            </button>
          </div>

          <div className="border-t border-[#27272a] py-1">
            <button
              data-account-item
              type="button"
              role="menuitem"
              onClick={leave}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[#FF6B6B] hover:bg-[#2A1515] transition-colors"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
