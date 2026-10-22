import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
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
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeIfOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  if (!user) return null;
  const go = (path: string) => { setOpen(false); navigate(path); };
  const leave = () => { setOpen(false); signOut(); navigate("/login", { replace: true }); };
  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open || !["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-account-item]") ?? []);
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return <div ref={root} className="relative" onKeyDown={moveFocus}>
    <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Open account menu" onClick={() => setOpen((value) => !value)}
      className={compact ? "ide-account-trigger" : "flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"}>
      <UserAvatar user={user} className={compact ? "h-7 w-7" : "h-7 w-7"} />
      <span className="max-w-36 truncate">{user.name}</span>
    </button>
    {open && <div role="menu" aria-label="Account menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
      <div className="flex items-center gap-3 px-3 py-3">
        <UserAvatar user={user} className="h-9 w-9" />
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{user.name}</p><p className="truncate text-xs text-gray-500">{user.email}</p></div>
      </div>
      <div className="my-1 border-t border-gray-100" />
      <button data-account-item type="button" role="menuitem" onClick={() => go("/profile")} className="account-menu-item"><UserRound size={15} />Your profile</button>
      <button data-account-item type="button" role="menuitem" onClick={() => go("/settings/profile")} className="account-menu-item"><Settings size={15} />Account settings</button>
      <button data-account-item type="button" role="menuitem" onClick={() => go("/")} className="account-menu-item">Projects</button>
      <div className="my-1 border-t border-gray-100" />
      <button data-account-item type="button" role="menuitem" onClick={leave} className="account-menu-item text-red-700"><LogOut size={15} />Sign out</button>
    </div>}
  </div>;
}
