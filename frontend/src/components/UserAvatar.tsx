import { useState } from "react";
import type { User } from "../api/types";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words.at(-1)![0]}` : words[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export default function UserAvatar({ user, className = "h-8 w-8" }: { user: User; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (user.avatarUrl && !failed) {
    return <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className} rounded-full object-cover`} />;
  }
  return <span aria-hidden="true" className={`${className} inline-grid shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700`}>{initials(user.name)}</span>;
}
