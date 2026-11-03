import { apiFetch } from "./client";
import type { Project } from "./types";

export function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export function createProject(
  title: string,
  templateId?: string,
  templateConfig?: string
): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      title,
      templateId: templateId || undefined,
      templateConfig: templateConfig || undefined,
    }),
  });
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${encodeURIComponent(id)}`);
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/api/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
