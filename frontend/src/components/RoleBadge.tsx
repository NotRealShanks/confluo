import type { Role } from "../api/types";

const LABELS: Record<Role, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const STYLES: Record<Role, string> = {
  OWNER: "border-[#27272a] bg-[#1c1c20] text-white",
  EDITOR: "border-[#27272a] bg-[#18181b] text-[#d4d4d8]",
  VIEWER: "border-[#27272a] bg-[#121214] text-[#a1a1aa]",
};

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${STYLES[role]}`}
    >
      {LABELS[role]}
    </span>
  );
}
