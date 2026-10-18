
import { apiFetch } from "./client";
import type { Role } from "./types";

export type ProjectMember = {
  userId: string;
  name: string;
  email: string | null;
  role: Role;
};

const membersPath = (projectId: string) =>
  `/api/projects/${encodeURIComponent(projectId)}/members`;

export function listMembers(projectId: string): Promise<ProjectMember[]> {
  return apiFetch<ProjectMember[]>(membersPath(projectId));
}

export function addMember(
  projectId: string,
  email: string,
  role: "EDITOR" | "VIEWER",
): Promise<ProjectMember> {
  return apiFetch<ProjectMember>(membersPath(projectId), {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function updateMemberRole(
  projectId: string,
  userId: string,
  role: "EDITOR" | "VIEWER",
): Promise<ProjectMember> {
  return apiFetch<ProjectMember>(
    `${membersPath(projectId)}/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
}

export function removeMember(
  projectId: string,
  userId: string,
): Promise<void> {
  return apiFetch<void>(
    `${membersPath(projectId)}/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
