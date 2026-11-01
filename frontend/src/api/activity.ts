import { apiFetch } from "./client";

export type ProjectActivityType =
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT"
  | "MEMBER_ROLE_UPDATED";

export interface ProjectActivity {
  id: string;
  projectId: string;
  actorId: string;
  actorName: string;
  actionType: ProjectActivityType;
  targetUserId?: string | null;
  targetUserName?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export interface ProjectActivityPage {
  activities: ProjectActivity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

export async function fetchProjectActivities(
  projectId: string,
  page = 0,
  size = 20,
): Promise<ProjectActivityPage> {
  return apiFetch<ProjectActivityPage>(
    `/api/projects/${encodeURIComponent(projectId)}/activity?page=${page}&size=${size}`,
  );
}

