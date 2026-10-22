import { ApiError, apiFetch } from "./client";
import { getToken } from "../auth/token";

export type AssetResponse = { assetId: string; contentType: string | null; size: number };

export async function uploadAsset(projectId: string, file: File): Promise<AssetResponse> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<AssetResponse>(`/api/projects/${encodeURIComponent(projectId)}/assets`, {
    method: "POST",
    body,
  });
}

export function assetUrl(projectId: string, assetId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
  return `${apiUrl}/api/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`;
}

export async function downloadAsset(projectId: string, assetId: string): Promise<Blob> {
  const response = await fetch(assetUrl(projectId, assetId), {
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new ApiAssetError(response.status, body.message ?? response.statusText);
  }
  return response.blob();
}

export async function deleteAsset(projectId: string, assetId: string): Promise<void> {
  await apiFetch<void>(`/api/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
}

export class ApiAssetError extends ApiError {}
