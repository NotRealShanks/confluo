import { apiFetch } from "./client";
import type { Project } from "./types";

export type ShareLink = {
  id: string;
  projectId: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  token: string | null;
};

export type GuestSession = {
  token: string;
  project: Project;
};

const linksPath = (projectId: string) =>
  `/api/projects/${encodeURIComponent(projectId)}/share-links`;

export function listShareLinks(projectId: string): Promise<ShareLink[]> {
  return apiFetch<ShareLink[]>(linksPath(projectId));
}

export function createShareLink(
  projectId: string,
  expiresAt: string | null,
): Promise<ShareLink> {
  return apiFetch<ShareLink>(linksPath(projectId), {
    method: "POST",
    body: JSON.stringify({ expiresAt }),
  });
}

export function revokeShareLink(projectId: string, linkId: string): Promise<void> {
  return apiFetch<void>(`${linksPath(projectId)}/${encodeURIComponent(linkId)}`, {
    method: "DELETE",
  });
}

export function exchangeShareToken(token: string): Promise<GuestSession> {
  return apiFetch<GuestSession>("/api/share-links/exchange", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
