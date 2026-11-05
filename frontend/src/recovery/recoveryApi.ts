import { apiFetch } from "../api/client";

export interface RecoveryDraftDto {
  id: string;
  userId: string;
  projectId: string;
  fileId: string;
  content: string;
  updatedAt: string;
}

export function saveRemoteDraft(
  projectId: string,
  fileId: string,
  content: string,
): Promise<RecoveryDraftDto> {
  return apiFetch<RecoveryDraftDto>(`/api/recovery/drafts/projects/${projectId}`, {
    method: "POST",
    body: JSON.stringify({ fileId, content }),
  });
}

export function getRemoteDraft(
  projectId: string,
  fileId: string,
): Promise<RecoveryDraftDto | null> {
  return apiFetch<RecoveryDraftDto>(
    `/api/recovery/drafts/projects/${projectId}/file?fileId=${encodeURIComponent(fileId)}`,
  ).catch(() => null);
}

export function deleteRemoteDraft(projectId: string, fileId: string): Promise<void> {
  return apiFetch<void>(
    `/api/recovery/drafts/projects/${projectId}/file?fileId=${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
    },
  ).catch(() => undefined);
}

