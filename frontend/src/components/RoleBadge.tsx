import type { Role } from "../api/types";

const LABELS: Record<Role, string> = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" };

const STYLES: Record<Role, string> = {
  OWNER: "bg-blue-50 text-blue-700",
  EDITOR: "bg-green-50 text-green-700",
  VIEWER: "bg-gray-100 text-gray-700",
};

export default function RoleBadge({ role }: { role: Role }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[role]}`}>{LABELS[role]}</span>;
}
