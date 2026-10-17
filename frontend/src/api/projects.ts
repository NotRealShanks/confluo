import { apiFetch } from "./client";
import type { Project } from "./types";

export function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export function createProject(title: string): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${encodeURIComponent(id)}`);
}
