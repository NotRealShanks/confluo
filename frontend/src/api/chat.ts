import { apiFetch } from "./client";

export interface ChatMessage {
  id: string;
  projectId: string;
  senderUserId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  message: string;
  createdAt: string;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasMore: boolean;
}

export async function fetchChatMessages(
  projectId: string,
  page = 0,
  size = 50,
): Promise<ChatMessagePage> {
  return apiFetch<ChatMessagePage>(
    `/api/projects/${encodeURIComponent(projectId)}/chat/messages?page=${page}&size=${size}`,
  );
}

export async function sendChatMessage(
  projectId: string,
  message: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/api/projects/${encodeURIComponent(projectId)}/chat/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
}

export async function fetchChatMessage(
  projectId: string,
  messageId: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/api/projects/${encodeURIComponent(projectId)}/chat/messages/${encodeURIComponent(messageId)}`,
  );
}

